<?php
/**
 * Wallet API Endpoints
 * 
 * Handles wallet-related operations including balance, transactions, and withdrawals
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../db_connect.php';

try {
    $request_method = $_SERVER['REQUEST_METHOD'];
    $path_info = $_SERVER['PATH_INFO'] ?? '';
    
    // Route requests
    switch ($request_method) {
        case 'GET':
            handleGetRequest($path_info);
            break;
        case 'POST':
            handlePostRequest($path_info);
            break;
        default:
            throw new Exception('Method not allowed');
    }
    
} catch (Exception $e) {
    error_log("Wallet API Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

/**
 * Handle GET requests
 */
function handleGetRequest($path) {
    switch ($path) {
        case '/balance':
            getWalletBalance();
            break;
        case '/transactions':
            getTransactionHistory();
            break;
        case '/fees':
            getFeeEstimates();
            break;
        default:
            throw new Exception('Endpoint not found');
    }
}

/**
 * Handle POST requests
 */
function handlePostRequest($path) {
    switch ($path) {
        case '/send':
            sendBitcoin();
            break;
        case '/generate-address':
            generateNewAddress();
            break;
        default:
            throw new Exception('Endpoint not found');
    }
}

/**
 * Get wallet balance
 */
function getWalletBalance() {
    $address = $_GET['address'] ?? null;
    $user_id = $_GET['user_id'] ?? 1;
    
    if (!$address) {
        // Get address from user record
        $db = DatabaseConnection::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT wallet_address, btc_balance FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            throw new Exception('User not found');
        }
        
        $address = $user['wallet_address'];
    }
    
    // In a real implementation, this would call Electrum or BlockCypher
    // For demo purposes, get balance from database
    $db = DatabaseConnection::getInstance()->getConnection();
    $stmt = $db->prepare("SELECT btc_balance FROM users WHERE wallet_address = ?");
    $stmt->execute([$address]);
    $result = $stmt->fetch();
    
    if (!$result) {
        throw new Exception('Wallet not found');
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'address' => $address,
            'balance' => floatval($result['btc_balance']),
            'unconfirmed_balance' => 0.0,
            'total_received' => floatval($result['btc_balance']),
            'total_sent' => 0.0,
            'n_tx' => 1,
            'updated_at' => date('Y-m-d H:i:s')
        ]
    ]);
}

/**
 * Get transaction history
 */
function getTransactionHistory() {
    $address = $_GET['address'] ?? null;
    $user_id = $_GET['user_id'] ?? 1;
    $limit = min(50, max(1, intval($_GET['limit'] ?? 10)));
    $offset = max(0, intval($_GET['offset'] ?? 0));
    
    if (!$address) {
        // Get address from user record
        $db = DatabaseConnection::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT wallet_address FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            throw new Exception('User not found');
        }
        
        $address = $user['wallet_address'];
    }
    
    $db = DatabaseConnection::getInstance()->getConnection();
    
    // Get transactions for this address/user
    $stmt = $db->prepare("
        SELECT 
            transaction_hash,
            transaction_type,
            amount,
            fee,
            from_address,
            to_address,
            confirmations,
            status,
            created_at,
            confirmed_at,
            blockchain_data
        FROM transactions 
        WHERE user_id = ? OR from_address = ? OR to_address = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    ");
    
    $stmt->execute([$user_id, $address, $address, $limit, $offset]);
    $transactions = $stmt->fetchAll();
    
    // Format transactions for API response
    $formatted_transactions = array_map(function($tx) use ($address) {
        $is_incoming = ($tx['to_address'] === $address);
        
        return [
            'hash' => $tx['transaction_hash'],
            'block_height' => 800000, // Mock block height
            'block_time' => $tx['confirmed_at'] ?: $tx['created_at'],
            'inputs' => [
                ['addresses' => [$tx['from_address']]]
            ],
            'outputs' => [
                ['addresses' => [$tx['to_address']], 'value' => intval($tx['amount'] * 100000000)]
            ],
            'value' => intval($tx['amount'] * 100000000), // Convert to satoshis
            'confirmations' => intval($tx['confirmations']),
            'fees' => intval($tx['fee'] * 100000000),
            'status' => $tx['status'],
            'type' => $tx['transaction_type']
        ];
    }, $transactions);
    
    echo json_encode([
        'success' => true,
        'data' => $formatted_transactions
    ]);
}

