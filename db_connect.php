<?php
/**
 * Database Connection Handler
 * 
 * Provides a secure PDO connection to MySQL database
 */

require_once 'db_config.php';

class DatabaseConnection {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];
            
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
            
            if (DEBUG_MODE) {
                error_log("Database connection established successfully");
            }
            
        } catch (PDOException $e) {
            $error_message = "Database connection failed: " . $e->getMessage();
            error_log($error_message);
            
            if (DEBUG_MODE) {
                throw new Exception($error_message);
            } else {
                throw new Exception("Database connection failed");
            }
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function testConnection() {
        try {
            $stmt = $this->connection->query("SELECT 1");
            return $stmt !== false;
        } catch (PDOException $e) {
            error_log("Database test connection failed: " . $e->getMessage());
            return false;
        }
    }
    
    // Prevent cloning and unserialization
    private function __clone() {}
    public function __wakeup() {}
}

// Initialize database tables if they don't exist
function initializeTables() {
    try {
        $db = DatabaseConnection::getInstance()->getConnection();
        
        // Users table
        $usersTable = "
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                wallet_address VARCHAR(100),
                btc_balance DECIMAL(16,8) DEFAULT 0.00000000,
                usd_balance DECIMAL(12,2) DEFAULT 0.00,
                withdrawal_timer TIMESTAMP NULL,
                airtable_record_id VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                last_login TIMESTAMP NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        // BTC conversions table
        $conversionsTable = "
            CREATE TABLE IF NOT EXISTS btc_conversions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                btc_amount DECIMAL(16,8) NOT NULL,
                converted_amount DECIMAL(12,2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'USD',
                conversion_rate DECIMAL(12,2) NOT NULL,
                transaction_type ENUM('buy', 'sell', 'convert') DEFAULT 'convert',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        // Transactions table
        $transactionsTable = "
            CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                transaction_hash VARCHAR(64),
                transaction_type ENUM('deposit', 'withdrawal', 'internal') NOT NULL,
                amount DECIMAL(16,8) NOT NULL,
                fee DECIMAL(16,8) DEFAULT 0.00000000,
                from_address VARCHAR(100),
                to_address VARCHAR(100),
                confirmations INT DEFAULT 0,
                status ENUM('pending', 'confirmed', 'failed') DEFAULT 'pending',
                blockchain_data JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                confirmed_at TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_transaction_hash (transaction_hash),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        // Market data table
        $marketDataTable = "
            CREATE TABLE IF NOT EXISTS market_data (
                id INT AUTO_INCREMENT PRIMARY KEY,
                symbol VARCHAR(10) NOT NULL,
                price DECIMAL(12,2) NOT NULL,
                price_change_24h DECIMAL(8,4),
                price_change_percentage_24h DECIMAL(6,2),
                high_24h DECIMAL(12,2),
                low_24h DECIMAL(12,2),
                volume_24h DECIMAL(20,2),
                market_cap DECIMAL(20,2),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_symbol (symbol)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        // System logs table
        $logsTable = "
            CREATE TABLE IF NOT EXISTS system_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                log_level ENUM('info', 'warning', 'error', 'debug') DEFAULT 'info',
                message TEXT NOT NULL,
                context JSON,
                user_id INT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_log_level (log_level),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        // Execute table creation
        $db->exec($usersTable);
        $db->exec($conversionsTable);
        $db->exec($transactionsTable);
        $db->exec($marketDataTable);
        $db->exec($logsTable);
        
        if (DEBUG_MODE) {
            error_log("Database tables initialized successfully");
        }
        
        return true;
        
    } catch (PDOException $e) {
        error_log("Failed to initialize database tables: " . $e->getMessage());
        return false;
    }
}

// Auto-initialize tables on first include
if (!defined('SKIP_TABLE_INIT')) {
    initializeTables();
}

?>