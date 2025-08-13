import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useEffect, useState } from "react";

interface PriceData {
  price: number;
  change24h: number;
  lastUpdated: string;
}

export const PriceChecker = () => {
  const [priceData, setPriceData] = useState<PriceData>({
    price: 45000,
    change24h: 2.34,
    lastUpdated: new Date().toLocaleTimeString()
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchPrice = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
      const data = await response.json();
      
      setPriceData({
        price: data.bitcoin.usd,
        change24h: data.bitcoin.usd_24h_change,
        lastUpdated: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Failed to fetch price:', error);
      // Simulate price movement for demo
      setPriceData(prev => ({
        ...prev,
        price: prev.price + (Math.random() - 0.5) * 100,
        change24h: prev.change24h + (Math.random() - 0.5) * 2,
        lastUpdated: new Date().toLocaleTimeString()
      }));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const isPositive = priceData.change24h > 0;

  return (
    <Card className="gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-bitcoin" />
          Live BTC Price
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">
              ${priceData.price.toLocaleString()}
            </div>
            <div className={`flex items-center justify-center gap-1 text-sm ${
              isPositive ? 'text-crypto-green' : 'text-crypto-red'
            }`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {isPositive ? '+' : ''}{priceData.change24h.toFixed(2)}%
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Last updated:</span>
            <span className={isLoading ? 'animate-pulse' : ''}>{priceData.lastUpdated}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};