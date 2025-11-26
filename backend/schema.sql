-- =====================================================
-- ZCASH PAYWALL SDK - COMPLETE PRODUCTION DATABASE SCHEMA
-- PostgreSQL - Ready for 100K+ users & $1M+ in ZEC volume
-- Supports: Transparent, Shielded, Unified, WebZjs, zcash-devtool
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
-- =====================================================
-- USERS TABLE - FULL REGISTRATION SUPPORT
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();




-- =====================================================
-- 2. LEGACY INVOICES TABLE (Transparent payments)
-- =====================================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(20) NOT NULL CHECK (type IN ('subscription', 'one_time')),
    item_id VARCHAR(255), -- video ID, course ID, etc.
    
    amount_zec DECIMAL(16,8) NOT NULL CHECK (amount_zec > 0),
    z_address VARCHAR(120) NOT NULL, -- zcash address (non-unique for treasury)
    
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
    
    paid_txid VARCHAR(64), -- Zcash transaction ID
    paid_amount_zec DECIMAL(16,8) CHECK (paid_amount_zec >= 0),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    expires_at TIMESTAMP WITH TIME ZONE, -- for subscriptions only
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance (z_address non-unique for treasury reuse)
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_z_address ON invoices(z_address);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_expires_at ON invoices(expires_at);
CREATE INDEX idx_invoices_paid_at ON invoices(paid_at);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);

COMMENT ON COLUMN invoices.z_address IS 'Zcash address for payment - can be treasury address (non-unique)';

-- =====================================================
-- 3. WITHDRAWALS TABLE (User cashouts with fees)
-- =====================================================
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    amount_zec DECIMAL(16,8) NOT NULL CHECK (amount_zec > 0), -- what user requested
    fee_zec DECIMAL(16,8) NOT NULL CHECK (fee_zec >= 0),      -- your platform fee
    net_zec DECIMAL(16,8) NOT NULL CHECK (net_zec > 0),       -- actually sent
    
    to_address VARCHAR(120) NOT NULL, -- user's z/t address
    
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    
    txid VARCHAR(64), -- Zcash transaction ID
    
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_to_address ON withdrawals(to_address);
CREATE INDEX idx_withdrawals_processed_at ON withdrawals(processed_at);

-- =====================================================
-- 4. API KEYS TABLE (Authentication & Authorization)
-- =====================================================
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of the API key
    permissions JSONB NOT NULL DEFAULT '["read", "write"]'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for API keys
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at);

-- =====================================================
-- 5. SHIELDED WALLETS & INVOICES (Zaino-based)
-- =====================================================
CREATE TABLE shielded_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL DEFAULT 'Shielded Wallet',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE shielded_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES shielded_wallets(id) ON DELETE SET NULL,
    amount_zec DECIMAL(16, 8) NOT NULL CHECK (amount_zec > 0),
    z_address VARCHAR(255) NOT NULL,
    item_id VARCHAR(255),
    memo TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
    paid_amount_zec DECIMAL(16, 8),
    paid_txid VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for shielded tables
CREATE INDEX idx_shielded_wallets_user_id ON shielded_wallets(user_id);
CREATE INDEX idx_shielded_wallets_address ON shielded_wallets(address);
CREATE INDEX idx_shielded_invoices_user_id ON shielded_invoices(user_id);
CREATE INDEX idx_shielded_invoices_wallet_id ON shielded_invoices(wallet_id);
CREATE INDEX idx_shielded_invoices_status ON shielded_invoices(status);
CREATE INDEX idx_shielded_invoices_z_address ON shielded_invoices(z_address);

COMMENT ON TABLE shielded_wallets IS 'Shielded wallets for users - requires Zaino indexer';
COMMENT ON TABLE shielded_invoices IS 'Shielded invoices using z-addresses - requires Zaino indexer';
COMMENT ON COLUMN shielded_invoices.memo IS 'Encrypted memo field for shielded transactions';

-- =====================================================
-- 6. ALTERNATIVE WALLET SYSTEMS (WebZjs & zcash-devtool)
-- =====================================================

