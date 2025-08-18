import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, CreditCard, DollarSign } from "lucide-react";
import { toast } from "sonner";

export const FundingOptions = () => {
  const handleContactSupport = () => {
    toast.info("Support team will contact you within 24 hours for fiat funding options.");
  };

  const handleQuickFund = () => {
    toast.info("Redirecting to secure payment gateway...");
  };

  return (
    <Card className="gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-gold" />
          Funding Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          Multiple ways to fund your Bitcoin wallet
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={handleContactSupport}
            variant="outline" 
            className="w-full flex items-center gap-2 justify-start h-auto p-4 border-gold/20 hover:border-gold/40"
          >
            <MessageCircle className="h-5 w-5 text-gold" />
            <div className="text-left">
              <div className="font-semibold">Contact Support</div>
              <div className="text-xs text-muted-foreground">Fiat-to-crypto funding assistance</div>
            </div>
          </Button>

          <Button 
            onClick={handleQuickFund}
            className="w-full gradient-success flex items-center gap-2 justify-start h-auto p-4 hover:shadow-glow"
          >
            <CreditCard className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Quick Fund</div>
              <div className="text-xs opacity-90">Instant crypto purchase</div>
            </div>
          </Button>
        </div>

        <div className="mt-4 p-3 bg-dark-surface rounded-lg border-l-4 border-gold">
          <div className="text-sm text-gold font-semibold">Bank Transfer</div>
          <div className="text-xs text-muted-foreground mt-1">
            Wire transfers available 24/7 • 0.1% fee • 1-3 business days
          </div>
        </div>
      </CardContent>
    </Card>
  );
};