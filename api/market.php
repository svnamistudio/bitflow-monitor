<?php
/**
 * Market Data API Endpoints
 * 
 * Handles cryptocurrency market data, prices, and analytics
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
    error_log("Market API Error: " . $e->getMessage());
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
        case '/price':
            getCurrentPrice();
            break;
        case '/rates':
            getMarketRates();
            break;
        case '/history':
            getPriceHistory();
            break;
        case '/stats':
            getMarketStats();
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
        case '/update':
            updateMarketData();
            break;
        default:
            throw new Exception('Endpoint not found');
    }
}

/**
 * Get current Bitcoin price
 */
function getCurrentPrice() {
    $symbol = strtoupper($_GET['symbol'] ?? 'BTC');
    $vs_currency = strtoupper($_GET['vs_currency'] ?? 'USD');
    
    // Try to get cached price from database first
    $db = DatabaseConnection::getInstance()->getConnection();
    $stmt = $db->prepare("
        SELECT price, price_change_24h, price_change_percentage_24h, high_24h, low_24h, volume_24h, updated_at
        FROM market_data 
        WHERE symbol = ? 
        AND updated_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        ORDER BY updated_at DESC 
        LIMIT 1
    ");
    $stmt->execute([$symbol]);
    $cached_data = $stmt->fetch();
    
    if ($cached_data) {
        // Return cached data if it's fresh (less than 5 minutes old)
        echo json_encode([
            'success' => true,
            'data' => [
                'symbol' => $symbol,
                'price' => floatval($cached_data['price']),
                'change_24h' => floatval($cached_data['price_change_24h']),
                'change_percentage_24h' => floatval($cached_data['price_change_percentage_24h']),
                'high_24h' => floatval($cached_data['high_24h']),
                'low_24h' => floatval($cached_data['low_24h']),
                'volume_24h' => floatval($cached_data['volume_24h']),
                'last_updated' => $cached_data['updated_at'],
                'source' => 'cache'
            ]
        ]);
        return;
    }
    
    // Fetch fresh data from external API
    $fresh_data = fetchPriceFromAPI($symbol, $vs_currency);
    
    if ($fresh_data) {
        // Cache the fresh data
        cacheMarketData($symbol, $fresh_data);
        
        echo json_encode([
            'success' => true,
            'data' => array_merge($fresh_data, ['source' => 'live'])
        ]);
    } else {
        // Return mock data if API fails
        echo json_encode([
            'success' => true,
            'data' => getMockPriceData($symbol),
            'warning' => 'Using mock data - API unavailable'
        ]);
    }
}

/**
 * Get market rates for multiple cryptocurrencies
 */
function getMarketRates() {
    $symbols = explode(',', strtoupper($_GET['symbols'] ?? 'BTC,ETH,USDT'));
    $vs_currency = strtoupper($_GET['vs_currency'] ?? 'USD');
    $limit = min(50, max(1, intval($_GET['limit'] ?? 10)));
    
    $db = DatabaseConnection::getInstance()->getConnection();
    
    // Get cached data for requested symbols
    $placeholders = str_repeat('?,', count($symbols) - 1) . '?';
    $stmt = $db->prepare("
        SELECT symbol, price, price_change_24h, price_change_percentage_24h, 
               high_24h, low_24h, volume_24h, market_cap, updated_at
        FROM market_data 
        WHERE symbol IN ($placeholders)
        AND updated_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
        ORDER BY market_cap DESC
        LIMIT ?
    ");
    
    $params = array_merge($symbols, [$limit]);
    $stmt->execute($params);
    $market_data = $stmt->fetchAll();
    
    // If we don't have enough fresh data, supplement with mock data
    $existing_symbols = array_column($market_data, 'symbol');
    $missing_symbols = array_diff($symbols, $existing_symbols);
    
    foreach ($missing_symbols as $symbol) {
        $mock_data = getMockMarketData($symbol);
        $market_data[] = $mock_data;
        
        // Cache the mock data
        cacheMarketData($symbol, $mock_data);
    }
    
    // Format the response
    $formatted_data = array_map(function($item) {
        return [
            'symbol' => $item['symbol'],
            'name' => getCoinName($item['symbol']),
            'price' => floatval($item['price']),
            'change_24h' => floatval($item['price_change_24h'] ?? 0),
            'change_percentage_24h' => floatval($item['price_change_percentage_24h'] ?? 0),
            'high_24h' => floatval($item['high_24h'] ?? 0),
            'low_24h' => floatval($item['low_24h'] ?? 0),
            'volume_24h' => floatval($item['volume_24h'] ?? 0),
            'market_cap' => floatval($item['market_cap'] ?? 0),
            'last_updated' => $item['updated_at'] ?? date('Y-m-d H:i:s')
        ];
    }, array_slice($market_data, 0, $limit));
    
    echo json_encode([
        'success' => true,
        'data' => $formatted_data
    ]);
}

/**
 * Get price history
 */
function getPriceHistory() {
    $symbol = strtoupper($_GET['symbol'] ?? 'BTC');
    $days = min(30, max(1, intval($_GET['days'] ?? 7)));
    $interval = $_GET['interval'] ?? 'daily';
    
    // Generate mock historical data
    $history = [];
    $base_price = 45000; // Mock base price for BTC
    $current_time = time();
    
    for ($i = $days; $i >= 0; $i--) {
        $timestamp = $current_time - ($i * 24 * 60 * 60);
        $price = $base_price + (rand(-5000, 5000)); // Random variation
        $volume = rand(20000000000, 50000000000); // Random volume
        
        $history[] = [
            'timestamp' => $timestamp,
            'date' => date('Y-m-d', $timestamp),
            'price' => $price,
            'volume' => $volume,
            'high' => $price + rand(500, 2000),
            'low' => $price - rand(500, 2000),
            'open' => $price + rand(-1000, 1000),
            'close' => $price
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'symbol' => $symbol,
            'interval' => $interval,
            'history' => $history
        ]
    ]);
}

/**
 * Get market statistics
 */
function getMarketStats() {
    $db = DatabaseConnection::getInstance()->getConnection();
    
    // Get latest market data
    $stmt = $db->query("
        SELECT 
            COUNT(*) as total_coins,
            SUM(market_cap) as total_market_cap,
            SUM(volume_24h) as total_volume_24h,
            AVG(price_change_percentage_24h) as avg_change_24h,
            MAX(updated_at) as last_updated
        FROM market_data
        WHERE updated_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    ");
    $stats = $stmt->fetch();
    
    // Bitcoin dominance (mock calculation)
    $btc_stmt = $db->query("
        SELECT market_cap 
        FROM market_data 
        WHERE symbol = 'BTC' 
        AND updated_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        LIMIT 1
    ");
    $btc_data = $btc_stmt->fetch();
    
    $btc_dominance = 0;
    if ($btc_data && $stats['total_market_cap'] > 0) {
        $btc_dominance = ($btc_data['market_cap'] / $stats['total_market_cap']) * 100;
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'total_coins' => intval($stats['total_coins'] ?? 0),
            'total_market_cap' => floatval($stats['total_market_cap'] ?? 0),
            'total_volume_24h' => floatval($stats['total_volume_24h'] ?? 0),
            'average_change_24h' => floatval($stats['avg_change_24h'] ?? 0),
            'bitcoin_dominance' => round($btc_dominance, 2),
            'last_updated' => $stats['last_updated'] ?? date('Y-m-d H:i:s'),
            'active_cryptocurrencies' => intval($stats['total_coins'] ?? 0),
            'market_status' => 'active'
        ]
    ]);
}

/**
 * Update market data (admin endpoint)
 */
function updateMarketData() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['symbol'])) {
        throw new Exception('Symbol is required');
    }
    
    $symbol = strtoupper($input['symbol']);
    
    // Fetch fresh data from API
    $fresh_data = fetchPriceFromAPI($symbol);
    
    if ($fresh_data) {
        cacheMarketData($symbol, $fresh_data);
        
        echo json_encode([
            'success' => true,
            'message' => "Market data updated for {$symbol}",
            'data' => $fresh_data
        ]);
    } else {
        throw new Exception('Failed to fetch market data');
    }
}

