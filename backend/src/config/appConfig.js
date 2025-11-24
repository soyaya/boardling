import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

// App configuration
export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  apiRateLimit: parseInt(process.env.API_RATE_LIMIT) || 100,
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // SDK Configuration
  sdk: {
    // Default base URL for the SDK (can be overridden by clients)
    defaultBaseUrl: process.env.SDK_DEFAULT_BASE_URL || 
                   process.env.API_BASE_URL || 
                   `http://localhost:${process.env.PORT || 3000}`,
    
    // Public API URL (for external clients)
    publicApiUrl: process.env.PUBLIC_API_URL || 
                 process.env.SDK_DEFAULT_BASE_URL || 
                 `http://localhost:${process.env.PORT || 3000}`,
    
    // Default timeout for SDK requests
    defaultTimeout: parseInt(process.env.SDK_DEFAULT_TIMEOUT) || 30000,
    
    // API version
    apiVersion: process.env.API_VERSION || 'v1',
  },
  
  // Zcash configuration
  zcash: {
    rpcUrl: process.env.ZCASH_RPC_URL,
    rpcUser: process.env.ZCASH_RPC_USER,
    rpcPass: process.env.ZCASH_RPC_PASS,
  },
  
  // Platform treasury
  platformTreasuryAddress: process.env.PLATFORM_TREASURY_ADDRESS,
};

// Validate required environment variables
const requiredEnvVars = [
  'DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME',
  'ZCASH_RPC_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Optional RPC auth (some nodes like Zebra don't require it)
if (!process.env.ZCASH_RPC_USER || !process.env.ZCASH_RPC_PASS) {
  console.log('⚠️ Warning: ZCASH_RPC_USER/PASS not set - using no authentication');
}
