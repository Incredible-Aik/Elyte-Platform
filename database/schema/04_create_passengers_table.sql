-- Passengers Table
-- Stores passenger-specific information and preferences
CREATE TABLE IF NOT EXISTS passengers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    preferred_payment_method ENUM('cash', 'mobile_money', 'card') DEFAULT 'cash',
    emergency_contact_name VARCHAR(100) DEFAULT NULL,
    emergency_contact_phone VARCHAR(20) DEFAULT NULL,
    home_address TEXT DEFAULT NULL,
    work_address TEXT DEFAULT NULL,
    home_latitude DECIMAL(10,8) DEFAULT NULL,
    home_longitude DECIMAL(11,8) DEFAULT NULL,
    work_latitude DECIMAL(10,8) DEFAULT NULL,
    work_longitude DECIMAL(11,8) DEFAULT NULL,
    passenger_rating DECIMAL(3,2) DEFAULT 0.00,
    total_trips INT DEFAULT 0,
    preferred_vehicle_type ENUM('car', 'motorcycle', 'tricycle', 'bus') DEFAULT NULL,
    accessibility_needs TEXT DEFAULT NULL,
    language_preference VARCHAR(10) DEFAULT 'en',
    notification_preferences JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_payment_method (preferred_payment_method),
    INDEX idx_rating (passenger_rating),
    INDEX idx_vehicle_preference (preferred_vehicle_type),
    INDEX idx_home_location (home_latitude, home_longitude),
    INDEX idx_work_location (work_latitude, work_longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;