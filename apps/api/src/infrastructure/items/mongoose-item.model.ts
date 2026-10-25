import mongoose, { type Model } from "mongoose";

export interface ItemDocument {
  id: string;
  name: string;
}

const itemSchema = new mongoose.Schema<ItemDocument>(
  {
    id: { type: String, required: true, trim: true, unique: true, immutable: true },
    name: { type: String, required: true, trim: true, minlength: 1 },
  },
  {
    collection: "items",
    timestamps: true,
    versionKey: false,
  },
);

export const ItemModel: Model<ItemDocument> =
  (mongoose.models.Item as Model<ItemDocument> | undefined) ??
  mongoose.model<ItemDocument>("Item", itemSchema);
