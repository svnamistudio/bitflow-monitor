// Bitcoin Investment Dashboard JavaScript

// Global Variables
let priceData = {
    bitcoin: { price: 123074, change: 2.59 },
    ethereum: { price: 4747, change: 3.46 },
    tether: { price: 1.00, change: 0.06 }
};

let userBalance = 1.25847332;
let walletAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
let showFullAddress = false;
let withdrawEnabled = false;

// Timer variables
let timeLeft = {
    hours: 23,
    minutes: 45,
    seconds: 30
};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    updatePriceDisplay();
    updateMarketRates();
    startCountdown();
    startPriceUpdater();
    updateLastUpdated();
});

// Toast Notification System
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toastId = 'toast-' + Date.now();
    
    const toastHTML = `
        <div class="toast toast-${type}" role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
            <div class="toast-header bg-transparent border-0">
                <i class="fas fa-${getToastIcon(type)} me-2"></i>
                <strong class="me-auto">${getToastTitle(type)}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toastElement) {
            toastElement.remove();
        }
    }, 5000);
}

function getToastIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-triangle';
        case 'info': return 'info-circle';
        default: return 'info-circle';
    }
}

function getToastTitle(type) {
    switch(type) {
        case 'success': return 'Success';
        case 'error': return 'Error';
        case 'info': return 'Info';
        default: return 'Notification';
    }
}

// Price Management
function updatePriceDisplay() {
    const btcPriceElement = document.getElementById('btcPrice');
    const priceChangeElement = document.getElementById('priceChange');
    const usdBalanceElement = document.getElementById('usdBalance');
    
    if (btcPriceElement) {
        btcPriceElement.textContent = `$${priceData.bitcoin.price.toLocaleString()}`;
    }
    
    if (priceChangeElement) {
        const isPositive = priceData.bitcoin.change > 0;
        const icon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
        const colorClass = isPositive ? 'text-success' : 'text-danger';
        const sign = isPositive ? '+' : '';
        
        priceChangeElement.innerHTML = `
            <i class="fas ${icon} ${colorClass} me-1"></i>
            <span class="${colorClass}">${sign}${priceData.bitcoin.change.toFixed(2)}%</span>
        `;
    }
    
    if (usdBalanceElement) {
        const usdValue = userBalance * priceData.bitcoin.price;
        usdBalanceElement.textContent = `≈ $${usdValue.toLocaleString()}`;
    }
}

function updateMarketRates() {
    const marketRatesContainer = document.getElementById('marketRates');
    if (!marketRatesContainer) return;
    
    const rates = [
        { symbol: 'BTC', name: 'Bitcoin', price: priceData.bitcoin.price, change: priceData.bitcoin.change, icon: '₿' },
        { symbol: 'ETH', name: 'Ethereum', price: priceData.ethereum.price, change: priceData.ethereum.change, icon: 'Ξ' },
        { symbol: 'USDT', name: 'Tether', price: priceData.tether.price, change: priceData.tether.change, icon: '₮' }
    ];
    
    let ratesHTML = '';
    rates.forEach(rate => {
        const isPositive = rate.change > 0;
        const icon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
        const colorClass = isPositive ? 'text-success' : 'text-danger';
        const sign = isPositive ? '+' : '';
        const priceDisplay = rate.symbol === 'USDT' ? rate.price.toFixed(4) : rate.price.toLocaleString();
        
        ratesHTML += `
            <div class="market-rate-item d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-3">
                    <div class="h4 fw-bold text-gold mb-0">${rate.icon}</div>
                    <div>
                        <div class="fw-semibold">${rate.symbol}</div>
                        <div class="small text-muted">${rate.name}</div>
                    </div>
                </div>
                <div class="text-end">
                    <div class="fw-semibold">$${priceDisplay}</div>
                    <div class="d-flex align-items-center gap-1 small ${colorClass}">
                        <i class="fas ${icon}"></i>
                        ${sign}${rate.change.toFixed(2)}%
                    </div>
                </div>
            </div>
        `;
    });
    
    marketRatesContainer.innerHTML = ratesHTML;
}

function updateLastUpdated() {
    const lastUpdatedElement = document.getElementById('lastUpdated');
    if (lastUpdatedElement) {
        lastUpdatedElement.textContent = new Date().toLocaleTimeString();
    }
}

// API Price Fetching
async function fetchRealPrices() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd&include_24hr_change=true');
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        // Update price data
        priceData.bitcoin.price = Math.round(data.bitcoin.usd);
        priceData.bitcoin.change = data.bitcoin.usd_24h_change;
        priceData.ethereum.price = Math.round(data.ethereum.usd * 100) / 100;
        priceData.ethereum.change = data.ethereum.usd_24h_change;
        priceData.tether.price = data.tether.usd;
        priceData.tether.change = data.tether.usd_24h_change;
        
        updatePriceDisplay();
        updateMarketRates();
        updateLastUpdated();
        
    } catch (error) {
        console.error('Failed to fetch prices:', error);
        
        // Simulate price movement for demo
        priceData.bitcoin.price += Math.round((Math.random() - 0.5) * 100);
        priceData.bitcoin.change += (Math.random() - 0.5) * 2;
        priceData.ethereum.price += Math.round((Math.random() - 0.5) * 50 * 100) / 100;
        priceData.ethereum.change += (Math.random() - 0.5) * 2;
        priceData.tether.change += (Math.random() - 0.5) * 0.1;
        
        updatePriceDisplay();
        updateMarketRates();
        updateLastUpdated();
    }
}

function startPriceUpdater() {
    // Initial fetch
    fetchRealPrices();
    
    // Update every 30 seconds
    setInterval(fetchRealPrices, 30000);
}

// Countdown Timer
function startCountdown() {
    setInterval(() => {
        if (timeLeft.seconds > 0) {
            timeLeft.seconds--;
        } else if (timeLeft.minutes > 0) {
            timeLeft.minutes--;
            timeLeft.seconds = 59;
        } else if (timeLeft.hours > 0) {
            timeLeft.hours--;
            timeLeft.minutes = 59;
            timeLeft.seconds = 59;
        } else {
            // Reset timer
            timeLeft.hours = 23;
            timeLeft.minutes = 59;
            timeLeft.seconds = 59;
        }
        
        updateCountdownDisplay();
    }, 1000);
}

function updateCountdownDisplay() {
    const countdownElement = document.getElementById('countdown');
    if (countdownElement) {
        const hours = String(timeLeft.hours).padStart(2, '0');
        const minutes = String(timeLeft.minutes).padStart(2, '0');
        const seconds = String(timeLeft.seconds).padStart(2, '0');
        countdownElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
}

// Wallet Address Management
function toggleFullAddress() {
    showFullAddress = !showFullAddress;
    const addressElement = document.getElementById('walletAddress');
    
    if (addressElement) {
        if (showFullAddress) {
            addressElement.textContent = walletAddress;
        } else {
            addressElement.textContent = `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}`;
        }
    }
}

function copyAddress() {
    navigator.clipboard.writeText(walletAddress).then(() => {
        showToast('Wallet address copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy address', 'error');
    });
}

// Event Handlers
function handleLogout() {
    showToast('Logging out...', 'info');
    // Add logout logic here
}

function handleFund() {
    showToast('Funding request initiated. Redirecting to payment options...', 'success');
    // Add funding logic here
}

function handleWithdraw() {
    if (!withdrawEnabled) {
        showToast('Withdrawals are currently disabled. Please contact support to enable.', 'error');
        return;
    }
    showToast('Withdraw request submitted for review.', 'info');
    // Add withdrawal logic here
}

function handleContactSupport() {
    showToast('Support team will contact you within 24 hours for fiat funding options.', 'info');
    // Add support contact logic here
}

function handleQuickFund() {
    showToast('Redirecting to secure payment gateway...', 'info');
    // Add quick funding logic here
}

function handleOpenChat() {
    showToast('Opening support chat...', 'info');
    // Add chat opening logic here
    // In a real app, this would initialize Freshchat widget
}

// Enable withdraw button (for testing)
function enableWithdraw() {
    withdrawEnabled = true;
    const withdrawBtn = document.getElementById('withdrawBtn');
    if (withdrawBtn) {
        withdrawBtn.disabled = false;
        withdrawBtn.classList.remove('btn-secondary');
        withdrawBtn.classList.add('btn-danger');
    }
    showToast('Withdraw functionality enabled', 'success');
}

// Utility Functions
function formatNumber(num, decimals = 2) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
}

function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Console commands for testing
window.enableWithdraw = enableWithdraw;
window.priceData = priceData;

console.log('🚀 Bitcoin Dashboard loaded successfully!');
console.log('💡 Type "enableWithdraw()" in console to enable withdraw button');
console.log('📊 Access price data with "priceData" variable');