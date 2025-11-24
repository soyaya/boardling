import pkg from "pg";
import config from "../config.js";

const { Client } = pkg;

export const client = new Client(config.db);

export async function connectDB() {
  await client.connect();
  console.log("📦 Connected to PostgreSQL");
}

export async function disconnectDB() {
  await client.end();
  console.log("📦 Disconnected from PostgreSQL");
}
