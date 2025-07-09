-- Mobile Money Accounts Table
-- Stores Ghana mobile money provider information
CREATE TABLE IF NOT EXISTS mobile_money_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    provider ENUM('mtn', 'vodafone', 'airteltigo') NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(10) DEFAULT NULL,
    verification_expires_at TIMESTAMP NULL,
    last_transaction_at TIMESTAMP NULL,
    total_transactions INT DEFAULT 0,
    account_balance DECIMAL(10,2) DEFAULT 0.00,
    daily_limit DECIMAL(10,2) DEFAULT 2000.00,
    monthly_limit DECIMAL(10,2) DEFAULT 20000.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_provider (provider),
    INDEX idx_phone_number (phone_number),
    INDEX idx_primary (is_primary),
    INDEX idx_verified (is_verified),
    INDEX idx_active (is_active),
    INDEX idx_verification_expires (verification_expires_at),
    UNIQUE KEY unique_user_provider_phone (user_id, provider, phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;