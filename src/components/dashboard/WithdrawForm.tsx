import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface WithdrawFormProps {
  onSubmit: (address: string, amount: number) => Promise<void>;
  maxAmount: number;
  onCancel: () => void;
}

export const WithdrawForm = ({ onSubmit, maxAmount, onCancel }: WithdrawFormProps) => {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount <= 0 || numAmount > maxAmount) {
      toast.error(`Amount must be between 0 and ${maxAmount} BTC`);
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(address, numAmount);
      toast.success('Withdrawal submitted successfully');
      onCancel();
    } catch (error) {
      toast.error('Failed to submit withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Withdraw Bitcoin</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="address">Withdrawal Address</Label>
            <Input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="bc1..."
              required
            />
          </div>
          
          <div>
            <Label htmlFor="amount">Amount (BTC)</Label>
            <Input
              id="amount"
              type="number"
              step="0.00000001"
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00000000"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Available: {maxAmount.toFixed(8)} BTC
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Processing...' : 'Withdraw'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};