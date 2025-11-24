import db from "./db/db";

// Detect microtransactions, shielded usage, swaps, bridges
export async function processTransaction(tx) {
  const microTx = tx.vout?.some(v => v.value < 0.01) || false;
  const shielded = tx.valueBalance && tx.valueBalance !== 0;

  const swapLike = tx.metadata?.possibleSwap || false;
  const bridgeLike = tx.metadata?.possibleBridge || false;

  await db.collection("processed").updateOne(
    { _id: tx.txid },
    { $set: { microTx, shielded, swapLike, bridgeLike } },
    { upsert: true }
  );
}

