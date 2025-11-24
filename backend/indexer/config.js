import dotenv from "dotenv";
dotenv.config();

const config = {
  rpc: {
    url: process.env.ZEBRA_HOST,
    user: process.env.ZEBRA_RPC_USER,
    pass: process.env.ZEBRA_RPC_PASS,
  },
  db: {
    connectionString: process.env.DB_URL,
  },
  indexer: {
    reorg_safety: 10,
  },
};
export default config;