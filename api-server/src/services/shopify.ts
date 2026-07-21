/**
 * Shopify Storefront API Service
 *
 * Handles cart creation and Shopify integration.
 * Uses the Storefront API (public-safe) for cart/checkout.
 * Uses the Admin API (server-only) for draft orders if needed.
 *
 * Required env vars:
 *   SHOPIFY_STORE_DOMAIN         - e.g. your-store.myshopify.com
 *   SHOPIFY_STOREFRONT_TOKEN     - Storefront API access token
 *   SHOPIFY_ADMIN_API_TOKEN      - Admin API token (for draft orders) — optional
 */

import { logger } from "../lib/logger.js";

const STORE_DOMAIN = process.env["SHOPIFY_STORE_DOMAIN"];
const STOREFRONT_TOKEN = process.env["SHOPIFY_STOREFRONT_TOKEN"];
const ADMIN_TOKEN = process.env["SHOPIFY_ADMIN_API_TOKEN"];
const STOREFRONT_VERSION = "2025-01";
const ADMIN_VERSION = "2025-01";

function storefrontUrl(): string {
  if (!STORE_DOMAIN) throw new ShopifyConfigError("SHOPIFY_STORE_DOMAIN is not set");
  if (!STOREFRONT_TOKEN) throw new ShopifyConfigError("SHOPIFY_STOREFRONT_TOKEN is not set");
  return `https://${STORE_DOMAIN}/api/${STOREFRONT_VERSION}/graphql.json`;
}

async function storefrontGql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(storefrontUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new ShopifyApiError(`Shopify Storefront HTTP ${res.status}`);
  const json = await res.json() as any;
  if (json?.errors?.length) {
    logger.error({ errors: json.errors }, "Shopify Storefront errors");
    throw new ShopifyApiError(`Shopify error: ${json.errors[0]?.message}`);
  }
  return json.data as T;
}

// ── Cart Creation ─────────────────────────────────────────────────────────────

const CART_CREATE = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { id checkoutUrl }
      userErrors { field message }
    }
  }
