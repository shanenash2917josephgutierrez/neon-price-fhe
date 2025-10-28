/**
 * FHE SDK Initialization Utility
 *
 * This module provides FHE instance management following Zama best practices:
 * - Uses CDN dynamic import for Vite compatibility
 * - Implements singleton pattern to avoid redundant initialization
 * - Provides proper error handling and logging
 * - Uses SepoliaConfig for testnet deployment
 */

let fheInstance: any = null;
let initializationPromise: Promise<any> | null = null;

/**
 * Initialize the FHE SDK instance
 *
 * @returns Promise resolving to the FHE instance
 * @throws Error if SDK fails to load or initialize
 */
export async function initializeFHE(): Promise<any> {
  // Return cached instance if already initialized
  if (fheInstance) {
    console.log('[FHE] Using cached instance');
    return fheInstance;
  }

  // Return ongoing initialization if in progress
  if (initializationPromise) {
    console.log('[FHE] Initialization in progress, waiting...');
    return initializationPromise;
  }

  console.log('[FHE] Starting initialization...');

  // Create new initialization promise
  initializationPromise = (async () => {
    try {
      // Import SDK from CDN (recommended for Vite projects)
      const sdk = await import('https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js');
      const { initSDK, createInstance, SepoliaConfig } = sdk;

      // Initialize WASM module (required before creating instance)
      console.log('[FHE] Initializing WASM module...');
      await initSDK();

      // Create FHE instance with Sepolia configuration
      console.log('[FHE] Creating FHE instance with SepoliaConfig...');
      fheInstance = await createInstance(SepoliaConfig);

      console.log('[FHE] ✅ Initialization complete');
      return fheInstance;
    } catch (error) {
      console.error('[FHE] ❌ Initialization failed:', error);

      // Reset state on failure
      fheInstance = null;
      initializationPromise = null;

      throw new Error(
        `Failed to initialize FHE SDK: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  })();

  return initializationPromise;
}

/**
 * Get the current FHE instance
 *
 * @returns The FHE instance or null if not initialized
 */
export function getFheInstance(): any | null {
  return fheInstance;
}

/**
 * Check if FHE is initialized
 *
 * @returns True if FHE instance is ready
 */
export function isFheInitialized(): boolean {
  return fheInstance !== null;
}

/**
 * Reset FHE instance (useful for testing or re-initialization)
 */
export function resetFheInstance(): void {
  console.log('[FHE] Resetting instance');
  fheInstance = null;
  initializationPromise = null;
}
