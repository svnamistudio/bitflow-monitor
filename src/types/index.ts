// Types for Airtable integration

export interface User {
  recordId?: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  username: string;
  passwordHash: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  btcAddress?: string;
}

export interface Wallet {
  recordId?: string;
  walletId: string;
  userId: string;
  balance: number;
  currency: 'BTC' | 'USD';
  lastTransactionDate?: string;
  status: 'active' | 'inactive';
}

export interface Transaction {
  recordId?: string;
  transactionId: string;
  userId: string;
  walletId: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  date: string;
  txHash?: string;
  fees?: number;
}

export interface MarketPrice {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  lastUpdated: string;
}

export interface DepositAddress {
  address: string;
  coin: string;
  chain: string;
  userId: string;
}

export interface WithdrawalRequest {
  userId: string;
  address: string;
  amount: number;
  coin: string;
  chain: string;
  tag?: string;
}