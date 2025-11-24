import dotenv from "dotenv";
import axios from "axios";
import { Pool } from "pg";
import https from "https";
import {addressStats, updateAddressStats, formatOutput } from './formatOutputs.js'
import { saveOutputs } from "./saveOutputs.js";



dotenv.config();

const rpcUrl = process.env.ZEC_RPC_URL;
const pool = new Pool({ connectionString: process.env.DB_URL });
const agent = new https.Agent({ family: 4 });

// ------------------- RPC helper with retries -------------------
async function rpc(method, params = [], retries = 5) {
  try {
    const res = await axios.post(
      rpcUrl,
      { jsonrpc: "1.0", id: "indexer", method, params },
      { httpsAgent: agent, timeout: 30000 }
    );
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.result;
  } catch (e) {
    if (
      retries > 0 &&
      ["ECONNRESET", "ETIMEDOUT", "ECONNABORTED"].includes(e.code)
    ) {
      console.warn(`RPC failed (${e.code}). Retrying in 2s... (${retries} retries left)`);
      await new Promise(r => setTimeout(r, 2000));
      return rpc(method, params, retries - 1);
    }
    console.error("RPC ERROR:", e.message);
    throw e;
  }
}

// ------------------- DB helpers -------------------
async function getLastIndexedHeight() {
  const res = await pool.query("SELECT height FROM blocks ORDER BY height DESC LIMIT 1");
  return res.rows.length ? res.rows[0].height : 0;
}

function computeFee(tx) {
  const inSum = (tx.vin || []).reduce((sum, i) => sum + Number(i.value || 0), 0);
  const outSum = (tx.vout || []).reduce((sum, o) => sum + Number(o.value || 0), 0);
  return inSum - outSum;
}

function isShielded(tx) {
  const joinsplit = Array.isArray(tx.vjoinsplit) && tx.vjoinsplit.length > 0;
  const orchard = tx.orchard && Object.keys(tx.orchard).length > 0;
  return joinsplit || orchard;
}

function classifyTx(tx) {
  if (tx.coinbase) return "reward";
  if (isShielded(tx)) return "shielded";
  return "transfer";
}

// ------------------- Save block and transactions -------------------
async function saveBlock(block) {
  const sql = `
    INSERT INTO blocks (height, hash, timestamp)
    VALUES ($1,$2,to_timestamp($3))
    ON CONFLICT (height) DO NOTHING
  `;
  await pool.query(sql, [block.height, block.hash, block.time]);
  console.log(`✔ Block saved: ${block.height}`);
}

async function saveTx(tx, block) {
  const fee = computeFee(tx);
  const tx_type = classifyTx(tx);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Save transaction
    await client.query(
      `INSERT INTO transactions
      (txid, block_height, timestamp, version, locktime, fee, tx_type, is_shielded, raw)
      VALUES ($1,$2,to_timestamp($3),$4,$5,$6,$7,$8,$9)
      ON CONFLICT (txid) DO NOTHING`,
      [tx.txid, block.height, block.time, tx.version, tx.locktime, fee, tx_type, !!isShielded(tx), tx]
    );

    // Save inputs
    for (const vin of tx.vin || []) {
      let address = vin.address || null;
      if (!address && vin.prevout?.scriptPubKey?.addresses?.length) {
        address = vin.prevout.scriptPubKey.addresses[0];
      }

      await client.query(
        `INSERT INTO inputs (txid, prev_txid, prev_vout, address, value)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (txid, prev_txid, prev_vout) DO NOTHING`,
        [tx.txid, vin.txid || null, vin.vout || null, address, vin.value || 0]
      );

      if (address) {
        await client.query(
          `INSERT INTO addresses (address) VALUES ($1) ON CONFLICT (address) DO NOTHING`,
          [address]
        );
      }
    }

    // Save outputs
    await saveOutputs(client, tx);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("TX ERROR:", err);
    throw err;
  } finally {
    client.release();
  }
  console.log(`   ↳ TX saved: ${tx.txid}`);
}

// ------------------- Sync a single block -------------------
async function syncBlock(height) {
  try {
    const hash = await rpc("getblockhash", [height]);
    const block = await rpc("getblock", [hash, 2]);
    block.height = height;
    block.hash = hash;

    await saveBlock(block);

    for (const tx of block.tx) {
      await saveTx(tx, block);
    }

    console.log(`✔ Finished block ${height}`);
  } catch (err) {
    console.error(`⚠ Failed to sync block ${height}:`, err.message);
    console.log("⏱ Retrying block in 5s...");
    await new Promise(r => setTimeout(r, 5000));
    await syncBlock(height);
  }
}

// ------------------- Main loop -------------------
async function main() {
  console.log("🚀 Starting Zcash indexer...");
  let last = await getLastIndexedHeight();
  console.log("Last indexed height:", last);

  while (true) {
    try {
      const chainHeight = await rpc("getblockcount");
      if (last < chainHeight) {
        last++;
        await syncBlock(last);
        await new Promise(r => setTimeout(r, 1000));
      } else {
        console.log("⏸ No new blocks... sleeping 5s");
        await new Promise(r => setTimeout(r, 5000));
      }
    } catch (err) {
      console.error("Main loop error:", err.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

main().catch(err => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
