import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";

interface CryptoRate {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
}

export const MarketRates = () => {
  const [rates, setRates] = useState<CryptoRate[]>([
    { symbol: 'BTC', name: 'Bitcoin', price: 45000, change24h: 2.34, icon: '₿' },
    { symbol: 'ETH', name: 'Ethereum', price: 2800, change24h: -1.23, icon: 'Ξ' },
    { symbol: 'USDT', name: 'Tether', price: 1.00, change24h: 0.02, icon: '₮' }
  ]);

  const fetchRates = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd&include_24hr_change=true');
      const data = await response.json();
      
      setRates([
        { 
          symbol: 'BTC', 
          name: 'Bitcoin', 
          price: data.bitcoin.usd, 
          change24h: data.bitcoin.usd_24h_change, 
          icon: '₿' 
        },
        { 
          symbol: 'ETH', 
          name: 'Ethereum', 
          price: data.ethereum.usd, 
          change24h: data.ethereum.usd_24h_change, 
          icon: 'Ξ' 
        },
        { 
          symbol: 'USDT', 
          name: 'Tether', 
          price: data.tether.usd, 
          change24h: data.tether.usd_24h_change, 
          icon: '₮' 
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch rates:', error);
      // Simulate market movement
      setRates(prev => prev.map(rate => ({
        ...rate,
        price: rate.price * (1 + (Math.random() - 0.5) * 0.01),
        change24h: rate.change24h + (Math.random() - 0.5) * 0.5
      })));
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="gradient-card shadow-card">
      <CardHeader>
        <CardTitle>Market Rates</CardTitle>
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