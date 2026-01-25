-- Transaction Service Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop tables in reverse dependency order if they exist (for clean recreation)
DROP TABLE IF EXISTS contract_state CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS deposit_addresses CASCADE;
DROP TABLE IF EXISTS user_balances CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (synced from user-service via Kafka)
-- Note: One user can have multiple roles, but we store one record per user
CREATE TABLE users (
    id UUID PRIMARY KEY,
    display_id VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    mobile_number VARCHAR(20),
    country_code VARCHAR(10),
    role VARCHAR(20) DEFAULT 'user', -- First role synced, user can have multiple roles
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id)
);

-- User balances table
CREATE TABLE user_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(36, 18) DEFAULT 0,
    stablecoin_balance DECIMAL(36, 18) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Deposit addresses table (must be created before transactions)
CREATE TABLE deposit_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vault_account_id VARCHAR(255),
    address VARCHAR(255),
    customer_ref_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES transactions(id),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deposit_address_id UUID REFERENCES deposit_addresses(id),
    transaction_type VARCHAR(20) NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    amount_requested DECIMAL(36, 18),
    currency VARCHAR(10),
    to_currency VARCHAR(10),
    status VARCHAR(20) DEFAULT 'pending',
    txn_id VARCHAR(255),
    tx_hash VARCHAR(255),
    source_address VARCHAR(255),
    destination_address VARCHAR(255),
    source_type VARCHAR(50),
    destination_type VARCHAR(50),
    vault_account_id VARCHAR(255),
    asset_id VARCHAR(50),
    note TEXT,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    fee DECIMAL(36, 18),
    fee_currency VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contract State table (tracks contract deployment and state)
CREATE TABLE contract_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_address VARCHAR(42) UNIQUE NOT NULL,
    contract_name VARCHAR(100) NOT NULL,
    network VARCHAR(50) NOT NULL,
    is_paused BOOLEAN DEFAULT false,
    total_supply DECIMAL(36, 18) DEFAULT 0,
    deployed_at TIMESTAMP,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_display_id ON users(display_id);
CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON user_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_txn_id ON transactions(txn_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_deposit_addresses_user_id ON deposit_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_addresses_vault_account_id ON deposit_addresses(vault_account_id);
CREATE INDEX IF NOT EXISTS idx_contract_state_address ON contract_state(contract_address);
CREATE INDEX IF NOT EXISTS idx_contract_state_network ON contract_state(network);
CREATE INDEX IF NOT EXISTS idx_contract_state_paused ON contract_state(is_paused);
CREATE INDEX IF NOT EXISTS idx_transactions_deposit_address_id ON transactions(deposit_address_id);
CREATE INDEX IF NOT EXISTS idx_transactions_parent_id ON transactions(parent_id);

-- ============================================
-- MOCK DATA FOR SMOOTH END-TO-END FLOW TESTING
-- ============================================

-- Insert synced users (matching user-service users)
-- These users will be synced via Kafka, but we insert them here for initial testing

-- User 1: Admin/Super Admin
INSERT INTO users (id, display_id, email, first_name, last_name, mobile_number, country_code, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'USR-000001',
    'admin@stablecoin.com',
    'John',
    'Admin',
    '1234567890',
    '+1',
    'super_admin'
) ON CONFLICT (id) DO UPDATE SET
    display_id = EXCLUDED.display_id,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    mobile_number = EXCLUDED.mobile_number,
    country_code = EXCLUDED.country_code,
    updated_at = CURRENT_TIMESTAMP;

-- User 2: Regular User
INSERT INTO users (id, display_id, email, first_name, last_name, mobile_number, country_code, role)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'USR-000002',
    'user@stablecoin.com',
    'Jane',
    'Doe',
    '9876543210',
    '+1',
    'user'
) ON CONFLICT (id) DO UPDATE SET
    display_id = EXCLUDED.display_id,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    mobile_number = EXCLUDED.mobile_number,
    country_code = EXCLUDED.country_code,
    updated_at = CURRENT_TIMESTAMP;

