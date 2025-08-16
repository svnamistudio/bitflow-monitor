import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

export const MarketTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 30
  });

  const [marketData] = useState({
    previousHigh: 69000,
    previousLow: 15500,
    targetPrice: 50000
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          // Reset timer when it reaches zero
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (time: number) => time.toString().padStart(2, '0');

  return (
    <Card className="gradient-card shadow-card border-crypto-green/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-crypto-green">
          <Clock className="h-5 w-5" />
          Market Rise Prediction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2">Time until predicted rise:</div>
          <div className="text-3xl font-bold text-crypto-green">
            {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-dark-surface p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">Previous High</div>
            <div className="text-lg font-semibold text-crypto-green">
              ${marketData.previousHigh.toLocaleString()}
            </div>
          </div>
          <div className="bg-dark-surface p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">Previous Low</div>
            <div className="text-lg font-semibold text-crypto-red">
              ${marketData.previousLow.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="text-center p-3 bg-darker-surface rounded-lg border border-crypto-green/20">
          <div className="flex items-center justify-center gap-2 text-crypto-green mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Target Price</span>
          </div>
          <div className="text-xl font-bold text-crypto-green">
            ${marketData.targetPrice.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};