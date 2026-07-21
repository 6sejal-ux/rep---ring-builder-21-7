/**
 * Setting Media Resolver
 *
 * Resolves the correct static image(s) and GIF for a ring setting based on
 * selected shape and metal colour.
 *
 * ─── URL naming conventions (connect.overnightmountings.com) ─────────────
 *   SKU.jpg        → White Gold / Platinum  (no .alt marker)
 *   SKU.alt.jpg    → Yellow Gold            (.alt. inside filename)
 *   SKU.alt1.jpg   → Rose Gold             (.alt1. inside filename)
 *
 * ".alt" / ".alt1" are NAMING MARKERS embedded before ".jpg".  Every image
 * URL ends in ".jpg".  They are never standalone file formats.
 *
 * ─── Shape codes for multi-shape settings ────────────────────────────────
 *   rd=Round  ov=Oval  sq=Princess  cu=Cushion  em=Emerald
 *   as=Asscher  pe=Pear  ra=Radiant  mq=Marquise  he=Heart
 *
 * ─── Two types of settings ───────────────────────────────────────────────
 *   Single-shape (190): SKU.jpg / SKU.alt.jpg / SKU.alt1.jpg + angle variants
 *   Multi-shape  ( 19): SKU.rd.jpg / SKU.ov.jpg … (white only — no colour
 *                       suffix per shape).  Yellow/Rose only via GIF.
 *
 * ─── GIFs ────────────────────────────────────────────────────────────────
 *   Stored in variant.image — NEVER in setting.images[].
 *   One GIF per metal tone; NOT shape-specific.
 */

/** Maps display shape name → OvernightMountings shape code */
export const SHAPE_TO_CODE: Record<string, string> = {
  Round:    'rd',
  Oval:     'ov',
  Princess: 'sq',
  Cushion:  'cu',
  Emerald:  'em',
  Asscher:  'as',
  Pear:     'pe',
  Radiant:  'ra',
  Marquise: 'mq',
  Heart:    'he',
};

export type MetalTone = 'white' | 'yellow' | 'rose';

/** Derives white / yellow / rose from a full metal name string. */
export function getMetalTone(metal: string): MetalTone {
  const m = metal.toLowerCase();
  if (m.includes('yellow')) return 'yellow';
  if (m.includes('rose'))   return 'rose';
  return 'white';
}

/**
 * Classifies a static image URL as white / yellow / rose / null (GIF).
 * Rule: .alt1. → rose  |  .alt. (not .alt1.) → yellow  |  ends .jpg → white
 */
export function imageColour(url: string): MetalTone | null {
  const f = url.split('/').pop() ?? '';
  if (f.endsWith('.gif'))    return null;
  if (f.includes('.alt1.'))  return 'rose';
  if (f.includes('.alt.'))   return 'yellow';
  if (f.endsWith('.jpg'))    return 'white';
  return null;
}

/**
 * Returns true when the images array belongs to a multi-shape setting.
 *
 * Detection rule:
 *   Multi-shape settings have NO plain base image (SKU.jpg without a shape
 *   code or colour suffix); every image is shape-coded.
 *   Single-shape settings always include at least one plain white image
 *   (SKU.jpg / SKU-SIZE.jpg), even when they also carry angle images whose
 *   names incidentally contain shape-code strings (e.g. SKU.em.side.alt.jpg).
 *
 *   Therefore: if a plain white image exists → single-shape.
 *              If none exists AND shape-coded images exist → multi-shape.
 */
export function isMultiShapeImages(images: string[]): boolean {
  const codes = Object.values(SHAPE_TO_CODE);

  // "Plain white" = ends in .jpg, no .alt suffix, no shape code directly
  // before .jpg  (i.e. NOT SKU.rd.jpg).
  const hasPlainWhite = images.some(u => {
    const f = u.split('/').pop() ?? '';
    return (
      f.endsWith('.jpg')
      && !f.includes('.alt')
      && !codes.some(c => new RegExp(`\\.${c}\\.jpg$`).test(f))
    );
  });

  if (hasPlainWhite) return false;

  // Require at least one shape-coded image (SKU.rd.jpg / SKU.ov.alt.jpg …).
  return images.some(u => {
    const f = u.split('/').pop() ?? '';
    return codes.some(
      c => new RegExp(`\\.${c}\\.jpg$`).test(f) || new RegExp(`\\.${c}\\.alt`).test(f),
    );
  });
}

