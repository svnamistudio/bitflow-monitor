// Airtable API service
import { AIRTABLE_CONFIG } from './config';
import { User, Wallet, Transaction } from '../types';

const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}`;

const getHeaders = () => ({
  'Authorization': `Bearer ${AIRTABLE_CONFIG.API_KEY}`,
  'Content-Type': 'application/json'
});

// Generic Airtable operations
export const airtableApi = {
  async list(table: string, params = '') {
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(table)}${params}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error(`Airtable list failed: ${response.statusText}`);
    return response.json();
  },

  async create(table: string, fields: Record<string, any>) {
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(table)}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fields })
    });
    if (!response.ok) throw new Error(`Airtable create failed: ${response.statusText}`);
    return response.json();
  },

  async update(table: string, recordId: string, fields: Record<string, any>) {
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(table)}/${recordId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ fields })
    });
    if (!response.ok) throw new Error(`Airtable update failed: ${response.statusText}`);
    return response.json();
  },

  async findByField(table: string, fieldName: string, value: string) {
    const formula = `?filterByFormula=${encodeURIComponent(`{${fieldName}}="${value}"`)}`;
    const data = await this.list(table, formula);
    return data.records?.[0] ?? null;
  }
};

// User operations
export const userService = {
  async getUser(userId: string): Promise<User | null> {
    try {
      const record = await airtableApi.findByField(
        AIRTABLE_CONFIG.TABLES.USERS,
        AIRTABLE_CONFIG.FIELDS.USERS.USER_ID,
        userId
      );
      if (!record) return null;
      
      return {
        recordId: record.id,
        userId: record.fields[AIRTABLE_CONFIG.FIELDS.USERS.USER_ID],
        fullName: record.fields[AIRTABLE_CONFIG.FIELDS.USERS.FULL_NAME],
        email: record.fields[AIRTABLE_CONFIG.FIELDS.USERS.EMAIL],
        phone: record.fields[AIRTABLE_CONFIG.FIELDS.USERS.PHONE],
        username: record.fields[AIRTABLE_CONFIG.FIELDS.USERS.USERNAME],
        passwordHash: record.fields[AIRTABLE_CONFIG.FIELDS.USERS.PASSWORD_HASH],
        status: record.fields[AIRTABLE_CONFIG.FIELDS.USERS.STATUS],
        createdAt: record.fields[AIRTABLE_CONFIG.FIELDS.USERS.CREATED_AT],
        btcAddress: record.fields[AIRTABLE_CONFIG.FIELDS.USERS.BTC_ADDRESS]
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  async createUser(user: Omit<User, 'recordId'>): Promise<User> {
    try {
      const fields = {
        [AIRTABLE_CONFIG.FIELDS.USERS.USER_ID]: user.userId,
        [AIRTABLE_CONFIG.FIELDS.USERS.FULL_NAME]: user.fullName,
        [AIRTABLE_CONFIG.FIELDS.USERS.EMAIL]: user.email,
        [AIRTABLE_CONFIG.FIELDS.USERS.PHONE]: user.phone,
        [AIRTABLE_CONFIG.FIELDS.USERS.USERNAME]: user.username,
        [AIRTABLE_CONFIG.FIELDS.USERS.PASSWORD_HASH]: user.passwordHash,
        [AIRTABLE_CONFIG.FIELDS.USERS.STATUS]: user.status,
        [AIRTABLE_CONFIG.FIELDS.USERS.CREATED_AT]: user.createdAt,
        [AIRTABLE_CONFIG.FIELDS.USERS.BTC_ADDRESS]: user.btcAddress
      };
      
      const record = await airtableApi.create(AIRTABLE_CONFIG.TABLES.USERS, fields);
      return { ...user, recordId: record.id };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async updateUser(recordId: string, updates: Partial<User>): Promise<User> {
    try {
      const fields: Record<string, any> = {};
      if (updates.fullName) fields[AIRTABLE_CONFIG.FIELDS.USERS.FULL_NAME] = updates.fullName;
      if (updates.email) fields[AIRTABLE_CONFIG.FIELDS.USERS.EMAIL] = updates.email;
      if (updates.phone) fields[AIRTABLE_CONFIG.FIELDS.USERS.PHONE] = updates.phone;
      if (updates.status) fields[AIRTABLE_CONFIG.FIELDS.USERS.STATUS] = updates.status;
      if (updates.btcAddress) fields[AIRTABLE_CONFIG.FIELDS.USERS.BTC_ADDRESS] = updates.btcAddress;

      const record = await airtableApi.update(AIRTABLE_CONFIG.TABLES.USERS, recordId, fields);
      return { ...updates, recordId: record.id } as User;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
};

// Wallet operations
export const walletService = {
  async getUserWallets(userId: string): Promise<Wallet[]> {
    try {
      const formula = `?filterByFormula=${encodeURIComponent(`{${AIRTABLE_CONFIG.FIELDS.WALLETS.USER_LINK}}="${userId}"`)}`;
      const data = await airtableApi.list(AIRTABLE_CONFIG.TABLES.WALLETS, formula);
      
      return data.records.map((record: any) => ({
        recordId: record.id,
        walletId: record.fields[AIRTABLE_CONFIG.FIELDS.WALLETS.WALLET_ID],
        userId: record.fields[AIRTABLE_CONFIG.FIELDS.WALLETS.USER_LINK],
        balance: record.fields[AIRTABLE_CONFIG.FIELDS.WALLETS.BALANCE] || 0,
        currency: record.fields[AIRTABLE_CONFIG.FIELDS.WALLETS.CURRENCY],
        lastTransactionDate: record.fields[AIRTABLE_CONFIG.FIELDS.WALLETS.LAST_TX_DATE],
        status: record.fields[AIRTABLE_CONFIG.FIELDS.WALLETS.STATUS]
      }));
    } catch (error) {
      console.error('Error fetching wallets:', error);
      throw error;
    }
  },

  async updateWalletBalance(recordId: string, newBalance: number): Promise<void> {
    try {
      await airtableApi.update(AIRTABLE_CONFIG.TABLES.WALLETS, recordId, {
        [AIRTABLE_CONFIG.FIELDS.WALLETS.BALANCE]: newBalance,
        [AIRTABLE_CONFIG.FIELDS.WALLETS.LAST_TX_DATE]: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      throw error;
    }
  }
};

// Transaction operations  
export const transactionService = {
  async getUserTransactions(userId: string): Promise<Transaction[]> {
    try {
      const formula = `?filterByFormula=${encodeURIComponent(`{${AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.USER_LINK}}="${userId}"`)}&sort[0][field]=${AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.DATE}&sort[0][direction]=desc`;
      const data = await airtableApi.list(AIRTABLE_CONFIG.TABLES.TRANSACTIONS, formula);
      
      return data.records.map((record: any) => ({
        recordId: record.id,
        transactionId: record.fields[AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.TX_ID],
        userId: record.fields[AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.USER_LINK],
        walletId: record.fields[AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.WALLET_LINK],
        type: record.fields[AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.TYPE],
        amount: record.fields[AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.AMOUNT],
        description: record.fields[AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.DESC],
        status: record.fields[AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.STATUS],
        date: record.fields[AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.DATE],
        txHash: record.fields[AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.TX_HASH],
        fees: record.fields[AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.FEES]
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  async createTransaction(transaction: Omit<Transaction, 'recordId'>): Promise<Transaction> {
    try {
      const fields = {
        [AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.TX_ID]: transaction.transactionId,
        [AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.USER_LINK]: transaction.userId,
        [AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.WALLET_LINK]: transaction.walletId,
        [AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.TYPE]: transaction.type,
        [AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.AMOUNT]: transaction.amount,
        [AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.DESC]: transaction.description,
        [AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.STATUS]: transaction.status,
        [AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.DATE]: transaction.date,
        [AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.TX_HASH]: transaction.txHash,
        [AIRTABLE_CONFIG.FIELDS.TRANSACTIONS.FEES]: transaction.fees
      };
      
      const record = await airtableApi.create(AIRTABLE_CONFIG.TABLES.TRANSACTIONS, fields);
      return { ...transaction, recordId: record.id };
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }
};