-- WebZjs wallets (browser-based)
CREATE TABLE webzjs_wallets (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    network VARCHAR(20) NOT NULL CHECK (network IN ('mainnet', 'testnet')),
    mnemonic_encrypted TEXT, -- Base64 encoded mnemonic (use proper encryption in production)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE webzjs_invoices (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id INTEGER REFERENCES webzjs_wallets(id) ON DELETE SET NULL,
    amount_zec DECIMAL(16, 8) NOT NULL,
    item_id VARCHAR(255),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
    paid_amount_zec DECIMAL(16, 8),
    paid_txid VARCHAR(255),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- zcash-devtool wallets (CLI-based)
CREATE TABLE devtool_wallets (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    network VARCHAR(20) NOT NULL CHECK (network IN ('mainnet', 'testnet')),
    wallet_path VARCHAR(500) NOT NULL, -- File system path to wallet
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE devtool_invoices (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id INTEGER REFERENCES devtool_wallets(id) ON DELETE SET NULL,
    amount_zec DECIMAL(16, 8) NOT NULL,
    item_id VARCHAR(255),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
    paid_amount_zec DECIMAL(16, 8),
    paid_txid VARCHAR(255),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for alternative wallets
CREATE INDEX idx_webzjs_wallets_user_id ON webzjs_wallets(user_id);
CREATE INDEX idx_webzjs_wallets_network ON webzjs_wallets(network);
CREATE INDEX idx_webzjs_invoices_user_id ON webzjs_invoices(user_id);
CREATE INDEX idx_webzjs_invoices_status ON webzjs_invoices(status);
CREATE INDEX idx_webzjs_invoices_wallet_id ON webzjs_invoices(wallet_id);

CREATE INDEX idx_devtool_wallets_user_id ON devtool_wallets(user_id);
CREATE INDEX idx_devtool_wallets_network ON devtool_wallets(network);
CREATE INDEX idx_devtool_invoices_user_id ON devtool_invoices(user_id);
CREATE INDEX idx_devtool_invoices_status ON devtool_invoices(status);
CREATE INDEX idx_devtool_invoices_wallet_id ON devtool_invoices(wallet_id);

COMMENT ON TABLE webzjs_wallets IS 'WebZjs browser-based wallet configurations';
COMMENT ON TABLE webzjs_invoices IS 'Invoices for WebZjs browser-based payments';
COMMENT ON TABLE devtool_wallets IS 'zcash-devtool CLI wallet configurations';
COMMENT ON TABLE devtool_invoices IS 'Invoices for zcash-devtool CLI-based payments';
COMMENT ON COLUMN webzjs_wallets.mnemonic_encrypted IS 'Base64 encoded mnemonic - use proper encryption in production';
COMMENT ON COLUMN devtool_wallets.wallet_path IS 'File system path to zcash-devtool wallet directory';

-- =====================================================
-- 7. UNIFIED ADDRESS SYSTEM (ZIP-316 compliant)
-- =====================================================
CREATE TABLE unified_addresses (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    unified_address VARCHAR(500) NOT NULL, -- ZIP-316 unified address
    network VARCHAR(20) NOT NULL CHECK (network IN ('mainnet', 'testnet')),
    diversifier VARCHAR(64), -- 32-byte F4JSh diversifier (hex)
    include_transparent BOOLEAN DEFAULT FALSE,
    include_sapling BOOLEAN DEFAULT TRUE,
    include_orchard BOOLEAN DEFAULT TRUE,
    webzjs_wallet_id INTEGER REFERENCES webzjs_wallets(id) ON DELETE SET NULL,
    devtool_wallet_id INTEGER REFERENCES devtool_wallets(id) ON DELETE SET NULL,
    receivers_data JSONB, -- Store individual receiver data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for unified addresses
CREATE INDEX idx_unified_addresses_user_id ON unified_addresses(user_id);
CREATE INDEX idx_unified_addresses_unified_address ON unified_addresses(unified_address);
CREATE INDEX idx_unified_addresses_network ON unified_addresses(network);
CREATE INDEX idx_unified_addresses_diversifier ON unified_addresses(diversifier);

-- =====================================================
-- 8. UNIFIED INVOICE SYSTEM (Centralized payment hub)
-- =====================================================
CREATE TABLE unified_invoices (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('subscription', 'one_time')),
    amount_zec DECIMAL(16, 8) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('auto', 'transparent', 'shielded', 'unified', 'webzjs', 'devtool')),
    network VARCHAR(10) NOT NULL DEFAULT 'testnet' CHECK (network IN ('mainnet', 'testnet')),
    
    -- Payment address and metadata
    payment_address TEXT NOT NULL,
    address_type VARCHAR(30) NOT NULL,
    address_metadata JSONB DEFAULT '{}',
    
    -- Invoice details
    item_id TEXT,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
    
    -- Payment tracking
    paid_amount_zec DECIMAL(16, 8),
    paid_txid TEXT,
    paid_at TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- Wallet linking (optional)
    webzjs_wallet_id INTEGER REFERENCES webzjs_wallets(id),
    devtool_wallet_id INTEGER REFERENCES devtool_wallets(id),
    shielded_wallet_id UUID REFERENCES shielded_wallets(id),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User payment preferences
CREATE TABLE user_payment_preferences (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) UNIQUE,
    preferred_method VARCHAR(20) DEFAULT 'auto' CHECK (preferred_method IN ('auto', 'transparent', 'shielded', 'unified', 'webzjs', 'devtool')),
    preferred_network VARCHAR(10) DEFAULT 'testnet' CHECK (preferred_network IN ('mainnet', 'testnet')),
    
    -- Wallet preferences
    default_webzjs_wallet_id INTEGER REFERENCES webzjs_wallets(id),
    default_devtool_wallet_id INTEGER REFERENCES devtool_wallets(id),
    default_shielded_wallet_id UUID REFERENCES shielded_wallets(id),
    
    -- Settings
    auto_create_wallets BOOLEAN DEFAULT false,
    require_memo BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for unified invoice system
CREATE INDEX idx_unified_invoices_user_id ON unified_invoices(user_id);
CREATE INDEX idx_unified_invoices_status ON unified_invoices(status);
CREATE INDEX idx_unified_invoices_payment_address ON unified_invoices(payment_address);
CREATE INDEX idx_unified_invoices_payment_method ON unified_invoices(payment_method);
CREATE INDEX idx_unified_invoices_created_at ON unified_invoices(created_at);

-- =====================================================
-- 9. TRIGGERS (Auto-update timestamps)
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE
    ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE
    ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shielded_wallets_updated_at 
    BEFORE UPDATE ON shielded_wallets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shielded_invoices_updated_at 
    BEFORE UPDATE ON shielded_invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webzjs_wallets_updated_at 
    BEFORE UPDATE ON webzjs_wallets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webzjs_invoices_updated_at 
    BEFORE UPDATE ON webzjs_invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devtool_wallets_updated_at 
    BEFORE UPDATE ON devtool_wallets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devtool_invoices_updated_at 
    BEFORE UPDATE ON devtool_invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unified_addresses_updated_at 
    BEFORE UPDATE ON unified_addresses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unified_invoices_updated_at 
    BEFORE UPDATE ON unified_invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_payment_preferences_updated_at 
    BEFORE UPDATE ON user_payment_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    
    
    -- =====================================================
-- 10. PROJECTS TABLE
-- =====================================================
-- =====================================================
-- PROJECTS TABLE - COMPLETE PROJECT MANAGEMENT SUPPORT
-- =====================================================

-- Create enum for project categories (Web3 focus)
CREATE TYPE project_category AS ENUM (
    'defi',
    'social_fi',
    'gamefi',
    'nft',
    'infrastructure',
    'governance',
    'cefi',
    'metaverse',
    'dao',
    'identity',
    'storage',
    'ai_ml',
    'other'
);

-- Create enum for project status
CREATE TYPE project_status AS ENUM (
    'draft',
    'active',
    'paused',
    'completed',
    'cancelled'
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic project info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category project_category NOT NULL DEFAULT 'other',
    status project_status NOT NULL DEFAULT 'draft',
    
    -- Project metadata
    website_url VARCHAR(500),
    github_url VARCHAR(500),
    logo_url VARCHAR(500),
    tags TEXT[], -- Array of tags for flexible categorization
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    launched_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_website_url CHECK (website_url IS NULL OR website_url ~ '^https?://.*'),
    CONSTRAINT valid_github_url CHECK (github_url IS NULL OR github_url ~ '^https?://github.com/.*'),
    CONSTRAINT valid_launch_date CHECK (launched_at IS NULL OR launched_at >= created_at)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Basic lookup indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category);

-- Composite indexes for common query patterns
CREATE INDEX idx_projects_user_status ON projects(user_id, status);
CREATE INDEX idx_projects_category_status ON projects(category, status);
CREATE INDEX idx_projects_launch_date ON projects(launched_at) WHERE launched_at IS NOT NULL;

-- GIN index for array tags for fast tag searching
CREATE INDEX idx_projects_tags ON projects USING GIN(tags);

-- Partial index for active projects (common use case)
CREATE INDEX idx_projects_active ON projects(created_at) WHERE status = 'active';

-- Text search index for name and description search
CREATE INDEX idx_projects_search ON projects USING GIN(
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically set launched_at when status changes to active
CREATE OR REPLACE FUNCTION set_project_launch_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Set launched_at when project becomes active and launched_at is not already set
    IF NEW.status = 'active' AND OLD.status != 'active' AND NEW.launched_at IS NULL THEN
        NEW.launched_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_project_launch_timestamp
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION set_project_launch_date();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get project count by user
CREATE OR REPLACE FUNCTION get_user_project_count(user_uuid UUID)
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM projects WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql;

-- Function to search projects by text
CREATE OR REPLACE FUNCTION search_projects(search_query TEXT)
RETURNS TABLE(
    project_id UUID,
    project_name VARCHAR(255),
    project_description TEXT,
    category project_category,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.category,
        ts_rank(to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')), 
                plainto_tsquery('english', search_query)) as relevance
    FROM projects p
    WHERE to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')) 
          @@ plainto_tsquery('english', search_query)
    ORDER BY relevance DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE projects IS 'Stores comprehensive information about Web3 projects created by users';
COMMENT ON COLUMN projects.tags IS 'Array of tags for flexible categorization and filtering';
COMMENT ON COLUMN projects.launched_at IS 'Timestamp when the project was officially launched';
COMMENT ON COLUMN projects.status IS 'Current lifecycle status of the project';
COMMENT ON COLUMN projects.category IS 'Web3 category classification of the project';




-- =====================================================
-- 11.  WALLETS TABLE - SIMPLIFIED ZCASH
-- =====================================================

-- Create enum for Zcash wallet types
CREATE TYPE wallet_type AS ENUM ('t', 'z', 'u');

-- Create enum for privacy modes
CREATE TYPE privacy_mode AS ENUM ('private', 'public', 'monetizable');

CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Basic wallet info
    address TEXT NOT NULL,
    type wallet_type NOT NULL,
    privacy_mode privacy_mode NOT NULL DEFAULT 'private',
    description TEXT,
    
    -- Zcash-specific
    network VARCHAR(20) DEFAULT 'mainnet', -- mainnet, testnet
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(address, network)
);

-- Basic indexes for performance
CREATE INDEX idx_wallets_project_id ON wallets(project_id);
CREATE INDEX idx_wallets_address ON wallets(address);
CREATE INDEX idx_wallets_type ON wallets(type);
CREATE INDEX idx_wallets_network ON wallets(network);

-- Auto-update updated_at timestamp
CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
-- ====
=================================================
-- 12. WALLET ANALYTICS PLATFORM SCHEMA
-- =====================================================
-- Comprehensive analytics system for wallet behavior tracking,
-- cohort analysis, productivity scoring, and AI recommendations
-- =====================================================

-- =====================================================
-- 12.1 WALLET ACTIVITY METRICS
-- =====================================================
CREATE TABLE wallet_activity_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    
    -- Core transaction metrics
    transaction_count INTEGER DEFAULT 0,
    unique_days_active INTEGER DEFAULT 0,
    total_volume_zatoshi BIGINT DEFAULT 0,
    total_fees_paid BIGINT DEFAULT 0,
    
    -- Transaction type breakdown
    transfers_count INTEGER DEFAULT 0,
    swaps_count INTEGER DEFAULT 0,
    bridges_count INTEGER DEFAULT 0,
    shielded_count INTEGER DEFAULT 0,
    
    -- Behavioral metrics
    is_active BOOLEAN DEFAULT FALSE,
    is_returning BOOLEAN DEFAULT FALSE,
    days_since_creation INTEGER DEFAULT 0,
    sequence_complexity_score INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(wallet_id, activity_date)
);

-- Indexes for wallet activity metrics
CREATE INDEX idx_wallet_activity_wallet_id ON wallet_activity_metrics(wallet_id);
CREATE INDEX idx_wallet_activity_date ON wallet_activity_metrics(activity_date);
CREATE INDEX idx_wallet_activity_active ON wallet_activity_metrics(is_active) WHERE is_active = true;
CREATE INDEX idx_wallet_activity_returning ON wallet_activity_metrics(is_returning) WHERE is_returning = true;

-- Composite indexes for common queries
CREATE INDEX idx_wallet_activity_wallet_date ON wallet_activity_metrics(wallet_id, activity_date);
CREATE INDEX idx_wallet_activity_date_active ON wallet_activity_metrics(activity_date, is_active);

-- =====================================================
-- 12.2 COHORT MANAGEMENT
-- =====================================================
CREATE TABLE wallet_cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_type TEXT NOT NULL CHECK (cohort_type IN ('weekly', 'monthly')),
    cohort_period DATE NOT NULL,
    wallet_count INTEGER DEFAULT 0,
    
    -- Pre-calculated retention rates
    retention_week_1 DECIMAL(5,2),
    retention_week_2 DECIMAL(5,2),
    retention_week_3 DECIMAL(5,2),
    retention_week_4 DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(cohort_type, cohort_period)
);

CREATE TABLE wallet_cohort_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES wallet_cohorts(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(wallet_id, cohort_id)
);

-- Indexes for cohort tables
CREATE INDEX idx_wallet_cohorts_type ON wallet_cohorts(cohort_type);
CREATE INDEX idx_wallet_cohorts_period ON wallet_cohorts(cohort_period);
CREATE INDEX idx_cohort_assignments_wallet ON wallet_cohort_assignments(wallet_id);
CREATE INDEX idx_cohort_assignments_cohort ON wallet_cohort_assignments(cohort_id);

-- =====================================================
-- 12.3 ADOPTION FUNNEL TRACKING
-- =====================================================
CREATE TABLE wallet_adoption_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    stage_name TEXT NOT NULL CHECK (stage_name IN ('created', 'first_tx', 'feature_usage', 'recurring', 'high_value')),
    
    achieved_at TIMESTAMP WITH TIME ZONE,
    time_to_achieve_hours INTEGER,
    conversion_probability DECIMAL(5,4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint per wallet per stage
    UNIQUE(wallet_id, stage_name)
);

-- Indexes for adoption stages
CREATE INDEX idx_adoption_stages_wallet ON wallet_adoption_stages(wallet_id);
CREATE INDEX idx_adoption_stages_stage ON wallet_adoption_stages(stage_name);
CREATE INDEX idx_adoption_stages_achieved ON wallet_adoption_stages(achieved_at) WHERE achieved_at IS NOT NULL;

-- =====================================================
-- 12.4 PRODUCTIVITY SCORING
-- =====================================================
CREATE TABLE wallet_productivity_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    
    -- Overall score and components (0-100 scale)
    total_score INTEGER DEFAULT 0 CHECK (total_score >= 0 AND total_score <= 100),
    retention_score INTEGER DEFAULT 0 CHECK (retention_score >= 0 AND retention_score <= 100),
    adoption_score INTEGER DEFAULT 0 CHECK (adoption_score >= 0 AND adoption_score <= 100),
    activity_score INTEGER DEFAULT 0 CHECK (activity_score >= 0 AND activity_score <= 100),
    diversity_score INTEGER DEFAULT 0 CHECK (diversity_score >= 0 AND diversity_score <= 100),
    
    -- Status indicators
    status TEXT DEFAULT 'healthy' CHECK (status IN ('healthy', 'at_risk', 'churn')),
    risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    
    -- Task tracking
    pending_tasks JSONB DEFAULT '[]'::jsonb,
    completed_tasks JSONB DEFAULT '[]'::jsonb,
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint per wallet
    UNIQUE(wallet_id)
);

-- Indexes for productivity scores
CREATE INDEX idx_productivity_scores_wallet ON wallet_productivity_scores(wallet_id);
CREATE INDEX idx_productivity_scores_total ON wallet_productivity_scores(total_score);
CREATE INDEX idx_productivity_scores_status ON wallet_productivity_scores(status);
CREATE INDEX idx_productivity_scores_risk ON wallet_productivity_scores(risk_level);

-- =====================================================
-- 12.5 BEHAVIOR FLOW TRACKING
-- =====================================================
CREATE TABLE wallet_behavior_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    session_id UUID DEFAULT gen_random_uuid(),
    
    -- Flow metadata
    flow_sequence JSONB NOT NULL,
    flow_duration_minutes INTEGER,
    flow_complexity_score INTEGER DEFAULT 0,
    
    -- Classification
    flow_type TEXT CHECK (flow_type IN ('simple_transfer', 'complex_defi', 'privacy_focused', 'multi_step')),
    success_indicator BOOLEAN DEFAULT TRUE,
    
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for behavior flows
CREATE INDEX idx_behavior_flows_wallet ON wallet_behavior_flows(wallet_id);
CREATE INDEX idx_behavior_flows_session ON wallet_behavior_flows(session_id);
CREATE INDEX idx_behavior_flows_type ON wallet_behavior_flows(flow_type);
CREATE INDEX idx_behavior_flows_started ON wallet_behavior_flows(started_at);

-- =====================================================
-- 12.6 SHIELDED POOL ANALYTICS
-- =====================================================
CREATE TABLE shielded_pool_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,
    
    -- Shielded activity metrics
    shielded_tx_count INTEGER DEFAULT 0,
    transparent_to_shielded_count INTEGER DEFAULT 0,
    shielded_to_transparent_count INTEGER DEFAULT 0,
    internal_shielded_count INTEGER DEFAULT 0,
    
    -- Privacy behavior analysis
    avg_shielded_duration_hours DECIMAL(10,2),
    shielded_volume_zatoshi BIGINT DEFAULT 0,
    privacy_score INTEGER DEFAULT 0 CHECK (privacy_score >= 0 AND privacy_score <= 100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(wallet_id, analysis_date)
);

-- Indexes for shielded pool metrics
CREATE INDEX idx_shielded_metrics_wallet ON shielded_pool_metrics(wallet_id);
CREATE INDEX idx_shielded_metrics_date ON shielded_pool_metrics(analysis_date);
CREATE INDEX idx_shielded_metrics_privacy_score ON shielded_pool_metrics(privacy_score);

-- =====================================================
-- 12.7 COMPETITIVE BENCHMARKING
-- =====================================================
CREATE TABLE competitive_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benchmark_type TEXT NOT NULL CHECK (benchmark_type IN ('productivity', 'retention', 'adoption', 'churn')),
    category TEXT NOT NULL, -- 'defi', 'gamefi', etc.
    
    -- Benchmark metrics (percentiles)
    percentile_25 DECIMAL(10,4),
    percentile_50 DECIMAL(10,4),
    percentile_75 DECIMAL(10,4),
    percentile_90 DECIMAL(10,4),
    
    sample_size INTEGER DEFAULT 0,
    calculation_date DATE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(benchmark_type, category, calculation_date)
);

-- Indexes for competitive benchmarks
CREATE INDEX idx_benchmarks_type ON competitive_benchmarks(benchmark_type);
CREATE INDEX idx_benchmarks_category ON competitive_benchmarks(category);
CREATE INDEX idx_benchmarks_date ON competitive_benchmarks(calculation_date);

-- =====================================================
-- 12.8 AI RECOMMENDATIONS AND TASK TRACKING
-- =====================================================
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Recommendation details
    recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('marketing', 'onboarding', 'feature_enhancement', 'retention', 'engagement')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    
    -- Task tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed')),
    completion_indicators JSONB DEFAULT '{}'::jsonb,
    
    -- Effectiveness tracking
    baseline_metrics JSONB DEFAULT '{}'::jsonb,
    current_metrics JSONB DEFAULT '{}'::jsonb,
    effectiveness_score DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_wallet_or_project CHECK (wallet_id IS NOT NULL OR project_id IS NOT NULL)
);

