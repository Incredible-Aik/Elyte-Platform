-- ============================================================================
-- ELYTE PLATFORM DATABASE INITIALIZATION
-- Ghana's Premier Ride-Sharing Platform
-- ============================================================================

-- Create database if it doesn't exist
-- Note: This should be run by a superuser
-- CREATE DATABASE elyte_platform;

-- Connect to the database
\c elyte_platform;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for location data
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    profile_image_url VARCHAR(500),
    
    -- Address information
    city VARCHAR(100),
    address TEXT,
    
    -- Account status
    is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, suspended, banned
    
    -- Verification
    verification_otp VARCHAR(10),
    otp_expires_at TIMESTAMP,
    reset_password_otp VARCHAR(10),
    reset_otp_expires_at TIMESTAMP,
    
    -- Payment preferences
    mobile_money_provider VARCHAR(50), -- mtn, vodafone, airteltigo
    mobile_money_number VARCHAR(20),
    
    -- Preferences
    preferred_language VARCHAR(10) DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{"sms": true, "email": true, "push": true}',
    
    -- Tracking
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DRIVERS TABLE
-- ============================================================================

CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    profile_image_url VARCHAR(500),
    
    -- Address information
    city VARCHAR(100) NOT NULL,
    address TEXT,
    
    -- Account status
    is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, suspended, banned, offline
    approval_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    
    -- Verification
    verification_otp VARCHAR(10),
    otp_expires_at TIMESTAMP,
    reset_password_otp VARCHAR(10),
    reset_otp_expires_at TIMESTAMP,
    
    -- Driver-specific information
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_expiry_date DATE NOT NULL,
    license_image_url VARCHAR(500),
    
    -- Vehicle information
    vehicle_make VARCHAR(50) NOT NULL,
    vehicle_model VARCHAR(50) NOT NULL,
    vehicle_year INTEGER NOT NULL,
    vehicle_color VARCHAR(30) NOT NULL,
    vehicle_plate_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_registration_url VARCHAR(500),
    vehicle_insurance_url VARCHAR(500),
    vehicle_inspection_url VARCHAR(500),
    
    -- Documents
    national_id_number VARCHAR(50),
    national_id_image_url VARCHAR(500),
    background_check_status VARCHAR(20) DEFAULT 'pending',
    background_check_date TIMESTAMP,
    
    -- Ratings and performance
    rating DECIMAL(3,2) DEFAULT 0,
    total_rides INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    
    -- Current location and availability
    current_latitude DECIMAL(10,8),
    current_longitude DECIMAL(11,8),
    current_location GEOGRAPHY(POINT,4326),
    is_available BOOLEAN DEFAULT FALSE,
    is_on_trip BOOLEAN DEFAULT FALSE,
    
    -- Payment preferences
    mobile_money_provider VARCHAR(50),
    mobile_money_number VARCHAR(20),
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(100),
    
    -- Emergency contact
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    
    -- Preferences
    preferred_language VARCHAR(10) DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{"sms": true, "email": true, "push": true}',
    
    -- Tracking
    last_login_at TIMESTAMP,
    last_location_update TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ADMINS TABLE
-- ============================================================================

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    profile_image_url VARCHAR(500),
    
    -- Admin role and permissions
    role VARCHAR(50) DEFAULT 'admin', -- admin, super_admin, moderator
    permissions JSONB DEFAULT '[]',
    
    -- Account status
    is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, suspended
    
    -- Verification
    verification_otp VARCHAR(10),
    otp_expires_at TIMESTAMP,
    reset_password_otp VARCHAR(10),
    reset_otp_expires_at TIMESTAMP,
    
    -- Organization
    organization VARCHAR(100),
    department VARCHAR(100),
    
    -- Preferences
    preferred_language VARCHAR(10) DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{"sms": true, "email": true}',
    
    -- Tracking
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- RIDES TABLE
-- ============================================================================

CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Parties involved
    passenger_id UUID REFERENCES users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    
    -- Trip details
    pickup_address TEXT NOT NULL,
    pickup_latitude DECIMAL(10,8) NOT NULL,
    pickup_longitude DECIMAL(11,8) NOT NULL,
    pickup_location GEOGRAPHY(POINT,4326) NOT NULL,
    
    destination_address TEXT NOT NULL,
    destination_latitude DECIMAL(10,8) NOT NULL,
    destination_longitude DECIMAL(11,8) NOT NULL,
    destination_location GEOGRAPHY(POINT,4326) NOT NULL,
    
    -- Ride status and timing
    status VARCHAR(20) DEFAULT 'requested', -- requested, accepted, in_progress, completed, cancelled
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    pickup_time TIMESTAMP,
    dropoff_time TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    cancelled_by VARCHAR(20), -- passenger, driver, system
    
    -- Distance and duration
    estimated_distance DECIMAL(8,2), -- in kilometers
    actual_distance DECIMAL(8,2),
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER,
    
    -- Pricing
    base_fare DECIMAL(8,2) NOT NULL,
    distance_fare DECIMAL(8,2) DEFAULT 0,
    time_fare DECIMAL(8,2) DEFAULT 0,
    surge_multiplier DECIMAL(3,2) DEFAULT 1.0,
    total_fare DECIMAL(8,2) NOT NULL,
    
    -- Payment
    payment_method VARCHAR(50), -- mobile_money, cash, card
    payment_provider VARCHAR(50), -- mtn, vodafone, airteltigo
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
    payment_reference VARCHAR(100),
    payment_completed_at TIMESTAMP,
    
    -- Ratings and feedback
    passenger_rating INTEGER CHECK (passenger_rating >= 1 AND passenger_rating <= 5),
    driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
    passenger_feedback TEXT,
    driver_feedback TEXT,
    
    -- Special requests
    special_requests TEXT,
    vehicle_type VARCHAR(50) DEFAULT 'standard',
    
    -- Route tracking
    route_data JSONB, -- Store GPS coordinates during trip
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Transaction details
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    
    -- Payment information
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GHS',
    payment_method VARCHAR(50) NOT NULL, -- mobile_money, cash, card
    payment_provider VARCHAR(50), -- mtn, vodafone, airteltigo, cash
    
    -- Mobile money details
    mobile_money_number VARCHAR(20),
    mobile_money_reference VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed, refunded, cancelled
    
    -- Timestamps
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    
    -- Response data from payment provider
    provider_response JSONB,
    
    -- Fees and commissions
    platform_fee DECIMAL(10,2) DEFAULT 0,
    driver_earning DECIMAL(10,2),
    
    -- Metadata
    description TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DRIVER LOCATIONS TABLE (for real-time tracking)
-- ============================================================================

CREATE TABLE driver_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    
    -- Location data
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    location GEOGRAPHY(POINT,4326) NOT NULL,
    accuracy DECIMAL(6,2), -- GPS accuracy in meters
    heading INTEGER, -- direction in degrees
    speed DECIMAL(6,2), -- speed in km/h
    
    -- Status
    is_available BOOLEAN DEFAULT TRUE,
    is_on_trip BOOLEAN DEFAULT FALSE,
    current_ride_id UUID REFERENCES rides(id),
    
    -- Timestamps
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index for efficient queries
    CONSTRAINT unique_driver_location UNIQUE (driver_id, recorded_at)
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Recipient
    user_id UUID, -- Can reference users, drivers, or admins
    user_type VARCHAR(20) NOT NULL, -- passenger, driver, admin
    
    -- Notification details
    type VARCHAR(50) NOT NULL, -- ride_request, ride_accepted, payment_completed, etc.
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Delivery channels
    channels JSONB DEFAULT '["app"]', -- app, sms, email, push
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed
    is_read BOOLEAN DEFAULT FALSE,
    
    -- Related entities
    related_ride_id UUID REFERENCES rides(id),
    related_payment_id UUID REFERENCES payments(id),
    
    -- Delivery tracking
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- USSD SESSIONS TABLE
-- ============================================================================

CREATE TABLE ussd_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Session details
    session_id VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    service_code VARCHAR(20) NOT NULL,
    
    -- User context
    user_id UUID REFERENCES users(id),
    step VARCHAR(50) DEFAULT 'main_menu',
    context JSONB DEFAULT '{}',
    
    -- Session status
    status VARCHAR(20) DEFAULT 'active', -- active, completed, expired
    
    -- Current operation
    current_operation VARCHAR(50), -- book_ride, check_balance, check_status
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Expiry (USSD sessions typically expire quickly)
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes')
);

-- ============================================================================
-- SYSTEM SETTINGS TABLE
-- ============================================================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_city ON users(city);

-- Drivers table indexes
CREATE INDEX idx_drivers_email ON drivers(email);
CREATE INDEX idx_drivers_phone ON drivers(phone);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_city ON drivers(city);
CREATE INDEX idx_drivers_available ON drivers(is_available);
CREATE INDEX idx_drivers_location ON drivers USING GIST(current_location);
CREATE INDEX idx_drivers_license ON drivers(license_number);
CREATE INDEX idx_drivers_plate ON drivers(vehicle_plate_number);

-- Admins table indexes
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_phone ON admins(phone);
CREATE INDEX idx_admins_role ON admins(role);

-- Rides table indexes
CREATE INDEX idx_rides_passenger ON rides(passenger_id);
CREATE INDEX idx_rides_driver ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_created_at ON rides(created_at);
CREATE INDEX idx_rides_pickup_location ON rides USING GIST(pickup_location);
CREATE INDEX idx_rides_destination_location ON rides USING GIST(destination_location);

