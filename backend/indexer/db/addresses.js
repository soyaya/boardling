import { client } from "./client.js";

export async function saveOutputs(outputs) {
  for (const o of outputs) {
    await client.query(
      `INSERT INTO outputs(txid, index, address, value)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT DO NOTHING`,
      [o.txid, o.index, o.address, o.value]
    );

    await client.query(
      `INSERT INTO addresses (address)
       VALUES ($1)
       ON CONFLICT DO NOTHING`,
      [o.address]
    );
  }
}
