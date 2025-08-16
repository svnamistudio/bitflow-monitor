import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Clock } from "lucide-react";
import { toast } from "sonner";

export const SupportChat = () => {
  const handleOpenChat = () => {
    toast.info("Opening support chat...");
    // In a real app, this would initialize Freshchat widget
  };

  return (
    <Card className="gradient-card shadow-card border-gold/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gold" />
          Support Center
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Get instant help from our crypto experts
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-dark-surface rounded-lg">
            <Users className="h-5 w-5 text-crypto-green" />
            <div>
              <div className="text-sm font-semibold">Live Agents</div>
              <div className="text-xs text-crypto-green">12 agents online</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-dark-surface rounded-lg">
            <Clock className="h-5 w-5 text-gold" />
            <div>
              <div className="text-sm font-semibold">Avg Response</div>
              <div className="text-xs text-muted-foreground">Under 2 minutes</div>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleOpenChat}
          className="w-full gradient-gold text-black font-semibold hover:shadow-glow transition-all"
        >
          Start Live Chat
        </Button>

        <div className="text-xs text-center text-muted-foreground">
          Available 24/7 • Powered by Freshchat
        </div>
      </CardContent>
    </Card>
  );
};