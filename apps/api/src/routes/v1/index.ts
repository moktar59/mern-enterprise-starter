import { Router } from "express";
import { createItemsRouter } from "./items.routes.js";

/** Composes the public routes exposed under /api/v1. */
export function createV1Router(): Router {
  const router = Router();

  router.use("/items", createItemsRouter());

  return router;
}
