/**
 * Bitcoin Dashboard - API Functions
 * Handles all API calls and external service integrations
 */

class DashboardAPI {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.cache = new Map();
        this.requestQueue = new Map();
    }

    /**
     * Make HTTP request with error handling and caching
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const cacheKey = `${options.method || 'GET'}_${url}_${JSON.stringify(options.body || {})}`;
        
        // Return cached response if available and not expired
        if (options.cache !== false && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < (options.cacheTime || 30000)) {
                return cached.data;
            }
        }

        // Prevent duplicate requests
        if (this.requestQueue.has(cacheKey)) {
            return this.requestQueue.get(cacheKey);
        }

        const requestPromise = this._makeRequest(url, options);
        this.requestQueue.set(cacheKey, requestPromise);

        try {
            const response = await requestPromise;
            
            // Cache successful responses
            if (options.cache !== false && response.success) {
                this.cache.set(cacheKey, {
                    data: response,
                    timestamp: Date.now()
                });
            }
            
            return response;
        } finally {
            this.requestQueue.delete(cacheKey);
        }
    }

    /**
     * Internal request method
     */
    async _makeRequest(url, options) {
        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`API Error for ${url}:`, error);
            throw error;
        }
    }

    /**
     * Save BTC conversion data
     */
    async saveBTCConversion(conversionData) {
        return await this.request('/save_btc.php', {
            method: 'POST',
            body: conversionData,
            cache: false
        });
    }

    /**
     * Get BTC conversion history
     */
    async getBTCConversions(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/get_btc.php${queryString ? `?${queryString}` : ''}`;
        
        return await this.request(endpoint, {
            cacheTime: 60000 // Cache for 1 minute
        });
    }

    /**
     * Get live Bitcoin price from CoinGecko
     */
    async getBitcoinPrice() {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true');
            const data = await response.json();
            
            if (data.bitcoin) {
                return {
                    success: true,
                    data: {
                        price: data.bitcoin.usd,
                        change_24h: data.bitcoin.usd_24h_change,
                        volume_24h: data.bitcoin.usd_24h_vol
                    }
                };
            }
            
            throw new Error('Invalid price data received');
        } catch (error) {
            console.error('Failed to fetch Bitcoin price:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get comprehensive market data
     */
    async getMarketData() {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,tether&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h');
            const data = await response.json();
            
            return {
                success: true,
                data: data.map(coin => ({
                    id: coin.id,
                    symbol: coin.symbol.toUpperCase(),
                    name: coin.name,
                    price: coin.current_price,
                    change_24h: coin.price_change_percentage_24h,
                    market_cap: coin.market_cap,
                    volume: coin.total_volume,
                    high_24h: coin.high_24h,
                    low_24h: coin.low_24h
                }))
            };
        } catch (error) {
            console.error('Failed to fetch market data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get wallet balance (mock implementation for demo)
     */
    async getWalletBalance(address) {
        try {
            // In a real implementation, this would call BlockCypher or Electrum
            // For demo purposes, return mock data
            const mockBalance = Utils.storage.get('wallet_balance', 0.12345678);
            
            return {
                success: true,
                data: {
                    address: address,
                    balance: mockBalance,
                    unconfirmed_balance: 0,
                    total_received: mockBalance,
                    total_sent: 0,
                    n_tx: 1
                }
            };
        } catch (error) {
            console.error('Failed to fetch wallet balance:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get transaction history (mock implementation)
     */
    async getTransactionHistory(address, limit = 10) {
        try {
            // Mock transaction data
            const mockTransactions = [
                {
                    hash: 'abc123...def456',
                    block_height: 800000,
                    block_time: new Date(Date.now() - 86400000).toISOString(),
                    inputs: [{ addresses: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'] }],
                    outputs: [{ addresses: [address], value: 12345678 }],
                    value: 12345678,
                    confirmations: 6
                }
            ];

            return {
                success: true,
                data: mockTransactions.slice(0, limit)
            };
        } catch (error) {
            console.error('Failed to fetch transaction history:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send Bitcoin transaction (mock implementation)
     */
    async sendBitcoin(toAddress, amount, fee = 'normal') {
        try {
            // Validate inputs
            if (!Utils.isValidBitcoinAddress(toAddress)) {
                throw new Error('Invalid Bitcoin address');
            }

            if (!Utils.isValidBTCAmount(amount)) {
                throw new Error('Invalid amount');
            }

            // Mock transaction sending
            const mockTxHash = 'tx_' + Utils.generateId();
            
            // Update local balance
            const currentBalance = Utils.storage.get('wallet_balance', 0);
            const newBalance = Math.max(0, currentBalance - amount - 0.0001); // Subtract amount + fee
            Utils.storage.set('wallet_balance', newBalance);

            return {
                success: true,
                data: {
                    tx_hash: mockTxHash,
                    amount: amount,
                    fee: 0.0001,
                    to_address: toAddress,
                    status: 'pending'
                }
            };
        } catch (error) {
            console.error('Failed to send Bitcoin:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get network fee estimates
     */
    async getFeeEstimates() {
        try {
            // Mock fee estimates (in satoshis per byte)
            return {
                success: true,
                data: {
                    slow: { sat_per_byte: 10, time_estimate: '60+ minutes' },
                    normal: { sat_per_byte: 20, time_estimate: '30 minutes' },
                    fast: { sat_per_byte: 50, time_estimate: '10 minutes' }
                }
            };
        } catch (error) {
            console.error('Failed to fetch fee estimates:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Authenticate user (mock implementation)
     */
    async authenticateUser(credentials) {
        try {
            // Mock authentication
            if (credentials.username && credentials.password) {
                const userData = {
                    id: 1,
                    username: credentials.username,
                    email: `${credentials.username}@example.com`,
                    wallet_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
                    btc_balance: 0.12345678,
                    usd_balance: 1000.00,
                    withdrawal_timer: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
                };

                Utils.storage.set('user_data', userData);
                Utils.storage.set('auth_token', 'mock_jwt_token');

                return {
                    success: true,
                    data: userData
                };
            }

            throw new Error('Invalid credentials');
        } catch (error) {
            console.error('Authentication failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get user profile
     */
    async getUserProfile() {
        try {
            const userData = Utils.storage.get('user_data');
            if (!userData) {
                throw new Error('User not authenticated');
            }

            return {
                success: true,
                data: userData
            };
        } catch (error) {
            console.error('Failed to get user profile:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update user profile
     */
    async updateUserProfile(updates) {
        try {
            const userData = Utils.storage.get('user_data');
            if (!userData) {
                throw new Error('User not authenticated');
            }

            const updatedData = { ...userData, ...updates, updated_at: new Date().toISOString() };
            Utils.storage.set('user_data', updatedData);

            return {
                success: true,
                data: updatedData
            };
        } catch (error) {
            console.error('Failed to update user profile:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate new wallet address
     */
    async generateWalletAddress() {
        try {
            // Mock address generation
            const mockAddress = 'bc1q' + Math.random().toString(36).substr(2, 39);
            
            return {
                success: true,
                data: {
                    address: mockAddress,
                    private_key_encrypted: 'encrypted_private_key_here'
                }
            };
        } catch (error) {
            console.error('Failed to generate wallet address:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('API cache cleared');
    }

    /**
     * Get cache status
     */
    getCacheStatus() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            memory_usage: JSON.stringify(Array.from(this.cache.entries())).length
        };
    }
}

// Initialize API instance
const API = new DashboardAPI();

// Export for global use
window.API = API;