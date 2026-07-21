/**
 * Nivoda Diamond API Service
 *
 * All Nivoda API communication happens here.
 * Never expose Nivoda credentials or supplier prices to the browser.
 *
 * Required env vars:
 *   NIVODA_ENDPOINT  - Nivoda GraphQL endpoint (default: staging)
 *   NIVODA_USERNAME  - Nivoda account username
 *   NIVODA_PASSWORD  - Nivoda account password
 */

import { logger } from "../lib/logger.js";
import { calculateDiamondPrice } from "../config/builder.js";

const NIVODA_ENDPOINT =
  process.env["NIVODA_ENDPOINT"] ||
  "https://integrations.nivoda.net/graphql-loupe360";

const STAGING_ENDPOINT = "https://integrations.nivoda.net/graphql-loupe360";

// Token cache — avoids re-authenticating on every request
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

// ── GraphQL Queries ───────────────────────────────────────────────────────────

const AUTH_QUERY = `
  query Authenticate($username: String!, $password: String!) {
    authenticate {
      username_and_password(username: $username, password: $password) { token }
    }
  }
`;

const DIAMONDS_QUERY = `
  query DiamondsByQuery($query: DiamondQuery!, $offset: Int, $limit: Int) {
    diamonds_by_query(query: $query, offset: $offset, limit: $limit) {
      total_count
      items {
        id price discount
        diamond {
          id video image supplierStockId
          certificate {
            id lab shape certNumber cut carats clarity polish symmetry color
            fluorescence length width depth table depthPercentage
          }
        }
      }
    }
  }
`;

const SINGLE_DIAMOND_QUERY = `
  query DiamondById($id: ID!) {
    diamond(id: $id) {
      id video image supplierStockId
      availability
      certificate {
        id lab shape certNumber cut carats clarity polish symmetry color
        fluorescence length width depth table depthPercentage
      }
    }
  }
`;

// ── Authentication ────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const username = process.env["NIVODA_USERNAME"];
  const password = process.env["NIVODA_PASSWORD"];

  if (!username || !password) {
    throw new NivodaConfigError(
      "NIVODA_USERNAME and NIVODA_PASSWORD environment variables are required. " +
      "Add them in the Replit Secrets panel."
    );
  }

  const endpoint = NIVODA_ENDPOINT;
  logger.info({ endpoint: endpoint.replace(/^https?:\/\//, "") }, "Nivoda: authenticating");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: AUTH_QUERY,
      variables: { username, password },
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new NivodaApiError(`Nivoda auth HTTP ${res.status}`);
  }

  const json = await res.json() as any;
  const token = json?.data?.authenticate?.username_and_password?.token;
  if (!token) {
    logger.error({ errors: json?.errors }, "Nivoda auth failed — check credentials");
    throw new NivodaApiError("Nivoda authentication failed — check credentials");
  }

  cachedToken = token;
  tokenExpiresAt = Date.now() + 50 * 60 * 1000; // 50 minutes
  logger.info("Nivoda: authenticated successfully");
  return token;
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const token = await getToken();
  const res = await fetch(NIVODA_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new NivodaApiError(`Nivoda API HTTP ${res.status}`);
  }

  const json = await res.json() as any;
  if (json?.errors?.length) {
    logger.error({ errors: json.errors }, "Nivoda GQL errors");
    throw new NivodaApiError(`Nivoda GraphQL error: ${json.errors[0]?.message}`);
  }

  return json.data as T;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface DiamondSearchFilters {
  shapes?: string[];
  caratMin?: number;
  caratMax?: number;
  priceMin?: number;  // customer-facing price — converted back before sending to Nivoda
  priceMax?: number;
  colors?: string[];
  clarities?: string[];
  cuts?: string[];
  labGrown?: boolean;
  offset?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface NivodaDiamond {
  id: string;
  price: number;
  discount: number | null;
  supplierPrice: number | null;
  video: string | null;
  image: string | null;
  supplierStockId: string | null;
  certificate: {
    id: string | null;
    lab: string | null;
    shape: string;
    certNumber: string | null;
    cut: string | null;
    carats: number;
    clarity: string;
    polish: string | null;
    symmetry: string | null;
    fluorescence: string | null;
    color: string;
    length: number | null;
    width: number | null;
    depth: number | null;
    table: number | null;
    depthPercentage: number | null;
  };
}

export interface SearchResult {
  items: NivodaDiamond[];
  totalCount: number;
  offset: number;
  limit: number;
}

function normalizeDiamond(it: any): NivodaDiamond {
  // Nivoda prices are in cents for some API versions; handle both
  const rawPrice: number =
    typeof it.price === "number" ? it.price : parseFloat(it.price ?? "0");
  const supplierPrice = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
  const customerPrice = calculateDiamondPrice(supplierPrice);

  return {
    id: it.id,
    price: customerPrice,
    discount: it.discount ?? null,
    supplierPrice: null, // Never expose supplier cost to the browser
    video: it.diamond?.video ?? null,
    image: it.diamond?.image ?? null,
    supplierStockId: it.diamond?.supplierStockId ?? null,
    certificate: it.diamond?.certificate ?? it.certificate ?? {
      id: null, lab: null, shape: "ROUND", certNumber: null, cut: null,
      carats: 0, clarity: "", polish: null, symmetry: null, fluorescence: null, color: "",
      length: null, width: null, depth: null, table: null, depthPercentage: null,
    },
  };
}

export async function searchDiamonds(filters: DiamondSearchFilters): Promise<SearchResult> {
  const {
    shapes, caratMin = 0.5, caratMax = 5,
    colors, clarities, cuts,
    labGrown = true,
    offset = 0,
    limit = 24,
  } = filters;

  const query: Record<string, unknown> = {
    sizes: [{ from: caratMin, to: caratMax }],
    labgrown: labGrown,
  };
  if (shapes?.length) query["shapes"] = shapes;
  if (colors?.length) query["color"] = colors;
  if (clarities?.length) query["clarity"] = clarities;
  if (cuts?.length) query["cut"] = cuts;

  const data = await gql<any>(DIAMONDS_QUERY, { query, offset, limit });
  const raw = data?.diamonds_by_query ?? { items: [], total_count: 0 };

  return {
    items: (raw.items ?? []).map(normalizeDiamond),
    totalCount: raw.total_count ?? 0,
    offset,
    limit,
  };
}

export async function getDiamond(id: string): Promise<NivodaDiamond | null> {
  try {
    const data = await gql<any>(SINGLE_DIAMOND_QUERY, { id });
    const d = data?.diamond;
    if (!d) return null;
    // Single diamond endpoint has slightly different structure
    const wrapper = { id, price: 0, discount: null, diamond: d };
    return normalizeDiamond(wrapper);
  } catch (err) {
    logger.warn({ id, err }, "getDiamond failed");
    return null;
  }
}

export async function validateDiamond(nivodaId: string): Promise<{
  available: boolean;
  currentPrice: number | null;
  priceChanged: boolean;
  diamond: NivodaDiamond | null;
}> {
  const diamond = await getDiamond(nivodaId);
  if (!diamond) {
    return { available: false, currentPrice: null, priceChanged: false, diamond: null };
  }
  return {
    available: true,
    currentPrice: diamond.price,
    priceChanged: false, // Would compare against previously stored price in production
    diamond,
  };
}

// ── Error Types ───────────────────────────────────────────────────────────────

export class NivodaConfigError extends Error {
  constructor(msg: string) { super(msg); this.name = "NivodaConfigError"; }
}

export class NivodaApiError extends Error {
  constructor(msg: string) { super(msg); this.name = "NivodaApiError"; }
}
