// saveOutputs.js
import dotenv from "dotenv";
import axios from "axios";
import { Pool } from "pg";
import https from "https";

export async function saveOutputs(tx) {
  if (!tx.vout) return;

  for (const [voutIndex, vout] of tx.vout.entries()) {
    // Normalize scriptPubKey
    let raw =
      vout.scriptPubKey ??
      vout.scriptpubkey ??
      vout.script_pub_key ??
      null;

    let spk = {};

    if (typeof raw === "string") {
      try {
        spk = JSON.parse(raw);
      } catch {
        spk = { raw };
      }
    } else if (raw && typeof raw === "object") {
      spk = raw;
    }

    const address =
      (spk.addresses && spk.addresses[0]) ||
      spk.address ||
      null;

    const scriptPubKeyJson = Object.keys(spk).length ? spk : null;
    const scriptPubKeyText =
      typeof raw === "string"
        ? raw
        : scriptPubKeyJson
        ? JSON.stringify(scriptPubKeyJson)
        : null;

    // Save output row
    await queryClient.query(
      `INSERT INTO outputs
      (txid, vout_index, address, value, script_pub_key, scriptpubkey)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (txid, vout_index) DO NOTHING`,
      [
        tx.txid,
        voutIndex,
        address,
        vout.value || 0,
        scriptPubKeyJson,
        scriptPubKeyText,
      ]
    );

    // Save address if present
    if (address) {
      await queryClient.query(
        `INSERT INTO addresses (address)
         VALUES ($1)
         ON CONFLICT (address) DO NOTHING`,
        [address]
      );
    }
  }
}
