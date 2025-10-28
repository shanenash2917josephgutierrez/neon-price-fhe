/**
 * Trading Terminal Page
 *
 * Main page for placing encrypted price predictions.
 * Integrates wallet connection, FHE encryption, and smart contract interaction.
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { DigitalRain } from '@/components/DigitalRain';
import { RangeSelector } from '@/components/terminal/RangeSelector';
import { BetPanel } from '@/components/terminal/BetPanel';
import { useTerminalStore } from '@/store/terminalStore';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DEFAULT_ASSET_ID } from '@/config/contract';

/**
 * Trading terminal for placing encrypted predictions
 */
const Terminal = () => {
  const { currentPrice, setRange } = useTerminalStore();
  const { address, isConnected } = useAccount();
  const [selectedRange, setSelectedRange] = useState<{ lower: number; upper: number } | null>(null);

  const handleRangeSelect = (lower: number, upper: number) => {
    setRange(lower, upper);
    setSelectedRange({ lower, upper });
  };

  return (
    <div className="relative min-h-screen">
      <DigitalRain />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link to="/">
              <Button
                variant="outline"
                className="border-secondary text-secondary hover:bg-secondary/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>

            {/* Wallet Connection Button */}
            <ConnectButton />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="neon-green">PREDICTION</span> <span className="neon-purple">TERMINAL</span>
          </h1>
          <p className="text-muted-foreground font-mono">
            [ ENCRYPTED RANGE BETTING INTERFACE ]
          </p>

          {/* Connection Status */}
          {isConnected && address && (
            <div className="mt-4 p-4 border border-secondary/30 rounded-lg bg-secondary/5">
              <p className="text-xs font-mono text-secondary">
                ✅ CONNECTED: {address.slice(0, 6)}...{address.slice(-4)}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Ready to place encrypted predictions on-chain
              </p>
            </div>
          )}
        </div>

        {/* Trading interface */}
        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl">
          <RangeSelector currentPrice={currentPrice} onRangeSelect={handleRangeSelect} />

          {selectedRange && (
            <BetPanel
              lowerBound={selectedRange.lower}
              upperBound={selectedRange.upper}
              assetId={DEFAULT_ASSET_ID}
              userAddress={address}
              isConnected={isConnected}
            />
          )}
        </div>

        {!selectedRange && (
          <div className="lg:col-start-2 max-w-6xl mt-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-card/30">
              <p className="text-muted-foreground font-mono">
                Set your prediction range to enable betting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Terminal;
