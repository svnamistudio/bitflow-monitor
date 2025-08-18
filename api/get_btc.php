<?php
/**
 * Get BTC Conversion History
 * 
 * GET endpoint to retrieve BTC conversion history from database
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../db_connect.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use GET.'
    ]);
    exit();
}

try {
    // Get query parameters
    $limit = isset($_GET['limit']) ? filter_var($_GET['limit'], FILTER_VALIDATE_INT) : 20;
    $offset = isset($_GET['offset']) ? filter_var($_GET['offset'], FILTER_VALIDATE_INT) : 0;
    $user_id = isset($_GET['user_id']) ? filter_var($_GET['user_id'], FILTER_VALIDATE_INT) : null;
    $currency = isset($_GET['currency']) ? filter_var($_GET['currency'], FILTER_SANITIZE_STRING) : null;
    $transaction_type = isset($_GET['type']) ? filter_var($_GET['type'], FILTER_SANITIZE_STRING) : null;
    
    // Validate parameters
    if ($limit === false || $limit < 1 || $limit > 100) {
        $limit = 20; // Default limit
    }
    
    if ($offset === false || $offset < 0) {
        $offset = 0; // Default offset
    }
    
    // Get database connection
    $db = DatabaseConnection::getInstance()->getConnection();
    
    // Build query
    $where_conditions = [];
    $params = [];
    
    if ($user_id !== null && $user_id > 0) {
        $where_conditions[] = "c.user_id = ?";
        $params[] = $user_id;
    }
    
    if ($currency !== null) {
        $where_conditions[] = "c.currency = ?";
        $params[] = strtoupper($currency);
    }
    
    if ($transaction_type !== null && in_array($transaction_type, ['buy', 'sell', 'convert'])) {
        $where_conditions[] = "c.transaction_type = ?";
        $params[] = $transaction_type;
    }
    
    $where_clause = '';
    if (!empty($where_conditions)) {
        $where_clause = 'WHERE ' . implode(' AND ', $where_conditions);
    }
    
    // Get total count
    $count_query = "
        SELECT COUNT(*) as total 
        FROM btc_conversions c 
        LEFT JOIN users u ON c.user_id = u.id 
        {$where_clause}
    ";
    
    $count_stmt = $db->prepare($count_query);
    $count_stmt->execute($params);
    $total_records = $count_stmt->fetch()['total'];
    
    // Get conversion records
    $query = "
        SELECT 
            c.id,
            c.btc_amount,
            c.converted_amount,
            c.currency,
            c.conversion_rate,
            c.transaction_type,
            c.timestamp,
            c.notes,
            u.username,
            u.email
        FROM btc_conversions c
        LEFT JOIN users u ON c.user_id = u.id
        {$where_clause}
        ORDER BY c.timestamp DESC
        LIMIT ? OFFSET ?
    ";
    
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $conversions = $stmt->fetchAll();
    
    // Format the results
    $formatted_conversions = array_map(function($conversion) {
        return [
            'id' => (int)$conversion['id'],
            'btc_amount' => number_format($conversion['btc_amount'], 8),
            'converted_amount' => number_format($conversion['converted_amount'], 2),
            'currency' => $conversion['currency'],
            'conversion_rate' => number_format($conversion['conversion_rate'], 2),
            'transaction_type' => $conversion['transaction_type'],
            'timestamp' => $conversion['timestamp'],
            'notes' => $conversion['notes'],
            'user' => [
                'username' => $conversion['username'],
                'email' => $conversion['email']
            ],
            'formatted_timestamp' => date('M j, Y g:i A', strtotime($conversion['timestamp']))
        ];
    }, $conversions);
    
    // Calculate pagination info
    $total_pages = ceil($total_records / $limit);
    $current_page = floor($offset / $limit) + 1;
    
    echo json_encode([
        'success' => true,
        'data' => $formatted_conversions,
        'pagination' => [
            'total_records' => (int)$total_records,
            'total_pages' => (int)$total_pages,
            'current_page' => (int)$current_page,
            'limit' => (int)$limit,
            'offset' => (int)$offset,
            'has_next' => $current_page < $total_pages,
            'has_prev' => $current_page > 1
        ],
        'summary' => [
            'total_btc' => array_sum(array_column($conversions, 'btc_amount')),
            'total_converted' => array_sum(array_column($conversions, 'converted_amount')),
            'avg_rate' => $conversions ? array_sum(array_column($conversions, 'conversion_rate')) / count($conversions) : 0
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in get_btc.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'error' => DEBUG_MODE ? $e->getMessage() : 'Internal server error'
    ]);
    
} catch (Exception $e) {
    error_log("Error in get_btc.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

?>