/**
 * Send Bitcoin
 */
function sendBitcoin() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $user_id = $input['user_id'] ?? 1;
    $to_address = $input['address'] ?? '';
    $amount = floatval($input['amount'] ?? 0);
    $fee_level = $input['fee'] ?? 'normal';
    
    // Validate inputs
    if (empty($to_address)) {
        throw new Exception('Destination address is required');
    }
    
    if ($amount <= 0) {
        throw new Exception('Amount must be greater than zero');
    }
    
    // Get user's current balance
    $db = DatabaseConnection::getInstance()->getConnection();
    $stmt = $db->prepare("SELECT wallet_address, btc_balance FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    
    if (!$user) {
        throw new Exception('User not found');
    }
    
    // Calculate fee based on level
    $fees = [
        'slow' => 0.00001,
        'normal' => 0.00002,
        'fast' => 0.00005
    ];
    $fee = $fees[$fee_level] ?? $fees['normal'];
    
    $total_needed = $amount + $fee;
    
    if ($user['btc_balance'] < $total_needed) {
        throw new Exception('Insufficient balance');
    }
    
    // Generate mock transaction hash
    $tx_hash = 'tx_' . bin2hex(random_bytes(16));
    
    try {
        $db->beginTransaction();
        
        // Update user balance
        $new_balance = $user['btc_balance'] - $total_needed;
        $stmt = $db->prepare("UPDATE users SET btc_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$new_balance, $user_id]);
        
        // Record transaction
        $stmt = $db->prepare("
            INSERT INTO transactions 
            (user_id, transaction_hash, transaction_type, amount, fee, from_address, to_address, status, created_at)
            VALUES (?, ?, 'withdrawal', ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
        ");
        $stmt->execute([$user_id, $tx_hash, $amount, $fee, $user['wallet_address'], $to_address]);
        
        $db->commit();
        
        // In a real implementation, this would call Electrum to broadcast the transaction
        
        echo json_encode([
            'success' => true,
            'data' => [
                'tx_hash' => $tx_hash,
                'amount' => $amount,
                'fee' => $fee,
                'to_address' => $to_address,
                'from_address' => $user['wallet_address'],
                'status' => 'pending',
                'estimated_confirmation' => '10-30 minutes'
            ]
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * Generate new wallet address
 */
function generateNewAddress() {
    $input = json_decode(file_get_contents('php://input'), true);
    $user_id = $input['user_id'] ?? 1;
    
    // Generate mock Bitcoin address
    $address = 'bc1q' . bin2hex(random_bytes(20));
    
    // Update user's wallet address
    $db = DatabaseConnection::getInstance()->getConnection();
    $stmt = $db->prepare("UPDATE users SET wallet_address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    $stmt->execute([$address, $user_id]);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'address' => $address,
            'type' => 'bech32',
            'created_at' => date('Y-m-d H:i:s')
        ]
    ]);
}

/**
 * Get fee estimates
 */
function getFeeEstimates() {
    // Mock fee estimates (in real app, would call fee estimation service)
    echo json_encode([
        'success' => true,
        'data' => [
            'slow' => [
                'sat_per_byte' => 10,
                'time_estimate' => '60+ minutes',
                'btc_fee' => 0.00001
            ],
            'normal' => [
                'sat_per_byte' => 20,
                'time_estimate' => '30 minutes',
                'btc_fee' => 0.00002
            ],
            'fast' => [
                'sat_per_byte' => 50,
                'time_estimate' => '10 minutes',
                'btc_fee' => 0.00005
            ]
        ]
    ]);
}

?>