/**
 * Contract Interaction Hooks
 *
 * Provides React hooks for interacting with the PriceGuessBook smart contract.
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI, GAS_LIMITS } from '@/config/contract';
import type { Address } from 'viem';

/**
 * Hook to read market information for a specific asset
 *
 * @param assetId - The asset ID to query
 * @returns Market data including settlement time, oracle, settled price, etc.
 */
export function useMarket(assetId: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'markets',
    args: [assetId],
  });
}

/**
 * Hook to read ticket information
 *
 * @param ticketId - The ticket ID to query
 * @returns Ticket data including bettor, asset ID, encrypted bounds, etc.
 */
export function useTicket(ticketId: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'tickets',
    args: [ticketId],
  });
}

/**
 * Hook to read payout ratio for an asset
 *
 * @param assetId - The asset ID to query
 * @returns Payout ratio (scaled by 1e6)
 */
export function usePayoutRatio(assetId: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'payoutRatioPlain',
    args: [assetId],
  });
}

/**
 * Hook to get the next ticket ID
 *
 * @returns The next ticket ID that will be assigned
 */
export function useNextTicketId() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'nextTicketId',
  });
}

/**
 * Hook to place an encrypted guess
 *
 * @returns Object containing write function, transaction data, and status
 */
export function usePlaceGuess() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Place a guess with encrypted price bounds and stake
   *
   * @param assetId - Asset ID to bet on
   * @param encryptedLower - Encrypted lower price bound
   * @param encryptedUpper - Encrypted upper price bound
   * @param encryptedStake - Encrypted stake amount
   * @param proof - Zero-knowledge proof for the encrypted data
   * @param commitment - Commitment hash to prevent replay attacks
   */
  const placeGuess = async (
    assetId: bigint,
    encryptedLower: `0x${string}`,
    encryptedUpper: `0x${string}`,
    encryptedStake: `0x${string}`,
    proof: `0x${string}`,
    commitment: `0x${string}`
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'placeGuess',
      args: [assetId, encryptedLower, encryptedUpper, encryptedStake, proof, commitment],
      gas: GAS_LIMITS.placeGuess,
    });
  };

  return {
    placeGuess,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook to claim winnings from a ticket
 *
 * @returns Object containing write function, transaction data, and status
 */
export function useClaim() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Claim winnings for a specific ticket
   *
   * @param ticketId - The ticket ID to claim
   */
  const claim = async (ticketId: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'claim',
      args: [ticketId],
      gas: GAS_LIMITS.claim,
    });
  };

  return {
    claim,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook to watch for GuessPlaced events
 *
 * @param userAddress - Optional address to filter events for a specific user
 * @returns Event watcher configuration
 */
export function useGuessPlacedEvents(userAddress?: Address) {
  // This would use useWatchContractEvent from wagmi
  // Implementation depends on whether you want to track all events or user-specific events
  return {
    // TODO: Implement event watching if needed
  };
}
