import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bitcoin, Plus, Minus, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface BalanceCardProps {
  balance: number;
  walletAddress: string;
  onFund: () => void;
  onWithdraw: () => void;
  withdrawEnabled: boolean;
}

export const BalanceCard = ({ 
  balance, 
  walletAddress, 
  onFund, 
  onWithdraw, 
  withdrawEnabled 
}: BalanceCardProps) => {
  const [showFullAddress, setShowFullAddress] = useState(false);

  const formatAddress = (address: string) => {
    if (showFullAddress) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast.success("Wallet address copied to clipboard!");
  };

  return (
    <Card className="gradient-card shadow-glow border-gold/20">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-gold">
          <Bitcoin className="h-6 w-6" />
          Bitcoin Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-foreground animate-pulse-glow">
            {balance.toFixed(8)} BTC
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            ≈ ${(balance * 45000).toLocaleString()}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button 
            onClick={onFund}
            variant="default"
            className="gradient-success flex items-center gap-2 hover:shadow-glow transition-all"
          >
            <Plus className="h-4 w-4" />
            Fund
          </Button>
          <Button 
            onClick={onWithdraw}
            disabled={!withdrawEnabled}
            variant={withdrawEnabled ? "destructive" : "secondary"}
            className="flex items-center gap-2 transition-all"
          >
            <Minus className="h-4 w-4" />
            Withdraw
          </Button>
        </div>

        <div className="border-t border-border pt-4">
          <div className="text-sm text-muted-foreground mb-2">Your Wallet Address:</div>
          <div className="flex items-center gap-2">
            <code 
              className="text-xs bg-dark-surface p-2 rounded cursor-pointer flex-1 break-all"
              onClick={() => setShowFullAddress(!showFullAddress)}
            >
              {formatAddress(walletAddress)}
            </code>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={copyAddress}
              className="shrink-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Click address to {showFullAddress ? 'hide' : 'show'} full
          </div>
        </div>
      </CardContent>
    </Card>
  );
};