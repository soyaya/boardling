import pkg from "pg";
const { Client } = pkg;
import config from "./config.json" assert { type: "json" };

const client = new Client(config.db);

try {
  await client.connect();
  console.log("✅ Connected to Postgres!");
  await client.end();
} catch (err) {
  console.error(err);
}
