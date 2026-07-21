# Southern Star Diamonds — Ring Builder

A production-grade 3-step engagement ring configurator for a premium Australian jewellery brand. Customers choose a ring setting, select a live diamond via the Nivoda API, review their complete ring, and add it to their Shopify cart.

## Run & Operate

- `pnpm --filter @workspace/ring-builder run dev` — run the frontend (ring builder UI)
- `pnpm --filter @workspace/api-server run dev` — run the backend API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Secrets Required

Add these in the Replit Secrets panel (lock icon in sidebar):

| Secret | Required | Description |
|---|---|---|
| `NIVODA_ENDPOINT` | Optional | Nivoda GraphQL URL (defaults to production) |
| `NIVODA_USERNAME` | Yes (for diamonds) | Nivoda API username |
| `NIVODA_PASSWORD` | Yes (for diamonds) | Nivoda API password |
| `SHOPIFY_STORE_DOMAIN` | Yes (for checkout) | e.g. `your-store.myshopify.com` |
| `SHOPIFY_STOREFRONT_TOKEN` | Yes (for checkout) | Storefront API access token |
| `SHOPIFY_ADMIN_API_TOKEN` | Optional | Admin API token (for draft orders) |
| `SESSION_SECRET` | Yes | Already set — used for session signing |

Without Nivoda credentials: diamond search returns a "not configured" error with setup instructions.
Without Shopify credentials: cart creation returns a demo checkout URL so the UI flow still works.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter + Zustand + TailwindCSS + shadcn/ui
- API: Express 5 (artifacts/api-server)
- Diamond data: Nivoda GraphQL API (server-side proxy — credentials never exposed to browser)
- Commerce: Shopify Storefront API (cart) / Admin API (draft orders)
- DB: PostgreSQL + Drizzle ORM (available but settings are loaded from JSON for now)
- Validation: Zod (drizzle-zod), Orval codegen from OpenAPI spec
- Build: esbuild (CJS bundle)

## Architecture

```
Browser
  └─ Ring Builder (React + Vite) @ /
       └─ API calls → /api/* (Express server)
            ├─ GET  /api/settings        → reads settings.json (210 rings, ~850 variants)
            ├─ GET  /api/settings/:handle
            ├─ POST /api/diamonds/search → proxies to Nivoda GraphQL API
            ├─ GET  /api/diamonds/:id    → proxies to Nivoda
            ├─ POST /api/diamonds/validate
            ├─ POST /api/cart/create     → creates Shopify cart or draft order
            └─ GET  /api/config          → returns metals, shapes, ring sizes, feature flags
```

## Where Things Live

- `artifacts/ring-builder/src/` — React frontend (pages, components, store)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/services/nivoda.ts` — Nivoda API service (token cache, pricing)
- `artifacts/api-server/src/services/shopify.ts` — Shopify cart/draft order service
- `artifacts/api-server/src/config/builder.ts` — **CENTRAL CONFIG** (metals, shapes, markup rules, feature flags)
- `artifacts/api-server/src/data/settings.json` — 210 ring settings (from Overnight Mountings CSV)
- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/api-client-react/src/generated/` — Generated React Query hooks (don't edit)

## How Pricing Works

Diamond pricing is calculated in `artifacts/api-server/src/config/builder.ts`:

```
Nivoda base price (supplier cost)
× markup multiplier (15–30% depending on price tier)
= Customer-facing price in AUD
```

**To change markup:** Edit `MARKUP_RULES` in `config/builder.ts`. Changes take effect on the next API server restart.

## How to Add/Change Options

All done in `artifacts/api-server/src/config/builder.ts`:

- **Add a metal:** Add entry to `METALS` array
- **Add a shape:** Add entry to `SHAPES` array with `nivodaKey` matching Nivoda's enum
- **Add a ring size:** Add to `RING_SIZES` array
- **Enable/disable engraving:** Set `FEATURES.engraving = true/false`
- **Show natural diamonds:** Set `DIAMOND_TYPES.natural = true`
- **Change markup:** Edit `MARKUP_RULES`

## Settings Data

Settings come from `artifacts/api-server/src/data/settings.json` — 210 unique ring styles (sourced from your Overnight Mountings / Shopify CSV export). Each setting has:
- Variants for up to 10 metals × multiple shapes
- Real product images from Overnight Mountings CDN
- Pricing per variant

To update settings: re-export from Shopify and re-run the CSV parser (see scripts/ folder).

## Architecture Decisions

- Nivoda is a server-side proxy only — credentials never reach the browser
- Diamond prices use a centralized pricing engine — markup rules in one place
- Settings are loaded from a JSON file at startup (fast, no DB queries for browsing)
- Shopify cart uses Storefront API (no server-side secrets needed by browser)
- Builder state uses Zustand with localStorage persistence — survives page refresh

## User Preferences

- Non-technical owner — keep config changes in one central file
- No exposed credentials anywhere in frontend code
- AUD currency throughout
- Premium/luxury aesthetic matching ringsofaustralia.com.au reference

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen`
- The api-server bundles settings.json at build time (via esbuild) — restart after editing it
- `NIVODA_ENDPOINT` defaults to production — use staging for testing: `https://intg-customer-staging.nivodaapi.net/graphql-loupe360`
- Shopify Storefront API requires the `unauthenticated_read_product_listings` and `unauthenticated_write_checkouts` scopes on the access token

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `.env.example` for all required environment variables
