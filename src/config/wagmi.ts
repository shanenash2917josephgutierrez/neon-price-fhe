/**
 * Wagmi Configuration
 *
 * Sets up Wagmi and RainbowKit for wallet connection.
 * Configured for Sepolia testnet as required by FHE deployment.
 * Coinbase Wallet connector is explicitly disabled to avoid connection issues.
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

// Get environment variables
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'demo-project-id';
const appName = import.meta.env.VITE_APP_NAME || 'PriceGuess';

/**
 * Configure wallet connectors
 * Explicitly exclude Coinbase Wallet to prevent connection issues
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
 * Wagmi configuration with custom connectors
 * Includes MetaMask, WalletConnect, Rainbow, and Trust Wallet
 * Coinbase connector is explicitly disabled
 */
export const config = createConfig({
  connectors,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(
      import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
    ),
  },
  ssr: false,
});

/**
 * RainbowKit metadata for wallet connection modal
 */
export const rainbowKitConfig = {
  appInfo: {
    appName,
  },
};

/**
 * Network configuration for Sepolia testnet
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
