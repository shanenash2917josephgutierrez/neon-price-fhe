/**
 * Bet Panel Component
 *
 * This component handles the complete workflow for placing encrypted price predictions:
 *
 * 1. User Input: Collects bet amount from user
 * 2. FHE Encryption: Encrypts range (lower, upper) and stake using Zama SDK
 * 3. Proof Generation: Creates zero-knowledge proof for encrypted data
 * 4. Transaction: Submits encrypted data to smart contract
 * 5. Confirmation: Displays transaction status and result
 *
 * Security Features:
 * - All prediction data encrypted client-side before transmission
 * - Commitment scheme prevents replay attacks
 * - Zero-knowledge proofs validate encrypted data integrity
 *
 * @component
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

/**
 * BetPanel Props
 */
interface BetPanelProps {
  /** Lower price bound selected by user */
  lowerBound: number;
  /** Upper price bound selected by user */
  upperBound: number;
  /** Asset ID to bet on (e.g., BTC=1, ETH=2) */
  assetId: bigint;
  /** Connected wallet address */
  userAddress?: `0x${string}`;
  /** Whether wallet is connected */
  isConnected: boolean;
}

/**
 * BetPanel Component
 *
 * Interactive panel for placing encrypted bets with FHE technology.
 * Handles the complete encryption and submission workflow.
 */
