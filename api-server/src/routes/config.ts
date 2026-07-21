import { Router } from "express";
import {
  METALS, SHAPES, DIAMOND_TYPES, FEATURES, CURRENCY, RING_SIZES,
  STYLES, METAL_TONES, UI_TEXT,
} from "../config/builder.js";

const router = Router();

// GET /api/config — public configuration consumed by the frontend
router.get("/config", (_req, res) => {
  res.json({
    metals: METALS,
    shapes: SHAPES,
    diamondTypes: DIAMOND_TYPES,
    currency: CURRENCY,
    engravingEnabled: FEATURES.engraving,
    ringSizes: RING_SIZES,
    // Catalogue / filter config
    styles:     STYLES,
    metalTones: METAL_TONES,
    uiText:     UI_TEXT,
  });
});

export default router;
