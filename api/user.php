<?php
/**
 * User Management API Endpoints
 * 
 * Handles user authentication, profile management, and account operations
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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
        case 'PUT':
            handlePutRequest($path_info);
            break;
        case 'DELETE':
            handleDeleteRequest($path_info);
            break;
        default:
            throw new Exception('Method not allowed');
    }
    
} catch (Exception $e) {
    error_log("User API Error: " . $e->getMessage());
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
        case '/profile':
            getUserProfile();
            break;
        case '/balance':
            getUserBalance();
            break;
        case '/settings':
            getUserSettings();
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
        case '/login':
            loginUser();
            break;
        case '/register':
            registerUser();
            break;
        case '/logout':
            logoutUser();
            break;
        case '/reset-password':
            resetPassword();
            break;
        default:
            throw new Exception('Endpoint not found');
    }
}

/**
 * Handle PUT requests
 */
function handlePutRequest($path) {
    switch ($path) {
        case '/profile':
            updateUserProfile();
            break;
        case '/password':
            changePassword();
            break;
        case '/settings':
            updateUserSettings();
            break;
        default:
            throw new Exception('Endpoint not found');
    }
}

/**
 * Handle DELETE requests
 */
function handleDeleteRequest($path) {
    switch ($path) {
        case '/account':
            deleteUserAccount();
            break;
        default:
            throw new Exception('Endpoint not found');
    }
}

/**
 * User login
 */
function loginUser() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        throw new Exception('Username and password are required');
    }
    
    $db = DatabaseConnection::getInstance()->getConnection();
    
    // Find user by username or email
    $stmt = $db->prepare("
        SELECT id, username, email, password_hash, wallet_address, btc_balance, 
               usd_balance, withdrawal_timer, is_active, last_login
        FROM users 
        WHERE (username = ? OR email = ?) AND is_active = 1
    ");
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch();
    
    if (!$user) {
        throw new Exception('Invalid credentials');
    }
    
    // Verify password
    if (!password_verify($password, $user['password_hash'])) {
        throw new Exception('Invalid credentials');
    }
    
    // Update last login
    $stmt = $db->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    // Generate JWT token (mock implementation)
    $token = generateJWTToken($user['id'], $user['username']);
    
    // Prepare user data for response
    $user_data = [
        'id' => intval($user['id']),
        'username' => $user['username'],
        'email' => $user['email'],
        'wallet_address' => $user['wallet_address'],
        'btc_balance' => floatval($user['btc_balance']),
        'usd_balance' => floatval($user['usd_balance']),
        'withdrawal_timer' => $user['withdrawal_timer'],
        'last_login' => $user['last_login']
    ];
    
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'data' => $user_data,
        'token' => $token
    ]);
}

/**
 * User registration
 */