-- Indexes for AI recommendations
CREATE INDEX idx_ai_recommendations_wallet ON ai_recommendations(wallet_id) WHERE wallet_id IS NOT NULL;
CREATE INDEX idx_ai_recommendations_project ON ai_recommendations(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_ai_recommendations_type ON ai_recommendations(recommendation_type);
CREATE INDEX idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX idx_ai_recommendations_priority ON ai_recommendations(priority);

-- =====================================================
-- 12.9 PRIVACY AND MONETIZATION CONTROLS
-- =====================================================
CREATE TABLE wallet_privacy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    
    -- Privacy controls
    data_sharing_level TEXT DEFAULT 'private' CHECK (data_sharing_level IN ('private', 'public', 'monetizable')),
    anonymization_level TEXT DEFAULT 'high' CHECK (anonymization_level IN ('low', 'medium', 'high')),
    
    -- Monetization settings
    monetization_enabled BOOLEAN DEFAULT FALSE,
    earnings_address TEXT,
    revenue_share_percentage DECIMAL(5,2) DEFAULT 50.00 CHECK (revenue_share_percentage >= 0 AND revenue_share_percentage <= 100),
    
    -- Access controls
    allowed_analytics_types TEXT[] DEFAULT ARRAY['basic'],
    data_retention_days INTEGER DEFAULT 365 CHECK (data_retention_days > 0),
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint per wallet
    UNIQUE(wallet_id)
);

