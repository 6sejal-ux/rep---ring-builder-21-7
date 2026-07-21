import { Router } from "express";
import {
  NivodaConfigError,
  NivodaApiError,
} from "../services/nivoda.js";
import * as nivoda from "../services/nivoda.js";
import * as demo from "../services/demo.js";

// ── Data-source routing ───────────────────────────────────────────────────────
// Set DIAMOND_DATA_SOURCE=nivoda in your environment to use the live Nivoda API.
// Default is "demo" so the app works without credentials.

const source = (process.env["DIAMOND_DATA_SOURCE"] ?? "demo").toLowerCase();
const useLive = source === "nivoda";

const searchDiamonds  = useLive ? nivoda.searchDiamonds  : demo.searchDiamonds;
const getDiamond      = useLive ? nivoda.getDiamond      : demo.getDiamond;
const validateDiamond = useLive ? nivoda.validateDiamond : demo.validateDiamond;

if (!useLive) {
  console.info("Diamond data source: DEMO (set DIAMOND_DATA_SOURCE=nivoda to use live Nivoda API)");
} else {
  console.info("Diamond data source: NIVODA (live API)");
}

// ── Router ────────────────────────────────────────────────────────────────────

const router = Router();

// POST /api/diamonds/search
router.post("/diamonds/search", async (req, res) => {
  try {
    const result = await searchDiamonds(req.body ?? {});
    res.json(result);
  } catch (err) {
    if (err instanceof NivodaConfigError) {
      req.log.warn({ err: err.message }, "Nivoda not configured");
      res.status(503).json({ error: "Diamond search is not configured yet. " + err.message, code: "NIVODA_NOT_CONFIGURED" });
      return;
    }
    if (err instanceof NivodaApiError) {
      req.log.error({ err: err.message }, "Nivoda API error");
      res.status(503).json({ error: "Diamond search temporarily unavailable. Please try again.", code: "NIVODA_API_ERROR" });
      return;
    }
    req.log.error({ err }, "Unexpected diamond search error");
    res.status(500).json({ error: "Unexpected error during diamond search" });
  }
});

// POST /api/diamonds/validate
router.post("/diamonds/validate", async (req, res) => {
  const { nivodaId } = req.body ?? {};
  if (!nivodaId) {
    res.status(400).json({ error: "nivodaId is required" });
    return;
  }
  try {
    const result = await validateDiamond(String(nivodaId));
    res.json(result);
  } catch (err) {
    if (err instanceof NivodaConfigError) {
      res.status(503).json({ error: err.message, code: "NIVODA_NOT_CONFIGURED" });
      return;
    }
    req.log.error({ err }, "Diamond validation error");
    res.status(503).json({ error: "Unable to validate diamond availability", code: "VALIDATION_ERROR" });
  }
});

// GET /api/diamonds/:id
router.get("/diamonds/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const diamond = await getDiamond(id);
    if (!diamond) {
      res.status(404).json({ error: "Diamond not found" });
      return;
    }
    res.json(diamond);
  } catch (err) {
    if (err instanceof NivodaConfigError) {
      res.status(503).json({ error: err.message, code: "NIVODA_NOT_CONFIGURED" });
      return;
    }
    req.log.error({ err }, "getDiamond error");
    res.status(500).json({ error: "Unable to fetch diamond" });
  }
});

export default router;
