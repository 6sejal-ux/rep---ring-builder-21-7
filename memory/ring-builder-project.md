---
name: Ring Builder Project
description: Architecture, critical data quirks, completed work, and what still needs real credentials for the Southern Star Diamonds Ring Builder.
---

## Architecture

- **Monorepo:** pnpm workspaces
- **Frontend:** `artifacts/ring-builder` — React 19 + Vite + Tailwind v4 + Zustand + shadcn/ui
- **Backend:** `artifacts/api-server` — Express 5, TypeScript, esbuild
- **Shared client:** `lib/api-client` (OpenAPI) + `lib/api-client-react` (React Query)
- **Vercel entry:** `api/index.ts` — re-exports Express app as serverless function
- **Settings data:** `artifacts/api-server/src/data/settings.json` — 210 records (209 visible)

## Critical Data Quirks

### Image colour encoding (OvernightMountings CDN)
- `SKU.jpg` = White Gold
- `SKU.alt.jpg` = Yellow Gold
- `SKU.alt1.jpg` = Rose Gold
- Multi-angle: `.side.`, `.angle.`, `.set.`, `.ver.` before colour suffix

### Multi-shape detection (DO NOT use naive substring check)
19 settings are multi-shape (`SKU.rd.jpg`, `SKU.ov.jpg` etc). Some single-shape settings have angle images whose filenames accidentally contain shape codes (e.g. `51114-E.em.side.alt.jpg`). **Correct rule:** if `images[]` contains a plain `SKU.jpg` (no `.alt`, no shape code directly before `.jpg`) → single-shape.

### GIFs
GIF URLs are in `variant.image` (Lovable CDN), NOT in `setting.images[]`. One GIF per metal tone.

### CDN 404s in dev
OvernightMountings CDN whitelists referrers — images 404 in local/Replit dev. This is expected.

## Product Visibility

- **Rule:** `hasUsableDisplayImage()` — at least one non-GIF `.jpg` in `setting.images[]`
- **Enforced server-side** in `routes/settings.ts` at load time (affects counts + pagination)
- **Also exported** from `ring-builder/src/lib/setting-media.ts` for frontend use
- **1 hidden product** — empty placeholder record (no handle, no title, no images)

## Default Metal

- **Brand default: 9K Yellow Gold** — set everywhere
- `SettingDetail.tsx`: useEffect prefers `9K Yellow Gold` then any yellow gold, falls back to first variant
- `SettingsCatalog.tsx`: `getCatalogPreviewImage()` calls `resolveStaticImage(images, 'Round', 'yellow')` so cards show yellow gold images by default
- `getCatalogHoverImage()` returns a side/angle view of the same colour as the primary image

## Filter System (SettingsCatalog)

- **Architecture:** Fetch all 209 items (pageSize=250), all filtering is client-side
- **API metal filter:** substring match — "Yellow Gold" matches "9K Yellow Gold" etc.
- **API pageSize cap:** 250 (was 100)
- **Style options:** 14 styles from actual tag data (see STYLES in builder.ts)
- **Metal tones:** 4 tones (Yellow Gold, White Gold, Rose Gold, Platinum)
- **Shape filter:** multi-select, all 10 shapes
- **Mobile:** Sheet drawer triggered by "Filters" button
- **Active chips:** shown below controls bar, dismissible individually
- **No result for High/Low Set:** this field does NOT exist in settings.json data — not filterable

## Diamond Architecture

- `DIAMOND_DATA_SOURCE=demo` (default) → `services/demo.ts` (57 diamonds, 10 shapes)
- `DIAMOND_DATA_SOURCE=nivoda` → `services/nivoda.ts` (Nivoda GraphQL, token cache 50min)
- Both implement: `searchDiamonds`, `getDiamond`, `validateDiamond`
- Normalized model: `NivodaDiamond` with `certificate.fluorescence` added
- Supplier price NEVER sent to browser (`supplierPrice: null`)
- Diamond pricing in `config/builder.ts` (`calculateDiamondPrice`)

## Zustand Store (DiamondState)

Extended fields: `polish`, `symmetry`, `fluorescence`, `length`, `width`, `depth` — all optional. Set from `certificate.*` at diamond selection time.

## Shopify

- `services/shopify.ts`: `createRingCart` (Storefront API) + `createDraftOrder` (Admin API)
- `routes/cart.ts`: `POST /api/cart/create` — validates, calls Shopify, returns `{ checkoutUrl, cartId }`
- Falls back to `/checkout-demo` when no credentials set
- Double-click protection in ReviewRing
- Full Shopify configuration guide: `docs/shopify-configuration.md`
- Metafields, collections, theme settings, and variant structure all documented

## Config Endpoint (/api/config)

Exposes: `metals`, `shapes`, `diamondTypes`, `currency`, `engravingEnabled`, `ringSizes`,
`styles` (STYLES array), `metalTones` (METAL_TONES array), `uiText` (UI_TEXT object)

## UI Text Config

All customer-facing copy lives in `artifacts/api-server/src/config/builder.ts` → `UI_TEXT`.
Exposed via `/api/config → uiText`. Can be swapped for Shopify Theme settings without frontend code changes.

## What Still Needs Real Credentials

1. **Nivoda:** `NIVODA_USERNAME` + `NIVODA_PASSWORD` + set `DIAMOND_DATA_SOURCE=nivoda`; verify `fluorescence` field name against actual API version
2. **Shopify:** `SHOPIFY_STORE_DOMAIN` + `SHOPIFY_STOREFRONT_TOKEN` + `SHOPIFY_ADMIN_API_TOKEN`; Admin scopes: `write_draft_orders`, `read_draft_orders`

## Build

- `pnpm run typecheck` — clean (0 errors)
- `pnpm run build` — passes, ✓ 1840 modules. Sourcemap warnings on tooltip/select/sheet/label (shadcn/ui) are benign.
- Vercel: `vercel.json` at root, output: `artifacts/ring-builder/dist/public`, API: `api/index.ts`

## Key Files

- `artifacts/ring-builder/src/lib/setting-media.ts` — ALL media resolution + `getCatalogPreviewImage()` + `getCatalogHoverImage()`
- `artifacts/ring-builder/src/pages/SettingsCatalog.tsx` — complete catalog with sidebar filters
- `artifacts/ring-builder/src/pages/ReviewRing.tsx` — full 3-step review + Shopify cart CTA
- `artifacts/ring-builder/src/store/use-builder-store.ts` — Zustand store (persisted)
- `artifacts/api-server/src/config/builder.ts` — METALS, SHAPES, STYLES, METAL_TONES, UI_TEXT, RING_SIZES, markup rules
- `artifacts/ring-builder/src/index.css` — Tailwind v4 theme; primary = near-black `0 0% 9%`
- `docs/shopify-configuration.md` — complete Shopify setup guide
