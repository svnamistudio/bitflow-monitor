<?php
/**
 * Database Configuration
 * 
 * Edit these values to match your MySQL database settings
 */

// Database connection settings
define('DB_HOST', 'localhost');          // Database host (usually localhost)
define('DB_NAME', 'bitcoin_dashboard');   // Database name
define('DB_USER', 'your_username');       // Database username
define('DB_PASS', 'your_password');       // Database password
define('DB_CHARSET', 'utf8mb4');          // Database charset

// API Configuration
define('AIRTABLE_API_KEY', 'your_airtable_api_key');
define('AIRTABLE_BASE_ID', 'your_airtable_base_id');
define('BLOCKCYPHER_API_KEY', 'your_blockcypher_api_key');

// Electrum Server Configuration
define('ELECTRUM_HOST', 'localhost');
define('ELECTRUM_PORT', 7777);
define('ELECTRUM_USER', 'electrum_user');
define('ELECTRUM_PASS', 'electrum_password');

// Security Settings
define('JWT_SECRET', 'your_jwt_secret_key_here');
define('ENCRYPTION_KEY', 'your_encryption_key_here');

// Application Settings
define('WITHDRAWAL_TIMER_HOURS', 24);     // Hours before withdrawal is allowed
define('MAX_WITHDRAWAL_AMOUNT', 1.0);     // Maximum BTC withdrawal per transaction
define('MIN_WITHDRAWAL_AMOUNT', 0.001);   // Minimum BTC withdrawal amount

// Environment
define('ENVIRONMENT', 'development');     // development, staging, production
define('DEBUG_MODE', true);               // Set to false in production

?>