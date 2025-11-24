import fs from "fs";
import { connectDB, client } from "../src/db/client.js";

(async () => {
  await connectDB();
  const schema = fs.readFileSync("./schema.sql", "utf8");
  await client.query(schema);
  console.log("🎉 Database initialized");
  process.exit(0);
})();