-- Indexes for privacy settings
CREATE INDEX idx_privacy_settings_wallet ON wallet_privacy_settings(wallet_id);
CREATE INDEX idx_privacy_settings_sharing ON wallet_privacy_settings(data_sharing_level);
CREATE INDEX idx_privacy_settings_monetization ON wallet_privacy_settings(monetization_enabled) WHERE monetization_enabled = true;

-- =====================================================
-- 12.10 PROCESSED TRANSACTIONS FOR ANALYTICS
-- =====================================================
CREATE TABLE processed_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    
    -- Transaction identification
    txid VARCHAR(64) NOT NULL,
    block_height INTEGER,
    block_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Enhanced classification
    tx_type TEXT NOT NULL CHECK (tx_type IN ('transfer', 'swap', 'bridge', 'shielded', 'contract', 'mint', 'burn')),
    tx_subtype TEXT CHECK (tx_subtype IN ('incoming', 'outgoing', 'self', 'multi_party')),
    
    -- Value and fee analysis
    value_zatoshi BIGINT DEFAULT 0,
    fee_zatoshi BIGINT DEFAULT 0,
    usd_value_at_time DECIMAL(12,2),
    
    -- Behavioral context
    counterparty_address TEXT,
    counterparty_type TEXT CHECK (counterparty_type IN ('exchange', 'defi', 'wallet', 'contract', 'unknown')),
    feature_used TEXT,
    
    -- Sequence analysis
    sequence_position INTEGER,
    session_id UUID,
    time_since_previous_tx_minutes INTEGER,
    
    -- Privacy analysis (for shielded transactions)
    is_shielded BOOLEAN DEFAULT FALSE,
    shielded_pool_entry BOOLEAN DEFAULT FALSE,
    shielded_pool_exit BOOLEAN DEFAULT FALSE,
    
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(wallet_id, txid)
);

