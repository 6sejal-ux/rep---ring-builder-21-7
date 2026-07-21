/**
 * CENTRALIZED RING BUILDER CONFIGURATION
 *
 * This is the single place to change:
 * - Available metals, shapes, ring sizes
 * - Diamond type visibility (lab-grown / natural)
 * - Pricing/markup rules
 * - Feature flags (engraving, etc.)
 *
 * Changes here propagate to both the API and frontend automatically.
 */

// ── Metals ───────────────────────────────────────────────────────────────────

export interface MetalOption {
  label: string;
  karat: string;
  tone: string;
}

export const METALS: MetalOption[] = [
  { label: "9K White Gold",   karat: "9K",  tone: "White Gold" },
  { label: "9K Yellow Gold",  karat: "9K",  tone: "Yellow Gold" },
  { label: "9K Rose Gold",    karat: "9K",  tone: "Rose Gold" },
  { label: "14K White Gold",  karat: "14K", tone: "White Gold" },
  { label: "14K Yellow Gold", karat: "14K", tone: "Yellow Gold" },
  { label: "14K Rose Gold",   karat: "14K", tone: "Rose Gold" },
  { label: "18K White Gold",  karat: "18K", tone: "White Gold" },
  { label: "18K Yellow Gold", karat: "18K", tone: "Yellow Gold" },
  { label: "18K Rose Gold",   karat: "18K", tone: "Rose Gold" },
  { label: "Platinum",        karat: "PL",  tone: "Platinum" },
];

// ── Diamond Shapes ───────────────────────────────────────────────────────────

export interface ShapeOption {
  label: string;     // Display name
  nivodaKey: string; // Nivoda API enum value (uppercase)
}

export const SHAPES: ShapeOption[] = [
  { label: "Round",    nivodaKey: "ROUND" },
  { label: "Oval",     nivodaKey: "OVAL" },
  { label: "Cushion",  nivodaKey: "CUSHION" },
  { label: "Princess", nivodaKey: "PRINCESS" },
  { label: "Emerald",  nivodaKey: "EMERALD" },
  { label: "Pear",     nivodaKey: "PEAR" },
  { label: "Marquise", nivodaKey: "MARQUISE" },
  { label: "Radiant",  nivodaKey: "RADIANT" },
  { label: "Heart",    nivodaKey: "HEART" },
  { label: "Asscher",  nivodaKey: "ASSCHER" },
];

// ── Setting Styles ───────────────────────────────────────────────────────────
// Driven by the actual tag values present in settings.json — keep in sync if
// the product catalogue is updated.  These are exposed via /api/config so the
// frontend never hardcodes them.

export interface StyleOption {
  label: string;
  /** Value sent to the API ?style= filter — must match the tag exactly */
  value: string;
}

export const STYLES: StyleOption[] = [
  { label: "Solitaire",     value: "Solitaire" },
  { label: "Three Stone",   value: "Three Stone" },
  { label: "Multi Row",     value: "Multi Row" },
  { label: "Halo",          value: "Halo" },
  { label: "Hidden Halo",   value: "Hidden Halo" },
  { label: "Bypass",        value: "Bypass" },
  { label: "Cluster",       value: "Cluster" },
  { label: "Channel Set",   value: "Channel Set" },
  { label: "Cathedral",     value: "Cathedral" },
  { label: "Twisted Shank", value: "Twisted Shank" },
  { label: "Pavé",          value: "Pavé" },
  { label: "Vintage",       value: "Vintage" },
  { label: "Split Shank",   value: "Split Shank" },
  { label: "Prong Set",     value: "Prong Set" },
];

// ── Metal Tones ───────────────────────────────────────────────────────────────
// Tone-level groupings used for the catalogue filter swatches.
// The filter sends the tone string (e.g. "Yellow Gold") and the API does a
// case-insensitive substring match against the full variant metal name.

export interface MetalToneOption {
  label: string;
  /** Substring sent to the API ?metal= filter */
  value: string;
  /** CSS gradient for the swatch button */
  cssColor: string;
}

