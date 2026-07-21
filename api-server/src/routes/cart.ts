import { Router } from "express";
import { createRingCart, createDraftOrder, ShopifyConfigError, ShopifyApiError } from "../services/shopify.js";

const router = Router();

// POST /api/cart/create
router.post("/cart/create", async (req, res) => {
  const { lineItem } = req.body ?? {};
  if (!lineItem) {
    res.status(400).json({ error: "lineItem is required" });
    return;
  }

  // Required field validation — never trust frontend pricing blindly
  const required = ["settingHandle", "settingTitle", "settingSku", "metal", "shape", "ringSize", "nivodaId", "diamondCarat", "diamondColor", "diamondClarity"];
  for (const field of required) {
    if (!lineItem[field]) {
      res.status(400).json({ error: `Missing required field: ${field}` });
      return;
    }
  }

  // Basic sanity checks on prices
  const settingPrice = Number(lineItem.settingPrice);
  const diamondPrice = Number(lineItem.diamondPrice);
  if (!isFinite(settingPrice) || settingPrice <= 0) {
    res.status(400).json({ error: "Invalid setting price" });
    return;
  }
  if (!isFinite(diamondPrice) || diamondPrice <= 0) {
    res.status(400).json({ error: "Invalid diamond price" });
    return;
  }

  const config = {
    settingHandle: String(lineItem.settingHandle),
    settingTitle:  String(lineItem.settingTitle),
    settingSku:    String(lineItem.settingSku),
    metal:         String(lineItem.metal),
    shape:         String(lineItem.shape),
    ringSize:      String(lineItem.ringSize),
    engraving:     lineItem.engraving ? String(lineItem.engraving) : null,
    settingPrice,
    nivodaId:      String(lineItem.nivodaId),
    diamondCarat:  Number(lineItem.diamondCarat),
    diamondColor:  String(lineItem.diamondColor),
    diamondClarity: String(lineItem.diamondClarity),
    diamondCut:    lineItem.diamondCut ? String(lineItem.diamondCut) : null,
    diamondCert:   lineItem.diamondCert ? String(lineItem.diamondCert) : null,
    diamondLab:    lineItem.diamondLab ? String(lineItem.diamondLab) : null,
    diamondPrice,
  };

  try {
    // Try Storefront cart first; fall back to Admin draft order
    const result = await createRingCart(config);
    res.json(result);
  } catch (err) {
    if (err instanceof ShopifyConfigError) {
      req.log.warn({ err: err.message }, "Shopify not configured");
      // Return a demo URL so the UI can still be tested
      res.json({
        checkoutUrl: `/checkout-demo?total=${settingPrice + diamondPrice}`,
        cartId: null,
        demo: true,
        message: err.message,
      });
      return;
    }
    if (err instanceof ShopifyApiError) {
      req.log.error({ err: err.message }, "Shopify API error");
      res.status(503).json({ error: "Cart creation failed. Please try again.", code: "SHOPIFY_ERROR" });
      return;
    }
    req.log.error({ err }, "Unexpected cart error");
    res.status(500).json({ error: "Unexpected error creating cart" });
  }
});

export default router;
