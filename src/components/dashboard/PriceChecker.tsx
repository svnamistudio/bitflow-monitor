import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";
import { useMarketData } from "@/hooks/useMarketData";

export const PriceChecker = () => {
  const { btcPrice, getPriceChange, formatCurrency, isLoading, lastUpdated, refresh } = useMarketData();
  
  const btcData = getPriceChange('BTCUSDT');
  const isPositive = btcData.changePercent >= 0;

  return (
    <Card className="gradient-card shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-bitcoin" />
          Live BTC Price
        </CardTitle>
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
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">
              {formatCurrency(btcPrice)}
            </div>
            <div className={`flex items-center justify-center gap-1 text-sm ${
              isPositive ? 'text-crypto-green' : 'text-crypto-red'
            }`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {isPositive ? '+' : ''}{btcData.changePercent.toFixed(2)}%
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Last updated:</span>
            <span className={isLoading ? 'animate-pulse' : ''}>{lastUpdated?.toLocaleTimeString() || 'Loading...'}</span>
          </div>
          
          {btcData.change !== 0 && (
            <div className="text-center">
              <div className={`text-sm ${isPositive ? 'text-crypto-green' : 'text-crypto-red'}`}>
                {isPositive ? '+' : ''}{formatCurrency(btcData.change)} (24h)
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};