export const METAL_TONES: MetalToneOption[] = [
  {
    label: "Yellow Gold", value: "Yellow Gold",
    cssColor: "linear-gradient(135deg, #f5d68e, #c9a44f)",
  },
  {
    label: "White Gold", value: "White Gold",
    cssColor: "linear-gradient(135deg, #e8e8e8, #c8c8c8)",
  },
  {
    label: "Rose Gold", value: "Rose Gold",
    cssColor: "linear-gradient(135deg, #f0c4b0, #d4896a)",
  },
  {
    label: "Platinum", value: "Platinum",
    cssColor: "linear-gradient(135deg, #d8d8e0, #a8a8b8)",
  },
];

// ── UI Text ───────────────────────────────────────────────────────────────────
// Customer-facing copy that lives here so it can later be overridden by
// Shopify Theme Editor settings or a CMS — without touching component code.

export const UI_TEXT = {
  catalog: {
    heading:        "Choose Your Setting",
    subheading:     "Browse our collection of expertly crafted engagement ring settings.",
    emptyTitle:     "No settings found",
    emptyBody:      "Try adjusting your filters to see more options.",
    clearFilters:   "Clear All Filters",
  },
  builder: {
    step1Heading:   "Choose Your Setting",
    step2Heading:   "Choose Your Diamond",
    step3Heading:   "Review Your Ring",
  },
} as const;

// ── Ring Sizes ───────────────────────────────────────────────────────────────

export const RING_SIZES: string[] = [
  "H", "H½",
  "I", "I½",
  "J", "J½",
  "K", "K½",
  "L", "L½",
  "M", "M½",
  "N", "N½",
  "O", "O½",
  "P", "P½",
  "Q", "Q½",
  "R", "R½",
  "S", "S½",
  "T",
];

// ── Diamond Types ────────────────────────────────────────────────────────────

export const DIAMOND_TYPES = {
  /** Show lab-grown diamonds in the search */
  labGrown: true,
  /** Show natural diamonds in the search */
  natural: false,
};

// ── Feature Flags ────────────────────────────────────────────────────────────

export const FEATURES = {
  /** Allow customers to add engraving text */
  engraving: true,
  /** Show diamond video when available */
  diamondVideo: true,
  /** Show "Quick Ship" filter for Nivoda */
  quickShip: false,
};

// ── Currency ─────────────────────────────────────────────────────────────────

export const CURRENCY = "AUD";

// ── Pricing / Markup Engine ───────────────────────────────────────────────────
//
// How diamond pricing works:
//   Nivoda base price  (supplier cost — never shown to customers)
//   × markup multiplier
//   + fixed fee
//   = customer-facing price (in AUD)
//
// Markup rules are applied in order; the FIRST matching rule wins.
// If no rule matches, the fallback multiplier is used.

export interface MarkupRule {
  /** Rule name for logging */
  name: string;
  /** Minimum Nivoda base price for this rule to apply (inclusive) */
  minPrice?: number;
  /** Maximum Nivoda base price for this rule to apply (exclusive) */
  maxPrice?: number;
  /** Percentage markup, e.g. 0.15 = 15% above cost */
  percentageMarkup: number;
  /** Fixed fee added on top (AUD) */
  fixedFee?: number;
}

export const MARKUP_RULES: MarkupRule[] = [
  { name: "Budget (<$500)",         maxPrice: 500,    percentageMarkup: 0.30 },
  { name: "Mid ($500–$2000)",       minPrice: 500,   maxPrice: 2000,   percentageMarkup: 0.22 },
  { name: "Premium ($2000–$10000)", minPrice: 2000,  maxPrice: 10000,  percentageMarkup: 0.18 },
  { name: "Luxury ($10000+)",       minPrice: 10000, percentageMarkup: 0.15 },
];

/** Fallback markup if no rule matches */
export const DEFAULT_MARKUP = 0.20;

/**
 * Calculate the customer-facing price for a diamond.
 * @param nivodaBasePrice - The raw price from Nivoda (supplier cost)
 * @returns Customer-facing price in AUD, rounded to nearest dollar
 */
export function calculateDiamondPrice(nivodaBasePrice: number): number {
  const rule = MARKUP_RULES.find((r) => {
    const aboveMin = r.minPrice == null || nivodaBasePrice >= r.minPrice;
    const belowMax = r.maxPrice == null || nivodaBasePrice < r.maxPrice;
    return aboveMin && belowMax;
  });
  const multiplier = 1 + (rule?.percentageMarkup ?? DEFAULT_MARKUP);
  const fixed = rule?.fixedFee ?? 0;
  return Math.round(nivodaBasePrice * multiplier + fixed);
}
