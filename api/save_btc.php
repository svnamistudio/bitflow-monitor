<?php
/**
 * Save BTC Conversion Data
 * 
 * POST endpoint to save BTC conversion data to database
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../db_connect.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use POST.'
    ]);
    exit();
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $required_fields = ['btc_amount', 'converted_amount', 'currency'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            throw new Exception("Missing required field: {$field}");
        }
    }
    
    // Sanitize and validate data
    $btc_amount = filter_var($input['btc_amount'], FILTER_VALIDATE_FLOAT);
    $converted_amount = filter_var($input['converted_amount'], FILTER_VALIDATE_FLOAT);
    $currency = filter_var($input['currency'], FILTER_SANITIZE_STRING);
    $conversion_rate = isset($input['conversion_rate']) ? filter_var($input['conversion_rate'], FILTER_VALIDATE_FLOAT) : ($converted_amount / $btc_amount);
    $transaction_type = isset($input['transaction_type']) ? filter_var($input['transaction_type'], FILTER_SANITIZE_STRING) : 'convert';
    $user_id = isset($input['user_id']) ? filter_var($input['user_id'], FILTER_VALIDATE_INT) : 1; // Default user
    $notes = isset($input['notes']) ? filter_var($input['notes'], FILTER_SANITIZE_STRING) : '';
    
    // Validate amounts
    if ($btc_amount === false || $btc_amount <= 0) {
        throw new Exception('Invalid BTC amount');
    }
    
    if ($converted_amount === false || $converted_amount <= 0) {
        throw new Exception('Invalid converted amount');
    }
    
    if ($conversion_rate === false || $conversion_rate <= 0) {
        throw new Exception('Invalid conversion rate');
    }
    
    // Validate currency
    $allowed_currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
    if (!in_array(strtoupper($currency), $allowed_currencies)) {
        $currency = 'USD'; // Default to USD
    }
    
    // Validate transaction type
    $allowed_types = ['buy', 'sell', 'convert'];
    if (!in_array($transaction_type, $allowed_types)) {
        $transaction_type = 'convert';
    }
    
    // Get database connection
    $db = DatabaseConnection::getInstance()->getConnection();
    
    // Insert conversion record
    $stmt = $db->prepare("
        INSERT INTO btc_conversions 
        (user_id, btc_amount, converted_amount, currency, conversion_rate, transaction_type, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    $result = $stmt->execute([
        $user_id,
        $btc_amount,
        $converted_amount,
        strtoupper($currency),
        $conversion_rate,
        $transaction_type,
        $notes
    ]);
    
    if ($result) {
        $conversion_id = $db->lastInsertId();
        
        // Log the conversion
        if (defined('DEBUG_MODE') && DEBUG_MODE) {
            error_log("BTC conversion saved: ID {$conversion_id}, {$btc_amount} BTC = {$converted_amount} {$currency}");
        }
        
        // Update user balance if needed
        if ($user_id && in_array($transaction_type, ['buy', 'sell'])) {
            $balance_change = ($transaction_type === 'buy') ? $btc_amount : -$btc_amount;
            $usd_change = ($transaction_type === 'buy') ? -$converted_amount : $converted_amount;
            
            $update_stmt = $db->prepare("
                UPDATE users 
                SET btc_balance = btc_balance + ?, 
                    usd_balance = usd_balance + ?,
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ");
            $update_stmt->execute([$balance_change, $usd_change, $user_id]);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'BTC conversion saved successfully',
            'data' => [
                'id' => $conversion_id,
                'btc_amount' => $btc_amount,
                'converted_amount' => $converted_amount,
                'currency' => strtoupper($currency),
                'conversion_rate' => $conversion_rate,
                'transaction_type' => $transaction_type,
                'timestamp' => date('Y-m-d H:i:s')
            ]
        ]);
    } else {
        throw new Exception('Failed to save conversion data');
    }
    
} catch (PDOException $e) {
    error_log("Database error in save_btc.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'error' => DEBUG_MODE ? $e->getMessage() : 'Internal server error'
    ]);
    
} catch (Exception $e) {
    error_log("Error in save_btc.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

?>