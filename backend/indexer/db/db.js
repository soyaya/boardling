import pkg from 'pg';
const { Client } = pkg;

export const client = new Client({
    user: 'zcash_user',
    host: 'localhost',
    database: 'zcash_indexer',
    password: 'yourpassword',
    port: 5432,
});

export async function connectDB() {
    await client.connect();
    console.log('✅ Connected to Postgres!');
}
