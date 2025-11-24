import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const RPC_USER = process.env.ZCASH_RPC_USER;
const RPC_PASSWORD = process.env.ZCASH_RPC_PASSWORD;
const RPC_HOST = process.env.ZCASH_RPC_HOST;
const RPC_PORT = process.env.ZCASH_RPC_PORT;

export async function rpc(method, params = []) {
  const res = await fetch(`http://${RPC_HOST}:${RPC_PORT}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "1.0", id: "analytics", method, params }),
    // Basic auth
    auth: `${RPC_USER}:${RPC_PASSWORD}`
  });
  return res.json();
}
