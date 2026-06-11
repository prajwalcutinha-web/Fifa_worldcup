import mongoose from "mongoose";
import { config } from "../config.js";

let connected = false;

export async function connectMongo() {
  if (!config.mongo.uri) {
    console.log("[mongo] MONGODB_URI not set — using local JSON store fallback");
    return false;
  }
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(config.mongo.uri, {
      dbName: config.mongo.dbName,
      serverSelectionTimeoutMS: 8000,
    });
    connected = true;
    console.log(`[mongo] connected to "${config.mongo.dbName}"`);
    return true;
  } catch (err) {
    console.warn("[mongo] connection failed — using JSON store fallback:", err.message);
    return false;
  }
}

export function isMongoConnected() {
  return connected && mongoose.connection.readyState === 1;
}