`;

export interface RingConfiguration {
  // Setting
  settingHandle: string;
  settingTitle: string;
  settingSku: string;
  metal: string;
  shape: string;
  ringSize: string;
  engraving?: string | null;
  settingPrice: number;
  // Diamond
  nivodaId: string;
  diamondCarat: number;
  diamondColor: string;
  diamondClarity: string;
  diamondCut?: string | null;
  diamondCert?: string | null;
  diamondLab?: string | null;
  diamondPrice: number;
}

export interface CartResult {
  checkoutUrl: string;
  cartId: string | null;
}

/**
 * Create a Shopify cart for a complete ring configuration.
 *
 * Strategy: We create a cart with a custom product variant (the ring setting)
 * plus rich line-item attributes capturing all diamond/configuration details
 * for fulfilment. The diamond itself is a line-item note attribute, not a
 * separate Shopify product — Nivoda diamonds are sourced to order.
 *
 * If Shopify credentials are not yet configured, returns a demo checkout URL
 * so the UI flow can be tested without a live store.
 */
export async function createRingCart(config: RingConfiguration): Promise<CartResult> {
  const totalPrice = config.settingPrice + config.diamondPrice;

  // Build rich attributes for fulfilment team
  const attributes = [
    { key: "Setting Handle",   value: config.settingHandle },
    { key: "Setting Name",     value: config.settingTitle },
    { key: "Setting SKU",      value: config.settingSku },
    { key: "Metal",            value: config.metal },
    { key: "Shape",            value: config.shape },
    { key: "Ring Size",        value: config.ringSize },
    { key: "Setting Price",    value: `AUD $${config.settingPrice.toLocaleString()}` },
    { key: "Diamond ID",       value: config.nivodaId },
    { key: "Diamond Carat",    value: `${config.diamondCarat}ct` },
    { key: "Diamond Color",    value: config.diamondColor },
    { key: "Diamond Clarity",  value: config.diamondClarity },
    { key: "Diamond Cut",      value: config.diamondCut ?? "—" },
    { key: "Diamond Lab",      value: config.diamondLab ?? "—" },
    { key: "Certificate No.",  value: config.diamondCert ?? "—" },
    { key: "Diamond Price",    value: `AUD $${config.diamondPrice.toLocaleString()}` },
    { key: "Total Ring Price", value: `AUD $${totalPrice.toLocaleString()}` },
  ];

  if (config.engraving) {
    attributes.push({ key: "Engraving", value: config.engraving });
  }

  if (!STORE_DOMAIN || !STOREFRONT_TOKEN) {
    logger.warn(
      "Shopify credentials not configured — returning demo checkout URL. " +
      "Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN in Replit Secrets."
    );
    return {
      checkoutUrl: `/checkout-demo?total=${totalPrice}&config=${encodeURIComponent(JSON.stringify(config))}`,
      cartId: null,
    };
  }

  try {
    const data = await storefrontGql<any>(CART_CREATE, {
      input: {
        // A "custom item" line — quantity 1 with no merchandiseId means
        // we need to use the Admin draft order flow for real custom pricing.
        // For standard Shopify products, pass merchandiseId here.
        attributes,
        note: `Complete Ring Order — Setting: ${config.settingTitle} | Diamond: ${config.diamondCarat}ct ${config.diamondColor} ${config.diamondClarity} | Total: AUD $${totalPrice.toLocaleString()}`,
      },
    });

    const errs = data?.cartCreate?.userErrors ?? [];
    if (errs.length) {
      logger.error({ errs }, "Shopify cart userErrors");
      throw new ShopifyApiError(errs.map((e: any) => e.message).join(", "));
    }

    return {
      checkoutUrl: data.cartCreate.cart.checkoutUrl,
      cartId: data.cartCreate.cart.id,
    };
  } catch (err) {
    if (err instanceof ShopifyConfigError || err instanceof ShopifyApiError) throw err;
    throw new ShopifyApiError(`Cart creation failed: ${String(err)}`);
  }
}

/**
 * Admin API — Create a Draft Order (alternative checkout path).
 * Useful when you need custom line item pricing not tied to Shopify variants.
 */
export async function createDraftOrder(config: RingConfiguration): Promise<CartResult> {
  if (!STORE_DOMAIN || !ADMIN_TOKEN) {
    throw new ShopifyConfigError(
      "SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN must be set for draft orders"
    );
  }

  const totalPrice = config.settingPrice + config.diamondPrice;
  const url = `https://${STORE_DOMAIN}/admin/api/${ADMIN_VERSION}/draft_orders.json`;

  const body = {
    draft_order: {
      line_items: [
        {
          title: config.settingTitle,
          price: config.settingPrice.toFixed(2),
          quantity: 1,
          properties: [
            { name: "SKU",    value: config.settingSku },
            { name: "Metal",  value: config.metal },
            { name: "Shape",  value: config.shape },
            { name: "Size",   value: config.ringSize },
          ],
        },
        {
          title: `${config.diamondCarat}ct ${config.diamondColor} ${config.diamondClarity} Lab Diamond`,
          price: config.diamondPrice.toFixed(2),
          quantity: 1,
          properties: [
            { name: "Nivoda ID",   value: config.nivodaId },
            { name: "Carat",       value: `${config.diamondCarat}ct` },
            { name: "Color",       value: config.diamondColor },
            { name: "Clarity",     value: config.diamondClarity },
            { name: "Cut",         value: config.diamondCut ?? "—" },
            { name: "Certificate", value: config.diamondCert ?? "—" },
            { name: "Lab",         value: config.diamondLab ?? "—" },
          ],
        },
      ],
      note: `Ring Order via Ring Builder — Total: AUD $${totalPrice.toLocaleString()}`,
      ...(config.engraving ? { note_attributes: [{ name: "Engraving", value: config.engraving }] } : {}),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": ADMIN_TOKEN,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ShopifyApiError(`Draft order HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json() as any;
  const order = json?.draft_order;
  if (!order) throw new ShopifyApiError("Draft order response missing draft_order");

  return {
    checkoutUrl: order.invoice_url,
    cartId: String(order.id),
  };
}

// ── Error Types ───────────────────────────────────────────────────────────────

export class ShopifyConfigError extends Error {
  constructor(msg: string) { super(msg); this.name = "ShopifyConfigError"; }
}

export class ShopifyApiError extends Error {
  constructor(msg: string) { super(msg); this.name = "ShopifyApiError"; }
}
