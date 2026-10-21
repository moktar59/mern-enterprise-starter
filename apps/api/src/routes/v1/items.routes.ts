import { Router, type RequestHandler } from "express";
import { ValidationFailedError } from "../../errors/application-error.js";
import { methodNotAllowedHandler } from "../../http/middleware/http-error-middleware.js";
import type { ItemRepository } from "../../modules/items/item.repository.js";
import { createItemService } from "../../modules/items/item.repository.js";
function parsePositiveInteger(value: unknown, field: "page" | "perPage", defaultValue: number, maximum?: number): number {
  if (value === undefined) return defaultValue;
  if (typeof value !== "string" || !/^-?\d+$/.test(value)) throw new ValidationFailedError([{ field, code: "INVALID_INTEGER" }]);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new ValidationFailedError([{ field, code: "INVALID_INTEGER" }]);
  if (parsed < 1 || (maximum !== undefined && parsed > maximum)) throw new ValidationFailedError([{ field, code: "OUT_OF_RANGE" }]);
  return parsed;
}
export function createItemsRouter(repository: ItemRepository): Router {
  const router = Router();
  const service = createItemService(repository);
  const listItems: RequestHandler = async (request, response, next) => {
    try {
      const page = parsePositiveInteger(request.query.page, "page", 1);
      const perPage = parsePositiveInteger(request.query.perPage, "perPage", 10, 500);
      response.status(200).json(await service.list({ page, perPage }));
    } catch (error) { next(error); }
  };
  router.get("/", listItems);
  router.all("/", methodNotAllowedHandler);
  return router;
}
