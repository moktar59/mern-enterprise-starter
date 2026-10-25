import type { Item, ListItemsQuery, ListItemsResult } from "./item.js";
import type { ItemRepository } from "./item.repository.js";
export class InMemoryItemRepository implements ItemRepository {
  private readonly items: readonly Item[];
  constructor(
    items: readonly Item[] = Array.from({ length: 23 }, (_, index) => {
      const number = index + 1;
      return { id: `item-${String(number).padStart(3, "0")}`, name: `Example item ${number}` };
    }),
  ) {
    this.items = items.map((item) => Object.freeze({ ...item }));
  }
  async list(query: ListItemsQuery): Promise<ListItemsResult> {
    const totalItems = this.items.length;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / query.perPage);
    return {
      records: this.items.slice((query.page - 1) * query.perPage, query.page * query.perPage),
      pagination: { ...query, totalItems, totalPages },
    };
  }
}
