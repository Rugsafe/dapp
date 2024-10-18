"use client"

import React from 'react';
import { AlertTriangle, CheckCircle, Copy, ExternalLink, Info } from 'lucide-react';

interface ScanItem {
  name: string;
  category: string;
  description: string;
  passed: boolean;
}

interface TokenOverviewItem {
  label: string;
  value: string;
  copyable?: boolean;
  link?: boolean;
}

interface TokenScannerInterfaceProps {
  tokenName: string;
  tokenAddress: string;
  scanItems: ScanItem[];
  scanScore: number;
  passedCount: number;
  tokenOverview: TokenOverviewItem[];
}

const TokenScannerInterface: React.FC<TokenScannerInterfaceProps> = ({
  tokenName,
  tokenAddress,
  scanItems,
  scanScore,
  passedCount,
  tokenOverview,
}) => {
  return (
    <div className="bg-gray-900 text-white p-6 font-sans">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-yellow-500 rounded-full mr-2 flex items-center justify-center text-black font-bold">
            G
          </div>
          <div>
            <h1 className="text-xl font-bold">{tokenName}</h1>
            <p className="text-gray-400 text-sm">{tokenAddress}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="p-2 bg-gray-800 rounded-full">
            <AlertTriangle size={20} />
          </button>
          <button className="p-2 bg-gray-800 rounded-full">
            <ExternalLink size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Scan Result</h2>
              <div className="flex space-x-2 text-sm text-gray-400">
                <span>0 Attentions</span>
                <span>0 Alerts</span>
              </div>
            </div>
            <table className="w-full">
              <thead className="text-left text-gray-400 text-sm">
                <tr>
                  <th className="py-2">Scan Item Result</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {scanItems.map((item, index) => (
                  <tr key={index} className="border-t border-gray-700">
                    <td className="py-3 flex items-center">
                      <CheckCircle className="text-green-500 mr-2" size={20} />
                      <span>{item.name}</span>
                      <Info className="text-gray-400 ml-1" size={16} />
                    </td>
                    <td className="py-3">
                      <span className="bg-gray-700 text-xs px-2 py-1 rounded-full">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 text-sm">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-bold mb-4">Token Scan Score</h3>
            <div className="relative w-48 h-48 mx-auto">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-gray-700 stroke-current"
                  strokeWidth="10"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                />
                <circle
                  className="text-green-500 stroke-current"
                  strokeWidth="10"
                  strokeLinecap="round"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset="0"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{scanScore.toFixed(2)}</span>
                <span className="text-sm text-gray-400">0 100</span>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-green-500 font-bold">{passedCount} Passed</p>
              <p className="text-gray-400">0 Attentions</p>
              <p className="text-gray-400">0 Alerts</p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-bold mb-4">Token Overview</h3>
            <table className="w-full">
              <tbody>
                {tokenOverview.map((item, index) => (
                  <tr key={index} className="border-t border-gray-700">
                    <td className="py-2 text-gray-400">{item.label}</td>
                    <td className="py-2 text-right flex items-center justify-end">
                      <span className={item.label === 'Token Type' ? 'bg-gray-700 px-2 py-1 rounded text-xs' : ''}>
                        {item.value}
                      </span>
                      {item.copyable && <Copy className="ml-2 text-gray-400" size={16} />}
                      {item.link && <ExternalLink className="ml-2 text-gray-400" size={16} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenScannerInterface;