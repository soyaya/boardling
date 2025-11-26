import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'zcash_indexer',
  user: process.env.DB_USER || 'zcash_user',
  password: process.env.DB_PASSWORD || 'yourpassword',
});

export default pool;
