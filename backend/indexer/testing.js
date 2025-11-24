import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

// Connect to PostgreSQL
const pool = new Pool({ connectionString: process.env.DB_URL });

async function fetchTable(tableName) {
  try {
    const res = await pool.query(`SELECT * FROM ${tableName} ORDER BY 1 LIMIT 100`);
    console.log(`\n--- ${tableName} ---`);
    console.log(res.rows);
  } catch (err) {
    console.error(`Error fetching ${tableName}:`, err);
  }
}

async function main() {
  const tables = ["blocks", "transactions", "inputs", "outputs", "addresses"];
  
  for (const table of tables) {
    await fetchTable(table);
  }

  await pool.end();
}

main().catch(console.error);