-- User 3: Another Regular User
INSERT INTO users (id, display_id, email, first_name, last_name, mobile_number, country_code, role)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    'USR-000003',
    'alice@stablecoin.com',
    'Alice',
    'Smith',
    '5551234567',
    '+1',
    'user'
) ON CONFLICT (id) DO UPDATE SET
    display_id = EXCLUDED.display_id,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    mobile_number = EXCLUDED.mobile_number,
    country_code = EXCLUDED.country_code,
    updated_at = CURRENT_TIMESTAMP;

-- User 4: Regular Admin
INSERT INTO users (id, display_id, email, first_name, last_name, mobile_number, country_code, role)
VALUES (
    '00000000-0000-0000-0000-000000000004',
    'USR-000004',
    'admin2@stablecoin.com',
    'Bob',
    'Manager',
    '5559876543',
    '+1',
    'admin'
) ON CONFLICT (id) DO UPDATE SET
    display_id = EXCLUDED.display_id,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    mobile_number = EXCLUDED.mobile_number,
    country_code = EXCLUDED.country_code,
    updated_at = CURRENT_TIMESTAMP;

-- User 5: Another User
INSERT INTO users (id, display_id, email, first_name, last_name, mobile_number, country_code, role)
VALUES (
    '00000000-0000-0000-0000-000000000005',
    'USR-000005',
    'charlie@stablecoin.com',
    'Charlie',
    'Brown',
    '5551112222',
    '+1',
    'user'
) ON CONFLICT (id) DO UPDATE SET
    display_id = EXCLUDED.display_id,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    mobile_number = EXCLUDED.mobile_number,
    country_code = EXCLUDED.country_code,
    updated_at = CURRENT_TIMESTAMP;

-- Create user balances with realistic amounts
INSERT INTO user_balances (user_id, balance, stablecoin_balance, currency)
VALUES
    -- Admin balance (high balance for admin operations)
    ('00000000-0000-0000-0000-000000000001', 100000.00, 50000.00, 'USD'),
    -- User 1 balance (moderate balance)
    ('00000000-0000-0000-0000-000000000002', 5000.00, 2500.00, 'USD'),
    -- User 2 balance (good balance)
    ('00000000-0000-0000-0000-000000000003', 10000.00, 5000.00, 'USD'),
    -- Admin 2 balance
    ('00000000-0000-0000-0000-000000000004', 50000.00, 25000.00, 'USD'),
    -- User 5 balance (low balance for testing)
    ('00000000-0000-0000-0000-000000000005', 1000.00, 500.00, 'USD')
ON CONFLICT (user_id) DO UPDATE SET
    balance = EXCLUDED.balance,
    stablecoin_balance = EXCLUDED.stablecoin_balance,
    updated_at = CURRENT_TIMESTAMP;

-- Create deposit addresses for each user
INSERT INTO deposit_addresses (user_id, address, customer_ref_id, is_active)
VALUES
    -- Admin deposit address
    ('00000000-0000-0000-0000-000000000001', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'user_00000000-0000-0000-0000-000000000001_001', true),
    -- User 1 deposit address
    ('00000000-0000-0000-0000-000000000002', '0x8ba1f109551bD432803012645Hac136c22C9b8C1', 'user_00000000-0000-0000-0000-000000000002_001', true),
    -- User 2 deposit address
    ('00000000-0000-0000-0000-000000000003', '0x1234567890123456789012345678901234567890', 'user_00000000-0000-0000-0000-000000000003_001', true),
    -- Admin 2 deposit address
    ('00000000-0000-0000-0000-000000000004', '0x9876543210987654321098765432109876543210', 'user_00000000-0000-0000-0000-000000000004_001', true),
    -- User 5 deposit address
    ('00000000-0000-0000-0000-000000000005', '0xABCDEF1234567890ABCDEF1234567890ABCDEF12', 'user_00000000-0000-0000-0000-000000000005_001', true)
