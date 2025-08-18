import { useState, useEffect } from 'react';
import { Wallet, Transaction } from '../types';
import { walletService as airtableWalletService, transactionService } from '../services/airtable';
import { walletService as bybitWalletService } from '../services/bybit';
import { useAuth } from './useAuth';

export const useWallet = () => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load wallet data when user changes
  useEffect(() => {
    if (user?.userId) {
      loadWalletData();
    }
  }, [user?.userId]);

  const loadWalletData = async () => {
    if (!user?.userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [walletsData, transactionsData] = await Promise.all([
        airtableWalletService.getUserWallets(user.userId),
        transactionService.getUserTransactions(user.userId)
      ]);
      
      setWallets(walletsData);
      setTransactions(transactionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet data');
      console.error('Error loading wallet data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getBTCWallet = () => {
    return wallets.find(w => w.currency === 'BTC');
  };

  const getUSDWallet = () => {
    return wallets.find(w => w.currency === 'USD');
  };

  const getBTCBalance = () => {
    const btcWallet = getBTCWallet();
    return btcWallet?.balance || 0;
  };

  const getUSDBalance = () => {
    const usdWallet = getUSDWallet();
    return usdWallet?.balance || 0;
  };

  const requestDepositAddress = async () => {
    if (!user?.userId) throw new Error('User not logged in');
    
    try {
      setIsLoading(true);
      const depositAddress = await bybitWalletService.requestDepositAddress(user.userId);
      
      // Update user record with BTC address if not already set
      if (!user.btcAddress && depositAddress.address) {
        // This would update the user record in Airtable
        // You might want to call updateUser from useAuth here
      }
      
      return depositAddress;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request deposit address');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createWithdrawal = async (address: string, amount: number) => {
    if (!user?.userId) throw new Error('User not logged in');
    
    try {
      setIsLoading(true);
      
      const withdrawal = await bybitWalletService.createWithdrawal({
        userId: user.userId,
        address,
        amount,
        coin: 'BTC',
        chain: 'BTC'
      });

      // Create transaction record in Airtable
      const transaction: Omit<Transaction, 'recordId'> = {
        transactionId: withdrawal.txId || `withdraw_${Date.now()}`,
        userId: user.userId,
        walletId: getBTCWallet()?.walletId || '',
        type: 'withdraw',
        amount: -amount, // Negative for withdrawal
        description: `Withdrawal to ${address}`,
        status: 'pending',
        date: new Date().toISOString(),
        txHash: withdrawal.txHash,
        fees: withdrawal.fees || 0
      };

      await transactionService.createTransaction(transaction);
      
      // Update local state
      await loadWalletData();
      
      return withdrawal;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create withdrawal');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const checkDeposits = async () => {
    if (!user?.userId) return;
    
    try {
      const deposits = await bybitWalletService.checkDeposits(user.userId);
      
      // Process new deposits and create transaction records
      for (const deposit of deposits) {
        if (deposit.status === 'success' && deposit.amount > 0) {
          // Check if this deposit is already recorded
          const existingTx = transactions.find(tx => tx.txHash === deposit.txHash);
          if (!existingTx) {
            // Create new transaction record
            const transaction: Omit<Transaction, 'recordId'> = {
              transactionId: deposit.txId || `deposit_${Date.now()}`,
              userId: user.userId,
              walletId: getBTCWallet()?.walletId || '',
              type: 'deposit',
              amount: deposit.amount,
              description: `Deposit from ${deposit.address}`,
              status: 'completed',
              date: deposit.timestamp || new Date().toISOString(),
              txHash: deposit.txHash,
              fees: deposit.fees || 0
            };

            await transactionService.createTransaction(transaction);
            
            // Update wallet balance
            const btcWallet = getBTCWallet();
            if (btcWallet?.recordId) {
              const newBalance = btcWallet.balance + deposit.amount;
              await airtableWalletService.updateWalletBalance(btcWallet.recordId, newBalance);
            }
          }
        }
      }
      
      // Reload wallet data to reflect changes
      await loadWalletData();
    } catch (err) {
      console.error('Error checking deposits:', err);
    }
  };

  return {
    wallets,
    transactions,
    isLoading,
    error,
    getBTCWallet,
    getUSDWallet,
    getBTCBalance,
    getUSDBalance,
    requestDepositAddress,
    createWithdrawal,
    checkDeposits,
    refreshData: loadWalletData
  };
};