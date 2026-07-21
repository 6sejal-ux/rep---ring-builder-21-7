import { Router } from "express";

// Static imports — esbuild bundles these directly into the function.
// This eliminates all process.cwd() / readFileSync path guessing that
// fails in Vercel's serverless runtime.
import settingsRaw from "../data/settings.json";
import classificationRaw from "../data/settings-classification.json";

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
  settingHeight?: string;
  bandType?: string;
  settingType?: string;
}

type ClassificationMap = Record<string, {
  settingHeight: string;
  bandType: string;
  settingType: string;
}>;

// ── Product visibility ────────────────────────────────────────────────────────

function hasUsableDisplayImage(s: Setting): boolean {
  return s.images.some(u => {
    const f = u.split("/").pop() ?? "";
    if (f.endsWith(".gif")) return false;
    return f.endsWith(".jpg");
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMinPrice(s: Setting): number {
  if (!s.variants.length) return 0;
  return Math.min(...s.variants.map((v) => v.price));
}

// ── Load data from static imports ─────────────────────────────────────────────

const classification = classificationRaw as unknown as ClassificationMap;

const allSettings: Setting[] = (settingsRaw as unknown as Setting[])
  .filter((s) => s.handle && s.title && s.variants?.length > 0 && hasUsableDisplayImage(s))
  .map((s) => {
    const cl = classification[s.handle];
    if (cl) {
      return { ...s, settingHeight: cl.settingHeight, bandType: cl.bandType, settingType: cl.settingType };
    }
    return s;
  });

console.info(`Loaded ${allSettings.length} valid ring settings (static bundle)`);

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
    if (metal && !s.variants.some((v) =>
      v.metal.toLowerCase().includes(metal.toLowerCase()),
    )) return false;
    if (shape && !s.variants.some((v) => v.shape === shape)) return false;
    if (style && !s.tags.some((t) => t.toLowerCase() === style.toLowerCase())) return false;
    if (settingHeight && s.settingHeight !== settingHeight) return false;
    if (bandType && s.bandType !== bandType) return false;
    if (settingType && s.settingType !== settingType) return false;
    if (q) {
      const query = q.toLowerCase();
      if (
        !s.title.toLowerCase().includes(query) &&
        !s.tags.some((t) => t.toLowerCase().includes(query))
      ) return false;
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
