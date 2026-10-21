import { ItemPersistenceError, type ItemRepository } from "../../modules/items/item.repository.js";
import type { Item, ListItemsQuery, ListItemsResult } from "../../modules/items/item.js";
import { ItemModel } from "./mongoose-item.model.js";

export class MongooseItemRepository implements ItemRepository {
  async list(query: ListItemsQuery): Promise<ListItemsResult> {
    try {
      const skip = (query.page - 1) * query.perPage;
      const [documents, totalItems] = await Promise.all([
        ItemModel.find({}, { _id: 0, id: 1, name: 1 })
          .sort({ id: 1 })
          .skip(skip)
          .limit(query.perPage)
          .lean()
          .exec(),
        ItemModel.countDocuments({}).exec()
      ]);
      const records: Item[] = documents.map((document) => ({
        id: document.id,
        name: document.name
      }));
      return {
        records,
        pagination: {
          page: query.page,
          perPage: query.perPage,
          totalItems,
          totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.perPage)
        }
      };
    } catch {
      throw new ItemPersistenceError();
    }
  }
}
