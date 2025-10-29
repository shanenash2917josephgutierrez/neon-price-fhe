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

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { DigitalRain } from '@/components/DigitalRain';
import { RangeSelector } from '@/components/terminal/RangeSelector';
import { BetPanel } from '@/components/terminal/BetPanel';
import { useTerminalStore } from '@/store/terminalStore';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DEFAULT_ASSET_ID } from '@/config/contract';
import { fetchPriceWithRetry, subscribeToPriceUpdates, PriceData } from '@/services/binanceApi';
import { useToast } from '@/hooks/use-toast';

/**
 * Terminal Component
 *
 * Main trading terminal interface for encrypted price predictions.
 */
const Terminal = () => {
  // State and hooks
  const { setRange } = useTerminalStore();
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [selectedRange, setSelectedRange] = useState<{ lower: number; upper: number; expiryTimestamp: number } | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(42879.24); // Default fallback
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  /**
   * Fetch initial price and setup subscription
   */
  useEffect(() => {
    console.log('[Terminal] Setting up price subscription...');

    // Fetch initial price
    const fetchInitialPrice = async () => {
      try {
        setIsLoadingPrice(true);
        const data = await fetchPriceWithRetry('BTCUSDT', 3);
        setCurrentPrice(data.price);
        setPriceData(data);
        setLastUpdate(new Date());
        console.log('[Terminal] ✅ Initial price loaded:', data.price);
      } catch (error) {
        console.error('[Terminal] ❌ Failed to fetch initial price:', error);
        toast({
          title: "Price Fetch Error",
          description: "Using fallback price. Real-time updates may be unavailable.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingPrice(false);
      }
    };

    fetchInitialPrice();

    // Subscribe to price updates (every 10 seconds)
    const unsubscribe = subscribeToPriceUpdates('BTCUSDT', (data) => {
      setCurrentPrice(data.price);
      setPriceData(data);
      setLastUpdate(new Date());
      console.log('[Terminal] 🔄 Price updated:', data.price);
    }, 10000);

    // Cleanup subscription on unmount
    return () => {
      console.log('[Terminal] Cleaning up price subscription');
      unsubscribe();
    };
  }, [toast]);

  /**
   * Handle manual price refresh
   */
  const handleRefreshPrice = async () => {
    try {
      setIsLoadingPrice(true);
      const data = await fetchPriceWithRetry('BTCUSDT', 2);
      setCurrentPrice(data.price);
      setPriceData(data);
      setLastUpdate(new Date());
      toast({
        title: "Price Updated",
        description: `BTC/USD: $${data.price.toLocaleString()}`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not fetch latest price",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPrice(false);
    }
  };

  /**
   * Handle range selection from RangeSelector component
   * Updates both the global store and local state
   */
  const handleRangeSelect = (lower: number, upper: number, expiryTimestamp: number) => {
    setRange(lower, upper);
    setSelectedRange({ lower, upper, expiryTimestamp });
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

          {/* Real-time Price Card */}
          <div className="mt-4 p-3 md:p-4 border border-primary/30 rounded-lg bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">
                    BTC/USD LIVE
                  </span>
                  {priceData && (
                    <span className={`text-xs font-mono ${priceData.changePercent24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {priceData.changePercent24h >= 0 ? '▲' : '▼'} {Math.abs(priceData.changePercent24h).toFixed(2)}%
                    </span>
                  )}
                </div>
                <div className="text-2xl md:text-3xl font-bold font-mono text-primary price-flicker">
                  ${isLoadingPrice ? '...' : currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {priceData && (
                  <div className="text-xs font-mono text-muted-foreground mt-1">
                    24h: ${priceData.low24h.toFixed(2)} - ${priceData.high24h.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshPrice}
                  disabled={isLoadingPrice}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingPrice ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline ml-2">Refresh</span>
                </Button>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  {lastUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

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
                expiryTimestamp={selectedRange.expiryTimestamp}
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
