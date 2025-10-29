/**
 * Binance API Service
 *
 * Fetches real-time cryptocurrency price data from Binance public API
 *
 * Features:
 * - Real-time BTC/USDT price
 * - 24h price change percentage
 * - Error handling and retry logic
 * - TypeScript type safety
 *
 * @module services/binanceApi
 */

/**
 * Binance API ticker response type
 */
export interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

/**
 * Simplified price data structure
 */
export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: number;
}

/**
 * Binance API base URL
 */
const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

/**
 * Fetch current price for a specific trading pair
 *
 * @param symbol - Trading pair symbol (e.g., 'BTCUSDT')
 * @returns Promise<PriceData> - Current price data
 * @throws Error if API request fails
 *
 * @example
 * ```typescript
 * const btcPrice = await fetchPrice('BTCUSDT');
 * console.log(`BTC Price: $${btcPrice.price}`);
 * ```
 */
export async function fetchPrice(symbol: string = 'BTCUSDT'): Promise<PriceData> {
  try {
    console.log(`[Binance API] Fetching price for ${symbol}...`);

    const response = await fetch(`${BINANCE_API_BASE}/ticker/24hr?symbol=${symbol}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

    const data: BinanceTicker = await response.json();

    // Parse and format the data
    const priceData: PriceData = {
      symbol: data.symbol,
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChange),
      changePercent24h: parseFloat(data.priceChangePercent),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      volume24h: parseFloat(data.volume),
      timestamp: Date.now(),
    };

    console.log(`[Binance API] ✅ Price fetched successfully: $${priceData.price.toFixed(2)}`);
    console.log(`[Binance API] 24h Change: ${priceData.changePercent24h.toFixed(2)}%`);

    return priceData;
  } catch (error) {
    console.error('[Binance API] ❌ Failed to fetch price:', error);
    throw new Error(`Failed to fetch ${symbol} price from Binance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch prices for multiple trading pairs
 *
 * @param symbols - Array of trading pair symbols
 * @returns Promise<PriceData[]> - Array of price data
 *
 * @example
 * ```typescript
 * const prices = await fetchMultiplePrices(['BTCUSDT', 'ETHUSDT']);
 * prices.forEach(p => console.log(`${p.symbol}: $${p.price}`));
 * ```
 */
export async function fetchMultiplePrices(symbols: string[]): Promise<PriceData[]> {
  try {
    console.log(`[Binance API] Fetching prices for ${symbols.length} symbols...`);

    const promises = symbols.map(symbol => fetchPrice(symbol));
    const results = await Promise.all(promises);

    console.log(`[Binance API] ✅ Fetched ${results.length} prices successfully`);
    return results;
  } catch (error) {
    console.error('[Binance API] ❌ Failed to fetch multiple prices:', error);
    throw error;
  }
}

/**
 * Subscribe to price updates with polling
 *
 * @param symbol - Trading pair symbol
 * @param callback - Callback function to handle price updates
 * @param interval - Polling interval in milliseconds (default: 5000ms = 5s)
 * @returns Cleanup function to stop polling
 *
 * @example
 * ```typescript
 * const unsubscribe = subscribeToPriceUpdates('BTCUSDT', (price) => {
 *   console.log(`Updated price: $${price.price}`);
 * });
 *
 * // Stop updates after 60 seconds
 * setTimeout(unsubscribe, 60000);
 * ```
 */
export function subscribeToPriceUpdates(
  symbol: string,
  callback: (data: PriceData) => void,
  interval: number = 5000
): () => void {
  console.log(`[Binance API] Starting price subscription for ${symbol} (${interval}ms interval)`);

  let isActive = true;

  const fetchAndCallback = async () => {
    if (!isActive) return;

    try {
      const data = await fetchPrice(symbol);
      callback(data);
    } catch (error) {
      console.error('[Binance API] Error in subscription:', error);
    }

    if (isActive) {
      setTimeout(fetchAndCallback, interval);
    }
  };

  // Start immediately
  fetchAndCallback();

  // Return cleanup function
  return () => {
    console.log(`[Binance API] Stopping price subscription for ${symbol}`);
    isActive = false;
  };
}

/**
 * Get price with exponential backoff retry logic
 *
 * @param symbol - Trading pair symbol
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Promise<PriceData> - Price data
 * @throws Error if all retries fail
 */
export async function fetchPriceWithRetry(
  symbol: string = 'BTCUSDT',
  maxRetries: number = 3
): Promise<PriceData> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Binance API] Attempt ${attempt}/${maxRetries} to fetch ${symbol}`);
      return await fetchPrice(symbol);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`[Binance API] Attempt ${attempt} failed:`, lastError.message);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s...
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`[Binance API] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed to fetch ${symbol} price after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Supported trading pairs
 */
export const SUPPORTED_SYMBOLS = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
  BNB: 'BNBUSDT',
  SOL: 'SOLUSDT',
  ADA: 'ADAUSDT',
} as const;

/**
 * Get user-friendly symbol name
 */
export function getSymbolName(symbol: string): string {
  const names: Record<string, string> = {
    'BTCUSDT': 'Bitcoin',
    'ETHUSDT': 'Ethereum',
    'BNBUSDT': 'BNB',
    'SOLUSDT': 'Solana',
    'ADAUSDT': 'Cardano',
  };

  return names[symbol] || symbol;
}
