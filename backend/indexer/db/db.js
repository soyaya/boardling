import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

export const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'broadlypaywall',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || 'admin',
    port: process.env.DB_PORT || 5432,
});

export async function connectDB() {
    await client.connect();
    console.log('✅ Connected to Postgres!');
}
