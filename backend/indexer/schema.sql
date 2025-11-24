-- This table will store the block hashes fetched from the RPC endpoint.
CREATE TABLE IF NOT EXISTS block_hashes (
    id SERIAL PRIMARY KEY,
    hash VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);