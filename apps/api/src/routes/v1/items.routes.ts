import { Router, type RequestHandler } from "express";
import { ValidationFailedError } from "../../errors/application-error.js";
import { methodNotAllowedHandler } from "../../http/middleware/http-error-middleware.js";

interface Item {
  readonly id: string;
  readonly name: string;
}

const items: readonly Item[] = Object.freeze(
  Array.from({ length: 23 }, (_, index) => {
    const number = index + 1;
    return Object.freeze({
      id: `item-${String(number).padStart(3, "0")}`,
      name: `Example item ${number}`
    });
  })
);

interface Pagination {
  readonly page: number;
  readonly perPage: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

function parsePositiveInteger(
  value: unknown,
  field: "page" | "perPage",
  defaultValue: number,
  maximum?: number
): number {
  if (value === undefined) return defaultValue;

  if (typeof value !== "string" || !/^-?\d+$/.test(value)) {
    throw new ValidationFailedError([{ field, code: "INVALID_INTEGER" }]);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new ValidationFailedError([{ field, code: "INVALID_INTEGER" }]);
  }

  if (parsed < 1 || (maximum !== undefined && parsed > maximum)) {
    throw new ValidationFailedError([{ field, code: "OUT_OF_RANGE" }]);
  }

  return parsed;
}

const listItems: RequestHandler = (request, response, next) => {
  try {
    const page = parsePositiveInteger(request.query.page, "page", 1);
    const perPage = parsePositiveInteger(request.query.perPage, "perPage", 10, 500);
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / perPage);
    const offset = (page - 1) * perPage;
    const records = items.slice(offset, offset + perPage);
    const pagination: Pagination = { page, perPage, totalItems, totalPages };

    response.status(200).json({ records, pagination });
  } catch (error) {
    next(error);
  }
};

/** Versioned example collection with deterministic in-memory records. */
export function createItemsRouter(): Router {
  const router = Router();

  router.get("/", listItems);
  router.all("/", methodNotAllowedHandler);

  return router;
}
