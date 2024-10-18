"use client";

import { Search, ChevronDown, AlertTriangle, Eye } from "lucide-react";
import { useState } from "react";
import Link from "next/link"; // Import Link for navigation

interface Token {
  name: string;
  logo: string;
  score: number;
  address: string;
  attentions: number;
  alerts: number;
}

interface Chain {
  name: string;
  logo: string;
}

const tokens: Token[] = [
  { name: "ETH", logo: "🔷", score: 95, address: "0x742...3a1b", attentions: 2, alerts: 0 },
  { name: "BTC", logo: "🟠", score: 98, address: "bc1q...9ph7", attentions: 1, alerts: 0 },
  { name: "USDT", logo: "💵", score: 92, address: "0x55d...7b9c", attentions: 0, alerts: 1 },
  { name: "XRP", logo: "✖️", score: 88, address: "rB3g...Y9Dp", attentions: 1, alerts: 2 },
];

const chains: Chain[] = [
  { name: "BNB", logo: "🟨" },
  { name: "Ethereum", logo: "🔷" },
  { name: "Solana", logo: "🟣" },
];

export default function CryptoScan() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedChain, setSelectedChain] = useState<Chain>(chains[1]); // Default to Ethereum chain
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-4">CryptoScan</h1>
      <p className="text-center mb-8">Instant multi-chain token security checks</p>

      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center bg-gray-800 rounded-md">
          <div className="relative">
            <div
              className="flex items-center px-3 py-2 cursor-pointer min-w-[120px]"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="mr-1">{selectedChain.logo}</span>
              <span className="mr-1 text-sm truncate">{selectedChain.name}</span>
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            </div>
            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
                {chains.map((chain) => (
                  <div
                    key={chain.name}
                    className="flex items-center px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm whitespace-nowrap min-w-[120px]"
                    onClick={() => {
                      setSelectedChain(chain);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <span className="mr-2">{chain.logo}</span>
                    <span className="truncate">{chain.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <input
            type="text"
            placeholder="Search Token By Address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow px-3 py-2 bg-transparent border-none focus:outline-none text-sm"
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center">
            <Search className="mr-2 h-4 w-4" /> Scan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {tokens.map((token) => (
          <Link
            key={token.name}
            href={`/detector/${selectedChain.name.toLowerCase()}/${token.address}`} // Dynamic URL for each token based on chain and address
            passHref
          >
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{token.logo}</span>
                  <span className="font-semibold">{token.name}</span>
                </div>
                <span className="text-green-400 font-bold">{token.score}</span>
              </div>
              <div className="text-sm text-gray-400 mb-2">{token.address}</div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <Eye className="mr-1 h-4 w-4" /> {token.attentions} Attentions
                </span>
                <span className="flex items-center text-yellow-500">
                  <AlertTriangle className="mr-1 h-4 w-4" /> {token.alerts} Alerts
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}