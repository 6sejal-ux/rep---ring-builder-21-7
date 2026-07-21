# PRODUCT DATA LOGIC — Southern Star Diamonds Ring Builder

This document explains exactly how product data is structured, read, and mapped so you can prepare products externally and re-import them without breaking the Ring Builder.

---

## A. Source Files

| File | Purpose |
|------|---------|
| `artifacts/api-server/src/data/settings.json` | **Primary product data** — 209 active ring settings |
| `artifacts/api-server/src/data/settings-classification.json` | **Classification sidecar** — adds `settingHeight`, `bandType`, `settingType` per product |

The two files are merged at server startup. The key that joins them is the product `handle`.

---

## B. Fields Currently Used

### From `settings.json`

Every product is an object inside the top-level `items` array.

| Field | Type | Controls |
|-------|------|---------|
| `handle` | `string` | **Unique ID** — used in URLs (`/setting/<handle>`), filter keys, classification join |
| `title` | `string` | Product name displayed everywhere |
| `description` | `string` (HTML) | Rich text shown on the product detail page |
| `productType` | `string` | Always `"Setting"` — used for filtering valid products |
| `tags` | `string[]` | Informational only (e.g. `"Solitaire"`, `"Lab Grown Diamond"`) |
| `variants` | `Variant[]` | All metal + shape combinations (see table below) |
| `images` | `string[]` | Static image URLs (OvernightMountings CDN) + angle views |

#### Variant fields

| Field | Type | Controls |
|-------|------|---------|
| `sku` | `string` | OvernightMountings SKU (e.g. `51196-E-10.3X6.2-9KW-Lab`) |
| `price` | `number` | Setting price in AUD (excluding diamond) |
| `metal` | `string` | Full metal name (e.g. `"9K Yellow Gold"`, `"14K White Gold"`) |
| `shape` | `string` | Diamond shape (e.g. `"Round"`, `"Oval"`) |
| `image` | `string \| null` | **GIF/video URL** (Lovable CDN). One per metal tone. NOT a static photo. |

### From `settings-classification.json`

Each key is a product `handle`. The value is merged onto the product at load time.

| Field | Allowed Values | Controls |
|-------|---------------|---------|
| `settingHeight` | `"High Set"`, `"Low Set"` | Setting Height filter |
| `bandType` | `"Accents"`, `"Plain"`, `"Twisted"`, `"Side Stone"` | Band Type filter |
| `settingType` | `"Solitaire"`, `"Halo"`, `"Hidden Halo"`, `"Toi Et Moi"`, `"Unique"`, `"Bezel"`, `"Pavé"` | Setting Type filter + category thumbnail |

---

## C. Unique Identifier

**`handle`** is the unique product identifier.

- Format: kebab-case slug derived from the product name + SKU root  
  Example: `elodie-solitaire-85346`, `aurora-solitaire-80066`
- Used in: URL path (`/setting/<handle>`), classification join key, Zustand store

---

## D. Image / Media Naming Logic

### Static images (OvernightMountings CDN)

Base URL: `https://connect.overnightmountings.com/gemfind/library/Images_And_Videos/<SKU>/`

#### Colour encoding

| Filename pattern | Colour |
|-----------------|--------|
| `SKU.jpg` | White Gold / Platinum |
| `SKU.alt.jpg` | Yellow Gold |
| `SKU.alt1.jpg` | Rose Gold |

`.alt` and `.alt1` are embedded **in the filename before `.jpg`**, not separate file extensions.

#### Angle/view markers

| Marker | Meaning |
|--------|---------|
| `.side.` | Side profile view |
| `.angle.` | Angled/three-quarter view |
| `.set.` | Shown with stone set |
| `.ver.` | Vertical view |

Example: `51196-E.side.alt.jpg` = side view in yellow gold.

#### Shape codes (for multi-shape settings)

| Code | Shape |
|------|-------|
| `rd` | Round |
| `ov` | Oval |
| `sq` | Princess |
| `cu` | Cushion |
| `em` | Emerald |
| `as` | Asscher |
| `pe` | Pear |
| `ra` | Radiant |
| `mq` | Marquise |
| `he` | Heart |

### Two types of settings

#### Single-shape (≈190 settings)
- `images[]` contains a **plain** `SKU.jpg` (no shape code before `.jpg`)
- Serves one shape only; images switch by colour only
- Example images: `50274-E-5.jpg`, `50274-E-5.alt.jpg`, `50274-E-5.alt1.jpg`

#### Multi-shape (≈19 settings)
- `images[]` has **NO** plain `SKU.jpg` — every image includes a shape code
- White only per shape; yellow/rose only available via GIF
- Example images: `80066.rd.jpg`, `80066.ov.jpg`, `80066.sq.jpg`

**Detection rule (do not change):** if any image in `images[]` ends in `.jpg` with no `.alt` suffix AND no shape code directly before `.jpg` → single-shape. Otherwise multi-shape.

### How SETTING + SHAPE + COLOUR finds the image

Resolution order (highest priority first):

| Step | Pattern tried | Example |
|------|-------------|---------|
| 1 | Shape + colour | `80066.ov.alt.jpg` |
| 2 | Shape + white (multi-shape only) | `80066.ov.jpg` |
| 3 | Plain colour | `50274-E.alt.jpg` |
| 4 | Plain white | `50274-E.jpg` |
| 5 | Any non-GIF | absolute fallback |

