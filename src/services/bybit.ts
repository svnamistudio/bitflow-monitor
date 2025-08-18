// Bybit API service (frontend calls to backend proxy)
import { BYBIT_CONFIG, BACKEND_ENDPOINTS } from './config';
import { MarketPrice, DepositAddress, WithdrawalRequest } from '../types';

// Public market data (safe to call from frontend)
export const marketService = {
  async getBTCPrice(): Promise<number> {
    try {
      const url = `${BYBIT_CONFIG.REST_BASE}${BYBIT_CONFIG.ENDPOINTS.TICKERS}?category=spot&symbol=BTCUSDT`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch BTC price');
      
      const data = await response.json();
      const price = data?.result?.list?.[0]?.lastPrice;
      return price ? Number(price) : 0;
    } catch (error) {
      console.error('Error fetching BTC price:', error);
      return 0;
    }
  },

  async getMarketPrices(): Promise<MarketPrice[]> {
    try {
      // Call your backend endpoint that fetches from Bybit
      const response = await fetch(BACKEND_ENDPOINTS.MARKET_PRICES);
      if (!response.ok) throw new Error('Failed to fetch market prices');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching market prices:', error);
      return [];
    }
  }
};

// Wallet operations (requires backend proxy for security)
export const walletService = {
  async requestDepositAddress(userId: string): Promise<DepositAddress> {
    try {
      const response = await fetch(BACKEND_ENDPOINTS.DEPOSIT_ADDRESS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          coin: 'BTC',
          chainType: 'BTC'
        })
      });

      if (!response.ok) throw new Error('Failed to request deposit address');
      return await response.json();
    } catch (error) {
      console.error('Error requesting deposit address:', error);
      throw error;
    }
  },

  async checkDeposits(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`${BACKEND_ENDPOINTS.DEPOSIT_RECORDS}?userId=${userId}&coin=BTC`);
      if (!response.ok) throw new Error('Failed to check deposits');
      
      return await response.json();
    } catch (error) {
      console.error('Error checking deposits:', error);
      return [];
    }
  },

  async createWithdrawal(request: WithdrawalRequest): Promise<any> {
    try {
      const response = await fetch(BACKEND_ENDPOINTS.WITHDRAW, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) throw new Error('Failed to create withdrawal');
      return await response.json();
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      throw error;
    }
  }
};

// WebSocket for real-time price updates (optional)
export class BybitWebSocket {
  private ws: WebSocket | null = null;
  private subscriptions: Set<string> = new Set();

  connect(onMessage: (data: any) => void) {
    this.ws = new WebSocket(BYBIT_CONFIG.WS_PUBLIC);
    
    this.ws.onopen = () => {
      console.log('Bybit WebSocket connected');
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    this.ws.onclose = () => {
      console.log('Bybit WebSocket disconnected');
      // Auto-reconnect after 5 seconds
      setTimeout(() => this.connect(onMessage), 5000);
    };
  }

  subscribe(symbol: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const subscription = {
        op: 'subscribe',
        args: [`tickers.${symbol}`]
      };
      this.ws.send(JSON.stringify(subscription));
      this.subscriptions.add(symbol);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.subscriptions.clear();
    }
  }
}