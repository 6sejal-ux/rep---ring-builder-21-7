import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import settingsRouter from "./settings.js";
import diamondsRouter from "./diamonds.js";
import cartRouter from "./cart.js";
import configRouter from "./config.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(settingsRouter);
router.use(diamondsRouter);
router.use(cartRouter);
router.use(configRouter);

export default router;
