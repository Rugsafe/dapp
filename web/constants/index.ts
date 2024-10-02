import { PublicKey, clusterApiUrl } from '@solana/web3.js';

// Define available networks
export enum SolanaNetwork {
  MAINNET = 'mainnet-beta',
  DEVNET = 'devnet',
  TESTNET = 'testnet'
}

// Set the current network (you can change this to MAINNET or TESTNET as needed)
export const CURRENT_NETWORK = SolanaNetwork.DEVNET;

// Get the appropriate cluster API URL
export const NETWORK_URL = clusterApiUrl(CURRENT_NETWORK);

// Your contract program ID
// export const CONTRACT_PROGRAM_ID: PublicKey = new PublicKey('FobNvbQsK5BAniZC2oJhXakjcPiArpsthTGDnX9eHDVY');
export const VAULT_CONTRACT_PROGRAM_ID: PublicKey = new PublicKey('3G5qWYYUBdc79hYTZqQ2TX2cvFxVgbhuSFcm7APispCw');
export const PERP_CONTRACT_PROGRAM_ID: PublicKey = new PublicKey('A7Lpa8Sg8cb9ZdHG7t1TJGyy5NsvbXxgkcR6P8r4nrig');

//A7Lpa8Sg8cb9ZdHG7t1TJGyy5NsvbXxgkcR6P8r4nrig

// Collateral token mint
export const COLLATERAL_MINT: PublicKey = new PublicKey('WQgfFKMeNyuANha2hsuCxgP36Qwfo2L8PGReAD1jBPp');

// Maximum number of positions
export const MAX_POSITIONS: number = 10; // dont need anymore

// You can keep the localhost URL for local development if needed
export const LOCALHOST_URL = 'http://127.0.0.1:8899';

// Function to get the appropriate connection URL
export const getConnectionUrl = (useLocalhost: boolean = true): string => {
  return useLocalhost ? LOCALHOST_URL : NETWORK_URL;
};