ON CONFLICT DO NOTHING;

-- Create sample transactions for testing various flows
-- User 1 (Jane Doe) - Deposit transaction (confirmed)
INSERT INTO transactions (
    id, user_id, deposit_address_id, transaction_type, amount, amount_requested, currency,
    status, txn_id, tx_hash, source_address, destination_address, source_type, destination_type, note, retry_count, created_at
)
SELECT
    'a0000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    (SELECT id FROM deposit_addresses WHERE user_id = '00000000-0000-0000-0000-000000000002' LIMIT 1),
    'deposit',
    1000.00,
    1000.00,
    'USD',
    'confirmed',
    'TXN-DEP-001',
    '0xabc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
    '0xExternalWallet123456789012345678901234567890',
    '0x8ba1f109551bD432803012645Hac136c22C9b8C1',
    'EXTERNAL_WALLET',
    'VAULT',
    'Initial deposit transaction',
    0,
    CURRENT_TIMESTAMP - INTERVAL '5 days'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE id = 'a0000000-0000-0000-0000-000000000001');

-- User 1 - Mint transaction (confirmed)
INSERT INTO transactions (
    id, user_id, transaction_type, amount, amount_requested, currency,
    status, txn_id, tx_hash, destination_address, destination_type, note, retry_count, created_at
)
SELECT
    'a0000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    'mint',
    500.00,
    500.00,
    'USD',
    'confirmed',
    'TXN-MINT-001',
    '0xdef456ghi789jkl012mno345pqr678stu901vwx234yzabc',
    '0x8ba1f109551bD432803012645Hac136c22C9b8C1',
    'VAULT',
    'Mint stablecoin from USD deposit',
    0,
    CURRENT_TIMESTAMP - INTERVAL '4 days'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE id = 'a0000000-0000-0000-0000-000000000002');

-- User 2 (Alice Smith) - Deposit transaction (confirmed)
INSERT INTO transactions (
    id, user_id, deposit_address_id, transaction_type, amount, amount_requested, currency,
    status, txn_id, tx_hash, source_address, destination_address, source_type, destination_type, note, retry_count, created_at
)
SELECT
    'a0000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    (SELECT id FROM deposit_addresses WHERE user_id = '00000000-0000-0000-0000-000000000003' LIMIT 1),
    'deposit',
    2000.00,
    2000.00,
    'USD',
    'confirmed',
    'TXN-DEP-002',
    '0xghi789jkl012mno345pqr678stu901vwx234yzabcdef',
    '0xExternalWallet987654321098765432109876543210',
    '0x1234567890123456789012345678901234567890',
    'EXTERNAL_WALLET',
    'VAULT',
    'Deposit for trading',
    0,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE id = 'a0000000-0000-0000-0000-000000000003');

-- User 2 - Withdraw transaction (pending)
INSERT INTO transactions (
    id, user_id, transaction_type, amount, amount_requested, currency,
    status, txn_id, source_address, destination_address, source_type, destination_type, note, retry_count, created_at
)
SELECT
    'a0000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    'withdraw',
    500.00,
    500.00,
    'USD',
    'pending',
    'TXN-WD-001',
    '0x1234567890123456789012345678901234567890',
    '0xExternalWallet987654321098765432109876543210',
    'VAULT',
    'EXTERNAL_WALLET',
    'Withdrawal request',
    0,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE id = 'a0000000-0000-0000-0000-000000000004');

-- User 2 - Burn transaction (confirmed)
INSERT INTO transactions (
    id, user_id, transaction_type, amount, amount_requested, currency,
    status, txn_id, tx_hash, source_address, source_type, note, retry_count, created_at
)
SELECT
    'a0000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    'burn',
    1000.00,
    1000.00,
    'STC',
    'confirmed',
    'TXN-BURN-001',
    '0xjkl012mno345pqr678stu901vwx234yzabcdefghi',
    '0x1234567890123456789012345678901234567890',
    'VAULT',
    'Burn stablecoin to USD',
    0,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE id = 'a0000000-0000-0000-0000-000000000005');