/**
 * Resolves the best single static image URL for the given shape + metal tone.
 * Used when storing the chosen setting in the builder store.
 *
 * Search order:
 *  1. Shape + colour  → SKU.ov.alt.jpg    (multi-shape with colour variant)
 *  2. Shape white     → SKU.ov.jpg        (multi-shape fallback — ONLY for multi-shape)
 *  3. Plain colour    → SKU.alt.jpg       (single-shape default colour)
 *  4. Plain white     → SKU.jpg           (single-shape fallback)
 *  5. First non-GIF   → absolute fallback
 *
 * NOTE on step 2: Single-shape products sometimes carry incidental shape-coded
 * angle images (e.g. SKU.rd.jpg as a gallery view). Step 2 is intentionally
 * gated on isMultiShapeImages() so those never incorrectly override the plain
 * yellow image at step 3.
 */
export function resolveStaticImage(
  images: string[],
  shape: string,
  tone: MetalTone,
): string | null {
  if (!images.length) return null;

  const code   = SHAPE_TO_CODE[shape] ?? 'rd';
  const fname  = (url: string) => url.split('/').pop() ?? '';

  // 1. Shape + colour  e.g. SKU.ov.alt.jpg
  const shapeColourSuffix =
    tone === 'yellow' ? '.alt.jpg'  :
    tone === 'rose'   ? '.alt1.jpg' : '.jpg';

  const shapeColour = images.find(u => {
    const f = fname(u);
    if (tone === 'white') {
      return new RegExp(`\\.${code}\\.jpg$`).test(f) && !f.includes('.alt');
    }
    return new RegExp(`\\.${code}${shapeColourSuffix}$`).test(f);
  });
  if (shapeColour) return shapeColour;

  // 2. Shape white — MULTI-SHAPE ONLY.
  // Do not run for single-shape products; they may have incidental shape-coded
  // angle images (SKU.rd.jpg) that must not override the plain colour at step 3.
  if (tone !== 'white' && isMultiShapeImages(images)) {
    const shapeWhite = images.find(u => {
      const f = fname(u);
      return new RegExp(`\\.${code}\\.jpg$`).test(f) && !f.includes('.alt');
    });
    if (shapeWhite) return shapeWhite;
  }

  // 3 & 4. Plain colour / plain white (single-shape settings)
  // "plain" = no shape code immediately before .jpg
  const codes = Object.values(SHAPE_TO_CODE);
  const noShapeCode = (u: string) => {
    const f = fname(u);
    return !codes.some(c => new RegExp(`\\.${c}\\.jpg$`).test(f));
  };

  const plainColour = images.find(u => noShapeCode(u) && imageColour(u) === tone);
  if (plainColour) return plainColour;

  const plainWhite = images.find(u => noShapeCode(u) && imageColour(u) === 'white');
  if (plainWhite) return plainWhite;

  // 5. Absolute fallback
  return images.find(u => !u.endsWith('.gif')) ?? images[0] ?? null;
}

/** Extracts the GIF URL for a given metal tone from the variants array. */
export function resolveGif(
  variants: ReadonlyArray<{ metal: string; image: string | null }>,
  tone: MetalTone,
): string | null {
  const match = variants.find(v => getMetalTone(v.metal) === tone);
  const img = match?.image ?? null;
  if (!img || !img.endsWith('.gif')) return null;
  return img;
}

/**
 * Returns true if the setting has at least one usable static display image.
 *
 * "Usable" means: a non-GIF image URL that resolves to a known colour
 * classification (white/yellow/rose).  GIF-only settings have no static
 * preview suitable for catalogue cards and must be hidden from customers.
 *
 * This is the SINGLE authoritative visibility rule.  Apply it server-side
 * (routes/settings.ts) and optionally client-side as a safety net.
 * DO NOT scatter this logic across multiple UI components.
 */
export function hasUsableDisplayImage(images: string[]): boolean {
  return images.some(u => !u.endsWith('.gif') && imageColour(u) !== null);
}

/**
 * Returns the best preview image for a catalogue card.
 * NEVER returns a GIF — catalogue must use static images only.
 */
export function getPreviewImage(images: string[]): string | null {
  return (
    images.find(u => !u.endsWith('.gif') && imageColour(u) === 'white')
    ?? images.find(u => !u.endsWith('.gif'))
    ?? null
  );
}

/**
 * Filename markers that indicate an angle/side view (not a straight-on hero shot).
 * Used to distinguish the primary hero image from secondary gallery views.
 */
