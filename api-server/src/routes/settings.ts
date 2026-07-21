import { Router } from "express";
import { readFileSync } from "fs";
import { join } from "path";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SettingVariant {
  sku: string;
  price: number;
  metal: string;
  shape: string;
  image: string;
  videoUrl?: string | null;
}

interface Setting {
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  images: string[];
  variants: SettingVariant[];
  // Classification fields (merged from CSV)
  settingHeight?: string;
  bandType?: string;
  settingType?: string;
}

// ── Load classification data ──────────────────────────────────────────────────

type ClassificationMap = Record<string, {
  settingHeight: string;
  bandType: string;
  settingType: string;
}>;

let classification: ClassificationMap = {};
try {
  const candidates = [
    join(process.cwd(), "src", "data", "settings-classification.json"),
    join(process.cwd(), "artifacts", "api-server", "src", "data", "settings-classification.json"),
  ];
  let clPath = candidates[0];
  for (const p of candidates) {
    try { readFileSync(p); clPath = p; break; } catch { /* try next */ }
  }
  classification = JSON.parse(readFileSync(clPath, "utf8")) as ClassificationMap;
  console.info(`Loaded classification for ${Object.keys(classification).length} settings`);
} catch (e) {
  console.warn("Could not load settings-classification.json — filter fields will be empty:", e);
}

// ── Load settings data ────────────────────────────────────────────────────────

let allSettings: Setting[] = [];
try {
  const candidates = [
    join(process.cwd(), "src", "data", "settings.json"),
    join(process.cwd(), "artifacts", "api-server", "src", "data", "settings.json"),
  ];
  let dataPath = candidates[0];
  for (const p of candidates) {
    try { readFileSync(p); dataPath = p; break; } catch { /* try next */ }
  }
  const raw = readFileSync(dataPath, "utf8");
  const parsed = JSON.parse(raw) as Setting[];
  allSettings = parsed
    .filter((s) => s.handle && s.title && s.variants?.length > 0 && hasUsableDisplayImage(s))
    .map((s) => {
      const cl = classification[s.handle];
      if (cl) {
        return { ...s, settingHeight: cl.settingHeight, bandType: cl.bandType, settingType: cl.settingType };
      }
      return s;
    });
  console.info(`Loaded ${allSettings.length} valid ring settings from ${dataPath}`);
} catch (e) {
  console.error("Failed to load settings.json — ring settings will be empty:", e);
}

// ── Product visibility ────────────────────────────────────────────────────────

function hasUsableDisplayImage(s: Setting): boolean {
  return s.images.some(u => {
    const f = u.split('/').pop() ?? '';
    if (f.endsWith('.gif')) return false;
    return f.endsWith('.jpg');
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMinPrice(s: Setting): number {
  if (!s.variants.length) return 0;
  return Math.min(...s.variants.map((v) => v.price));
}

// ── Router ────────────────────────────────────────────────────────────────────

const router = Router();

// GET /api/settings
router.get("/settings", (req, res) => {
  const {
    style, metal, shape,
    settingHeight, bandType, settingType,
    minPrice, maxPrice,
    page: pageRaw = "1",
    pageSize: pageSizeRaw = "24",
    sort = "price-asc",
    q,
  } = req.query as Record<string, string>;

  const page = Math.max(1, parseInt(pageRaw, 10) || 1);
  const pageSize = Math.min(250, Math.max(1, parseInt(pageSizeRaw, 10) || 24));
  const minP = minPrice ? parseFloat(minPrice) : undefined;
  const maxP = maxPrice ? parseFloat(maxPrice) : undefined;

  let filtered = allSettings.filter((s) => {
    // Metal: substring match
    if (metal && !s.variants.some((v) =>
      v.metal.toLowerCase().includes(metal.toLowerCase()),
    )) return false;
    if (shape && !s.variants.some((v) => v.shape === shape)) return false;
    // Style: tag match (legacy — kept for backward compatibility)
    if (style && !s.tags.some((t) => t.toLowerCase() === style.toLowerCase())) return false;
    // Classification filters
    if (settingHeight && s.settingHeight !== settingHeight) return false;
    if (bandType && s.bandType !== bandType) return false;
    if (settingType && s.settingType !== settingType) return false;
    // Search
    if (q) {
      const query = q.toLowerCase();
      if (!s.title.toLowerCase().includes(query) && !s.tags.some((t) => t.toLowerCase().includes(query))) return false;
    }
    const cheapest = getMinPrice(s);
    if (minP != null && cheapest < minP) return false;
    if (maxP != null && cheapest > maxP) return false;
    return true;
  });

  filtered.sort((a, b) => {
    const pa = getMinPrice(a);
    const pb = getMinPrice(b);
    if (sort === "price-desc") return pb - pa;
    if (sort === "name-asc") return a.title.localeCompare(b.title);
    return pa - pb;
  });

  const total = filtered.length;
  const pages = Math.ceil(total / pageSize);
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);

  res.json({ items, total, page, pageSize, pages });
});

// GET /api/settings/:handle
router.get("/settings/:handle", (req, res) => {
  const { handle } = req.params;
  const setting = allSettings.find((s) => s.handle === handle);
  if (!setting) {
    res.status(404).json({ error: "Setting not found" });
    return;
  }
  res.json(setting);
});

export default router;
