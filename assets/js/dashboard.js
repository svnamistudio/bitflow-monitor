/**
 * Bitcoin Dashboard - Main Application Logic
 * Handles UI interactions, data updates, and user interface management
 */

class BitcoinDashboard {
    constructor() {
        this.isInitialized = false;
        this.refreshIntervals = {};
        this.countdownInterval = null;
        this.userData = null;
        this.withdrawalTimer = null;
        this.showFullAddress = false;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Initialize the dashboard
     */
    async init() {
        if (this.isInitialized) return;
        
        try {
            console.log('Initializing Bitcoin Dashboard...');
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Load user data
            await this.loadUserData();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize UI components
            this.initializeUI();
            
            // Start data refresh intervals
            this.startRefreshIntervals();
            
            // Hide loading screen and show dashboard
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            console.log('Dashboard initialized successfully');
            
            // Show welcome toast
            this.showToast('Welcome to your Bitcoin Dashboard!', 'success');
            
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.showToast('Failed to load dashboard. Please refresh the page.', 'error');
            this.hideLoadingScreen();
        }
    }

    /**
     * Load user data from storage or API
     */
    async loadUserData() {
        try {
            // Try to get user data from localStorage first
            this.userData = Utils.storage.get('user_data');
            
            if (!this.userData) {
                // Mock user authentication for demo
                const authResult = await API.authenticateUser({
                    username: 'demo_user',
                    password: 'demo_password'
                });
                
                if (authResult.success) {
                    this.userData = authResult.data;
                } else {
                    throw new Error('Authentication failed');
                }
            }
            
            // Set withdrawal timer
            if (this.userData.withdrawal_timer) {
                this.withdrawalTimer = new Date(this.userData.withdrawal_timer).getTime();
            } else {
                // Set 24 hours from now if not set
                this.withdrawalTimer = Date.now() + CONFIG.DEFAULTS.WITHDRAWAL_TIMER;
                this.userData.withdrawal_timer = this.withdrawalTimer;
                Utils.storage.set('user_data', this.userData);
            }
            
        } catch (error) {
            console.error('Failed to load user data:', error);
            throw error;
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Header buttons
        this.addClickListener('logout-btn', () => this.logout());
        
        // Balance card
        this.addClickListener('refresh-balance', () => this.refreshBalance());
        this.addClickListener('copy-address', () => this.copyWalletAddress());
        this.addClickListener('toggle-address', () => this.toggleAddressDisplay());
        this.addClickListener('fund-btn', () => this.showFundingOptions());
        this.addClickListener('withdraw-btn', () => this.showWithdrawModal());
        
        // Price card
        this.addClickListener('refresh-price', () => this.refreshPriceData());
        
        // Market rates
        this.addClickListener('refresh-rates', () => this.refreshMarketRates());
        
        // Funding options
        this.addClickListener('quick-fund', () => this.quickFund());
        this.addClickListener('contact-support', () => this.contactSupport());
        
        // Support center
        this.addClickListener('start-chat', () => this.startLiveChat());
        this.addClickListener('view-faq', () => this.viewFAQ());
        
        // Transaction history
        this.addClickListener('refresh-history', () => this.refreshTransactionHistory());
        this.addClickListener('refresh-conversions', () => this.refreshConversionHistory());
        
        // Modal controls
        this.setupModalControls();
        
        // Form submissions
        this.setupFormHandlers();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    /**
     * Add click event listener with error handling
     */
    addClickListener(elementId, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('click', async (event) => {
                event.preventDefault();
                try {
                    await handler(event);
                } catch (error) {
                    Utils.handleError(error, `handling click on ${elementId}`);
                }
            });
        }
    }

    /**
     * Initialize UI components
     */
    async initializeUI() {
        // Update user info
        this.updateUserInfo();
        
        // Load initial data
        await Promise.all([
            this.refreshBalance(),
            this.refreshPriceData(),
            this.refreshMarketRates(),
            this.refreshTransactionHistory(),
            this.refreshConversionHistory()
        ]);
        
        // Start countdown timer
        this.startCountdownTimer();
    }

    /**
     * Update user information in UI
     */
    updateUserInfo() {
        if (!this.userData) return;
        
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = this.userData.username || 'Investor';
        }
        
        // Update wallet address
        this.updateWalletAddress();
    }

    /**
     * Update wallet address display
     */
    updateWalletAddress() {
        const addressElement = document.getElementById('wallet-address');
        if (!addressElement || !this.userData?.wallet_address) return;
        
        const address = this.userData.wallet_address;
        addressElement.textContent = this.showFullAddress 
            ? address 
            : Utils.truncateAddress(address);
        
        // Update toggle button icon
        const toggleBtn = document.getElementById('toggle-address');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = this.showFullAddress ? 'fas fa-eye-slash' : 'fas fa-eye';
            }
        }
    }

    /**
     * Refresh balance data
     */
    async refreshBalance() {
        const balanceCard = document.querySelector('.balance-card');
        Utils.setLoadingState(balanceCard, true);
        
        try {
            const walletData = await API.getWalletBalance(this.userData.wallet_address);
            
            if (walletData.success) {
                const btcBalance = walletData.data.balance;
                
                // Update BTC balance
                const btcBalanceElement = document.getElementById('btc-balance');
                if (btcBalanceElement) {
                    btcBalanceElement.textContent = Utils.formatBTC(btcBalance, false);
                }
                
                // Get current BTC price and calculate USD value
                const priceData = await API.getBitcoinPrice();
                if (priceData.success) {
                    const usdValue = btcBalance * priceData.data.price;
                    const usdBalanceElement = document.getElementById('usd-balance');
                    if (usdBalanceElement) {
                        usdBalanceElement.textContent = Utils.formatNumber(usdValue, 2);
                    }
                }
                
                // Update available balance in withdraw modal
                const availableBalanceElement = document.getElementById('available-balance');
                if (availableBalanceElement) {
                    availableBalanceElement.textContent = Utils.formatBTC(btcBalance, false);
                }
                
                // Update user data
                this.userData.btc_balance = btcBalance;
                Utils.storage.set('user_data', this.userData);
                
            } else {
                throw new Error(walletData.error || 'Failed to fetch balance');
            }
            
        } catch (error) {
            Utils.handleError(error, 'refreshing balance');
        } finally {
            Utils.setLoadingState(balanceCard, false);
        }
    }

    /**
     * Refresh price data
     */
    async refreshPriceData() {
        const priceCard = document.querySelector('.price-card');
        Utils.setLoadingState(priceCard, true);
        
        try {
            const priceData = await API.getBitcoinPrice();
            
            if (priceData.success) {
                const { price, change_24h, volume_24h } = priceData.data;
                
                // Update current price
                const priceElement = document.getElementById('btc-price');
                if (priceElement) {
                    priceElement.textContent = Utils.formatNumber(price, 2);
                }
                
                // Update price change
                const changeElement = document.getElementById('price-change');
                if (changeElement) {
                    const changePercent = Utils.formatPercentage(change_24h);
                    const changeAmount = Utils.formatCurrency(Math.abs(change_24h * price / 100));
                    
                    const percentSpan = changeElement.querySelector('.change-percent');
                    const amountSpan = changeElement.querySelector('.change-amount');
                    
                    if (percentSpan) percentSpan.textContent = changePercent;
                    if (amountSpan) {
                        amountSpan.textContent = `${change_24h >= 0 ? '+' : '-'}${changeAmount}`;
                    }
                    
                    // Update color based on change
                    changeElement.className = `price-change ${change_24h >= 0 ? 'positive' : 'negative'}`;
                }
                
                // Update volume
                const volumeElement = document.getElementById('price-volume');
                if (volumeElement) {
                    volumeElement.textContent = Utils.formatCurrency(volume_24h, 'USD');
                }
                
                // Update last updated time
                const updatedElement = document.getElementById('price-updated');
                if (updatedElement) {
                    updatedElement.textContent = new Date().toLocaleTimeString();
                }
                
            } else {
                throw new Error(priceData.error || 'Failed to fetch price data');
            }
            
        } catch (error) {
            Utils.handleError(error, 'refreshing price data');
        } finally {
            Utils.setLoadingState(priceCard, false);
        }
    }

    /**
     * Refresh market rates
     */
    async refreshMarketRates() {
        const ratesCard = document.querySelector('.market-rates-card');
        Utils.setLoadingState(ratesCard, true);
        
        try {
            const marketData = await API.getMarketData();
            
            if (marketData.success) {
                const ratesList = document.getElementById('market-rates-list');
                if (ratesList) {
                    ratesList.innerHTML = '';
                    
                    marketData.data.forEach(coin => {
                        const rateItem = this.createRateItem(coin);
                        ratesList.appendChild(rateItem);
                    });
                }
            } else {
                throw new Error(marketData.error || 'Failed to fetch market data');
            }
            
        } catch (error) {
            Utils.handleError(error, 'refreshing market rates');
        } finally {
            Utils.setLoadingState(ratesCard, false);
        }
    }

    /**
     * Create market rate item element
     */
    createRateItem(coin) {
        const item = document.createElement('div');
        item.className = 'rate-item';
        
        const changeClass = coin.change_24h >= 0 ? 'positive' : 'negative';
        const changePercent = Utils.formatPercentage(coin.change_24h);
        
        item.innerHTML = `
            <div class="rate-info">
                <div class="rate-symbol">${coin.symbol}</div>
                <div class="rate-name">${coin.name}</div>
            </div>
            <div class="rate-values">
                <div class="rate-price">${Utils.formatCurrency(coin.price)}</div>
                <div class="rate-change ${changeClass}">${changePercent}</div>
            </div>
        `;
        
        return item;
    }

    /**
     * Refresh transaction history
     */
    async refreshTransactionHistory() {
        const historyCard = document.querySelector('.history-card');
        Utils.setLoadingState(historyCard, true);
        
        try {
            const historyData = await API.getTransactionHistory(this.userData.wallet_address);
            
            if (historyData.success) {
                const historyList = document.getElementById('transaction-history');
                if (historyList) {
                    historyList.innerHTML = '';
                    
                    if (historyData.data.length === 0) {
                        historyList.innerHTML = '<div class="no-data">No transactions found</div>';
                    } else {
                        historyData.data.forEach(tx => {
                            const txItem = this.createTransactionItem(tx);
                            historyList.appendChild(txItem);
                        });
                    }
                }
            } else {
                throw new Error(historyData.error || 'Failed to fetch transaction history');
            }
            
        } catch (error) {
            Utils.handleError(error, 'refreshing transaction history');
        } finally {
            Utils.setLoadingState(historyCard, false);
        }
    }

    /**
     * Create transaction item element
     */
    createTransactionItem(tx) {
        const item = document.createElement('div');
        const isIncoming = tx.outputs.some(output => 
            output.addresses.includes(this.userData.wallet_address)
        );
        
        item.className = `transaction-item ${isIncoming ? 'deposit' : 'withdrawal'}`;
        
        const amount = tx.value / 100000000; // Convert satoshis to BTC
        const time = Utils.formatRelativeTime(tx.block_time);
        
        item.innerHTML = `
            <div class="item-info">
                <div class="item-type">${isIncoming ? 'Deposit' : 'Withdrawal'}</div>
                <div class="item-time">${time}</div>
            </div>
            <div class="item-amount">
                <div class="item-value">${Utils.formatBTC(amount, false)}</div>
                <div class="item-currency">BTC</div>
            </div>
        `;
        
        // Add click handler to show transaction details
        item.addEventListener('click', () => {
            this.showTransactionDetails(tx);
        });
        
        return item;
    }

    /**
     * Refresh conversion history
     */
    async refreshConversionHistory() {
        const conversionCard = document.querySelector('.conversion-card');
        Utils.setLoadingState(conversionCard, true);
        
        try {
            const conversionData = await API.getBTCConversions({ limit: 10 });
            
            if (conversionData.success) {
                const conversionList = document.getElementById('conversion-history');
                if (conversionList) {
                    conversionList.innerHTML = '';
                    
                    if (conversionData.data.length === 0) {
                        conversionList.innerHTML = '<div class="no-data">No conversions found</div>';
                    } else {
                        conversionData.data.forEach(conversion => {
                            const conversionItem = this.createConversionItem(conversion);
                            conversionList.appendChild(conversionItem);
                        });
                    }
                }
            } else {
                throw new Error(conversionData.error || 'Failed to fetch conversion history');
            }
            
        } catch (error) {
            Utils.handleError(error, 'refreshing conversion history');
        } finally {
            Utils.setLoadingState(conversionCard, false);
        }
    }

    /**
     * Create conversion item element
     */
    createConversionItem(conversion) {
        const item = document.createElement('div');
        item.className = `conversion-item ${conversion.transaction_type}`;
        
        const time = Utils.formatRelativeTime(conversion.timestamp);
        
        item.innerHTML = `
            <div class="item-info">
                <div class="item-type">${conversion.transaction_type}</div>
                <div class="item-time">${time}</div>
            </div>
            <div class="item-amount">
                <div class="item-value">${conversion.btc_amount} BTC</div>
                <div class="item-currency">${conversion.converted_amount} ${conversion.currency}</div>
            </div>
        `;
        
        return item;
    }

    /**
     * Start countdown timer
     */
    startCountdownTimer() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        this.countdownInterval = setInterval(() => {
            this.updateCountdown();
        }, 1000);
        
        // Initial update
        this.updateCountdown();
    }

    /**
     * Update countdown display
     */
    updateCountdown() {
        const now = Date.now();
        const timeLeft = Math.max(0, this.withdrawalTimer - now);
        
        const { hours, minutes, seconds } = Utils.formatCountdown(timeLeft);
        
        // Update countdown display
        const hoursElement = document.getElementById('countdown-hours');
        const minutesElement = document.getElementById('countdown-minutes');
        const secondsElement = document.getElementById('countdown-seconds');
        
        if (hoursElement) hoursElement.textContent = hours.toString().padStart(2, '0');
        if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
        if (secondsElement) secondsElement.textContent = seconds.toString().padStart(2, '0');
        
        // Update progress bar
        const progressElement = document.getElementById('timer-progress');
        if (progressElement) {
            const totalTime = CONFIG.DEFAULTS.WITHDRAWAL_TIMER;
            const elapsed = totalTime - timeLeft;
            const progress = Math.min(100, (elapsed / totalTime) * 100);
            progressElement.style.width = `${progress}%`;
        }
        
        // Update withdraw button
        const withdrawBtn = document.getElementById('withdraw-btn');
        const timerBadge = document.getElementById('withdraw-timer');
        
        if (withdrawBtn && timerBadge) {
            if (timeLeft <= 0) {
                withdrawBtn.disabled = false;
                withdrawBtn.classList.remove('disabled');
                timerBadge.textContent = 'Available';
                timerBadge.style.background = 'var(--gradient-success)';
            } else {
                withdrawBtn.disabled = true;
                withdrawBtn.classList.add('disabled');
                timerBadge.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
    }

    /**
     * Start refresh intervals
     */
    startRefreshIntervals() {
        // Price updates every 30 seconds
        this.refreshIntervals.price = setInterval(() => {
            this.refreshPriceData();
        }, CONFIG.REFRESH_INTERVALS.PRICE);
        
        // Balance updates every minute
        this.refreshIntervals.balance = setInterval(() => {
            this.refreshBalance();
        }, CONFIG.REFRESH_INTERVALS.BALANCE);
        
        // Transaction history every 2 minutes
        this.refreshIntervals.transactions = setInterval(() => {
            this.refreshTransactionHistory();
        }, CONFIG.REFRESH_INTERVALS.TRANSACTIONS);
    }

    /**
     * Stop refresh intervals
     */
    stopRefreshIntervals() {
        Object.values(this.refreshIntervals).forEach(interval => {
            clearInterval(interval);
        });
        this.refreshIntervals = {};
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    /**
     * Copy wallet address to clipboard
     */
    async copyWalletAddress() {
        if (!this.userData?.wallet_address) {
            this.showToast('No wallet address available', 'error');
            return;
        }
        
        const success = await Utils.copyToClipboard(this.userData.wallet_address);
        if (success) {
            this.showToast('Wallet address copied to clipboard!', 'success');
        } else {
            this.showToast('Failed to copy address', 'error');
        }
    }

    /**
     * Toggle address display (full/truncated)
     */
    toggleAddressDisplay() {
        this.showFullAddress = !this.showFullAddress;
        this.updateWalletAddress();
    }

    /**
     * Show funding options
     */
    showFundingOptions() {
        this.showToast('Please use your wallet address to receive Bitcoin', 'info');
        
        // Scroll to funding options card
        const fundingCard = document.querySelector('.funding-card');
        if (fundingCard) {
            Utils.scrollToElement(fundingCard, 20);
        }
    }

    /**
     * Quick fund action
     */
    async quickFund() {
        // In a real app, this would redirect to payment processor
        this.showToast('Redirecting to payment processor...', 'info');
        
        // Mock funding completion
        setTimeout(() => {
            this.showToast('Demo: $100 funding completed! (This is a simulation)', 'success');
            
            // Update balance for demo
            if (this.userData) {
                this.userData.usd_balance += 100;
                Utils.storage.set('user_data', this.userData);
            }
        }, 2000);
    }

    /**
     * Contact support
     */
    contactSupport() {
        this.showToast('Contacting support team...', 'info');
        // In a real app, this would open a support ticket or chat
    }

    /**
     * Start live chat
     */
    startLiveChat() {
        this.showToast('Connecting to live chat...', 'info');
        // In a real app, this would open a chat widget
        
        setTimeout(() => {
            this.showToast('Chat system is not available in demo mode', 'warning');
        }, 1500);
    }

    /**
     * View FAQ
     */
    viewFAQ() {
        // In a real app, this would open FAQ page or modal
        this.showToast('FAQ section would open here', 'info');
    }

    /**
     * Show withdraw modal
     */
    showWithdrawModal() {
        if (Date.now() < this.withdrawalTimer) {
            this.showToast('Withdrawal not available yet. Please wait for the timer to expire.', 'warning');
            return;
        }
        
        const modal = document.getElementById('withdraw-modal');
        if (modal) {
            modal.classList.add('show');
            
            // Focus on first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    /**
     * Hide modal
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }

    /**
     * Setup modal controls
     */
    setupModalControls() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target.id);
            }
        });
        
        // Close modal buttons
        document.querySelectorAll('.modal-close, [data-modal]').forEach(button => {
            button.addEventListener('click', (e) => {
                const modalId = button.getAttribute('data-modal') || 
                    button.closest('.modal')?.id;
                if (modalId) {
                    this.hideModal(modalId);
                }
            });
        });
        
        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    this.hideModal(openModal.id);
                }
            }
        });
    }

    /**
     * Setup form handlers
     */
    setupFormHandlers() {
        const withdrawForm = document.getElementById('withdraw-form');
        if (withdrawForm) {
            withdrawForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleWithdrawal(e.target);
            });
        }
    }

    /**
     * Handle withdrawal form submission
     */
    async handleWithdrawal(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            // Disable form
            Utils.setLoadingState(form, true);
            submitBtn.textContent = 'Processing...';
            
            // Get form data
            const formData = new FormData(form);
            const address = formData.get('address') || document.getElementById('withdraw-address').value;
            const amount = parseFloat(formData.get('amount') || document.getElementById('withdraw-amount').value);
            const fee = formData.get('fee') || document.getElementById('withdraw-fee').value;
            
            // Validate inputs
            if (!Utils.isValidBitcoinAddress(address)) {
                throw new Error('Please enter a valid Bitcoin address');
            }
            
            if (!Utils.isValidBTCAmount(amount, this.userData.btc_balance)) {
                throw new Error('Please enter a valid amount');
            }
            
            if (amount > this.userData.btc_balance) {
                throw new Error('Insufficient balance');
            }
            
            // Send transaction
            const result = await API.sendBitcoin(address, amount, fee);
            
            if (result.success) {
                this.showToast(`Withdrawal initiated! Transaction ID: ${result.data.tx_hash}`, 'success');
                this.hideModal('withdraw-modal');
                form.reset();
                
                // Refresh balance
                await this.refreshBalance();
                await this.refreshTransactionHistory();
                
                // Save conversion record
                await this.saveConversion({
                    btc_amount: amount,
                    converted_amount: amount * (await this.getCurrentBTCPrice()),
                    currency: 'USD',
                    transaction_type: 'sell',
                    notes: `Withdrawal to ${Utils.truncateAddress(address)}`
                });
                
            } else {
                throw new Error(result.error || 'Withdrawal failed');
            }
            
        } catch (error) {
            Utils.handleError(error, 'processing withdrawal');
        } finally {
            Utils.setLoadingState(form, false);
            submitBtn.textContent = originalText;
        }
    }

    /**
     * Get current BTC price
     */
    async getCurrentBTCPrice() {
        try {
            const priceData = await API.getBitcoinPrice();
            return priceData.success ? priceData.data.price : 50000; // Fallback price
        } catch (error) {
            console.error('Failed to get current BTC price:', error);
            return 50000; // Fallback price
        }
    }

    /**
     * Save conversion record
     */
    async saveConversion(conversionData) {
        try {
            const result = await API.saveBTCConversion({
                user_id: this.userData.id,
                ...conversionData
            });
            
            if (result.success) {
                // Refresh conversion history
                await this.refreshConversionHistory();
            }
        } catch (error) {
            console.error('Failed to save conversion:', error);
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + R: Refresh data
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.refreshAllData();
            }
            
            // Ctrl/Cmd + C: Copy wallet address (when no input is focused)
            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && 
                !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                e.preventDefault();
                this.copyWalletAddress();
            }
            
            // W key: Show withdraw modal (when no input is focused)
            if (e.key.toLowerCase() === 'w' && 
                !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                this.showWithdrawModal();
            }
        });
    }

    /**
     * Refresh all data
     */
    async refreshAllData() {
        this.showToast('Refreshing all data...', 'info');
        
        try {
            await Promise.all([
                this.refreshBalance(),
                this.refreshPriceData(),
                this.refreshMarketRates(),
                this.refreshTransactionHistory(),
                this.refreshConversionHistory()
            ]);
            
            this.showToast('Data refreshed successfully!', 'success');
        } catch (error) {
            Utils.handleError(error, 'refreshing data');
        }
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const dashboard = document.getElementById('dashboard');
        
        if (loadingScreen) loadingScreen.style.display = 'flex';
        if (dashboard) dashboard.style.display = 'none';
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const dashboard = document.getElementById('dashboard');
        
        if (loadingScreen) {
            Utils.animate.fadeOut(loadingScreen, 300, () => {
                loadingScreen.style.display = 'none';
            });
        }
        
        if (dashboard) {
            dashboard.style.display = 'block';
            Utils.animate.fadeIn(dashboard, 300);
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 5000) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icons[type] || icons.info}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${titles[type] || titles.info}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add close handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Show with animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto remove
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
    }

    /**
     * Remove toast notification
     */
    removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * Show transaction details
     */
    showTransactionDetails(tx) {
        const message = `
            Transaction: ${tx.hash}<br>
            Block: ${tx.block_height}<br>
            Amount: ${Utils.formatBTC(tx.value / 100000000)}<br>
            Confirmations: ${tx.confirmations}
        `;
        
        this.showToast(message, 'info', 8000);
    }

    /**
     * Logout user
     */
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear user data
            Utils.storage.clear();
            
            // Stop intervals
            this.stopRefreshIntervals();
            
            // Show logout message
            this.showToast('You have been logged out successfully', 'success');
            
            // Reload page after delay
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stopRefreshIntervals();
        // Remove event listeners if needed
        this.isInitialized = false;
    }
}

// Initialize dashboard when page loads
const dashboard = new BitcoinDashboard();

// Export for global access
window.Dashboard = dashboard;