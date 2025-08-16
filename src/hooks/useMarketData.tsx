import { useState, useEffect, useCallback } from 'react';
import { MarketPrice } from '../types';
import { marketService } from '../services/bybit';

export const useMarketData = (refreshInterval = 30000) => {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [btcPrice, setBtcPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBTCPrice = useCallback(async () => {
    try {
      const price = await marketService.getBTCPrice();
      setBtcPrice(price);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch BTC price');
      console.error('Error fetching BTC price:', err);
    }
  }, []);

  const fetchMarketPrices = useCallback(async () => {
    setIsLoading(true);
    try {
      const marketPrices = await marketService.getMarketPrices();
      setPrices(marketPrices);
      
      // Update BTC price from market data if available
      const btcData = marketPrices.find(p => p.symbol === 'BTCUSDT');
      if (btcData) {
        setBtcPrice(btcData.price);
      }
      
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market prices');
      console.error('Error fetching market prices:', err);
      
      // Fallback to just BTC price if market prices fail
      await fetchBTCPrice();
    } finally {
      setIsLoading(false);
    }
  }, [fetchBTCPrice]);

  // Initial fetch
  useEffect(() => {
    fetchMarketPrices();
  }, [fetchMarketPrices]);

  // Set up refresh interval
  useEffect(() => {
    const interval = setInterval(fetchMarketPrices, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMarketPrices, refreshInterval]);

  const getBTCPrice = () => btcPrice;

  const getPriceChange = (symbol: string) => {
    const price = prices.find(p => p.symbol === symbol);
    return {
      price: price?.price || 0,
      change: price?.change24h || 0,
      changePercent: price?.changePercent24h || 0
    };
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatBTC = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8
    }).format(amount) + ' BTC';
  };

  const calculateUSDValue = (btcAmount: number) => {
    return btcAmount * btcPrice;
  };

  return {
    prices,
    btcPrice,
    isLoading,
    error,
    lastUpdated,
    getBTCPrice,
    getPriceChange,
    formatCurrency,
    formatBTC,
    calculateUSDValue,
    refresh: fetchMarketPrices
  };
};