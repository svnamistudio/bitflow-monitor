import { useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { PriceChecker } from "@/components/dashboard/PriceChecker";
import { MarketRates } from "@/components/dashboard/MarketRates";
import { MarketTimer } from "@/components/dashboard/MarketTimer";
import { FundingOptions } from "@/components/dashboard/FundingOptions";
import { SupportChat } from "@/components/dashboard/SupportChat";
import { toast } from "sonner";

const Dashboard = () => {
  const [user] = useState({
    name: "John Doe",
    balance: 1.25847332
  });

  const [walletAddress] = useState("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh");
  const [withdrawEnabled, setWithdrawEnabled] = useState(false);

  const handleLogout = () => {
    toast.info("Logging out...");
  };

  const handleFund = () => {
    toast.success("Funding request initiated. Redirecting to payment options...");
  };

  const handleWithdraw = () => {
    if (!withdrawEnabled) {
      toast.error("Withdrawals are currently disabled. Please contact support to enable.");
      return;
    }
    toast.info("Withdraw request submitted for review.");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header userName={user.name} onLogout={handleLogout} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Main Balance Card - Takes full width on mobile, 2 cols on xl */}
          <div className="lg:col-span-2 xl:col-span-1">
            <BalanceCard
              balance={user.balance}
              walletAddress={walletAddress}
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

export default Dashboard;