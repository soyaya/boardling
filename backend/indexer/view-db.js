import dotenv from "dotenv";
import { Pool } from "pg";
dotenv.config();

const pool = new Pool({ connectionString: process.env.DB_URL });

(async () => {
  const res = await pool.query(`
    SELECT id, txid, vout_index, address, value, scriptpubkey, script_pub_key
    FROM outputs
    ORDER BY id DESC
    LIMIT 20
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
})();
