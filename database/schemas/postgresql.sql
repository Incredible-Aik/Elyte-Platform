-- Elyte Platform Database Schema (PostgreSQL Version)
-- This file shows the equivalent PostgreSQL schema for reference

-- Users table (passengers and drivers)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) DEFAULT 'passenger' CHECK (user_type IN ('passenger', 'driver')),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(6),
    verification_code_expires TIMESTAMP,
    reset_password_code VARCHAR(6),
    reset_password_expires TIMESTAMP,
    
    -- Profile information
    profile_picture VARCHAR(255),
    date_of_birth DATE,
    
    -- Driver-specific fields
    driver_license VARCHAR(50),
    vehicle_registration VARCHAR(50),
    vehicle_make VARCHAR(50),
    vehicle_model VARCHAR(50),
    vehicle_year INTEGER,
    vehicle_color VARCHAR(30),
    vehicle_license_plate VARCHAR(20),
    is_driver_approved BOOLEAN DEFAULT FALSE,
    
    -- Location (for drivers)
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    is_online BOOLEAN DEFAULT FALSE,
    
    -- Ratings and statistics
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,
    rating_sum INTEGER DEFAULT 0,
    total_earnings DECIMAL(10, 2) DEFAULT 0.00,
    today_earnings DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Activity tracking
    last_login TIMESTAMP,
    last_location_update TIMESTAMP,
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rides table
CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passenger_id UUID NOT NULL REFERENCES users(id),
    driver_id UUID REFERENCES users(id),
    
    -- Location details
    pickup_address TEXT NOT NULL,
    pickup_latitude DECIMAL(10, 8),
    pickup_longitude DECIMAL(11, 8),
    pickup_landmark VARCHAR(255),
    
    destination_address TEXT NOT NULL,
    destination_latitude DECIMAL(10, 8),
    destination_longitude DECIMAL(11, 8),
    destination_landmark VARCHAR(255),
    
    -- Ride details
    ride_type VARCHAR(20) NOT NULL CHECK (ride_type IN ('standard', 'premium', 'shared')),
    
    -- Pricing
    estimated_fare DECIMAL(8, 2) NOT NULL,
    actual_fare DECIMAL(8, 2),
    base_fare DECIMAL(8, 2),
    distance_fare DECIMAL(8, 2),
    time_fare DECIMAL(8, 2),
    additional_charges DECIMAL(8, 2) DEFAULT 0.00,
    
    -- Distance and time
    estimated_distance DECIMAL(8, 2) NOT NULL, -- in kilometers
    actual_distance DECIMAL(8, 2),
    estimated_duration INTEGER NOT NULL, -- in minutes
    actual_duration INTEGER,
    
    -- Payment
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'mobile-money', 'card')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_reference VARCHAR(100),
    
    -- Ride status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'driver_assigned', 'driver_arriving', 'driver_arrived', 
        'in_progress', 'completed', 'cancelled'
    )),
    
    -- Timing
    scheduled_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    driver_assigned_at TIMESTAMP,
    driver_arrived_at TIMESTAMP,
    ride_started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    -- Cancellation
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,
    
    -- Ratings and reviews
    passenger_rating INTEGER CHECK (passenger_rating BETWEEN 1 AND 5),
    driver_rating INTEGER CHECK (driver_rating BETWEEN 1 AND 5),
    passenger_comment TEXT,
    driver_comment TEXT,
    
    -- Special requirements
    special_requests TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Driver documents table
CREATE TABLE driver_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES users(id),
    document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('license', 'registration', 'insurance', 'roadworthy')),
    document_url VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    notes TEXT
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES rides(id),
    user_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_reference VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    gateway_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ride route tracking (for GPS tracking)
CREATE TABLE ride_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES rides(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    speed DECIMAL(5, 2), -- km/h
    heading DECIMAL(5, 2) -- degrees
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USSD sessions table
CREATE TABLE ussd_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(15) NOT NULL,
    current_step INTEGER DEFAULT 0,
    session_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes')
);

-- Indexes for better performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_type_online ON users(user_type, is_online);
CREATE INDEX idx_users_location ON users(current_latitude, current_longitude);
CREATE INDEX idx_rides_passenger ON rides(passenger_id, created_at DESC);
CREATE INDEX idx_rides_driver ON rides(driver_id, created_at DESC);
CREATE INDEX idx_rides_status ON rides(status, created_at DESC);
CREATE INDEX idx_rides_pickup_location ON rides(pickup_latitude, pickup_longitude);
CREATE INDEX idx_payments_ride ON payments(ride_id);
CREATE INDEX idx_payments_user ON payments(user_id, created_at DESC);
CREATE INDEX idx_route_ride ON ride_routes(ride_id, timestamp);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_ussd_sessions_phone ON ussd_sessions(phone_number);
CREATE INDEX idx_ussd_sessions_expires ON ussd_sessions(expires_at);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ussd_sessions_updated_at BEFORE UPDATE ON ussd_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();