-- Indexes for processed transactions
CREATE INDEX idx_processed_tx_wallet ON processed_transactions(wallet_id);
CREATE INDEX idx_processed_tx_txid ON processed_transactions(txid);
CREATE INDEX idx_processed_tx_type ON processed_transactions(tx_type);
CREATE INDEX idx_processed_tx_timestamp ON processed_transactions(block_timestamp);
CREATE INDEX idx_processed_tx_shielded ON processed_transactions(is_shielded) WHERE is_shielded = true;
CREATE INDEX idx_processed_tx_session ON processed_transactions(session_id) WHERE session_id IS NOT NULL;

-- Composite indexes for analytics queries
CREATE INDEX idx_processed_tx_wallet_timestamp ON processed_transactions(wallet_id, block_timestamp);
CREATE INDEX idx_processed_tx_wallet_type ON processed_transactions(wallet_id, tx_type);

-- =====================================================
-- 12.11 ANALYTICS TRIGGERS
-- =====================================================

-- Apply update triggers to analytics tables
CREATE TRIGGER update_wallet_activity_metrics_updated_at
    BEFORE UPDATE ON wallet_activity_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_cohorts_updated_at
    BEFORE UPDATE ON wallet_cohorts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_privacy_settings_updated_at
    BEFORE UPDATE ON wallet_privacy_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 12.12 ANALYTICS VIEWS FOR PERFORMANCE
