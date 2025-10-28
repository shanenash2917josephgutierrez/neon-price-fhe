/**
 * PriceGuess Application Root
 *
 * Integrates:
 * - RainbowKit for wallet connection
 * - Wagmi for Web3 interactions
 * - React Query for async state management
 * - React Router for navigation
 */

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { config, rainbowKitConfig } from './config/wagmi';
import Landing from './pages/Landing';
import Terminal from './pages/Terminal';
import Positions from './pages/Positions';
import NotFound from './pages/NotFound';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 30_000, // 30 seconds
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Main Application Component
 *
 * Wraps the entire app with necessary providers:
 * 1. WagmiProvider - Web3 connection management
 * 2. QueryClientProvider - Async state management
 * 3. RainbowKitProvider - Wallet connection UI
 * 4. TooltipProvider - UI tooltips
 * 5. BrowserRouter - Client-side routing
 */
const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider {...rainbowKitConfig}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/terminal" element={<Terminal />} />
              <Route path="/positions" element={<Positions />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