-- Payments table indexes
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_ride_id ON payments(ride_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_driver_id ON payments(driver_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Driver locations indexes
CREATE INDEX idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX idx_driver_locations_location ON driver_locations USING GIST(location);
CREATE INDEX idx_driver_locations_recorded_at ON driver_locations(recorded_at);
CREATE INDEX idx_driver_locations_available ON driver_locations(is_available);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_type ON notifications(user_type);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- USSD sessions indexes
CREATE INDEX idx_ussd_sessions_session_id ON ussd_sessions(session_id);
CREATE INDEX idx_ussd_sessions_phone ON ussd_sessions(phone_number);
CREATE INDEX idx_ussd_sessions_status ON ussd_sessions(status);
CREATE INDEX idx_ussd_sessions_expires_at ON ussd_sessions(expires_at);

-- System settings indexes
CREATE INDEX idx_system_settings_key ON system_settings(key);
CREATE INDEX idx_system_settings_category ON system_settings(category);

-- ============================================================================
-- CREATE TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INSERT INITIAL SYSTEM SETTINGS
-- ============================================================================

INSERT INTO system_settings (key, value, description, category) VALUES
-- Pricing settings
('base_fare', '{"amount": 3.00, "currency": "GHS"}', 'Base fare for rides', 'pricing'),
('distance_rate', '{"amount": 1.50, "currency": "GHS", "unit": "km"}', 'Rate per kilometer', 'pricing'),
('time_rate', '{"amount": 0.25, "currency": "GHS", "unit": "minute"}', 'Rate per minute', 'pricing'),
('platform_fee_percentage', '{"percentage": 15}', 'Platform commission percentage', 'pricing'),
('surge_pricing_enabled', 'true', 'Enable surge pricing during high demand', 'pricing'),

-- Mobile money settings
('mobile_money_providers', '["mtn", "vodafone", "airteltigo"]', 'Supported mobile money providers', 'payment'),
('mtn_api_config', '{"enabled": true, "environment": "sandbox"}', 'MTN Mobile Money API configuration', 'payment'),
('vodafone_api_config', '{"enabled": true, "environment": "sandbox"}', 'Vodafone Cash API configuration', 'payment'),
('airteltigo_api_config', '{"enabled": true, "environment": "sandbox"}', 'AirtelTigo Money API configuration', 'payment'),

-- USSD settings
('ussd_code', '"*920*123#"', 'USSD code for service access', 'ussd'),
('ussd_enabled', 'true', 'Enable USSD service', 'ussd'),
('ussd_session_timeout', '{"minutes": 5}', 'USSD session timeout', 'ussd'),

-- Geographic settings
('supported_cities', '["Accra", "Kumasi", "Tamale", "Cape Coast", "Sekondi-Takoradi", "Sunyani", "Koforidua", "Ho", "Bolgatanga", "Wa"]', 'Cities where service is available', 'geographic'),
('default_currency', '"GHS"', 'Default currency for the platform', 'general'),
('default_language', '"en"', 'Default language for the platform', 'general'),
('timezone', '"GMT"', 'Application timezone', 'general'),

-- Business rules
('max_ride_distance', '{"km": 100}', 'Maximum distance for a single ride', 'business'),
('driver_rating_threshold', '{"minimum": 3.0}', 'Minimum driver rating to stay active', 'business'),
('passenger_rating_threshold', '{"minimum": 2.0}', 'Minimum passenger rating', 'business'),
('cancellation_fee', '{"amount": 2.00, "currency": "GHS", "after_minutes": 5}', 'Cancellation fee settings', 'business');

-- ============================================================================
-- CREATE VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active drivers view
CREATE VIEW active_drivers AS
SELECT 
    d.*,
    ST_Y(d.current_location) as current_latitude,
    ST_X(d.current_location) as current_longitude
FROM drivers d
WHERE d.status = 'active' 
    AND d.is_verified = TRUE 
    AND d.approval_status = 'approved';

-- Recent rides view
CREATE VIEW recent_rides AS
SELECT 
    r.*,
    u.first_name as passenger_first_name,
    u.last_name as passenger_last_name,
    u.phone as passenger_phone,
    d.first_name as driver_first_name,
    d.last_name as driver_last_name,
    d.phone as driver_phone,
    d.vehicle_make,
    d.vehicle_model,
    d.vehicle_plate_number
FROM rides r
LEFT JOIN users u ON r.passenger_id = u.id
LEFT JOIN drivers d ON r.driver_id = d.id
ORDER BY r.created_at DESC;

-- Payment summary view
CREATE VIEW payment_summary AS
SELECT 
    p.*,
    r.pickup_address,
    r.destination_address,
    u.first_name as passenger_name,
    d.first_name as driver_name
FROM payments p
LEFT JOIN rides r ON p.ride_id = r.id
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN drivers d ON p.driver_id = d.id;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Create application user (should be done by DBA in production)
-- CREATE USER elyte_app WITH PASSWORD 'secure_password';
-- GRANT CONNECT ON DATABASE elyte_platform TO elyte_app;
-- GRANT USAGE ON SCHEMA public TO elyte_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO elyte_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO elyte_app;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Elyte Platform database initialization completed successfully!';
    RAISE NOTICE 'Tables created: %, %, %, %, %, %, %, %, %', 
        'users', 'drivers', 'admins', 'rides', 'payments', 
        'driver_locations', 'notifications', 'ussd_sessions', 'system_settings';
    RAISE NOTICE 'Views created: %, %, %', 
        'active_drivers', 'recent_rides', 'payment_summary';
    RAISE NOTICE 'Database is ready for Ghana ride-sharing operations!';
END $$;