-- =====================================================

-- Weekly cohort retention view
CREATE OR REPLACE VIEW weekly_cohort_retention AS
WITH cohort_base AS (
    SELECT 
        wc.cohort_period,
        wc.wallet_count as new_users,
        wca.wallet_id,
        EXTRACT(WEEK FROM wam.activity_date) - EXTRACT(WEEK FROM wc.cohort_period) as week_number
    FROM wallet_cohorts wc
    JOIN wallet_cohort_assignments wca ON wc.id = wca.cohort_id
    JOIN wallet_activity_metrics wam ON wca.wallet_id = wam.wallet_id
    WHERE wc.cohort_type = 'weekly' AND wam.is_active = true
),
cohort_retention AS (
    SELECT 
        cohort_period,
        new_users,
        week_number,
        COUNT(DISTINCT wallet_id) as active_wallets
    FROM cohort_base
    GROUP BY cohort_period, new_users, week_number
)
SELECT 
    cohort_period,
    new_users,
    ROUND(100.0 * MAX(CASE WHEN week_number = 1 THEN active_wallets END) / new_users, 2) as week_1,
    ROUND(100.0 * MAX(CASE WHEN week_number = 2 THEN active_wallets END) / new_users, 2) as week_2,
    ROUND(100.0 * MAX(CASE WHEN week_number = 3 THEN active_wallets END) / new_users, 2) as week_3,
    ROUND(100.0 * MAX(CASE WHEN week_number = 4 THEN active_wallets END) / new_users, 2) as week_4
