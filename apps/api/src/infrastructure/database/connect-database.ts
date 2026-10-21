import mongoose from "mongoose";
import { ItemModel } from "../items/mongoose-item.model.js";
export interface DatabaseConnection { disconnect(): Promise<void>; }
/** Connects, verifies MongoDB, and ensures the declared collection indexes before startup. */
export async function connectDatabase(uri: string): Promise<DatabaseConnection> {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5_000 });
    await mongoose.connection.db?.admin().command({ ping: 1 });
    await ItemModel.init();
  } catch {
    await mongoose.disconnect().catch(() => undefined);
    throw new Error("MongoDB connection or index initialization failed; API startup aborted.");
  }
  return { async disconnect() { await mongoose.disconnect(); } };
}
