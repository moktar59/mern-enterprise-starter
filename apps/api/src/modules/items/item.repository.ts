import type { Item, ListItemsQuery, ListItemsResult } from "./item.js";

export interface ItemRepository {
  list(query: ListItemsQuery): Promise<ListItemsResult>;
}

export class ItemPersistenceError extends Error {
  constructor(message = "Item persistence operation failed.") {
    super(message);
    this.name = "ItemPersistenceError";
  }
}

export function createItemService(repository: ItemRepository) {
  return {
    list(query: ListItemsQuery): Promise<ListItemsResult> {
      return repository.list(query);
    }
  };
}

export type { Item };