/**
 * Fetch price data from external API (CoinGecko)
 */
function fetchPriceFromAPI($symbol, $vs_currency = 'USD') {
    $coin_id = getCoinId($symbol);
    if (!$coin_id) {
        return null;
    }
    
    $url = "https://api.coingecko.com/api/v3/simple/price";
    $params = http_build_query([
        'ids' => $coin_id,
        'vs_currencies' => strtolower($vs_currency),
        'include_24hr_change' => 'true',
        'include_24hr_vol' => 'true',
        'include_market_cap' => 'true'
    ]);
    
    $context = stream_context_create([
        'http' => [
            'timeout' => 10,
            'user_agent' => 'Bitcoin Dashboard/1.0'
        ]
    ]);
    
    $response = @file_get_contents($url . '?' . $params, false, $context);
    
    if ($response === false) {
        return null;
    }
    
    $data = json_decode($response, true);
    if (!$data || !isset($data[$coin_id])) {
        return null;
    }
    
    $coin_data = $data[$coin_id];
    $vs_key = strtolower($vs_currency);
    
    return [
        'symbol' => $symbol,
        'price' => $coin_data[$vs_key] ?? 0,
        'change_24h' => $coin_data[$vs_key . '_24h_change'] ?? 0,
        'change_percentage_24h' => $coin_data[$vs_key . '_24h_change'] ?? 0,
        'volume_24h' => $coin_data[$vs_key . '_24h_vol'] ?? 0,
        'market_cap' => $coin_data[$vs_key . '_market_cap'] ?? 0,
        'high_24h' => ($coin_data[$vs_key] ?? 0) * 1.05, // Estimated
        'low_24h' => ($coin_data[$vs_key] ?? 0) * 0.95,  // Estimated
        'last_updated' => date('Y-m-d H:i:s')
    ];
}

