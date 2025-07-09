-- Driver Documents Table
-- Stores driver document information and verification status
CREATE TABLE IF NOT EXISTS driver_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    document_type ENUM('license', 'insurance', 'vehicle_registration', 'roadworthy_certificate', 'id_card', 'passport') NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    verified_by INT DEFAULT NULL,
    verification_notes TEXT DEFAULT NULL,
    expiry_date DATE DEFAULT NULL,
    is_expired BOOLEAN GENERATED ALWAYS AS (expiry_date < CURDATE()) STORED,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_driver_id (driver_id),
    INDEX idx_document_type (document_type),
    INDEX idx_document_number (document_number),
    INDEX idx_verification_status (verification_status),
    INDEX idx_verified_by (verified_by),
    INDEX idx_expiry (expiry_date, is_expired),
    INDEX idx_uploaded_at (uploaded_at),
    UNIQUE KEY unique_driver_document (driver_id, document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;