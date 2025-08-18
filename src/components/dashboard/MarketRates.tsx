import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { useMarketData } from "@/hooks/useMarketData";

interface CryptoRate {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
}

export const MarketRates = () => {
  const { prices, formatCurrency, isLoading, refresh } = useMarketData();

  // Default rates with real-time updates from useMarketData
  const defaultRates: CryptoRate[] = [
    { symbol: 'BTC', name: 'Bitcoin', price: 45000, change24h: 2.34, icon: '₿' },
    { symbol: 'ETH', name: 'Ethereum', price: 2800, change24h: -1.23, icon: 'Ξ' },
    { symbol: 'USDT', name: 'Tether', price: 1.00, change24h: 0.02, icon: '₮' }
  ];

  // Merge with real-time data if available
  const rates = defaultRates.map(defaultRate => {
    const livePrice = prices.find(p => p.symbol.includes(defaultRate.symbol));
    if (livePrice) {
      return {
        ...defaultRate,
        price: livePrice.price,
        change24h: livePrice.changePercent24h
      };
    }
    return defaultRate;
  });

  return (
    <Card className="gradient-card shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Market Rates</CardTitle>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={refresh}
          disabled={isLoading}
          className="p-1 h-8 w-8"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rates.map((rate) => {
            const isPositive = rate.change24h > 0;
            return (
              <div key={rate.symbol} className="flex items-center justify-between p-3 bg-dark-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-gold">{rate.icon}</div>
                  <div>
                    <div className="font-semibold">{rate.symbol}</div>
                    <div className="text-sm text-muted-foreground">{rate.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    ${rate.symbol === 'USDT' ? rate.price.toFixed(4) : rate.price.toLocaleString()}
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    isPositive ? 'text-crypto-green' : 'text-crypto-red'
                  }`}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {isPositive ? '+' : ''}{rate.change24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};