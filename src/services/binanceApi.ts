/**
 * Cryptocurrency Price API Service
 *
 * Fetches real-time cryptocurrency price data from CoinGecko public API
 *
 * Features:
 * - Real-time BTC/USD price
 * - 24h price change percentage and volume
 * - Error handling and retry logic
 * - TypeScript type safety
 * - No API key required
 *
 * @module services/binanceApi
 */

/**
 * CoinGecko API response type for detailed coin data
 */
export interface CoinGeckoResponse {
  id: string;
  symbol: string;
  name: string;
  market_data: {
    current_price: {
      usd: number;
    };
    price_change_24h: number;
    price_change_percentage_24h: number;
    high_24h: {
      usd: number;
    };
    low_24h: {
      usd: number;
    };
    total_volume: {
      usd: number;
    };
  };
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
 * CoinGecko API base URL
 * Using Vite proxy to bypass CORS restrictions in development
 * Production builds should use direct API or backend proxy
 */
const CRYPTO_API_BASE = '/api/crypto/api/v3';

/**
 * Map trading symbols to CoinGecko IDs
 */
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  'BTCUSDT': 'bitcoin',
  'ETHUSDT': 'ethereum',
  'BNBUSDT': 'binancecoin',
  'SOLUSDT': 'solana',
  'ADAUSDT': 'cardano',
};

/**
 * Fetch current price for a specific cryptocurrency
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
    // Convert symbol to CoinGecko ID
    const coinId = SYMBOL_TO_COINGECKO_ID[symbol] || 'bitcoin';
    console.log(`[Crypto API] Fetching price for ${symbol} (${coinId})...`);

    const response = await fetch(
      `${CRYPTO_API_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data: CoinGeckoResponse = await response.json();

    // Parse and format the data
    const priceData: PriceData = {
      symbol: symbol,
      price: data.market_data.current_price.usd,
      change24h: data.market_data.price_change_24h,
      changePercent24h: data.market_data.price_change_percentage_24h,
      high24h: data.market_data.high_24h.usd,
      low24h: data.market_data.low_24h.usd,
      volume24h: data.market_data.total_volume.usd,
      timestamp: Date.now(),
    };

    console.log(`[Crypto API] ✅ Price fetched successfully: $${priceData.price.toFixed(2)}`);
    console.log(`[Crypto API] 24h Change: ${priceData.changePercent24h.toFixed(2)}%`);

    return priceData;
  } catch (error) {
    console.error('[Crypto API] ❌ Failed to fetch price:', error);
    throw new Error(`Failed to fetch ${symbol} price from CoinGecko: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    console.log(`[Crypto API] Fetching prices for ${symbols.length} symbols...`);

    const promises = symbols.map(symbol => fetchPrice(symbol));
    const results = await Promise.all(promises);

    console.log(`[Crypto API] ✅ Fetched ${results.length} prices successfully`);
    return results;
  } catch (error) {
    console.error('[Crypto API] ❌ Failed to fetch multiple prices:', error);
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
  console.log(`[Crypto API] Starting price subscription for ${symbol} (${interval}ms interval)`);

  let isActive = true;

  const fetchAndCallback = async () => {
    if (!isActive) return;

    try {
      const data = await fetchPrice(symbol);
      callback(data);
    } catch (error) {
      console.error('[Crypto API] Error in subscription:', error);
    }

    if (isActive) {
      setTimeout(fetchAndCallback, interval);
    }
  };

  // Start immediately
  fetchAndCallback();

  // Return cleanup function
  return () => {
    console.log(`[Crypto API] Stopping price subscription for ${symbol}`);
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
      console.log(`[Crypto API] Attempt ${attempt}/${maxRetries} to fetch ${symbol}`);
      return await fetchPrice(symbol);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`[Crypto API] Attempt ${attempt} failed:`, lastError.message);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s...
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`[Crypto API] Retrying in ${delay}ms...`);
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
