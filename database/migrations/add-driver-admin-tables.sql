-- Driver and Admin Tables Migration for Elyte Platform
-- Created: 2024-01-XX
-- Description: Creates all necessary tables for driver and admin management

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================
-- DRIVERS TABLES
-- ===========================

-- Main drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    street_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    profile_photo_path TEXT,
    status VARCHAR(50) DEFAULT 'pending_verification' CHECK (status IN (
        'pending_verification', 'verified', 'active', 'suspended', 'rejected', 'inactive'
    )),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver licenses table
CREATE TABLE IF NOT EXISTS driver_licenses (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_class VARCHAR(5) NOT NULL CHECK (license_class IN ('A', 'B', 'C', 'D')),
    expiry_date DATE NOT NULL,
    document_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver vehicles table
CREATE TABLE IF NOT EXISTS driver_vehicles (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= EXTRACT(YEAR FROM NOW())),
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    color VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle photos table
CREATE TABLE IF NOT EXISTS vehicle_photos (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES driver_vehicles(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver insurance table
CREATE TABLE IF NOT EXISTS driver_insurance (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL,
    policy_number VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    document_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver mobile money table
CREATE TABLE IF NOT EXISTS driver_mobile_money (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('MTN', 'Vodafone', 'AirtelTigo')),
    phone_number VARCHAR(20) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver emergency contacts table
CREATE TABLE IF NOT EXISTS driver_emergency_contacts (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(50) NOT NULL CHECK (relationship IN ('Parent', 'Spouse', 'Sibling', 'Friend', 'Other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver work availability table
CREATE TABLE IF NOT EXISTS driver_work_availability (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    working_days JSONB NOT NULL, -- Array of days: ["Monday", "Tuesday", ...]
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- ADMINS TABLES
-- ===========================

-- Main admins table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'super-admin', 'operations-manager', 'fleet-manager', 'customer-service',
        'finance-manager', 'compliance-officer', 'support-staff'
    )),
    department VARCHAR(50) NOT NULL CHECK (department IN (
        'operations', 'fleet-management', 'customer-service', 'finance',
        'compliance', 'hr', 'it', 'marketing'
    )),
    area_of_responsibility TEXT NOT NULL,
    security_clearance VARCHAR(20) NOT NULL CHECK (security_clearance IN (
        'level-1', 'level-2', 'level-3', 'level-4', 'level-5'
    )),
    work_location VARCHAR(50) NOT NULL CHECK (work_location IN (
        'accra-hq', 'kumasi-office', 'tamale-office', 'takoradi-office', 'remote', 'field-operations'
    )),
    start_date DATE NOT NULL,
    password_hash TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_manager_approval' CHECK (status IN (
        'pending_manager_approval', 'pending_verification', 'approved', 'active', 
        'suspended', 'rejected', 'inactive'
    )),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(255),
    approved_by INTEGER REFERENCES admins(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_by INTEGER REFERENCES admins(id),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin reporting managers table
CREATE TABLE IF NOT EXISTS admin_reporting_managers (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
    manager_name VARCHAR(100) NOT NULL,
    manager_email VARCHAR(255) NOT NULL,
    manager_phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin two-factor authentication table
CREATE TABLE IF NOT EXISTS admin_two_factor_auth (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
    method VARCHAR(20) NOT NULL CHECK (method IN ('sms', 'email', 'authenticator', 'hardware-token')),
    enabled BOOLEAN DEFAULT FALSE,
    secret TEXT,
    backup_codes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin security questions table
CREATE TABLE IF NOT EXISTS admin_security_questions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
    question VARCHAR(100) NOT NULL,
    answer_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin emergency contacts table
CREATE TABLE IF NOT EXISTS admin_emergency_contacts (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(50) NOT NULL CHECK (relationship IN ('spouse', 'parent', 'sibling', 'child', 'friend', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin access permissions table
CREATE TABLE IF NOT EXISTS admin_access_permissions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
    system_access JSONB NOT NULL, -- Array of system permissions
    data_access JSONB NOT NULL,   -- Array of data permissions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin documents table
CREATE TABLE IF NOT EXISTS admin_documents (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
    profile_photo_path TEXT,
    identification_path TEXT,
    education_path TEXT,
    resume_path TEXT,
    references_paths JSONB, -- Array of reference document paths
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin approval logs table
CREATE TABLE IF NOT EXISTS admin_approval_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
    approved_by INTEGER REFERENCES admins(id),
    action VARCHAR(20) NOT NULL CHECK (action IN ('approved', 'rejected', 'suspended', 'reactivated')),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- INDEXES FOR PERFORMANCE
-- ===========================

-- Driver indexes
CREATE INDEX IF NOT EXISTS idx_drivers_email ON drivers(email);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_city_region ON drivers(city, region);
CREATE INDEX IF NOT EXISTS idx_drivers_created_at ON drivers(created_at);
CREATE INDEX IF NOT EXISTS idx_driver_licenses_number ON driver_licenses(license_number);
CREATE INDEX IF NOT EXISTS idx_driver_vehicles_plate ON driver_vehicles(license_plate);

-- Admin indexes
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_employee_id ON admins(employee_id);
CREATE INDEX IF NOT EXISTS idx_admins_status ON admins(status);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_department ON admins(department);
CREATE INDEX IF NOT EXISTS idx_admins_created_at ON admins(created_at);

-- ===========================
-- SAMPLE DATA (OPTIONAL)
-- ===========================

-- Insert sample Ghana regions and cities (for reference)
CREATE TABLE IF NOT EXISTS ghana_regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    capital VARCHAR(100) NOT NULL
);

INSERT INTO ghana_regions (name, capital) VALUES
('Greater Accra', 'Accra'),
('Ashanti', 'Kumasi'),
('Northern', 'Tamale'),
('Western', 'Takoradi'),
('Central', 'Cape Coast'),
('Eastern', 'Koforidua'),
('Volta', 'Ho'),
('Brong Ahafo', 'Sunyani'),
('Upper East', 'Bolgatanga'),
('Upper West', 'Wa')
ON CONFLICT (name) DO NOTHING;

-- Create Ghana cities table
CREATE TABLE IF NOT EXISTS ghana_cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    region_id INTEGER REFERENCES ghana_regions(id),
    is_capital BOOLEAN DEFAULT FALSE
);

-- Insert sample cities
INSERT INTO ghana_cities (name, region_id, is_capital) VALUES
-- Greater Accra cities
('Accra', 1, TRUE),
('Tema', 1, FALSE),
('Kasoa', 1, FALSE),
('Madina', 1, FALSE),
('Adenta', 1, FALSE),
('Teshie', 1, FALSE),
('Nungua', 1, FALSE),

-- Ashanti cities
('Kumasi', 2, TRUE),
('Obuasi', 2, FALSE),
('Ejisu', 2, FALSE),
('Mampong', 2, FALSE),
('Konongo', 2, FALSE),
('Bekwai', 2, FALSE),

-- Northern cities
('Tamale', 3, TRUE),
('Yendi', 3, FALSE),
('Gushegu', 3, FALSE),
('Karaga', 3, FALSE),
('Kumbungu', 3, FALSE),
('Sagnarigu', 3, FALSE)

ON CONFLICT DO NOTHING;

-- ===========================
-- FUNCTIONS AND TRIGGERS
-- ===========================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_licenses_updated_at BEFORE UPDATE ON driver_licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_vehicles_updated_at BEFORE UPDATE ON driver_vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_insurance_updated_at BEFORE UPDATE ON driver_insurance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_mobile_money_updated_at BEFORE UPDATE ON driver_mobile_money
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_emergency_contacts_updated_at BEFORE UPDATE ON driver_emergency_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_work_availability_updated_at BEFORE UPDATE ON driver_work_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_reporting_managers_updated_at BEFORE UPDATE ON admin_reporting_managers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_two_factor_auth_updated_at BEFORE UPDATE ON admin_two_factor_auth
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_emergency_contacts_updated_at BEFORE UPDATE ON admin_emergency_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_access_permissions_updated_at BEFORE UPDATE ON admin_access_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_documents_updated_at BEFORE UPDATE ON admin_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- VIEWS FOR COMMON QUERIES
-- ===========================

-- Driver overview view
CREATE OR REPLACE VIEW driver_overview AS
SELECT 
    d.id,
    d.first_name,
    d.last_name,
    d.email,
    d.phone,
    d.city,
    d.region,
    d.status,
    d.email_verified,
    d.phone_verified,
    d.created_at,
    dl.license_number,
    dl.license_class,
    dl.expiry_date as license_expiry,
    dv.make,
    dv.model,
    dv.year,
    dv.license_plate,
    dmm.provider as mobile_money_provider
FROM drivers d
LEFT JOIN driver_licenses dl ON d.id = dl.driver_id
LEFT JOIN driver_vehicles dv ON d.id = dv.driver_id
LEFT JOIN driver_mobile_money dmm ON d.id = dmm.driver_id;

-- Admin overview view
CREATE OR REPLACE VIEW admin_overview AS
SELECT 
    a.id,
    a.first_name,
    a.last_name,
    a.email,
    a.phone,
    a.employee_id,
    a.role,
    a.department,
    a.security_clearance,
    a.work_location,
    a.status,
    a.email_verified,
    a.phone_verified,
    a.created_at,
    arm.manager_name,
    arm.manager_email
FROM admins a
LEFT JOIN admin_reporting_managers arm ON a.id = arm.admin_id;

-- Migration completed successfully
SELECT 'Driver and Admin tables migration completed successfully!' as status;