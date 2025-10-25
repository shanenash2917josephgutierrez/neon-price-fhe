import { create } from 'zustand';

// Terminal state management for predictions and settings
interface TerminalState {
  selectedAsset: string;
  lowerBound: number | null;
  upperBound: number | null;
  betAmount: number | null;
  currentPrice: number;
  
  // Actions
  setSelectedAsset: (asset: string) => void;
  setRange: (lower: number, upper: number) => void;
  setBetAmount: (amount: number) => void;
  setCurrentPrice: (price: number) => void;
  resetPrediction: () => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  selectedAsset: 'BTC/USD',
  lowerBound: null,
  upperBound: null,
  betAmount: null,
  currentPrice: 42879.24,
  
  setSelectedAsset: (asset) => set({ selectedAsset: asset }),
  setRange: (lower, upper) => set({ lowerBound: lower, upperBound: upper }),
  setBetAmount: (amount) => set({ betAmount: amount }),
  setCurrentPrice: (price) => set({ currentPrice: price }),
  resetPrediction: () => set({ lowerBound: null, upperBound: null, betAmount: null }),
}));
