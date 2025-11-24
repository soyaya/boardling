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
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

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