function registerUser() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $username = trim($input['username'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    
    // Validate inputs
    if (empty($username) || empty($email) || empty($password)) {
        throw new Exception('Username, email, and password are required');
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email address');
    }
    
    if (strlen($password) < 8) {
        throw new Exception('Password must be at least 8 characters long');
    }
    
    if (strlen($username) < 3) {
        throw new Exception('Username must be at least 3 characters long');
    }
    
    $db = DatabaseConnection::getInstance()->getConnection();
    
    // Check if username or email already exists
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    if ($stmt->fetch()) {
        throw new Exception('Username or email already exists');
    }
    
    // Generate wallet address
    $wallet_address = generateBitcoinAddress();
    
    // Hash password
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Set withdrawal timer (24 hours from registration)
    $withdrawal_timer = date('Y-m-d H:i:s', time() + (24 * 60 * 60));
    
    try {
        $db->beginTransaction();
        
        // Insert new user
        $stmt = $db->prepare("
            INSERT INTO users 
            (username, email, password_hash, wallet_address, withdrawal_timer, created_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ");
        $stmt->execute([$username, $email, $password_hash, $wallet_address, $withdrawal_timer]);
        
        $user_id = $db->lastInsertId();
        
        // Log the registration
        logSystemEvent('info', 'User registered', ['user_id' => $user_id, 'username' => $username]);
        
        $db->commit();
        
        // Generate JWT token
        $token = generateJWTToken($user_id, $username);
        
        // Prepare user data for response
        $user_data = [
            'id' => intval($user_id),
            'username' => $username,
            'email' => $email,
            'wallet_address' => $wallet_address,
            'btc_balance' => 0.0,
            'usd_balance' => 0.0,
            'withdrawal_timer' => $withdrawal_timer
        ];
        
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful',
            'data' => $user_data,
            'token' => $token
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * Get user profile
 */
function getUserProfile() {
    $user_id = getCurrentUserId();
    
    $db = DatabaseConnection::getInstance()->getConnection();
    $stmt = $db->prepare("
        SELECT id, username, email, wallet_address, btc_balance, usd_balance, 
               withdrawal_timer, created_at, last_login, is_active
        FROM users 
        WHERE id = ? AND is_active = 1
    ");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    
    if (!$user) {
        throw new Exception('User not found');
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'id' => intval($user['id']),
            'username' => $user['username'],
            'email' => $user['email'],
            'wallet_address' => $user['wallet_address'],
            'btc_balance' => floatval($user['btc_balance']),
            'usd_balance' => floatval($user['usd_balance']),
            'withdrawal_timer' => $user['withdrawal_timer'],
            'created_at' => $user['created_at'],
            'last_login' => $user['last_login'],
            'account_status' => $user['is_active'] ? 'active' : 'inactive'
        ]
    ]);
}

/**
 * Update user profile
 */
function updateUserProfile() {
    $user_id = getCurrentUserId();
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $allowed_fields = ['username', 'email'];
    $updates = [];
    $params = [];
    
    foreach ($allowed_fields as $field) {
        if (isset($input[$field]) && !empty(trim($input[$field]))) {
            $value = trim($input[$field]);
            
            // Additional validation
            if ($field === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Invalid email address');
            }
            
            if ($field === 'username' && strlen($value) < 3) {
                throw new Exception('Username must be at least 3 characters long');
            }
            
            $updates[] = "$field = ?";
            $params[] = $value;
        }
    }
    
    if (empty($updates)) {
        throw new Exception('No valid fields to update');
    }
    
    $db = DatabaseConnection::getInstance()->getConnection();
    
    // Check for duplicate username/email
    if (in_array('username = ?', $updates) || in_array('email = ?', $updates)) {
        $check_fields = [];
        $check_params = [];
        
        if (in_array('username = ?', $updates)) {
            $check_fields[] = 'username = ?';
            $check_params[] = $params[array_search('username = ?', $updates)];
        }
        
        if (in_array('email = ?', $updates)) {
            $check_fields[] = 'email = ?';
            $check_params[] = $params[array_search('email = ?', $updates)];
        }
        
        $check_query = "SELECT id FROM users WHERE (" . implode(' OR ', $check_fields) . ") AND id != ?";
        $check_params[] = $user_id;
        
        $stmt = $db->prepare($check_query);
        $stmt->execute($check_params);
        
        if ($stmt->fetch()) {
            throw new Exception('Username or email already exists');
        }
    }
    
    // Update user
    $params[] = $user_id;
    $query = "UPDATE users SET " . implode(', ', $updates) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception('No changes made or user not found');
    }
    
    // Return updated profile
    getUserProfile();
}

/**
 * Get user balance
 */
function getUserBalance() {
    $user_id = getCurrentUserId();
    
    $db = DatabaseConnection::getInstance()->getConnection();
    $stmt = $db->prepare("
        SELECT btc_balance, usd_balance, wallet_address, updated_at
        FROM users 
        WHERE id = ? AND is_active = 1
    ");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    
    if (!$user) {
        throw new Exception('User not found');
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'btc_balance' => floatval($user['btc_balance']),
            'usd_balance' => floatval($user['usd_balance']),
            'wallet_address' => $user['wallet_address'],
            'last_updated' => $user['updated_at']
        ]
    ]);
}

/**
 * Change password
 */
function changePassword() {
    $user_id = getCurrentUserId();
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $current_password = $input['current_password'] ?? '';
    $new_password = $input['new_password'] ?? '';
    $confirm_password = $input['confirm_password'] ?? '';
    
    if (empty($current_password) || empty($new_password) || empty($confirm_password)) {
        throw new Exception('All password fields are required');
    }
    
    if ($new_password !== $confirm_password) {
        throw new Exception('New password and confirmation do not match');
    }
    
    if (strlen($new_password) < 8) {
        throw new Exception('New password must be at least 8 characters long');
    }
    
    $db = DatabaseConnection::getInstance()->getConnection();
    
    // Verify current password
    $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ? AND is_active = 1");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($current_password, $user['password_hash'])) {
        throw new Exception('Current password is incorrect');
    }
    
    // Update password
    $new_password_hash = password_hash($new_password, PASSWORD_DEFAULT);
    $stmt = $db->prepare("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    $stmt->execute([$new_password_hash, $user_id]);
    
    // Log the password change
    logSystemEvent('info', 'Password changed', ['user_id' => $user_id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Password changed successfully'
    ]);
}

/**
 * User logout
 */
function logoutUser() {
    // In a real implementation, you would invalidate the JWT token
    // For now, just return success
    echo json_encode([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);
}

/**
 * Reset password
 */
function resetPassword() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $email = trim($input['email'] ?? '');
    
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Valid email address is required');
    }
    
    $db = DatabaseConnection::getInstance()->getConnection();
    
    // Check if user exists
    $stmt = $db->prepare("SELECT id, username FROM users WHERE email = ? AND is_active = 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        // Don't reveal whether the email exists or not
        echo json_encode([
            'success' => true,
            'message' => 'If the email exists, a password reset link has been sent'
        ]);
        return;
    }
    
    // Generate reset token (in real implementation, store this securely)
    $reset_token = bin2hex(random_bytes(32));
    
    // In a real implementation, you would:
    // 1. Store the reset token in database with expiration
    // 2. Send email with reset link
    
    logSystemEvent('info', 'Password reset requested', ['user_id' => $user['id'], 'email' => $email]);
    
    echo json_encode([
        'success' => true,
        'message' => 'If the email exists, a password reset link has been sent',
        'debug_token' => DEBUG_MODE ? $reset_token : null
    ]);
}

/**
 * Delete user account
 */
function deleteUserAccount() {
    $user_id = getCurrentUserId();
    $input = json_decode(file_get_contents('php://input'), true);
    
    $password = $input['password'] ?? '';
    
    if (empty($password)) {
        throw new Exception('Password is required to delete account');
    }
    
    $db = DatabaseConnection::getInstance()->getConnection();
    
    // Verify password
    $stmt = $db->prepare("SELECT password_hash, btc_balance FROM users WHERE id = ? AND is_active = 1");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password_hash'])) {
        throw new Exception('Incorrect password');
    }
    
    if ($user['btc_balance'] > 0) {
        throw new Exception('Cannot delete account with Bitcoin balance. Please withdraw all funds first.');
    }
    
    try {
        $db->beginTransaction();
        
        // Soft delete - just mark as inactive
        $stmt = $db->prepare("UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$user_id]);
        
        // Log the account deletion
        logSystemEvent('info', 'Account deleted', ['user_id' => $user_id]);
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Account deleted successfully'
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * Get current user ID from request (mock implementation)
 */
function getCurrentUserId() {
    // In a real implementation, you would extract this from JWT token
    return $_GET['user_id'] ?? $_POST['user_id'] ?? 1;
}

/**
 * Generate JWT token (mock implementation)
 */
function generateJWTToken($user_id, $username) {
    // In a real implementation, use a proper JWT library
    $payload = [
        'user_id' => $user_id,
        'username' => $username,
        'issued_at' => time(),
        'expires_at' => time() + (24 * 60 * 60) // 24 hours
    ];
    
    return 'mock_jwt_' . base64_encode(json_encode($payload));
}

/**
 * Generate Bitcoin address (mock implementation)
 */
function generateBitcoinAddress() {
    // In a real implementation, this would call Electrum to generate a new address
    return 'bc1q' . bin2hex(random_bytes(20));
}

/**
 * Log system events
 */
function logSystemEvent($level, $message, $context = []) {
    $db = DatabaseConnection::getInstance()->getConnection();
    
    $stmt = $db->prepare("
        INSERT INTO system_logs (log_level, message, context, user_id, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $user_id = isset($context['user_id']) ? $context['user_id'] : null;
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? null;
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? null;
    
    $stmt->execute([
        $level,
        $message,
        json_encode($context),
        $user_id,
        $ip_address,
        $user_agent
    ]);
}

/**
 * Get user settings (placeholder)
 */
function getUserSettings() {
    echo json_encode([
        'success' => true,
        'data' => [
            'notifications' => true,
            'two_factor_enabled' => false,
            'theme' => 'dark',
            'language' => 'en',
            'timezone' => 'UTC'
        ]
    ]);
}

/**
 * Update user settings (placeholder)
 */
function updateUserSettings() {
    echo json_encode([
        'success' => true,
        'message' => 'Settings updated successfully'
    ]);
}

?>