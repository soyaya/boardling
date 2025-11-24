import fetch from "node-fetch";
import config from "../config.js";

export async function callRPC(method, params = []) {
  const body = {
    jsonrpc: "1.0",
    id: "indexer",
    method,
    params
  };

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const auth = Buffer.from(`${config.rpc.user}:${config.rpc.pass}`).toString("base64");
      const res = await fetch(config.rpc.url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.result;

    } catch (e) {
      console.log(`RPC Error (${attempt}/5):`, e.message);
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  throw new Error(`RPC failed after 5 attempts: ${method}`);
}
