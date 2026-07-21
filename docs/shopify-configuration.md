# Shopify Configuration Guide — Southern Star Diamonds Ring Builder

This document covers everything you need to set up and manage the Ring Builder
from Shopify after GitHub → Vercel deployment.

---

## Overview

The Ring Builder is a standalone React app hosted on Vercel. It communicates
with Shopify via the Storefront API (for product data and cart) and the Admin
API (for draft orders). Shopify acts as the **content and product management
layer** — you manage products, prices, images, and content in Shopify, and the
Ring Builder picks it all up automatically.

```
Customer browser
    ↓
Vercel (React app + Express API)
    ↓                    ↓
Shopify Storefront API   Shopify Admin API
  (products, cart)        (draft orders)
```

---

## 1. What Can Be Managed from Shopify (no code changes required)

Once you connect Shopify credentials to the Vercel environment, the following
can be managed entirely from the Shopify Admin:

### Products (Ring Settings)

| What you manage in Shopify | How it appears in the Ring Builder |
|---|---|
| Product title | Ring setting name |
| Product description (HTML) | Description on the setting detail page |
| Product images | Gallery images (CDN URLs auto-resolve per colour) |
| Product status (Active / Draft) | Active = shown, Draft/Archived = hidden |
| Tags | Style/band-type filter categories |
| Product type | `Setting` (used for collection filtering) |

### Variants (Metal × Shape combinations)

Each variant represents one metal + shape combination. The Ring Builder reads
variant data to populate selectors and prices.

| Variant field | Maps to |
|---|---|
| Variant title | `[Metal] / [Shape]` e.g. `9K Yellow Gold / Round` |
| Price | Displayed setting price |
| SKU | Used for cart line-item properties |
| Inventory | Availability indicator (future) |

### Collections

Create the following Shopify Collections to power style/band-type filtering:

| Collection | Products to include |
|---|---|
| `Solitaire` | Single-stone solitaire settings |
| `Halo` | Settings with halo surround |
| `Hidden Halo` | Settings with hidden/inset halo |
| `Three Stone` | Three-stone settings |
| `Multi Row` | Multi-row / eternity-style shank settings |
| `Bypass` | Bypass / crossover shank settings |
| `Cluster` | Cluster settings |
| `Channel Set` | Channel-set shank settings |
| `Cathedral` | Cathedral-mount settings |
| `Twisted Shank` | Twisted / braided shank settings |
| `Pavé` | Pavé-set settings |
| `Vintage` | Vintage-inspired settings |
| `Split Shank` | Split-shank settings |

**Important:** Also add every product to the `Engagement Rings` collection so
the Ring Builder catalogue query returns all settings.

---

## 2. Shopify Metafields — Per Product

Create these metafields on the `product` resource in Shopify Admin →
Settings → Custom data → Products:

| Namespace & Key | Type | Purpose |
|---|---|---|
| `ring_builder.setting_height` | Single-line text | `"High Set"` or `"Low Set"` |
| `ring_builder.supported_shapes` | List of single-line text | Diamond shapes this setting fits (e.g. `["Round","Oval","Cushion"]`) |
| `ring_builder.primary_shape` | Single-line text | Default shape to select on load |
| `ring_builder.default_metal` | Single-line text | Override global default (e.g. `"18K Yellow Gold"`) |
| `ring_builder.badge` | Single-line text | Optional badge text: `"New"`, `"Best Seller"`, `"Staff Pick"` |
| `ring_builder.promotional_text` | Single-line text | Optional promo text below price |
| `ring_builder.display_order` | Integer | Manual sort order (lower = first) |
| `ring_builder.video_url_white` | URL | GIF/video for white gold metal tone |
| `ring_builder.video_url_yellow` | URL | GIF/video for yellow gold metal tone |
| `ring_builder.video_url_rose` | URL | GIF/video for rose gold metal tone |

---

## 3. Shopify Metafields — Global / Shop Level

Create these metafields on the `shop` resource for global Ring Builder config:

| Namespace & Key | Type | Purpose |
|---|---|---|
| `ring_builder.default_metal` | Single-line text | `"9K Yellow Gold"` (global default) |
| `ring_builder.products_per_page` | Integer | How many settings to show per catalogue page |
| `ring_builder.default_sort` | Single-line text | `"price-asc"`, `"price-desc"`, or `"name-asc"` |
| `ring_builder.currency` | Single-line text | `"AUD"` |
| `ring_builder.markup_percentage` | Decimal | Diamond markup percentage (e.g. `0.20` = 20%) |

---

## 4. Shopify Theme Settings (UI Text)

When the Ring Builder is embedded as a Shopify Theme app block or section, the
following strings can be edited from the Theme Editor without touching code.

Until app-block embedding is set up, these strings live in:
`artifacts/api-server/src/config/builder.ts` → `UI_TEXT`