export const BetPanel = ({
  lowerBound,
  upperBound,
  assetId,
  userAddress,
  isConnected,
}: BetPanelProps) => {
  // Component state
  const [betAmount, setBetAmount] = useState<string>('');
  const [isEncrypting, setIsEncrypting] = useState(false);

  // Hooks
  const { toast } = useToast();
  const { placeGuess, isPending, isConfirming, isConfirmed, hash } = usePlaceGuess();

  /**
   * Handle Bet Placement
   *
   * This function orchestrates the complete bet placement workflow:
   * 1. Validates user input and wallet connection
   * 2. Encrypts prediction data using FHE SDK
   * 3. Generates commitment hash for replay protection
   * 4. Submits encrypted transaction to smart contract
   *
   * Error Handling:
   * - Input validation errors show user-friendly messages
   * - Encryption failures are caught and logged
   * - Transaction failures display error details to user
   */
  const handlePlaceBet = async () => {
    // ============================================
    // Step 1: Input Validation
    // ============================================
    const amount = parseFloat(betAmount);

    // Validate bet amount
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid bet amount greater than 0',
        variant: 'destructive',
      });
      return;
    }

    // Validate wallet connection
    if (!isConnected || !userAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to place a bet',
        variant: 'destructive',
      });
      return;
    }

    // Validate contract deployment
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

      // ============================================
      // Step 2: FHE Encryption
      // ============================================
      toast({
        title: '🔐 Encrypting Data',
        description: 'Your prediction is being encrypted with FHE...',
      });

      // Convert values to blockchain format
      // Note: Prices are scaled by 1e8 (satoshi-like precision)
      // This matches the price format used in the smart contract
      const lowerWei = BigInt(Math.floor(lowerBound * 1e8));
      const upperWei = BigInt(Math.floor(upperBound * 1e8));
      const stakeWei = parseEther(betAmount.toString()); // Convert ETH to wei

      console.log('[BetPanel] Encrypting values:', {
        lowerBound: lowerWei.toString(),
        upperBound: upperWei.toString(),
        stake: stakeWei.toString(),
        userAddress,
        contractAddress: CONTRACT_ADDRESS,
      });

      // Perform client-side FHE encryption
      // This creates encrypted handles that can be computed on-chain
      const { lowerHandle, upperHandle, stakeHandle, proof } = await encryptPriceGuess(
        CONTRACT_ADDRESS,
        userAddress,
        lowerWei,
        upperWei,
        stakeWei
      );

      setIsEncrypting(false);

      // ============================================
      // Step 3: Generate Commitment Hash
      // ============================================
      // Commitment scheme prevents replay attacks by making each
      // transaction unique based on user, asset, and timestamp
      const commitmentData = `${userAddress}-${assetId}-${Date.now()}`;
      const commitment = keccak256(toUtf8Bytes(commitmentData)) as `0x${string}`;

      console.log('[BetPanel] Generated commitment:', commitment);

      // ============================================
      // Step 4: Submit Transaction
      // ============================================
      toast({
        title: '📡 Broadcasting Transaction',
        description: 'Encrypted prediction submitted to blockchain...',
      });

      // Call smart contract placeGuess function
      // Parameters:
      // - assetId: Which asset to bet on (BTC, ETH, etc.)
      // - lowerHandle: Encrypted lower price bound
      // - upperHandle: Encrypted upper price bound
      // - stakeHandle: Encrypted bet amount
      // - proof: Zero-knowledge proof of encryption validity
      // - commitment: Replay attack prevention hash
      await placeGuess(
        assetId,
        lowerHandle as `0x${string}`,
        upperHandle as `0x${string}`,
        stakeHandle as `0x${string}`,
        proof as `0x${string}`,
        commitment
      );

      console.log('[BetPanel] ✅ Transaction submitted:', hash);

    } catch (error) {
      // Error handling
      console.error('[BetPanel] ❌ Error during bet placement:', error);

      setIsEncrypting(false);

      // Display error to user
      toast({
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Failed to place bet. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // ============================================
  // Success Handling
  // ============================================
  // Show success message when transaction is confirmed on-chain
  if (isConfirmed) {
    setTimeout(() => {
      toast({
        title: '✅ Prediction Submitted!',
        description: `Successfully placed ${betAmount} ETH bet on range $${lowerBound.toFixed(2)} - $${upperBound.toFixed(2)}`,
      });
      setBetAmount(''); // Clear input after success
    }, 100);
  }

  // Determine if any operation is in progress
  const isProcessing = isPending || isEncrypting || isConfirming;

  // ============================================
  // Component Render
  // ============================================
  return (
    <Card className="border-2 border-accent/30 bg-card/50 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <CardTitle className="font-mono flex items-center gap-2 text-base md:text-lg">
          <Wallet className="w-5 h-5 text-accent" />
          PLACE ENCRYPTED BET
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6">
        {/* ============================================ */}
        {/* Selected Range Display */}
        {/* ============================================ */}
        <div className="border-2 border-border rounded-lg p-3 md:p-4 bg-muted/20">
          <div className="text-xs text-muted-foreground font-mono mb-2">
            PREDICTION RANGE
          </div>
          <div className="flex items-center justify-between font-mono">
            <span className="text-base md:text-lg text-accent font-bold">
              ${lowerBound.toFixed(2)}
            </span>
            <span className="text-muted-foreground mx-2">→</span>
            <span className="text-base md:text-lg text-secondary font-bold">
              ${upperBound.toFixed(2)}
            </span>
          </div>
        </div>

        {/* ============================================ */}
        {/* Bet Amount Input */}
        {/* ============================================ */}
        <div className="space-y-2">
          <Label htmlFor="betAmount" className="font-mono text-xs md:text-sm">
            BET AMOUNT (ETH)
          </Label>
          <Input
            id="betAmount"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 0.1"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            disabled={isProcessing || !isConnected}
            className="font-mono border-2 border-muted focus:border-accent text-base md:text-lg"
          />
        </div>

        {/* ============================================ */}
        {/* FHE Encryption Notice */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-secondary/30 rounded-lg p-3 bg-secondary/5 flex items-start gap-3"
        >
          <Lock className="w-4 h-4 md:w-5 md:h-5 text-secondary mt-0.5 flex-shrink-0" />
          <div className="text-xs font-mono text-muted-foreground">
            <span className="text-secondary font-bold">FHE ENCRYPTION:</span> Your prediction range
            and bet amount will be encrypted before broadcast. Other players cannot see your
            strategy.
          </div>
        </motion.div>

        {/* ============================================ */}
        {/* Status Indicators */}
        {/* ============================================ */}
        {/* Warning: Wallet Not Connected */}
        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-accent/30 rounded-lg p-3 bg-accent/5 flex items-start gap-3"
          >
            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-accent mt-0.5 flex-shrink-0" />
            <div className="text-xs font-mono text-muted-foreground">
              Connect your wallet to place encrypted predictions on-chain
            </div>
          </motion.div>
        ) : isConfirmed ? (
          /* Success: Transaction Confirmed */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-green-500/30 rounded-lg p-3 bg-green-500/5 flex items-start gap-3"
          >
            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs font-mono">
              <div className="text-green-500 font-bold">✅ BET PLACED SUCCESSFULLY!</div>
              <div className="text-muted-foreground mt-1">
                Transaction confirmed: {hash?.slice(0, 10)}...{hash?.slice(-8)}
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* ============================================ */}
        {/* Place Bet Button */}
        {/* ============================================ */}
        <Button
          onClick={handlePlaceBet}
          disabled={!betAmount || isProcessing || !isConnected}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold border-2 border-accent neon-border-purple text-sm md:text-base py-5 md:py-6"
        >
          {isEncrypting ? (
            /* Encrypting State */
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 animate-pulse" />
              ENCRYPTING DATA...
            </span>
          ) : isPending || isConfirming ? (
            /* Transaction Processing State */
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 animate-pulse" />
              {isPending ? 'AWAITING SIGNATURE...' : 'CONFIRMING TRANSACTION...'}
            </span>
          ) : (
            /* Default State */
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">ENCRYPT & PLACE BET</span>
              <span className="sm:hidden">PLACE BET</span>
            </span>
          )}
        </Button>

        {/* ============================================ */}
        {/* Transaction Status Link */}
        {/* ============================================ */}
        {isConfirming && hash && (
          <div className="text-xs font-mono text-center text-muted-foreground animate-pulse">
            <p>⏳ Waiting for confirmation...</p>
            <p className="mt-1">
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline inline-flex items-center gap-1"
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
