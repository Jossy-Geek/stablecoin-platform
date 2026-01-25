# User Credentials Summary - 25 Users

## 🔐 Password Configuration

### Admin/Super Admin Users
- **Password:** `Admin@123`
- **Hash:** `$2b$10$6Ou8H8yUiUabouxhAnPUBOUg5/z0q0Uy9lOZJodenaXnPhhpRjfau`

### Regular Users
- **Password:** `User@123`
- **Hash:** `$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u`

## 👥 User List (25 Total)

### Admin Users (3)
| ID | Display ID | Email | Password | Roles |
|----|------------|-------|----------|-------|
| 1 | USR-000001 | admin@stablecoin.com | Admin@123 | admin, super_admin |
| 4 | USR-000004 | admin2@stablecoin.com | Admin@123 | admin |
| 21 | USR-000021 | admin3@stablecoin.com | Admin@123 | admin |

### Regular Users (22)
| ID | Display ID | Email | Password | Role |
|----|------------|-------|----------|------|
| 2 | USR-000002 | user@stablecoin.com | User@123 | user |
| 3 | USR-000003 | alice@stablecoin.com | User@123 | user |
| 5 | USR-000005 | charlie@stablecoin.com | User@123 | user |
| 6 | USR-000006 | david@stablecoin.com | User@123 | user |
| 7 | USR-000007 | eve@stablecoin.com | User@123 | user (inactive) |
| 8 | USR-000008 | frank@stablecoin.com | User@123 | user (blocked) |
| 9 | USR-000009 | grace@stablecoin.com | User@123 | user |
| 10 | USR-000010 | henry@stablecoin.com | User@123 | user |
| 11 | USR-000011 | ivy@stablecoin.com | User@123 | user |
| 12 | USR-000012 | jack@stablecoin.com | User@123 | user |
| 13 | USR-000013 | kate@stablecoin.com | User@123 | user |
| 14 | USR-000014 | liam@stablecoin.com | User@123 | user |
| 15 | USR-000015 | mia@stablecoin.com | User@123 | user |
| 16 | USR-000016 | noah@stablecoin.com | User@123 | user |
| 17 | USR-000017 | olivia@stablecoin.com | User@123 | user |
| 18 | USR-000018 | paul@stablecoin.com | User@123 | user |
| 19 | USR-000019 | quinn@stablecoin.com | User@123 | user |
| 20 | USR-000020 | rachel@stablecoin.com | User@123 | user |
| 22 | USR-000022 | sam@stablecoin.com | User@123 | user |
| 23 | USR-000023 | tina@stablecoin.com | User@123 | user |
| 24 | USR-000024 | uma@stablecoin.com | User@123 | user |
| 25 | USR-000025 | victor@stablecoin.com | User@123 | user |

## 📋 Quick Reference

### Login as Admin
```bash
curl -X POST http://localhost:3001/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stablecoin.com","password":"Admin@123"}'
```

### Login as Regular User
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@stablecoin.com","password":"User@123"}'
```

## 🔄 Update All Passwords

To update all existing users in the database:

```sql
-- Update all admin/super_admin users
UPDATE users 
SET password_hash = '$2b$10$6Ou8H8yUiUabouxhAnPUBOUg5/z0q0Uy9lOZJodenaXnPhhpRjfau'
WHERE id IN (
    SELECT user_id FROM users_roles 
    WHERE role IN ('admin', 'super_admin')
);

-- Update all regular users
UPDATE users 
SET password_hash = '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u'
WHERE id NOT IN (
    SELECT user_id FROM users_roles 
    WHERE role IN ('admin', 'super_admin')
);
```

## ✅ Verification

After running `init-user.sql`, verify users:

```sql
SELECT 
    u.display_id,
    u.email,
    ur.role,
    CASE 
        WHEN u.password_hash = '$2b$10$6Ou8H8yUiUabouxhAnPUBOUg5/z0q0Uy9lOZJodenaXnPhhpRjfau' THEN 'Admin@123'
        WHEN u.password_hash = '$2b$10$b6MgrhLiVmEBgscm9yW.Ee7ZK3A4snYO9iZNgbMDVX1dA9MRmCp0u' THEN 'User@123'
        ELSE 'Unknown'
    END as password
FROM users u
LEFT JOIN users_roles ur ON u.id = ur.user_id
ORDER BY u.display_id;
```

Expected: 25 users total (3 admins, 22 regular users)
