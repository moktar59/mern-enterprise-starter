import { connectDatabase } from "../src/infrastructure/database/connect-database.js";
import { ItemModel } from "../src/infrastructure/items/mongoose-item.model.js";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/mern_enterprise_starter";

async function main(): Promise<void> {
  const connection = await connectDatabase(uri);
  try {
    const operations = Array.from({ length: 23 }, (_, index) => {
      const number = index + 1;
      const id = `item-${String(number).padStart(3, "0")}`;
      return {
        updateOne: {
          filter: { id },
          update: { $set: { name: `Example item ${number}` } },
          upsert: true,
        },
      };
    });
    const result = await ItemModel.bulkWrite(operations, { ordered: true });
    console.info(
      `Seed complete: ${result.upsertedCount} inserted, ${result.modifiedCount} updated; existing non-seed records were left unchanged.`,
    );
  } finally {
    await connection.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    "Item seed command failed.",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
});
