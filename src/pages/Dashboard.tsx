import { useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { PriceChecker } from "@/components/dashboard/PriceChecker";
import { MarketRates } from "@/components/dashboard/MarketRates";
import { MarketTimer } from "@/components/dashboard/MarketTimer";
import { FundingOptions } from "@/components/dashboard/FundingOptions";
import { SupportChat } from "@/components/dashboard/SupportChat";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useMarketData } from "@/hooks/useMarketData";
import { toast } from "sonner";

const DashboardContent = () => {
  const { user, logout } = useAuth();
  const { getBTCBalance, requestDepositAddress, createWithdrawal, checkDeposits } = useWallet();
  const { btcPrice, calculateUSDValue } = useMarketData();
  const [withdrawEnabled, setWithdrawEnabled] = useState(false);

  // Mock user for demo - replace with actual auth
  const mockUser = user || {
    userId: "demo_user_123",
    fullName: "John Doe",
    email: "john@example.com",
    username: "johndoe",
    passwordHash: "hashed_password",
    status: "active" as const,
    createdAt: new Date().toISOString(),
    btcAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
  };

  const btcBalance = getBTCBalance();
  const usdValue = calculateUSDValue(btcBalance);

  const handleLogout = () => {
    logout();
    toast.info("Logging out...");
  };

  const handleFund = async () => {
    try {
      toast.info("Generating deposit address...");
      const depositInfo = await requestDepositAddress();
      toast.success(`Deposit to: ${depositInfo.address}`);
      
      // Start checking for deposits
      checkDeposits();
    } catch (error) {
      toast.error("Failed to generate deposit address. Please try again.");
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawEnabled) {
      toast.error("Withdrawals are currently disabled. Please contact support to enable.");
      return;
    }
    
    // In a real app, you'd show a withdrawal form
    const address = prompt("Enter withdrawal address:");
    const amount = parseFloat(prompt("Enter amount (BTC):") || "0");
    
    if (!address || !amount || amount <= 0) {
      toast.error("Invalid withdrawal details");
      return;
    }
    
    try {
      toast.info("Processing withdrawal...");
      await createWithdrawal(address, amount);
      toast.success("Withdrawal request submitted for review.");
    } catch (error) {
      toast.error("Failed to process withdrawal. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header userName={mockUser.fullName} onLogout={handleLogout} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Main Balance Card - Takes full width on mobile, 2 cols on xl */}
          <div className="lg:col-span-2 xl:col-span-1">
            <BalanceCard
              balance={btcBalance}
              usdValue={usdValue}
              walletAddress={mockUser.btcAddress || ""}
              onFund={handleFund}
              onWithdraw={handleWithdraw}
              withdrawEnabled={withdrawEnabled}
            />
          </div>

          {/* Price Checker */}
          <div className="xl:col-span-1">
            <PriceChecker />
          </div>

          {/* Funding Options */}
          <div className="xl:col-span-1">
            <FundingOptions />
          </div>

          {/* Market Rates */}
          <div className="lg:col-span-1">
            <MarketRates />
          </div>

          {/* Market Timer */}
          <div className="lg:col-span-1">
            <MarketTimer />
          </div>

          {/* Support Chat */}
          <div className="lg:col-span-2 xl:col-span-1">
            <SupportChat />
          </div>
        </div>

        {/* Footer with ticker */}
        <div className="mt-8 p-4 bg-dark-surface rounded-lg overflow-hidden">
          <div className="ticker text-sm text-muted-foreground whitespace-nowrap">
            📈 Bitcoin trading is highly volatile and involves significant risk. Past performance does not guarantee future results. 
            Trade responsibly and only invest what you can afford to lose. 
            🔒 Your funds are secured with bank-level encryption and cold storage technology.
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
};

export default Dashboard;