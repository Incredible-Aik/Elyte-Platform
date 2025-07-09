-- Ghana Locations Table
-- Stores Ghana cities and regions for location validation
CREATE TABLE IF NOT EXISTS ghana_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    region VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) DEFAULT NULL,
    latitude DECIMAL(10,8) DEFAULT NULL,
    longitude DECIMAL(11,8) DEFAULT NULL,
    population INT DEFAULT NULL,
    area_code VARCHAR(10) DEFAULT NULL,
    is_capital BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_region (region),
    INDEX idx_city (city),
    INDEX idx_district (district),
    INDEX idx_location (latitude, longitude),
    INDEX idx_capital (is_capital),
    INDEX idx_active (is_active),
    UNIQUE KEY unique_region_city (region, city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;