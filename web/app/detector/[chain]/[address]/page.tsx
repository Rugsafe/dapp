"use client"; // Ensure this is a client component

import TokenScannerInterface from "@/components/Detector/tokenscan";
import { useParams } from "next/navigation"; // Use useParams for dynamic route params

const scanItems = [
  { name: "Ownership Check", category: "Security", description: "No issues detected", passed: true },
  { name: "Liquidity", category: "Trading", description: "Sufficient liquidity available", passed: true },
  { name: "Source Code Audit", category: "Audit", description: "Audit passed", passed: true },
  // Add more scan items here...
];

const tokenOverview = [
  { label: "Total Supply", value: "1,000,000", copyable: true },
  { label: "Token Type", value: "SPL (Solana Program Library)" }, // Set Solana token type
  { label: "Deploy Time", value: "2021-01-01" },
  { label: "Token Address", value: "9n8b1EXLCA8Z22mf7pjLKVNzuQgGbyPfLrmFQvEcHeSU", copyable: true, link: true }, // Example Solana address
  { label: "Deployer Address", value: "5tRc5k8n8dFnE5dL9HyJNqE3GwyjS6UKT7", copyable: true },
  { label: "Owner Address", value: "H2a3vJ5oK1sL6qJr7Gd3FnT8z9pWn2vFzT", copyable: true },
];

// Default to Solana chain if not provided
export default function TokenPage() {
  const { chain, address } = useParams(); // Get the dynamic `chain` and `address` from URL params

  const selectedChain = chain || 'solana'; // Default to 'solana' if no chain is provided

  return (
    <TokenScannerInterface
      tokenName={`Sample Token on ${selectedChain}`} // Display Solana or the selected chain
      tokenAddress={address as string}
      scanItems={scanItems}
      scanScore={100}
      passedCount={scanItems.filter((item) => item.passed).length}
      tokenOverview={tokenOverview}
    />
  );
}