/**
 * Cache market data in database
 */
function cacheMarketData($symbol, $data) {
    $db = DatabaseConnection::getInstance()->getConnection();
    
    $stmt = $db->prepare("
        INSERT INTO market_data 
        (symbol, price, price_change_24h, price_change_percentage_24h, high_24h, low_24h, volume_24h, market_cap, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
        price = VALUES(price),
        price_change_24h = VALUES(price_change_24h),
        price_change_percentage_24h = VALUES(price_change_percentage_24h),
        high_24h = VALUES(high_24h),
        low_24h = VALUES(low_24h),
        volume_24h = VALUES(volume_24h),
        market_cap = VALUES(market_cap),
        updated_at = CURRENT_TIMESTAMP
    ");
    
    $stmt->execute([
        $symbol,
        $data['price'] ?? 0,
        $data['change_24h'] ?? 0,
        $data['change_percentage_24h'] ?? 0,
        $data['high_24h'] ?? 0,
        $data['low_24h'] ?? 0,
        $data['volume_24h'] ?? 0,
        $data['market_cap'] ?? 0
    ]);
}

/**
 * Get mock price data
 */
function getMockPriceData($symbol) {
    $mock_prices = [
        'BTC' => 45000,
        'ETH' => 3000,
        'USDT' => 1.00,
        'BNB' => 300,
        'ADA' => 0.5,
        'XRP' => 0.6,
        'SOL' => 100,
        'DOT' => 25
    ];
    
    $base_price = $mock_prices[$symbol] ?? 100;
    $change_24h = rand(-10, 10);
    
    return [
        'symbol' => $symbol,
        'price' => $base_price + ($base_price * $change_24h / 100),
        'change_24h' => $change_24h,
        'change_percentage_24h' => $change_24h,
        'high_24h' => $base_price * 1.05,
        'low_24h' => $base_price * 0.95,
        'volume_24h' => rand(1000000000, 10000000000),
        'market_cap' => $base_price * rand(10000000, 100000000),
        'last_updated' => date('Y-m-d H:i:s')
    ];
}

/**
 * Get mock market data
 */
function getMockMarketData($symbol) {
    $mock_data = getMockPriceData($symbol);
    return array_merge($mock_data, [
        'updated_at' => date('Y-m-d H:i:s')
    ]);
}

/**
 * Get CoinGecko coin ID from symbol
 */
function getCoinId($symbol) {
    $coin_map = [
        'BTC' => 'bitcoin',
        'ETH' => 'ethereum',
        'USDT' => 'tether',
        'BNB' => 'binancecoin',
        'ADA' => 'cardano',
        'XRP' => 'ripple',
        'SOL' => 'solana',
        'DOT' => 'polkadot'
    ];
    
    return $coin_map[$symbol] ?? null;
}

/**
 * Get coin name from symbol
 */
function getCoinName($symbol) {
    $coin_names = [
        'BTC' => 'Bitcoin',
        'ETH' => 'Ethereum',
        'USDT' => 'Tether',
        'BNB' => 'Binance Coin',
        'ADA' => 'Cardano',
        'XRP' => 'Ripple',
        'SOL' => 'Solana',
        'DOT' => 'Polkadot'
    ];
    
    return $coin_names[$symbol] ?? $symbol;
}

?>