### GIF / Video

- **Stored in `variant.image`** — NOT in `settings.images[]`
- One GIF per metal tone (all shapes share the same GIF for a given tone)
- GIF URLs come from the Lovable CDN, not OvernightMountings
- In the gallery these appear last, labelled **Video** with a Play icon

### Fallback logic

If the ideal image for a colour/shape combination doesn't exist:
1. Falls back through the resolution steps above
2. Multi-shape settings fall back to Round (`rd`) images if the selected shape has no images
3. Catalogue cards always use Yellow Gold as the default display colour

---

## E. Filter Mapping

| Filter | Source | Field | Notes |
|--------|--------|-------|-------|
| Setting Type | `settings-classification.json` | `settingType` | 7 values |
| Setting Height | `settings-classification.json` | `settingHeight` | High Set / Low Set |
| Band Type | `settings-classification.json` | `bandType` | 4 values |
| Shape | `variants[].shape` | n/a | Multi-select; matches any variant |
| Metal | `variants[].metal` | n/a | Karat + tone match (e.g. `"9K Yellow"`) |
| Price | `variants[].price` | n/a | Min price across all variants |

**All filtering is client-side** — the API fetches all 209 settings in one call (`pageSize=250`) and the frontend filters in memory.

---

## F. Sample Product Data Template

Use this structure to prepare new products externally and re-import them.

### `settings.json` entry

```json
{
  "handle": "my-ring-name-12345",
  "title": "My Ring Name",
  "description": "<p>Elegant solitaire setting with a classic four-prong head.</p>",
  "productType": "Setting",
  "tags": ["Solitaire", "Engagement Rings", "Lab Grown Diamond"],
  "variants": [
    {
      "sku": "12345-9KW-rd-Lab",
      "price": 450.00,
      "metal": "9K White Gold",
      "shape": "Round",
      "image": "https://cdn.example.com/12345.video.white.gif"
    },
    {
      "sku": "12345-9KY-rd-Lab",
      "price": 440.00,
      "metal": "9K Yellow Gold",
      "shape": "Round",
      "image": "https://cdn.example.com/12345.video.yellow.gif"
    },
    {
      "sku": "12345-9KR-rd-Lab",
      "price": 440.00,
      "metal": "9K Rose Gold",
      "shape": "Round",
      "image": "https://cdn.example.com/12345.video.rose.gif"
    },
    {
      "sku": "12345-9KW-ov-Lab",
      "price": 450.00,
      "metal": "9K White Gold",
      "shape": "Oval",
      "image": "https://cdn.example.com/12345.video.white.gif"
    }
  ],
  "images": [
    "https://connect.overnightmountings.com/gemfind/library/Images_And_Videos/12345/12345.jpg",
    "https://connect.overnightmountings.com/gemfind/library/Images_And_Videos/12345/12345.alt.jpg",
    "https://connect.overnightmountings.com/gemfind/library/Images_And_Videos/12345/12345.alt1.jpg",
    "https://connect.overnightmountings.com/gemfind/library/Images_And_Videos/12345/12345.side.jpg",
    "https://connect.overnightmountings.com/gemfind/library/Images_And_Videos/12345/12345.side.alt.jpg"
  ]
}
```

### `settings-classification.json` entry

Add one entry per handle to this file (keyed by handle):

```json
{
  "my-ring-name-12345": {
    "settingHeight": "High Set",
    "bandType": "Plain",
    "settingType": "Solitaire"
  }
}
```

### Valid values quick reference

| Field | Valid values |
|-------|-------------|
| `settingHeight` | `"High Set"` · `"Low Set"` |
| `bandType` | `"Accents"` · `"Plain"` · `"Twisted"` · `"Side Stone"` |
| `settingType` | `"Solitaire"` · `"Halo"` · `"Hidden Halo"` · `"Toi Et Moi"` · `"Unique"` · `"Bezel"` · `"Pavé"` |
| `metal` | `"9K White Gold"` · `"9K Yellow Gold"` · `"9K Rose Gold"` · `"14K White Gold"` · `"14K Yellow Gold"` · `"14K Rose Gold"` · `"18K White Gold"` · `"18K Yellow Gold"` · `"18K Rose Gold"` · `"Platinum"` |
| `shape` | `"Round"` · `"Oval"` · `"Cushion"` · `"Princess"` · `"Emerald"` · `"Pear"` · `"Marquise"` · `"Radiant"` · `"Heart"` · `"Asscher"` |
| `productType` | Always `"Setting"` |

### Rules for a valid product

1. `handle` must be unique (kebab-case)
2. At least one variant must exist
3. At least one image in `images[]` must be a non-GIF `.jpg`
4. `image` in each variant should be a `.gif` URL (or `null` if no video)
5. Add a matching entry in `settings-classification.json` (or the product will have no classification filters)

---

## Importing New Products

1. Add entries to `artifacts/api-server/src/data/settings.json` inside the `items` array
2. Add the corresponding entries to `artifacts/api-server/src/data/settings-classification.json`
3. Restart the API server workflow — it reloads both files at startup
4. No frontend changes needed; the product will appear automatically

> **Do not modify the image resolution logic in `artifacts/ring-builder/src/lib/setting-media.ts`** — it handles all the OvernightMountings URL conventions described above.