-- Admin - Mint transaction (confirmed)
INSERT INTO transactions (
    id, user_id, transaction_type, amount, amount_requested, currency,
    status, txn_id, tx_hash, destination_address, destination_type, note, retry_count, created_at
)
SELECT
    'a0000000-0000-0000-0000-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'mint',
    10000.00,
    10000.00,
    'USD',
    'confirmed',
    'TXN-MINT-002',
    '0xmno345pqr678stu901vwx234yzabcdefghijkl',
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    'VAULT',
    'Admin mint operation',
    0,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE id = 'a0000000-0000-0000-0000-000000000006');

-- User 1 - Failed transaction (for testing error handling)
INSERT INTO transactions (
    id, user_id, transaction_type, amount, amount_requested, currency,
    status, txn_id, source_address, destination_address, source_type, destination_type, note, failure_reason, retry_count, created_at
)
SELECT
    'a0000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    'withdraw',
    10000.00,
    10000.00,
    'USD',
    'failed',
    'TXN-WD-002',
    '0x8ba1f109551bD432803012645Hac136c22C9b8C1',
    '0xInvalidAddress123456789012345678901234567890',
    'VAULT',
    'EXTERNAL_WALLET',
    'Failed withdrawal - insufficient balance',
    'Insufficient balance for withdrawal',
    3,
    CURRENT_TIMESTAMP - INTERVAL '6 hours'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE id = 'a0000000-0000-0000-0000-000000000007');

-- User 5 - Small deposit (confirmed)
INSERT INTO transactions (
    id, user_id, deposit_address_id, transaction_type, amount, amount_requested, currency,
    status, txn_id, tx_hash, source_address, destination_address, source_type, destination_type, note, retry_count, created_at
)
SELECT
    'a0000000-0000-0000-0000-000000000008'::uuid,
    '00000000-0000-0000-0000-000000000005'::uuid,
    (SELECT id FROM deposit_addresses WHERE user_id = '00000000-0000-0000-0000-000000000005' LIMIT 1),
    'deposit',
    500.00,
    500.00,
    'USD',
    'confirmed',
    'TXN-DEP-003',
    '0xpqr678stu901vwx234yzabcdefghijklmno',
    '0xExternalWallet555555555555555555555555555555',
    '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
    'EXTERNAL_WALLET',
    'VAULT',
    'Small test deposit',
    0,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE id = 'a0000000-0000-0000-0000-000000000008');

-- Insert sample contract state for testing
INSERT INTO contract_state (id, contract_address, contract_name, network, is_paused, total_supply, deployed_at)
VALUES (
    'c0000000-0000-0000-0000-000000000001'::uuid,
    '0x1234567890123456789012345678901234567890',
    'StablecoinToken',
    'ethereum',
    false,
    1000000.00,
    CURRENT_TIMESTAMP - INTERVAL '30 days'
) ON CONFLICT (contract_address) DO UPDATE SET
    contract_name = EXCLUDED.contract_name,
    network = EXCLUDED.network,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO contract_state (id, contract_address, contract_name, network, is_paused, total_supply, deployed_at)
VALUES (
    'c0000000-0000-0000-0000-000000000002'::uuid,
    '0x9876543210987654321098765432109876543210',
    'StablecoinToken',
    'polygon',
    true,
    500000.00,
    CURRENT_TIMESTAMP - INTERVAL '20 days'
) ON CONFLICT (contract_address) DO UPDATE SET
    contract_name = EXCLUDED.contract_name,
    network = EXCLUDED.network,
    updated_at = CURRENT_TIMESTAMP;
