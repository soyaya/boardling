import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const mongoUri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB;

const client = new MongoClient(mongoUri);

await client.connect();
const db = client.db(dbName);

console.log("[DB] Connected to MongoDB:", dbName);

export default db;
