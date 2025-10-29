/**
 * Trading Terminal Page
 *
 * This is the main prediction interface where users can:
 * - Select price ranges for their predictions
 * - Place encrypted bets using FHE technology
 * - View connection status and wallet information
 *
 * Features:
 * - Fully responsive design (mobile, tablet, desktop)
 * - Real-time wallet connection status
 * - Cyberpunk-themed UI with digital rain background
 * - FHE-encrypted bet submission workflow
 *
 * @component
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
 * Terminal Component
 *
 * Main trading terminal interface for encrypted price predictions.
 */
const Terminal = () => {
  // State and hooks
  const { currentPrice, setRange } = useTerminalStore();
  const { address, isConnected } = useAccount();
  const [selectedRange, setSelectedRange] = useState<{ lower: number; upper: number } | null>(null);

  /**
   * Handle range selection from RangeSelector component
   * Updates both the global store and local state
   */
  const handleRangeSelect = (lower: number, upper: number) => {
    setRange(lower, upper);
    setSelectedRange({ lower, upper });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background effect - Digital rain animation */}
      <DigitalRain />

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-6 md:py-8 lg:py-12">
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          {/* Navigation and wallet connection */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <Link to="/">
              <Button
                variant="outline"
                size="sm"
                className="border-secondary text-secondary hover:bg-secondary/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>

            {/* Wallet Connection - Responsive positioning */}
            <div className="w-full sm:w-auto flex justify-end">
              <ConnectButton />
            </div>
          </div>

          {/* Page title - Responsive text sizing */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2">
            <span className="neon-green">PREDICTION</span>{' '}
            <span className="neon-purple">TERMINAL</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-mono">
            [ ENCRYPTED RANGE BETTING INTERFACE ]
          </p>

          {/* Connection Status Banner - Only shown when connected */}
          {isConnected && address && (
            <div className="mt-4 p-3 md:p-4 border border-secondary/30 rounded-lg bg-secondary/5 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-xs md:text-sm font-mono text-secondary flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>CONNECTED: {address.slice(0, 6)}...{address.slice(-4)}</span>
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Ready to place encrypted predictions on-chain
              </p>
            </div>
          )}

          {/* Warning for disconnected users */}
          {!isConnected && (
            <div className="mt-4 p-3 md:p-4 border border-accent/30 rounded-lg bg-accent/5 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-xs md:text-sm font-mono text-accent flex items-center gap-2">
                <span>⚠️</span>
                <span>WALLET NOT CONNECTED</span>
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Please connect your wallet to place predictions
              </p>
            </div>
          )}
        </div>

        {/* Trading Interface - Responsive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 max-w-7xl mx-auto">
          {/* Range Selector - Always visible */}
          <div className="w-full">
            <RangeSelector currentPrice={currentPrice} onRangeSelect={handleRangeSelect} />
          </div>

          {/* Bet Panel - Shown when range is selected */}
          {selectedRange ? (
            <div className="w-full animate-in fade-in slide-in-from-right-5 duration-500">
              <BetPanel
                lowerBound={selectedRange.lower}
                upperBound={selectedRange.upper}
                assetId={DEFAULT_ASSET_ID}
                userAddress={address}
                isConnected={isConnected}
              />
            </div>
          ) : (
            /* Placeholder when no range selected */
            <div className="w-full">
              <div className="border-2 border-dashed border-border rounded-lg p-6 md:p-8 lg:p-12 text-center bg-card/30 min-h-[200px] flex items-center justify-center">
                <div>
                  <p className="text-sm md:text-base text-muted-foreground font-mono mb-2">
                    ⬅️ Select your prediction range
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Choose price bounds to enable encrypted betting
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Terminal;
