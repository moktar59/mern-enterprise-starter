import { Router } from "express";
import type { ItemRepository } from "../../modules/items/item.repository.js";
import { createItemsRouter } from "./items.routes.js";
export function createV1Router(itemRepository: ItemRepository): Router {
  const router = Router();
  router.use("/items", createItemsRouter(itemRepository));
  return router;
}
