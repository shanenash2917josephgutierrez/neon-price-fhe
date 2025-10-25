import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Wallet, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface BetPanelProps {
  lowerBound: number;
  upperBound: number;
  onPlaceBet: (amount: number) => Promise<void>;
}

// Bet panel with FHE encryption and transaction submission
export const BetPanel = ({ lowerBound, upperBound, onPlaceBet }: BetPanelProps) => {
  const [betAmount, setBetAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePlaceBet = async () => {
    const amount = parseFloat(betAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid bet amount',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Step 1: Encrypt prediction data using FHE
      toast({
        title: 'Encrypting Data',
        description: 'Your prediction is being encrypted with FHE...',
      });

      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate encryption

      // Step 2: Submit encrypted transaction
      toast({
        title: 'Broadcasting Transaction',
        description: 'Encrypted prediction submitted to blockchain...',
      });

      await onPlaceBet(amount);

      toast({
        title: 'Prediction Submitted',
        description: `Successfully placed ${amount} ETH bet on range $${lowerBound.toFixed(2)} - $${upperBound.toFixed(2)}`,
      });

      setBetAmount('');
    } catch (error) {
      toast({
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Failed to place bet',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-2 border-accent/30 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-mono flex items-center gap-2">
          <Wallet className="w-5 h-5 text-accent" />
          PLACE ENCRYPTED BET
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selected range display */}
        <div className="border-2 border-border rounded-lg p-4 bg-muted/20">
          <div className="text-xs text-muted-foreground font-mono mb-2">PREDICTION RANGE</div>
          <div className="flex items-center justify-between font-mono">
            <span className="text-lg text-accent">${lowerBound.toFixed(2)}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-lg text-secondary">${upperBound.toFixed(2)}</span>
          </div>
        </div>

        {/* Bet amount input */}
        <div className="space-y-2">
          <Label htmlFor="betAmount" className="font-mono text-sm">
            BET AMOUNT (ETH)
          </Label>
          <Input
            id="betAmount"
            type="number"
            step="0.01"
            placeholder="e.g. 0.1"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            disabled={isProcessing}
            className="font-mono border-2 border-muted focus:border-accent text-lg"
          />
        </div>

        {/* FHE encryption notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-secondary/30 rounded-lg p-3 bg-secondary/5 flex items-start gap-3"
        >
          <Lock className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
          <div className="text-xs font-mono text-muted-foreground">
            <span className="text-secondary font-bold">FHE ENCRYPTION:</span> Your prediction range and bet amount will be encrypted before broadcast. Other players cannot see your strategy.
          </div>
        </motion.div>

        {/* Warning for unconnected wallet */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-accent/30 rounded-lg p-3 bg-accent/5 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
          <div className="text-xs font-mono text-muted-foreground">
            Connect your wallet to place encrypted predictions on-chain
          </div>
        </motion.div>

        {/* Place bet button */}
        <Button
          onClick={handlePlaceBet}
          disabled={!betAmount || isProcessing}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold border-2 border-accent neon-border-purple"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 animate-pulse" />
              ENCRYPTING & SUBMITTING...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              ENCRYPT & PLACE BET
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
