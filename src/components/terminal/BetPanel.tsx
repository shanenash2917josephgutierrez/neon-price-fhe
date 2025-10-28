/**
 * Bet Panel Component
 *
 * Handles encrypted bet placement using FHE encryption and smart contract interaction.
 * Follows Zama fhEVM best practices for data encryption and submission.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import { parseEther, keccak256, toUtf8Bytes } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { encryptPriceGuess } from '@/utils/encryption';
import { usePlaceGuess } from '@/hooks/useContract';
import { CONTRACT_ADDRESS, isContractConfigured } from '@/config/contract';

interface BetPanelProps {
  lowerBound: number;
  upperBound: number;
  assetId: bigint;
  userAddress?: `0x${string}`;
  isConnected: boolean;
}

/**
 * Bet panel with FHE encryption and transaction submission
 */
export const BetPanel = ({
  lowerBound,
  upperBound,
  assetId,
  userAddress,
  isConnected,
}: BetPanelProps) => {
  const [betAmount, setBetAmount] = useState<string>('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const { toast } = useToast();
  const { placeGuess, isPending, isConfirming, isConfirmed, hash } = usePlaceGuess();

  /**
   * Handle bet placement with FHE encryption
   */
  const handlePlaceBet = async () => {
    // Validation
    const amount = parseFloat(betAmount);

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid bet amount greater than 0',
        variant: 'destructive',
      });
      return;
    }

    if (!isConnected || !userAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to place a bet',
        variant: 'destructive',
      });
      return;
    }

    if (!isContractConfigured()) {
      toast({
        title: 'Contract Not Configured',
        description: 'Smart contract address is not configured. Please deploy the contract first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsEncrypting(true);

      // Step 1: Show encryption toast
      toast({
        title: 'Encrypting Data',
        description: 'Your prediction is being encrypted with FHE...',
      });

      // Convert values to appropriate format
      // Prices are scaled by 1e8 (similar to BTC price format)
      const lowerWei = BigInt(Math.floor(lowerBound * 1e8));
      const upperWei = BigInt(Math.floor(upperBound * 1e8));
      const stakeWei = parseEther(betAmount.toString());

      console.log('[BetPanel] Encrypting values:', {
        lower: lowerWei.toString(),
        upper: upperWei.toString(),
        stake: stakeWei.toString(),
      });

      // Step 2: Encrypt using FHE
      const { lowerHandle, upperHandle, stakeHandle, proof } = await encryptPriceGuess(
        CONTRACT_ADDRESS,
        userAddress,
        lowerWei,
        upperWei,
        stakeWei
      );

      setIsEncrypting(false);

      // Step 3: Generate commitment hash (prevents replay attacks)
      const commitmentData = `${userAddress}-${assetId}-${Date.now()}`;
      const commitment = keccak256(toUtf8Bytes(commitmentData)) as `0x${string}`;

      console.log('[BetPanel] Commitment:', commitment);

      // Step 4: Submit transaction
      toast({
        title: 'Broadcasting Transaction',
        description: 'Encrypted prediction submitted to blockchain...',
      });

      await placeGuess(
        assetId,
        lowerHandle as `0x${string}`,
        upperHandle as `0x${string}`,
        stakeHandle as `0x${string}`,
        proof as `0x${string}`,
        commitment
      );

      // Transaction submitted successfully
      console.log('[BetPanel] Transaction hash:', hash);

    } catch (error) {
      console.error('[BetPanel] Error:', error);

      setIsEncrypting(false);

      toast({
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Failed to place bet',
        variant: 'destructive',
      });
    }
  };

  // Show success message when transaction is confirmed
  if (isConfirmed) {
    setTimeout(() => {
      toast({
        title: 'Prediction Submitted!',
        description: `Successfully placed ${betAmount} ETH bet on range $${lowerBound.toFixed(2)} - $${upperBound.toFixed(2)}`,
      });
      setBetAmount('');
    }, 100);
  }

  const isProcessing = isPending || isEncrypting || isConfirming;

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
            disabled={isProcessing || !isConnected}
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
            <span className="text-secondary font-bold">FHE ENCRYPTION:</span> Your prediction range
            and bet amount will be encrypted before broadcast. Other players cannot see your
            strategy.
          </div>
        </motion.div>

        {/* Connection warning or success indicator */}
        {!isConnected ? (
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
        ) : isConfirmed ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-green-500/30 rounded-lg p-3 bg-green-500/5 flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs font-mono">
              <div className="text-green-500 font-bold">✅ BET PLACED SUCCESSFULLY!</div>
              <div className="text-muted-foreground mt-1">
                Transaction confirmed: {hash?.slice(0, 10)}...{hash?.slice(-8)}
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* Place bet button */}
        <Button
          onClick={handlePlaceBet}
          disabled={!betAmount || isProcessing || !isConnected}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold border-2 border-accent neon-border-purple"
        >
          {isEncrypting ? (
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 animate-pulse" />
              ENCRYPTING DATA...
            </span>
          ) : isPending || isConfirming ? (
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 animate-pulse" />
              {isPending ? 'AWAITING SIGNATURE...' : 'CONFIRMING TRANSACTION...'}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              ENCRYPT & PLACE BET
            </span>
          )}
        </Button>

        {/* Transaction status */}
        {isConfirming && hash && (
          <div className="text-xs font-mono text-center text-muted-foreground">
            <p>Waiting for confirmation...</p>
            <p className="mt-1">
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                View on Etherscan ↗
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
