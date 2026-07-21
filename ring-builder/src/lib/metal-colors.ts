/**
 * Maps metal tone labels to CSS gradient values for swatch display.
 * Used anywhere we show a coloured metal selector button.
 */

const METAL_COLORS: Record<string, string> = {
  "White Gold":  "linear-gradient(135deg, #e8e8e8, #c8c8c8)",
  "Yellow Gold": "linear-gradient(135deg, #f5d68e, #c9a44f)",
  "Rose Gold":   "linear-gradient(135deg, #f0c4b0, #d4896a)",
  "Platinum":    "linear-gradient(135deg, #d8d8e0, #a8a8b8)",
};

/**
 * Returns a CSS `background` value for a metal tone string.
 * Falls back to a neutral gray if the tone isn't recognised.
 */
export function metalColor(tone: string): string {
  return METAL_COLORS[tone] ?? "linear-gradient(135deg, #e0e0e0, #bdbdbd)";
}
