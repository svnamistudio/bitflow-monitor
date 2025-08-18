// Configuration for API integrations
// Replace with your actual API keys and configuration

export const AIRTABLE_CONFIG = {
  API_KEY: "YOUR_AIRTABLE_API_KEY_GOES_HERE",
  BASE_ID: "YOUR_AIRTABLE_BASE_ID_GOES_HERE",
  TABLES: {
    USERS: "Users",
    WALLETS: "Wallets",
    TRANSACTIONS: "Transactions"
  },
  FIELDS: {
    USERS: {
      USER_ID: "User ID",
      FULL_NAME: "Full Name", 
      EMAIL: "Email",
      PHONE: "Phone Number",
      USERNAME: "Username",
      PASSWORD_HASH: "Password (Hashed)",
      STATUS: "Status",
      CREATED_AT: "Registration Date",
      BTC_ADDRESS: "BTC Address"
    },
    WALLETS: {
      WALLET_ID: "Wallet ID",
      USER_LINK: "User ID",
      BALANCE: "Current Balance",
      CURRENCY: "Currency Type",
      LAST_TX_DATE: "Last Transaction Date",
      STATUS: "Wallet Status"
    },
    TRANSACTIONS: {
      TX_ID: "Transaction ID",
      USER_LINK: "User ID", 
      WALLET_LINK: "Wallet ID",
      TYPE: "Transaction Type",
      AMOUNT: "Amount",
      DESC: "Description",
      STATUS: "Status",
      DATE: "Date & Time",
      TX_HASH: "Tx Hash",
      FEES: "Fees"
    }
  }
};

export const BYBIT_CONFIG = {
  API_KEY: "YOUR_BYBIT_API_KEY_GOES_HERE",
  API_SECRET: "YOUR_BYBIT_API_SECRET_GOES_HERE",
  REST_BASE: "https://api.bybit.com",
  WS_PUBLIC: "wss://stream.bybit.com/v5/public/spot",
  ENDPOINTS: {
    DEPOSIT_ADDRESS: "/v5/asset/deposit/query-address",
    DEPOSIT_RECORDS: "/v5/asset/deposit/query-record", 
    WITHDRAW_CREATE: "/v5/asset/withdraw/create",
    TICKERS: "/v5/market/tickers"
  }
};

// Backend proxy endpoints (implement these on your server)
export const BACKEND_ENDPOINTS = {
  DEPOSIT_ADDRESS: "/api/bybit/deposit-address",
  DEPOSIT_RECORDS: "/api/bybit/deposit-records",
  WITHDRAW: "/api/bybit/withdraw",
  MARKET_PRICES: "/api/market/prices"
};