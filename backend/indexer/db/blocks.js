import { client } from "./client.js";

export async function saveBlock(block) {
  await client.query(
    `INSERT INTO blocks (hash, height, timestamp, tx_count)
     VALUES ($1, $2, to_timestamp($3), $4)
     ON CONFLICT DO NOTHING`,
    [block.hash, block.height, block.time, block.tx.length]
  );
}
