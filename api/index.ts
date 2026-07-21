/**
 * Vercel Serverless Function — API Handler
 *
 * This file is the entry point for the Express API when deployed on Vercel.
 * Vercel's @vercel/node runtime compiles this TypeScript file and runs it as
 * a serverless function for all /api/* requests.
 *
 * It re-exports the Express app from the api-server package.
 * Do NOT call app.listen() here — Vercel manages the server lifecycle.
 *
 * Local/Replit development continues to use artifacts/api-server/src/index.ts
 * (which calls app.listen() on the PORT env var).
 */
import app from "../api-server/src/app.js";

export default app;
