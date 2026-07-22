import mongoose from "mongoose";
import { ENV } from "./env";

let isConnected = false;

/**
 * Connect to MongoDB Atlas using the connection string from environment.
 * Handles reconnection and connection pooling.
 */
export async function connectMongoDB(): Promise<void> {
  if (isConnected) return;

  const mongoUrl = ENV.mongoUrl;
  if (!mongoUrl) {
    console.warn("[MongoDB] No DATABASE_URL (MongoDB connection string) provided");
    return;
  }

  try {
    mongoose.set("strictQuery", false);

    const conn = await mongoose.connect(mongoUrl, {
      // Connection pooling settings
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log(`[MongoDB] Connected to ${conn.connection.host}`);

    // Handle connection events
    conn.connection.on("error", (err) => {
      console.error("[MongoDB] Connection error:", err);
      isConnected = false;
    });

    conn.connection.on("disconnected", () => {
      console.warn("[MongoDB] Disconnected from MongoDB");
      isConnected = false;
    });

    conn.connection.on("reconnected", () => {
      console.log("[MongoDB] Reconnected to MongoDB");
      isConnected = true;
    });
  } catch (error) {
    console.error("[MongoDB] Failed to connect:", error);
    isConnected = false;
  }
}

/**
 * Ensure the connection is established before any database operation.
 * This is used by db helpers as a guard.
 */
export async function ensureConnection(): Promise<boolean> {
  if (!isConnected) {
    await connectMongoDB();
  }
  return isConnected;
}
