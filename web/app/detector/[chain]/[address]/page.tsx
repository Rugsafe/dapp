"use client"; // Keep the client component directive

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
  { label: "Token Type", value: "ERC-20" },
  { label: "Deploy Time", value: "2021-01-01" },
  { label: "Token Address", value: "0x1234...abcd", copyable: true, link: true },
  { label: "Deployer Address", value: "0x9876...abcd", copyable: true },
  { label: "Owner Address", value: "0x4321...abcd", copyable: true },
];

// Remove generateStaticParams since we're using client-side rendering
export default function TokenPage() {
  const { chain, address } = useParams(); // Get the dynamic `chain` and `address` from URL params

  return (
    <TokenScannerInterface
      tokenName={`Sample Token on ${chain}`} // Display chain-specific token name
      tokenAddress={address as string}
      scanItems={scanItems}
      scanScore={100}
      passedCount={scanItems.filter((item) => item.passed).length}
      tokenOverview={tokenOverview}
    />
  );
}
