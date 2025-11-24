import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const rpcUrl = process.env.ZEBRA_HOST;
const user = process.env.ZEBRA_RPC_USER;
const pass = process.env.ZEBRA_RPC_PASS;

async function test() {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    body: JSON.stringify({ jsonrpc: '1.0', id: 'test', method: 'getblockcount', params: [] }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64')
    }
  });
  const data = await res.json();
  console.log(data);
}

test();
