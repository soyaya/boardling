import { client } from "./client.js";

export async function saveTransaction(tx) {
  await client.query(
    `INSERT INTO transactions(txid, block_hash, block_height, timestamp, size, value_out)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT DO NOTHING`,
    [
      tx.txid,
      tx.block_hash,
      tx.block_height,
      tx.timestamp,
      tx.size,
      tx.value_out
    ]
  );
}
