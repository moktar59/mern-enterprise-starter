import mongoose from "mongoose";

export interface DatabaseConnection {
  disconnect(): Promise<void>;
}

/** Connects and verifies the default connection before the HTTP listener starts. */
export async function connectDatabase(uri: string): Promise<DatabaseConnection> {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5_000 });
    await mongoose.connection.db?.admin().command({ ping: 1 });
  } catch (error) {
    await mongoose.disconnect().catch(() => undefined);
    const reason = error instanceof Error ? error.message : "unknown connection error";
    throw new Error(`MongoDB connection failed; API startup aborted. ${reason}`);
  }

  return {
    async disconnect() {
      await mongoose.disconnect();
    }
  };
}
