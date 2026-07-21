# Southern Star Diamonds — Ring Builder

A production-ready bespoke ring configurator: customers choose a setting, configure metal/shape/prong/size, select a diamond, review their masterpiece, and check out directly through Shopify.

---

## Table of Contents

1. [Running Locally](#1-running-locally)
2. [Project Structure](#2-project-structure)
3. [Product Data & Media Logic](#3-product-data--media-logic)
4. [Filters](#4-filters)
5. [How to Edit Products / Settings](#5-how-to-edit-products--settings)
6. [How to Edit Marketing, Trust & Policy Content](#6-how-to-edit-marketing-trust--policy-content)
7. [Nivoda Connection](#7-nivoda-connection)
8. [Nivoda Environment Variables](#8-nivoda-environment-variables)
9. [Switching Demo → Nivoda Live Mode](#9-switching-demo--nivoda-live-mode)
10. [Shopify Connection](#10-shopify-connection)
11. [Shopify Environment Variables & API Scopes](#11-shopify-environment-variables--api-scopes)
12. [How Add to Cart Creates a Shopify Order](#12-how-add-to-cart-creates-a-shopify-order)
13. [GitHub Upload](#13-github-upload)
14. [Vercel Deployment](#14-vercel-deployment)
15. [Environment Variables in Vercel](#15-environment-variables-in-vercel)
16. [What Is Editable — Shopify vs Config vs Code](#16-what-is-editable--shopify-vs-config-vs-code)
17. [Troubleshooting](#17-troubleshooting)

---

## 1. Running Locally

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+

```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Clone the repo and install all dependencies
git clone https://github.com/YOUR_ORG/southern-star-ring-builder.git
cd southern-star-ring-builder
pnpm install

# Copy env template and fill in credentials (see sections 8 & 11)
cp .env.example .env
# Edit .env — the app works without Nivoda/Shopify credentials in demo mode

# Run both services in separate terminals
pnpm --filter @workspace/api-server run dev    # starts API on port 8080
pnpm --filter @workspace/ring-builder run dev  # starts frontend on random port

# Open the URL printed by the frontend dev server
```

The frontend proxies `/api/*` to `http://localhost:8080` automatically via the Vite dev config.

---

## 2. Project Structure

```
southern-star-ring-builder/
├── artifacts/
│   ├── api-server/                 # Express 5 + TypeScript backend
│   │   └── src/
│   │       ├── data/
│   │       │   ├── settings.json               # 209 ring settings (primary)
│   │       │   └── settings-classification.json # settingType/Height/bandType sidecar
│   │       ├── routes/
│   │       │   ├── settings.ts    # GET /api/settings, GET /api/settings/:handle
│   │       │   ├── diamonds.ts    # POST /api/diamonds/search, /validate, GET /:id
│   │       │   ├── cart.ts        # POST /api/cart/create → Shopify
│   │       │   └── config.ts      # GET /api/config (builder options)
│   │       ├── services/
│   │       │   ├── nivoda.ts      # Nivoda GraphQL client (server-only)
│   │       │   ├── shopify.ts     # Shopify Storefront + Admin API (server-only)
│   │       │   └── demo.ts        # Demo diamond data (no credentials needed)
│   │       └── config/
│   │           └── builder.ts     # Diamond markup formula, ring size list
│   └── ring-builder/              # React 19 + Vite + Tailwind v4 frontend
│       └── src/
│           ├── pages/
│           │   ├── SettingsCatalog.tsx  # Step 1 — browse & filter settings
│           │   ├── SettingDetail.tsx    # Step 1 — configure a setting
│           │   ├── DiamondSelector.tsx  # Step 2 — choose a diamond
│           │   └── ReviewRing.tsx       # Step 3 — view masterpiece & checkout
│           ├── store/
│           │   └── use-builder-store.ts # Zustand state (setting + diamond)
│           ├── lib/
│           │   └── setting-media.ts     # Image/GIF URL resolution logic
│           └── config/
│               └── policies.ts          # Trust badges, policy accordion copy
├── lib/
│   └── api-client-react/           # Generated React Query hooks for the API
├── .env.example                    # Environment variable template
├── PRODUCT-DATA-LOGIC.md          # Full data/image/filter documentation
├── PRODUCT-DATA-TEMPLATE.xlsx     # Spreadsheet template for preparing products
├── pnpm-workspace.yaml
└── README.md
```

---

## 3. Product Data & Media Logic

See **`PRODUCT-DATA-LOGIC.md`** for the complete reference. Summary:

- **`settings.json`** — primary product source (209 records). Each product has `handle`, `title`, `variants[]` (price + metal + shape + GIF URL), and `images[]` (static CDN URLs).
- **`settings-classification.json`** — sidecar merged at server startup by `handle`. Adds `settingType`, `settingHeight`, `bandType` for filters and subtitle display.

### Image naming convention (OvernightMountings CDN)

| Filename suffix | Colour |
|----------------|--------|
| `SKU.jpg` | White Gold / Platinum |
| `SKU.alt.jpg` | Yellow Gold |
| `SKU.alt1.jpg` | Rose Gold |

Shape codes for multi-shape settings: `rd` Round · `ov` Oval · `sq` Princess · `cu` Cushion · `em` Emerald · `as` Asscher · `pe` Pear · `ra` Radiant · `mq` Marquise · `he` Heart

GIF/video URLs live in `variant.image` (not `setting.images[]`).

---

## 4. Filters

All filtering is **client-side** — the API fetches all 209 settings once and the browser filters in memory.

| Filter | Data source | Field |
|--------|-------------|-------|
| Setting Type | `settings-classification.json` | `settingType` |
| Setting Height | `settings-classification.json` | `settingHeight` |
| Band Type | `settings-classification.json` | `bandType` |
| Shape | `variants[].shape` | multi-select |
| Metal | `variants[].metal` | karat + tone |
| Price range | `variants[].price` | min price across variants |

To add a new filter value, add it to the sidecar JSON and update the filter chip strip in `SettingsCatalog.tsx`.

---

## 5. How to Edit Products / Settings

### Add a new ring setting

1. Add an object to `artifacts/api-server/src/data/settings.json` inside the `items` array. Use `PRODUCT-DATA-TEMPLATE.xlsx` to prepare the data.
2. Add a matching entry to `artifacts/api-server/src/data/settings-classification.json` keyed by the same `handle`.
3. Restart the API server — it reloads both files on startup. No frontend changes needed.

### Remove a ring setting

Delete the entry from `settings.json` and its corresponding entry from `settings-classification.json`.

### Update pricing

Edit the `price` field in the relevant `variant` objects inside `settings.json`. Prices are in AUD.

### Do not edit

`artifacts/ring-builder/src/lib/setting-media.ts` — this file contains the image resolution logic that maps product/shape/colour to the correct CDN URL. Editing it incorrectly will break image display.

---

## 6. How to Edit Marketing, Trust & Policy Content

All customer-facing copy that isn't product data is centralised in one file:

**`artifacts/ring-builder/src/config/policies.ts`**

### Trust badges

Edit the `TRUST_BADGES` array. Each badge has:
- `icon` — a Lucide React icon component
- `title` — bold headline
- `body` — supporting text

### Policy accordions

Edit the `POLICY_ACCORDIONS` array. Each accordion has:
- `title` — the collapsed label (e.g. "Shipping & Returns")
- `items` — array of bullet strings; supports `**bold**` markdown

### Promo / Afterpay card

Replace `artifacts/ring-builder/public/promo-afterpay.png` with any 1:1 square promotional image. Edit the copy in the `PromoCard` component at the top of `SettingsCatalog.tsx`.

---

## 7. Nivoda Connection

The Nivoda integration is **fully implemented** in `artifacts/api-server/src/services/nivoda.ts`.

### What the integration covers

- ✅ Authentication (token cached for 50 minutes)
- ✅ Diamond search with server-side filters: shape, carat range, colour, clarity, cut, lab-grown flag
- ✅ Server-side pagination (offset + limit)
- ✅ Diamond availability & price revalidation before checkout
- ✅ Supplier price never exposed to the browser (only customer-facing price sent)
- ✅ Fallback to demo mode when credentials are absent

### Supported diamond filters

Shape · Carat min/max · Colour · Clarity · Cut · Lab-grown toggle · Pagination (24 per page) · Sorting (asc/desc by price)

Fields returned per diamond: ID · Carat · Shape · Colour · Clarity · Cut · Polish · Symmetry · Fluorescence · Lab · Certificate number · Dimensions · Price

---

## 8. Nivoda Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DIAMOND_DATA_SOURCE` | Yes (to enable live) | Set to `nivoda`. Default is `demo`. |
| `NIVODA_ENDPOINT` | No | Defaults to `https://integrations.nivoda.net/graphql-loupe360`. Change only if Nivoda gives you a different endpoint. |
| `NIVODA_USERNAME` | Yes | Your Nivoda account username |
| `NIVODA_PASSWORD` | Yes | Your Nivoda account password |

Obtain credentials from [https://integrations.nivoda.net](https://integrations.nivoda.net).

**Security:** These variables must NEVER be prefixed with `VITE_`. They are server-only. The browser never sees them.

---

## 9. Switching Demo → Nivoda Live Mode

1. Add `NIVODA_USERNAME` and `NIVODA_PASSWORD` to your environment (Replit Secrets, `.env`, or Vercel).
2. Set `DIAMOND_DATA_SOURCE=nivoda`.
3. Restart the API server.
4. The server logs `Diamond data source: NIVODA (live API)` on startup.
5. The diamond grid now shows live Nivoda inventory. No frontend changes needed.

To revert to demo mode, remove `DIAMOND_DATA_SOURCE` or set it back to `demo`.

---

## 10. Shopify Connection

The Shopify integration is **fully implemented** in `artifacts/api-server/src/services/shopify.ts`.

### What the integration covers

- ✅ Cart creation via Shopify Storefront API with full ring configuration as line-item attributes
- ✅ Draft order creation via Admin API (alternative path for custom pricing)
- ✅ All setting + diamond details preserved as named attributes for fulfilment
- ✅ Total price calculated server-side — frontend price is not trusted
- ✅ Admin API token never exposed to the browser
- ✅ Double-click protection on the Add to Cart button
- ✅ Demo fallback when credentials are absent (`/checkout-demo`)

### Required Shopify app permissions

When creating a custom app in Shopify Admin → Apps → Develop apps:

**Storefront API scopes (for cart creation):**
- `unauthenticated_write_checkouts`
- `unauthenticated_read_product_listings`

**Admin API scopes (for draft orders — optional):**
- `read_products`
- `write_draft_orders`

---

## 11. Shopify Environment Variables & API Scopes

| Variable | Required | Description |
|----------|----------|-------------|
| `SHOPIFY_STORE_DOMAIN` | Yes | Your store domain, e.g. `southern-star.myshopify.com` |
| `SHOPIFY_STOREFRONT_TOKEN` | Yes | Storefront API access token from Shopify Admin → Apps → Develop apps → your app → API credentials → Install |
| `SHOPIFY_ADMIN_API_TOKEN` | Optional | Admin API token — only needed for draft orders (alternative checkout). Format: `shpat_...` |

**Security:** These variables must NEVER be prefixed with `VITE_`. They are server-only.

Without these variables the app works normally in demo mode — Add to Cart redirects to `/checkout-demo` instead of Shopify.

---

## 12. How Add to Cart Creates a Shopify Order

```
Customer clicks "Add to Cart"
  ↓
Frontend: double-click guard activates (button disabled)
  ↓
Backend: POST /api/diamonds/validate { nivodaId }
  → Nivoda revalidates: still available? current price?
  → If unavailable: user sees "Diamond no longer available" toast, flow stops
  ↓
Backend: POST /api/cart/create { lineItem }
  → Server validates all required fields + prices
  → Calls Shopify Storefront API cartCreate mutation
  → Cart contains: quantity 1, all setting/diamond details as named attributes
  → Returns { checkoutUrl, cartId }
  ↓
Frontend: window.location.href = checkoutUrl
  → Customer lands on Shopify native checkout
  → Shopify handles payment, fulfilment, email receipts
```

### What Shopify receives per order

**Cart-level note:**
> `Complete Ring Order — Setting: Elodie Solitaire | Diamond: 1.20ct Round E VS1 | Total: AUD $8,450`

**Line-item attributes (visible in Shopify Admin → Orders):**
- Setting Handle, Setting Name, Setting SKU
- Metal, Shape, Ring Size, Engraving (if provided)
- Setting Price
- Diamond ID (Nivoda), Diamond Carat, Color, Clarity, Cut, Lab, Certificate No.
- Diamond Price, Total Ring Price

**Price validation:**
- Frontend sends setting price from the API response (not user-editable)
- Diamond price is re-fetched from Nivoda at validation time — frontend price is only a display fallback
- Total is re-calculated server-side

**Draft order alternative:**
If you need fully custom pricing per order (not tied to Shopify product variants), call `POST /api/cart/create` with `useDraftOrder: true`. The Admin API token must be set. Draft orders appear in Shopify Admin → Orders → Drafts.

---

## 13. GitHub Upload

```bash
# Ensure .env is in .gitignore (it already is)
cat .gitignore | grep .env

# Initialise repo (if not already)
git init
git add .
git commit -m "Initial commit — Southern Star Ring Builder"

# Push to GitHub
git remote add origin https://github.com/YOUR_ORG/southern-star-ring-builder.git
git branch -M main
git push -u origin main
```

The following are already excluded via `.gitignore`:
- `node_modules/`
- `dist/` and `build/`
- `.env` (real secrets)
- `*.log`
- Replit internal files

---

## 14. Vercel Deployment

This is a pnpm monorepo. Vercel handles it natively.

### Frontend (ring-builder)

1. Import the GitHub repo in Vercel
2. Framework preset: **Vite**
3. Root directory: `artifacts/ring-builder`
4. Build command: `pnpm run build`
5. Output directory: `dist/public`

### Backend (api-server)

The backend must be deployed separately as a Node.js service (Render, Railway, Fly.io, or a Vercel serverless rewrite).

**Recommended: deploy api-server on Render or Railway**

1. Create a new Web Service pointing to `artifacts/api-server`
2. Build command: `pnpm install && pnpm run build`
3. Start command: `pnpm run start`
4. Add all environment variables from `.env.example`

Then update the frontend's `VITE_API_BASE_URL` to point to the deployed backend URL.

**Alternative: Vercel with vercel.json rewrites**

If you want everything on one Vercel project, add a `vercel.json` at the root:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://your-api-server.example.com/api/$1" }
  ]
}
```

---

## 15. Environment Variables in Vercel

In Vercel → Project → Settings → Environment Variables, add:

| Variable | Environment | Notes |
|----------|-------------|-------|
| `DIAMOND_DATA_SOURCE` | Production | `nivoda` for live diamonds |
| `NIVODA_ENDPOINT` | Production | Usually leave blank (uses default) |
| `NIVODA_USERNAME` | Production | From Nivoda |
| `NIVODA_PASSWORD` | Production | From Nivoda |
| `SHOPIFY_STORE_DOMAIN` | Production | e.g. `southern-star.myshopify.com` |
| `SHOPIFY_STOREFRONT_TOKEN` | Production | From Shopify app |
| `SHOPIFY_ADMIN_API_TOKEN` | Production | From Shopify app (optional) |
| `SESSION_SECRET` | Production | Random 32-char string |

Generate a session secret: `openssl rand -base64 32`

**Important:** None of the above should have the `VITE_` prefix. They are all server-side secrets.

---

## 16. What Is Editable — Shopify vs Config vs Code

### ✅ Editable directly from Shopify Admin

| What | Where in Shopify |
|------|-----------------|
| Checkout appearance (colours, fonts, logo) | Online Store → Themes → Customize → Checkout |
| Payment methods | Settings → Payments |
| Shipping zones and rates | Settings → Shipping and delivery |
| Tax configuration | Settings → Taxes |
| Email notification templates | Settings → Notifications |
| Order management & fulfilment | Orders → (order) → Fulfil |
| Draft order details | Orders → Drafts |
| Customer records | Customers |
| Discount codes | Discounts |

### ✅ Editable from Ring Builder config/data files (no Shopify access needed)

| What | File |
|------|------|
| Ring settings (add/remove/update products) | `artifacts/api-server/src/data/settings.json` |
| Setting filters (settingType / bandType / settingHeight) | `artifacts/api-server/src/data/settings-classification.json` |
| Trust badge text | `artifacts/ring-builder/src/config/policies.ts` → `TRUST_BADGES` |
| Policy accordion content (Shipping, Warranty, etc.) | `artifacts/ring-builder/src/config/policies.ts` → `POLICY_ACCORDIONS` |
| Diamond price markup formula | `artifacts/api-server/src/config/builder.ts` → `calculateDiamondPrice()` |
| Ring size options | `artifacts/api-server/src/config/builder.ts` → `RING_SIZES` |
| Builder configuration (metals, shapes available) | `artifacts/api-server/src/config/builder.ts` |
| Promo card image & text | `artifacts/ring-builder/public/promo-afterpay.png` + `PromoCard` in `SettingsCatalog.tsx` |
| "Consult an Expert" email address | `artifacts/ring-builder/src/pages/SettingDetail.tsx` → `mailto:` link |

### ⚠️ Requires code changes

| What | Notes |
|------|-------|
| Adding new filter types (beyond settingType/Height/bandType) | Edit `SettingsCatalog.tsx` + `settings.ts` |
| Adding new diamond filter types | Edit `DiamondSelector.tsx` + `nivoda.ts` |
| Changing the 3-step flow structure | Edit `App.tsx` routing |
| Adding new page sections | Edit the relevant page component |
| Changing Shopify API version | Edit `STOREFRONT_VERSION` / `ADMIN_VERSION` in `shopify.ts` |

**Important:** The Shopify Admin cannot edit ring settings, diamond inventory, trust badge copy, or policy accordion text. Those are managed in the config files listed above.

---

## 17. Troubleshooting

### App shows "Diamond search is not configured" in the diamond grid

- `DIAMOND_DATA_SOURCE` is set to `nivoda` but Nivoda credentials are missing or wrong.
- Fix: check `NIVODA_USERNAME` and `NIVODA_PASSWORD` in your environment.
- Alternatively, set `DIAMOND_DATA_SOURCE=demo` to use built-in demo data.

### Add to Cart redirects to `/checkout-demo` instead of Shopify

- Shopify credentials are not configured.
- Fix: add `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_TOKEN` to your environment and restart the API server.

### "Diamond no longer available" toast on checkout

- The selected Nivoda diamond was sold between browse and checkout.
- Expected behaviour — the customer must select a different diamond.

### Images not loading on product cards

- The OvernightMountings CDN is the image source. Images load only if the SKU exists on their platform.
- Check `images[]` URLs in `settings.json` are valid.
- Do not modify `artifacts/ring-builder/src/lib/setting-media.ts` — it handles all URL resolution.

### API server not starting

- Run `pnpm --filter @workspace/api-server run build` and check for TypeScript errors.
- Ensure `NODE_ENV` is set (or defaults to development).

### Vite dev server shows blank screen

- Ensure the API server is running on port 8080 before starting the frontend.
- Check browser console for API errors.

### Classification filters (settingType etc.) show as blank on products

- The product `handle` in `settings-classification.json` must exactly match the `handle` in `settings.json`.
- Handles are case-sensitive and must be kebab-case.

### Production build fails

```bash
pnpm run typecheck       # check TypeScript errors first
pnpm --filter @workspace/ring-builder run build
```

### Shopify cart creation returns 503

- Shopify credentials are present but invalid.
- Verify the Storefront API token has `unauthenticated_write_checkouts` scope.
- Verify `SHOPIFY_STORE_DOMAIN` is `your-store.myshopify.com` (not `https://...`).

---

## Environment Variables Quick Reference

Copy `.env.example` to `.env` and fill in real values. Never commit `.env`.

```env
DIAMOND_DATA_SOURCE=demo         # Change to "nivoda" for live diamonds
NIVODA_ENDPOINT=                 # Optional — defaults to Nivoda staging endpoint
NIVODA_USERNAME=                 # Required for live Nivoda
NIVODA_PASSWORD=                 # Required for live Nivoda
SHOPIFY_STORE_DOMAIN=            # e.g. southern-star.myshopify.com
SHOPIFY_STOREFRONT_TOKEN=        # From Shopify app → Storefront API
SHOPIFY_ADMIN_API_TOKEN=         # Optional — for draft orders
SESSION_SECRET=                  # Any long random string
```
