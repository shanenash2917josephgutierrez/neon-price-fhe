/**
 * FHE Encryption Utilities
 *
 * Provides helper functions for encrypting data before submitting to smart contracts.
 * All encryption follows Zama fhEVM best practices.
 */

import { hexlify, getAddress } from 'ethers';
import { initializeFHE } from './fheInstance';

/**
 * Encrypt price guess data (lower bound, upper bound, stake amount)
 *
 * @param contractAddress - The smart contract address (must be checksummed)
 * @param userAddress - The user's wallet address
 * @param lower - Lower price bound (in wei or scaled price)
 * @param upper - Upper price bound (in wei or scaled price)
 * @param stakeWei - Stake amount in wei
 * @returns Object containing encrypted handles and proof
 */
export async function encryptPriceGuess(
  contractAddress: string,
  userAddress: string,
  lower: bigint,
  upper: bigint,
  stakeWei: bigint
): Promise<{
  lowerHandle: string;
  upperHandle: string;
  stakeHandle: string;
  proof: string;
}> {
  console.log('[Encryption] Starting price guess encryption...');
  console.log('[Encryption] Lower:', lower, 'Upper:', upper, 'Stake:', stakeWei);

  // Get FHE instance (will initialize if not already done)
  const fhe = await initializeFHE();

  // Ensure address is in checksum format
  const contractAddr = getAddress(contractAddress) as `0x${string}`;
  console.log('[Encryption] Contract address:', contractAddr);

  // Create encrypted input for the contract
  const input = fhe.createEncryptedInput(contractAddr, userAddress);

  // Add all three values as euint64
  input.add64(lower);
  input.add64(upper);
  input.add64(stakeWei);

  console.log('[Encryption] Encrypting data...');

  // Perform encryption
  const { handles, inputProof } = await input.encrypt();

  // Convert to hex strings
  const result = {
    lowerHandle: hexlify(handles[0]),
    upperHandle: hexlify(handles[1]),
    stakeHandle: hexlify(handles[2]),
    proof: hexlify(inputProof),
  };

  console.log('[Encryption] ✅ Encryption complete');
  console.log('[Encryption] Lower handle:', result.lowerHandle.slice(0, 10) + '...');
  console.log('[Encryption] Upper handle:', result.upperHandle.slice(0, 10) + '...');
  console.log('[Encryption] Stake handle:', result.stakeHandle.slice(0, 10) + '...');

  return result;
}

/**
 * Encrypt a single uint64 value
 *
 * @param contractAddress - The smart contract address
 * @param userAddress - The user's wallet address
 * @param value - The value to encrypt
 * @returns Object containing encrypted handle and proof
 */
export async function encryptUint64(
  contractAddress: string,
  userAddress: string,
  value: bigint
): Promise<{ handle: string; proof: string }> {
  console.log('[Encryption] Encrypting uint64 value:', value);

  const fhe = await initializeFHE();
  const contractAddr = getAddress(contractAddress) as `0x${string}`;

  const input = fhe.createEncryptedInput(contractAddr, userAddress);
  input.add64(value);

  const { handles, inputProof } = await input.encrypt();

  return {
    handle: hexlify(handles[0]),
    proof: hexlify(inputProof),
  };
}

/**
 * Encrypt a single uint32 value
 *
 * @param contractAddress - The smart contract address
 * @param userAddress - The user's wallet address
 * @param value - The value to encrypt (will be converted to Number)
 * @returns Object containing encrypted handle and proof
 */
export async function encryptUint32(
  contractAddress: string,
  userAddress: string,
  value: number | bigint
): Promise<{ handle: string; proof: string }> {
  console.log('[Encryption] Encrypting uint32 value:', value);

  const fhe = await initializeFHE();
  const contractAddr = getAddress(contractAddress) as `0x${string}`;

  const input = fhe.createEncryptedInput(contractAddr, userAddress);
  input.add32(Number(value));

  const { handles, inputProof } = await input.encrypt();

  return {
    handle: hexlify(handles[0]),
    proof: hexlify(inputProof),
  };
}

/**
 * Encrypt a boolean value
 *
 * @param contractAddress - The smart contract address
 * @param userAddress - The user's wallet address
 * @param value - The boolean value to encrypt
 * @returns Object containing encrypted handle and proof
 */
export async function encryptBool(
  contractAddress: string,
  userAddress: string,
  value: boolean
): Promise<{ handle: string; proof: string }> {
  console.log('[Encryption] Encrypting boolean value:', value);

  const fhe = await initializeFHE();
  const contractAddr = getAddress(contractAddress) as `0x${string}`;

  const input = fhe.createEncryptedInput(contractAddr, userAddress);
  input.addBool(value);

  const { handles, inputProof } = await input.encrypt();

  return {
    handle: hexlify(handles[0]),
    proof: hexlify(inputProof),
  };
}
