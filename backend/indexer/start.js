#!/usr/bin/env node

import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Validate required environment variables
const requiredEnvVars = ['ZEBRA_HOST', 'DB_URL', 'ZEBRA_RPC_USER', 'ZEBRA_RPC_PASS'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease check your .env file and ensure all required variables are set.');
  process.exit(1);
}

console.log('🚀 Starting Zcash Indexer...');
console.log(`📡 RPC URL: ${process.env.ZEBRA_HOST}`);
console.log(`🗄️  Database: ${process.env.DB_URL.replace(/\/\/.*@/, '//***@')}`);

// Import and start the indexer
import('./indexer.js').catch(err => {
  console.error('💥 Failed to start indexer:', err);
  process.exit(1);
});