| Setting | Current value | Where it appears |
|---|---|---|
| `catalog.heading` | `"Choose Your Setting"` | Catalogue page H1 |
| `catalog.subheading` | `"Browse our collection..."` | Catalogue page subtitle |
| `catalog.emptyTitle` | `"No settings found"` | Empty filter state |
| `catalog.emptyBody` | `"Try adjusting your filters..."` | Empty filter state |
| `catalog.clearFilters` | `"Clear All Filters"` | Filter panel button |
| `builder.step1Heading` | `"Choose Your Setting"` | Step nav label |
| `builder.step2Heading` | `"Choose Your Diamond"` | Step nav label |
| `builder.step3Heading` | `"Review Your Ring"` | Step nav label |

These are exposed via `GET /api/config → uiText` so the frontend never
hardcodes them — they will be swappable for Shopify Theme settings with a small
API change.

---

## 5. Shopify Product Image Naming Convention

The Ring Builder resolves CDN images using OvernightMountings' naming pattern:

| Filename pattern | Metal colour | Type |
|---|---|---|
| `SKU.jpg` | White Gold / Platinum | Front view |
| `SKU.alt.jpg` | Yellow Gold | Front view |
| `SKU.alt1.jpg` | Rose Gold | Front view |
| `SKU.side.jpg` | White Gold | Side view |
| `SKU.side.alt.jpg` | Yellow Gold | Side view |
| `SKU.side.alt1.jpg` | Rose Gold | Side view |
| `SKU.angle.jpg` | White Gold | Angled view |
| `SKU.rd.jpg` | White — Round shape | Multi-shape front |
| `SKU.ov.alt.jpg` | Yellow — Oval shape | Multi-shape front |

When uploading ring images to Shopify, add the CDN URLs as product images. The
Ring Builder's `setting-media.ts` resolves the correct colour/angle automatically
from the URL filename.

---

## 6. Shopify Storefront API — Required Access

When you connect Shopify, you need a **Public Storefront API token** with these
access scopes:

- `unauthenticated_read_product_listings` — browse ring settings
- `unauthenticated_read_checkouts` — create carts
- `unauthenticated_write_checkouts` — add items to cart

Vercel environment variable: `SHOPIFY_STOREFRONT_TOKEN`

---

## 7. Shopify Admin API — Required Access

For draft orders (custom ring configurations), create a **Private App** or
**Custom App** with these Admin API scopes:

- `write_draft_orders`
- `read_draft_orders`

Vercel environment variable: `SHOPIFY_ADMIN_API_TOKEN`

---

## 8. Vercel Environment Variables (Complete List)

Set these in your Vercel project → Settings → Environment Variables:

```
# Required — always
SESSION_SECRET=<openssl rand -base64 32>
DIAMOND_DATA_SOURCE=demo          # change to "nivoda" when credentials ready

# Required — Shopify (add when ready)
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_TOKEN=<public Storefront API token>
SHOPIFY_ADMIN_API_TOKEN=<Admin API token>

# Optional — Nivoda (add when credentials are issued)
NIVODA_USERNAME=<Nivoda account email>
NIVODA_PASSWORD=<Nivoda account password>
NIVODA_ENDPOINT=https://integrations.nivoda.net/graphql-loupe360
```

---

## 9. What Still Requires a Code Deployment to Change

The following cannot be changed from Shopify and require a Replit code edit
followed by a GitHub push + Vercel redeploy:

| Item | File to edit |
|---|---|
| Diamond markup pricing rules | `artifacts/api-server/src/config/builder.ts` → `MARKUP_RULES` |
| Available ring sizes | `artifacts/api-server/src/config/builder.ts` → `RING_SIZES` |
| Diamond colour/clarity options | `artifacts/ring-builder/src/pages/DiamondSearch.tsx` |
| Nivoda API endpoint version | `artifacts/api-server/src/services/nivoda.ts` |
| Cart line-item property schema | `artifacts/api-server/src/routes/cart.ts` |
| Application routing / page structure | `artifacts/ring-builder/src/App.tsx` |

---

## 10. Current Data Source

Until Shopify is connected, ring settings are served from:

`artifacts/api-server/src/data/settings.json`

This file contains 209 ring settings originally exported from the product
catalogue. The file structure mirrors Shopify's product/variant schema, so
migrating to live Shopify data requires only swapping the data source in
`artifacts/api-server/src/routes/settings.ts` — the API response shape
stays identical and the frontend requires no changes.

---

## 11. Filter Tags Reference

These tags must be applied to Shopify products for the Ring Builder filters to work:

**Style / Band Type tags** (at least one per product):
`Solitaire` · `Three Stone` · `Multi Row` · `Halo` · `Hidden Halo` · `Bypass`
· `Cluster` · `Channel Set` · `Cathedral` · `Twisted Shank` · `Pavé`
· `Vintage` · `Split Shank` · `Prong Set`

**Required tags** (on every engagement ring product):
`Engagement Rings` · `Lab Grown Diamond`

**Product name tag** (for internal reference):
Add the ring name as a tag, e.g. `Aurora`, `Celeste`, etc.

---

*Last updated: July 2026*