FROM cohort_retention
GROUP BY cohort_period, new_users
ORDER BY cohort_period DESC;

-- Wallet health dashboard view
CREATE OR REPLACE VIEW wallet_health_dashboard AS
SELECT 
    CASE 
        WHEN wps.total_score >= 80 THEN 'Healthy'
        WHEN wps.total_score >= 50 THEN 'At Risk'
        ELSE 'Churn'
    END as health_status,
    COUNT(*) as wallet_count,
    ROUND(AVG(wps.total_score), 2) as avg_score,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM wallet_productivity_scores), 2) as percentage
FROM wallet_productivity_scores wps
GROUP BY health_status
ORDER BY wallet_count DESC;

-- =====================================================
-- 12.13 ANALYTICS HELPER FUNCTIONS
-- =====================================================

-- Function to calculate wallet retention score
CREATE OR REPLACE FUNCTION calculate_wallet_retention_score(p_wallet_id UUID)
RETURNS INTEGER AS $$
DECLARE
    frequency_score INTEGER := 0;
    recency_score INTEGER := 0;
    volume_score INTEGER := 0;
    diversity_score INTEGER := 0;
    total_score INTEGER := 0;
    
    last_activity_date DATE;
    activity_days INTEGER;
    total_volume BIGINT;
    tx_diversity INTEGER;
