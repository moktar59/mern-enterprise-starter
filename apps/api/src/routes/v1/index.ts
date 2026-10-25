import { Router } from "express";
import type { ItemRepository } from "../../modules/items/item.repository.js";
import { createItemsRouter } from "./items.routes.js";
export function createV1Router(items: ItemRepository, auth: Router = Router()) {
  const r = Router();
  r.use("/auth", auth);
  r.use("/items", createItemsRouter(items));
  return r;
}
