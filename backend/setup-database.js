#!/usr/bin/env node

/**
 * Database Setup Script for Boardling
 * 
 * This script helps set up the PostgreSQL database with all required tables
 * for the unified backend system.
 */

import { readFileSync } from 'fs';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'boardling',
  password: process.env.DB_PASS || 'boardling123',
  database: process.env.DB_NAME || 'boardling',
});

async function setupDatabase() {
  console.log('🗄️  Setting up Boardling database...\n');
  
  try {
    // Test connection
    console.log('1. Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');
    
    // Read and execute main schema
    console.log('2. Creating main database schema...');
    const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schemaSQL);
    console.log('✅ Main schema created\n');
    
    // Execute migrations
    console.log('3. Running database migrations...');
    const migrationFiles = [
      '001_add_wallet_analytics.sql',
      '003_add_processed_transactions.sql',
      '003_shielded_tables.sql',
      '004_add_cohort_tables.sql',
      '004_alternative_wallets.sql',
      '005_add_adoption_stages.sql',
      '006_unified_invoice_system.sql',
      '007_add_wallet_behavior_flows.sql'
    ];
    
    for (const file of migrationFiles) {
      try {
        const migrationPath = join(__dirname, 'migrations', file);
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await pool.query(migrationSQL);
        console.log(`✅ Migration ${file} completed`);
      } catch (error) {
        console.log(`⚠️  Migration ${file} skipped (may already exist)`);
      }
    }
    
    console.log('\n4. Creating test data...');
    
    // Create a test user
    const testUser = await pool.query(`
      INSERT INTO users (name, email, password_hash) 
      VALUES ('Test User', 'test@boardling.com', '$2a$10$example.hash.for.testing')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, email
    `);
    
    console.log(`✅ Test user created: ${testUser.rows[0].email}`);
    
    // Create a test project
    const testProject = await pool.query(`
      INSERT INTO projects (user_id, name, description)
      VALUES ($1, 'Test Project', 'A test project for development')
      ON CONFLICT DO NOTHING
      RETURNING id, name
    `, [testUser.rows[0].id]);
    
    if (testProject.rows.length > 0) {
      console.log(`✅ Test project created: ${testProject.rows[0].name}`);
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the unified backend: npm start');
    console.log('2. Start the frontend: npm run dev (in the root directory)');
    console.log('3. Visit http://localhost:5173 to test the application');
    console.log('\n🔐 Test credentials:');
    console.log('Email: test@boardling.com');
    console.log('Password: (you can register a new account or use the test user)');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your .env file configuration');
    console.log('3. Try running: docker run --name boardling-postgres -e POSTGRES_PASSWORD=boardling123 -e POSTGRES_USER=boardling -e POSTGRES_DB=boardling -p 5432:5432 -d postgres:15');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup
setupDatabase();