BEGIN
    -- Get wallet activity metrics for last 30 days
    SELECT 
        MAX(activity_date),
        COUNT(DISTINCT activity_date),
        SUM(total_volume_zatoshi),
        COUNT(DISTINCT CASE WHEN transfers_count > 0 THEN 'transfer' END) +
        COUNT(DISTINCT CASE WHEN swaps_count > 0 THEN 'swap' END) +
        COUNT(DISTINCT CASE WHEN bridges_count > 0 THEN 'bridge' END) +
        COUNT(DISTINCT CASE WHEN shielded_count > 0 THEN 'shielded' END)
    INTO last_activity_date, activity_days, total_volume, tx_diversity
    FROM wallet_activity_metrics
    WHERE wallet_id = p_wallet_id
    AND activity_date >= CURRENT_DATE - INTERVAL '30 days';
    
    -- Frequency Score (0-30 points)
    IF activity_days >= 15 THEN frequency_score := 30;
    ELSIF activity_days >= 8 THEN frequency_score := 20;
    ELSIF activity_days >= 4 THEN frequency_score := 10;
    ELSE frequency_score := 0;
    END IF;
    
    -- Recency Score (0-30 points)
    IF last_activity_date >= CURRENT_DATE - INTERVAL '1 day' THEN recency_score := 30;
    ELSIF last_activity_date >= CURRENT_DATE - INTERVAL '3 days' THEN recency_score := 20;
    ELSIF last_activity_date >= CURRENT_DATE - INTERVAL '7 days' THEN recency_score := 10;
    ELSE recency_score := 0;
    END IF;
    
    -- Volume Score (0-20 points)
    IF total_volume > 100000000 THEN volume_score := 20; -- > 1 ZEC
    ELSIF total_volume > 10000000 THEN volume_score := 15; -- > 0.1 ZEC
    ELSIF total_volume > 1000000 THEN volume_score := 10; -- > 0.01 ZEC
    ELSE volume_score := 5;
    END IF;
    
    -- Diversity Score (0-20 points)
    diversity_score := LEAST(tx_diversity * 5, 20);
    
    total_score := frequency_score + recency_score + volume_score + diversity_score;
    
    RETURN LEAST(total_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to update wallet cohorts
CREATE OR REPLACE FUNCTION update_wallet_cohorts()
RETURNS VOID AS $$
BEGIN
    -- Create weekly cohorts for new wallets
    INSERT INTO wallet_cohorts (cohort_type, cohort_period, wallet_count)
    SELECT 
        'weekly',
        DATE_TRUNC('week', w.created_at)::DATE,
        COUNT(*)
    FROM wallets w
    WHERE w.created_at >= CURRENT_DATE - INTERVAL '30 days'
    AND NOT EXISTS (
        SELECT 1 FROM wallet_cohort_assignments wca 
        JOIN wallet_cohorts wc ON wca.cohort_id = wc.id 
        WHERE wca.wallet_id = w.id AND wc.cohort_type = 'weekly'
    )
    GROUP BY DATE_TRUNC('week', w.created_at)::DATE
    ON CONFLICT (cohort_type, cohort_period) DO UPDATE SET
        wallet_count = EXCLUDED.wallet_count;
    
    -- Assign wallets to cohorts
    INSERT INTO wallet_cohort_assignments (wallet_id, cohort_id)
    SELECT 
        w.id,
        wc.id
    FROM wallets w
    JOIN wallet_cohorts wc ON DATE_TRUNC('week', w.created_at)::DATE = wc.cohort_period
    WHERE wc.cohort_type = 'weekly'
    AND NOT EXISTS (
        SELECT 1 FROM wallet_cohort_assignments wca 
        WHERE wca.wallet_id = w.id AND wca.cohort_id = wc.id
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 12.14 COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE wallet_activity_metrics IS 'Daily aggregated activity metrics per wallet for analytics processing';
COMMENT ON TABLE wallet_cohorts IS 'Time-based cohorts for retention analysis and user lifecycle tracking';
COMMENT ON TABLE wallet_adoption_stages IS 'Tracks wallet progression through adoption funnel stages';
COMMENT ON TABLE wallet_productivity_scores IS 'Comprehensive productivity scoring with AI task recommendations';
COMMENT ON TABLE wallet_behavior_flows IS 'Sequential transaction pattern analysis for user journey mapping';
COMMENT ON TABLE shielded_pool_metrics IS 'Privacy-focused analytics for shielded transaction behavior';
COMMENT ON TABLE competitive_benchmarks IS 'Market benchmarking data for competitive analysis';
COMMENT ON TABLE ai_recommendations IS 'AI-generated task recommendations with completion tracking';
COMMENT ON TABLE wallet_privacy_settings IS 'Privacy controls and monetization preferences per wallet';
COMMENT ON TABLE processed_transactions IS 'Enhanced transaction data with behavioral metadata for analytics';

COMMENT ON FUNCTION calculate_wallet_retention_score(UUID) IS 'Calculates 0-100 retention score based on frequency, recency, volume, and diversity';
COMMENT ON FUNCTION update_wallet_cohorts() IS 'Automatically assigns wallets to cohorts and updates cohort statistics';

COMMENT ON VIEW weekly_cohort_retention IS 'Pre-calculated weekly cohort retention percentages for dashboard display';
COMMENT ON VIEW wallet_health_dashboard IS 'Wallet health distribution summary for executive dashboard';