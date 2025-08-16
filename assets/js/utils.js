/**
 * Bitcoin Dashboard - Utility Functions
 * Core utility functions for the dashboard application
 */

// Configuration
const CONFIG = {
    API_BASE_URL: '/api',
    REFRESH_INTERVALS: {
        PRICE: 30000,        // 30 seconds
        BALANCE: 60000,      // 1 minute
        TRANSACTIONS: 120000 // 2 minutes
    },
    DEFAULTS: {
        WITHDRAWAL_TIMER: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        BTC_DECIMALS: 8,
        USD_DECIMALS: 2
    }
};

// Utility Functions
const Utils = {
    /**
     * Format numbers with proper decimals and localization
     */
    formatNumber: (number, decimals = 2, locale = 'en-US') => {
        if (number === null || number === undefined || isNaN(number)) {
            return '0.00';
        }
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    },

    /**
     * Format currency values
     */
    formatCurrency: (amount, currency = 'USD', locale = 'en-US') => {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return '$0.00';
        }
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    /**
     * Format BTC amounts with proper precision
     */
    formatBTC: (amount, showUnit = true) => {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return showUnit ? '0.00000000 BTC' : '0.00000000';
        }
        const formatted = Utils.formatNumber(amount, CONFIG.DEFAULTS.BTC_DECIMALS);
        return showUnit ? `${formatted} BTC` : formatted;
    },

    /**
     * Format percentage changes
     */
    formatPercentage: (percentage, showSign = true) => {
        if (percentage === null || percentage === undefined || isNaN(percentage)) {
            return '0.00%';
        }
        const sign = showSign && percentage > 0 ? '+' : '';
        return `${sign}${Utils.formatNumber(percentage, 2)}%`;
    },

    /**
     * Truncate Bitcoin address for display
     */
    truncateAddress: (address, startChars = 6, endChars = 6) => {
        if (!address || address.length <= startChars + endChars) {
            return address;
        }
        return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
    },

    /**
     * Format timestamps to relative time
     */
    formatRelativeTime: (timestamp) => {
        const now = new Date();
        const date = new Date(timestamp);
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    },

    /**
     * Format countdown timer
     */
    formatCountdown: (milliseconds) => {
        if (milliseconds <= 0) {
            return { hours: 0, minutes: 0, seconds: 0 };
        }

        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

        return { hours, minutes, seconds };
    },

    /**
     * Copy text to clipboard
     */
    copyToClipboard: async (text) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const success = document.execCommand('copy');
                textArea.remove();
                return success;
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    },

    /**
     * Validate Bitcoin address
     */
    isValidBitcoinAddress: (address) => {
        if (!address || typeof address !== 'string') {
            return false;
        }

        // Basic Bitcoin address validation patterns
        const patterns = [
            /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Legacy (P2PKH/P2SH)
            /^bc1[a-z0-9]{39,59}$/,              // Bech32 (P2WPKH/P2WSH)
            /^bc1p[a-z0-9]{58}$/                 // Bech32m (P2TR)
        ];

        return patterns.some(pattern => pattern.test(address));
    },

    /**
     * Validate BTC amount
     */
    isValidBTCAmount: (amount, maxAmount = null, minAmount = 0.00000001) => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            return false;
        }
        if (numAmount < minAmount) {
            return false;
        }
        if (maxAmount !== null && numAmount > maxAmount) {
            return false;
        }
        return true;
    },

    /**
     * Debounce function calls
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function calls
     */
    throttle: (func, limit) => {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Generate unique ID
     */
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Safe JSON parse
     */
    safeJSONParse: (str, defaultValue = null) => {
        try {
            return JSON.parse(str);
        } catch (error) {
            console.warn('Failed to parse JSON:', error);
            return defaultValue;
        }
    },

    /**
     * Check if element is in viewport
     */
    isInViewport: (element) => {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Smooth scroll to element
     */
    scrollToElement: (element, offset = 0) => {
        const elementPosition = element.offsetTop;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    },

    /**
     * Add event listener with cleanup
     */
    addEventListenerWithCleanup: (element, event, handler, options = {}) => {
        element.addEventListener(event, handler, options);
        return () => element.removeEventListener(event, handler, options);
    },

    /**
     * Create loading state for elements
     */
    setLoadingState: (element, isLoading = true) => {
        if (isLoading) {
            element.classList.add('loading');
            element.style.opacity = '0.5';
            element.style.pointerEvents = 'none';
        } else {
            element.classList.remove('loading');
            element.style.opacity = '';
            element.style.pointerEvents = '';
        }
    },

    /**
     * Handle errors with user feedback
     */
    handleError: (error, context = '') => {
        console.error(`Error ${context}:`, error);
        
        let message = 'An unexpected error occurred.';
        if (error.message) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }

        // Show error toast
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        }

        return message;
    },

    /**
     * Local storage helpers
     */
    storage: {
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.warn('Failed to save to localStorage:', error);
                return false;
            }
        },

        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.warn('Failed to read from localStorage:', error);
                return defaultValue;
            }
        },

        remove: (key) => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.warn('Failed to remove from localStorage:', error);
                return false;
            }
        },

        clear: () => {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.warn('Failed to clear localStorage:', error);
                return false;
            }
        }
    },

    /**
     * Animation helpers
     */
    animate: {
        fadeIn: (element, duration = 300) => {
            element.style.opacity = '0';
            element.style.display = 'block';
            
            const start = performance.now();
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = progress;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        },

        fadeOut: (element, duration = 300, callback = null) => {
            const start = performance.now();
            const startOpacity = parseFloat(getComputedStyle(element).opacity);
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = startOpacity * (1 - progress);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                    if (callback) callback();
                }
            };
            
            requestAnimationFrame(animate);
        },

        slideDown: (element, duration = 300) => {
            element.style.height = '0';
            element.style.overflow = 'hidden';
            element.style.display = 'block';
            
            const targetHeight = element.scrollHeight;
            const start = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.height = (targetHeight * progress) + 'px';
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.height = '';
                    element.style.overflow = '';
                }
            };
            
            requestAnimationFrame(animate);
        }
    }
};

// Export for use in other files
window.Utils = Utils;
window.CONFIG = CONFIG;