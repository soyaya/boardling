import { client } from "./client.js";

export async function saveTransaction(tx) {
  await client.query(
    `INSERT INTO transactions(txid, block_hash, block_height, timestamp, size, value_out)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (txid) DO UPDATE SET
       block_hash = EXCLUDED.block_hash,
       block_height = EXCLUDED.block_height,
       timestamp = EXCLUDED.timestamp,
       size = EXCLUDED.size,
       value_out = EXCLUDED.value_out,
       updated_at = NOW()`,
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