const ANGLE_MARKERS = ['.side.', '.angle.', '.set.', '.ver.'];

function isAngleView(url: string): boolean {
  const f = url.split('/').pop() ?? '';
  return ANGLE_MARKERS.some(m => f.includes(m));
}

/**
 * Returns the best catalogue card hero image, defaulting to Yellow Gold.
 *
 * Because 9K Yellow Gold is the brand default metal, catalogue cards should
 * lead with a yellow-gold image wherever one exists.
 *
 * Resolution order (delegates to resolveStaticImage with Round + yellow):
 *   1. Round shape + yellow gold  → SKU.rd.alt.jpg  (multi-shape)
 *   2. Round shape + white gold   → SKU.rd.jpg       (multi-shape fallback)
 *   3. Plain yellow gold front    → SKU.alt.jpg      (single-shape)
 *   4. Plain white gold front     → SKU.jpg          (single-shape fallback)
 *   5. Any non-GIF                → absolute fallback
 */
export function getCatalogPreviewImage(images: string[]): string | null {
  if (!images.length) return null;
  // Reuse resolveStaticImage: Round is the universal default shape for catalogue cards.
  return resolveStaticImage(images, 'Round', 'yellow');
}

/**
 * Returns a secondary angle/side image for the catalogue card hover state.
 * Prefers an angle view in the same colour as the primary image.
 * Returns null if no suitable hover image exists.
 */
export function getCatalogHoverImage(
  images: string[],
  primaryUrl: string | null,
): string | null {
  if (!primaryUrl) return null;
  const primaryColour = imageColour(primaryUrl);
  if (!primaryColour) return null;

  // Look for an angle/side view in the same colour, different from the primary
  return (
    images.find(u =>
      !u.endsWith('.gif') &&
      u !== primaryUrl &&
      imageColour(u) === primaryColour &&
      isAngleView(u),
    ) ?? null
  );
}

export type GalleryItem =
  | { kind: 'image'; url: string }
  | { kind: 'gif';   url: string };

/**
 * Builds the ordered gallery item list for the product detail page.
 *
 * Multi-shape setting:
 *   - Filter to images for the selected shape code.
 *   - Then filter to selected colour; fall back to white if colour not available.
 *   - If shape code missing entirely (mq/he), fall back to rd images.
 *
 * Single-shape setting:
 *   - All images whose colour classification matches `tone`.
 *   - Fall back to white if no images exist for this tone.
 *
 * GIF for the selected tone is appended last (if available).
 */
export function buildGallery(
  images: string[],
  shape: string,
  tone: MetalTone,
  variants: ReadonlyArray<{ metal: string; image: string | null }>,
): GalleryItem[] {
  const fname = (url: string) => url.split('/').pop() ?? '';
  const code  = SHAPE_TO_CODE[shape] ?? 'rd';
  const multi = isMultiShapeImages(images);

  let staticItems: string[];

  if (multi) {
    // Images for the selected shape code (only .jpg, no GIFs)
    const forShape = images.filter(u => {
      const f = fname(u);
      return new RegExp(`\\.${code}\\.`).test(f) && !u.endsWith('.gif');
    });

    if (forShape.length > 0) {
      const coloured = forShape.filter(u => imageColour(u) === tone);
      staticItems = coloured.length > 0 ? coloured : forShape.filter(u => imageColour(u) === 'white');
    } else {
      // Shape not in data (mq/he gap) → fall back to rd
      const rdImages = images.filter(u => {
        const f = fname(u);
        return new RegExp(`\\.rd\\.`).test(f) && !u.endsWith('.gif');
      });
      const coloured = rdImages.filter(u => imageColour(u) === tone);
      staticItems = coloured.length > 0 ? coloured : rdImages.filter(u => imageColour(u) === 'white');
    }
  } else {
    // Single-shape: all images matching selected colour
    const coloured = images.filter(u => !u.endsWith('.gif') && imageColour(u) === tone);
    if (coloured.length > 0) {
      staticItems = coloured;
    } else {
      staticItems = images.filter(u => !u.endsWith('.gif') && imageColour(u) === 'white');
    }
  }

  const items: GalleryItem[] = staticItems.map(url => ({ kind: 'image' as const, url }));

  // GIF for the selected tone
  const gif = resolveGif(variants, tone);
  if (gif) items.push({ kind: 'gif', url: gif });

  return items;
}
