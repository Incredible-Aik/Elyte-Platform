-- Admin Roles Seed Data
-- Creates default admin user and roles

-- Insert default super admin user
INSERT INTO users (
  uuid, 
  email, 
  phone, 
  password_hash, 
  first_name, 
  last_name, 
  user_type, 
  is_verified, 
  email_verified, 
  phone_verified, 
  is_active
) VALUES (
  UUID(),
  'admin@elyteplatform.com',
  '+233200000001',
  '$2b$12$LQv3c1yqBwEHFaxkdO8Mie2/WcPhfJFrqYGjr5H1K8L7H7H7H7H7H', -- password: admin123!
  'System',
  'Administrator',
  'admin',
  true,
  true,
  true,
  true
);

-- Get the admin user ID
SET @admin_user_id = LAST_INSERT_ID();

-- Insert admin record with full permissions
INSERT INTO admins (
  user_id,
  role,
  department,
  permissions,
  two_factor_enabled,
  can_approve_drivers,
  can_manage_users,
  can_view_reports,
  can_manage_system
) VALUES (
  @admin_user_id,
  'super_admin',
  'System Administration',
  JSON_OBJECT(
    'user_management', true,
    'driver_approval', true,
    'system_settings', true,
    'reports', true,
    'audit_logs', true,
    'financial_management', true,
    'emergency_access', true
  ),
  true,
  true,
  true,
  true,
  true
);

-- Insert default support user
INSERT INTO users (
  uuid, 
  email, 
  phone, 
  password_hash, 
  first_name, 
  last_name, 
  user_type, 
  is_verified, 
  email_verified, 
  phone_verified, 
  is_active
) VALUES (
  UUID(),
  'support@elyteplatform.com',
  '+233200000002',
  '$2b$12$LQv3c1yqBwEHFaxkdO8Mie2/WcPhfJFrqYGjr5H1K8L7H7H7H7H7H', -- password: support123!
  'Customer',
  'Support',
  'admin',
  true,
  true,
  true,
  true
);

-- Get the support user ID
SET @support_user_id = LAST_INSERT_ID();

-- Insert support admin record
INSERT INTO admins (
  user_id,
  role,
  department,
  permissions,
  two_factor_enabled,
  can_approve_drivers,
  can_manage_users,
  can_view_reports,
  can_manage_system,
  created_by
) VALUES (
  @support_user_id,
  'support',
  'Customer Support',
  JSON_OBJECT(
    'user_support', true,
    'driver_support', true,
    'basic_reports', true,
    'verification_assistance', true
  ),
  false,
  false,
  false,
  true,
  false,
  @admin_user_id
);