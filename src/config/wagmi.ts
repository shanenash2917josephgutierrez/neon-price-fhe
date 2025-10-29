/**
 * Wagmi Configuration
 *
 * This module configures Web3 wallet connectivity for the PriceGuess DApp.
 *
 * Key Features:
 * - Sepolia testnet support (required for Zama FHE deployment)
 * - RainbowKit wallet connection UI
 * - Multiple wallet support (MetaMask, WalletConnect, Rainbow, Trust)
 * - Coinbase Wallet explicitly disabled to prevent connection issues
 *
 * @see https://wagmi.sh/react/getting-started
 * @see https://www.rainbowkit.com/docs/introduction
 */

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  walletConnectWallet,
  rainbowWallet,
  trustWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';

/**
 * Environment Variables
 * These should be defined in your .env file
 */
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'demo-project-id';
const appName = import.meta.env.VITE_APP_NAME || 'PriceGuess';

/**
 * Configure wallet connectors
 *
 * Supported Wallets:
 * - MetaMask: Most popular browser extension wallet
 * - WalletConnect: Mobile wallet connection protocol
 * - Rainbow: Modern Ethereum wallet with great UX
 * - Trust Wallet: Mobile-first multi-chain wallet
 *
 * Note: Coinbase Wallet is intentionally excluded due to:
 * - Connection reliability issues on Sepolia testnet
 * - Known compatibility issues with FHE encrypted transactions
 */
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, walletConnectWallet, rainbowWallet, trustWallet],
    },
  ],
  {
    appName,
    projectId,
  }
);

/**
 * Main Wagmi configuration
 *
 * Configuration includes:
 * - Custom wallet connectors (without Coinbase)
 * - Sepolia testnet chain
 * - RPC provider with fallback
 * - SSR disabled (client-side only)
 *
 * The configuration is exported for use in the WagmiProvider component.
 */
export const config = createConfig({
  connectors,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(
      import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
    ),
  },
  ssr: false, // Disable server-side rendering (Vite SPA)
});

/**
 * RainbowKit Configuration
 *
 * Customizes the RainbowKit wallet connection modal.
 * Additional options can be added here for branding and UX.
 *
 * @see https://www.rainbowkit.com/docs/custom-app-info
 */
export const rainbowKitConfig = {
  appInfo: {
    appName,
    // Optional: Add disclaimer, learn more URL, etc.
  },
};

/**
 * Sepolia Network Configuration
 *
 * Extended network configuration for Sepolia testnet.
 * Includes RPC URLs, block explorers, and native currency info.
 *
 * Why Sepolia?
 * - Supported by Zama fhEVM for FHE operations
 * - Stable testnet with consistent block times
 * - Free testnet ETH available from faucets
 *
 * Faucets:
 * - https://sepoliafaucet.com
 * - https://sepolia-faucet.pk910.de
 */
export const sepoliaConfig = {
  id: sepolia.id,
  name: sepolia.name,
  network: 'sepolia',
  nativeCurrency: sepolia.nativeCurrency,
  rpcUrls: {
    default: {
      http: [
        import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
      ],
    },
    public: {
      http: ['https://ethereum-sepolia-rpc.publicnode.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
  },
  testnet: true,
};
