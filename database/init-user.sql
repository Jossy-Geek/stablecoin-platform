-- User Service Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop tables in reverse dependency order if they exist (for clean recreation)
DROP TABLE IF EXISTS two_factor_auth CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS users_roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (no role column, email can be reused for different roles)
-- Note: is_verified is derived from users_roles table (user has at least one active, non-blocked role)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_id VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    mobile_number VARCHAR(20),
    country_code VARCHAR(10),
    profile_image VARCHAR(500),
    is_two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Roles table (many-to-many relationship)
CREATE TABLE users_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role)
);

-- Password resets table
CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Two factor auth table
CREATE TABLE two_factor_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    secret VARCHAR(255) NOT NULL,
    backup_codes TEXT, -- JSON array as string
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_display_id ON users(display_id);
CREATE INDEX IF NOT EXISTS idx_users_roles_user_id ON users_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_users_roles_role ON users_roles(role);
CREATE INDEX IF NOT EXISTS idx_users_roles_active ON users_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_users_roles_blocked ON users_roles(is_blocked);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON two_factor_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON two_factor_auth(user_id);

-- Insert default admin user (password: Admin@123)
-- Password hash generated with bcrypt(10 rounds)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'USR-000001',
    'admin@stablecoin.com',
    '$2b$10$6Ou8H8yUiUabouxhAnPUBOUg5/z0q0Uy9lOZJodenaXnPhhpRjfau',
    'John',
    'Admin',
    '1234567890',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Then assign admin and super_admin roles
INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin', true, false),
    ('00000000-0000-0000-0000-000000000001', 'super_admin', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert default user (password: User@123)
-- Password hash generated with bcrypt(10 rounds)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'USR-000002',
    'user@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Jane',
    'Doe',
    '9876543210',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Assign user role
INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000002', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert additional sample users for testing
-- User 3: Another regular user (password: User@123)
-- Password hash generated with bcrypt(10 rounds)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    'USR-000003',
    'alice@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Alice',
    'Smith',
    '5551234567',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000003', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 4: Regular admin (not super_admin) (password: Admin@123)
-- Password hash generated with bcrypt(10 rounds)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000004',
    'USR-000004',
    'admin2@stablecoin.com',
    '$2b$10$6Ou8H8yUiUabouxhAnPUBOUg5/z0q0Uy9lOZJodenaXnPhhpRjfau',
    'Bob',
    'Manager',
    '5559876543',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000004', 'admin', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 5: Another regular user with profile image (password: User@123)
-- Password hash generated with bcrypt(10 rounds)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code, profile_image)
VALUES (
    '00000000-0000-0000-0000-000000000005',
    'USR-000005',
    'charlie@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Charlie',
    'Brown',
    '5551112222',
    '+1',
    'profile-images/profile-charlie-00000000-0000-0000-0000-000000000005.jpg'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000005', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 6: User with 2FA enabled (password: User@123)
-- Password hash generated with bcrypt(10 rounds)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code, is_two_factor_enabled)
VALUES (
    '00000000-0000-0000-0000-000000000006',
    'USR-000006',
    'david@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'David',
    'Wilson',
    '5553334444',
    '+1',
    true
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000006', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 7: Inactive user (password: User@123)
-- Password hash generated with bcrypt(10 rounds)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000007',
    'USR-000007',
    'eve@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Eve',
    'Johnson',
    '5555556666',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000007', 'user', false, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 8: Blocked user (password: User@123)
-- Password hash generated with bcrypt(10 rounds)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000008',
    'USR-000008',
    'frank@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Frank',
    'Davis',
    '5557778888',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000008', 'user', true, true)
ON CONFLICT (user_id, role) DO NOTHING;

-- Additional users to reach 21+ total
-- Password hashes:
-- Admin@123 -> $2b$10$6Ou8H8yUiUabouxhAnPUBOUg5/z0q0Uy9lOZJodenaXnPhhpRjfau
-- User@123 -> $2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u

-- User 9: Regular user (password: User@123)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000009',
    'USR-000009',
    'grace@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Grace',
    'Martinez',
    '5558889999',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000009', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 10: Regular user (password: User@123)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000010',
    'USR-000010',
    'henry@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Henry',
    'Anderson',
    '5550001111',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000010', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 11: Regular user (password: User@123)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000011',
    'USR-000011',
    'ivy@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Ivy',
    'Taylor',
    '5552223333',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000011', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 12: Regular user (password: User@123)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000012',
    'USR-000012',
    'jack@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Jack',
    'Thomas',
    '5554445555',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000012', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 13: Regular user (password: User@123)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000013',
    'USR-000013',
    'kate@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Kate',
    'Jackson',
    '5556667777',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000013', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 14: Regular user (password: User@123)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000014',
    'USR-000014',
    'liam@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Liam',
    'White',
    '5558889990',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000014', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 15: Regular user (password: User@123)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000015',
    'USR-000015',
    'mia@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Mia',
    'Harris',
    '5551112223',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000015', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 16: Regular user (password: User@123)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000016',
    'USR-000016',
    'noah@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Noah',
    'Martin',
    '5553334445',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000016', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 17: Regular user (password: User@123)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000017',
    'USR-000017',
    'olivia@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Olivia',
    'Thompson',
    '5555556667',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000017', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 18: Regular user (password: User@123)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000018',
    'USR-000018',
    'paul@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Paul',
    'Moore',
    '5557778889',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000018', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 19: Regular user (password: User@123)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000019',
    'USR-000019',
    'quinn@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Quinn',
    'Young',
    '5559990001',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000019', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 20: Regular user (password: User@123)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000020',
    'USR-000020',
    'rachel@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Rachel',
    'Allen',
    '5550001112',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000020', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 21: Admin user (password: Admin@123)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000021',
    'USR-000021',
    'admin3@stablecoin.com',
    '$2b$10$6Ou8H8yUiUabouxhAnPUBOUg5/z0q0Uy9lOZJodenaXnPhhpRjfau',
    'Sarah',
    'Admin',
    '5551112224',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000021', 'admin', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 22: Regular user (password: User@123)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000022',
    'USR-000022',
    'sam@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Sam',
    'King',
    '5552223334',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000022', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 23: Regular user (password: User@123)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000023',
    'USR-000023',
    'tina@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Tina',
    'Wright',
    '5554445556',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000023', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 24: Regular user (password: User@123)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000024',
    'USR-000024',
    'uma@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Uma',
    'Lopez',
    '5556667778',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000024', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;

-- User 25: Regular user (password: User@123)
INSERT INTO users (id, display_id, email, password_hash, first_name, last_name, mobile_number, country_code)
VALUES (
    '00000000-0000-0000-0000-000000000025',
    'USR-000025',
    'victor@stablecoin.com',
    '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u',
    'Victor',
    'Hill',
    '5558889991',
    '+1'
) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO users_roles (user_id, role, is_active, is_blocked)
VALUES ('00000000-0000-0000-0000-000000000025', 'user', true, false)
ON CONFLICT (user_id, role) DO NOTHING;
