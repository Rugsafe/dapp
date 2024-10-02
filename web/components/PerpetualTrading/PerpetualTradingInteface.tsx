"use client"
import React, { useState, useEffect } from 'react';
import TradingChart from './TradingChart';
import OrderForm from './OrderForm';
import { useSolanaProgram } from '../../hooks/useSolanaProgram';
import OrderBook from './Orderbook';

const PerpetualTradingInterface: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('ETH-USD');
  const [currentPrice, setCurrentPrice] = useState(2460.5);
  const { userPositions, balance, loading, placeOrder } = useSolanaProgram();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrice(prevPrice => prevPrice + (Math.random() * 10 - 5));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Top bar */}
      <div className="flex justify-between items-center p-2 bg-gray-800">
        <div className="flex items-center space-x-4">
          <span className="font-bold">{selectedSymbol}</span>
          <span>Mark: {currentPrice.toFixed(1)}</span>
          <span>Oracle: {(currentPrice + 1.4).toFixed(1)}</span>
          <span>24h Change: -68.5 / -2.71%</span>
        </div>
        <div className="flex space-x-2">
          <button className="px-2 py-1 bg-gray-700 rounded">Cross</button>
          <button className="px-2 py-1 bg-gray-700 rounded">20x</button>
          <button className="px-2 py-1 bg-gray-700 rounded">One-Way</button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chart and trading tools */}
        <div className="flex-1 flex flex-col">
          {/* Chart */}
          <div className="flex-1">
            <TradingChart />
          </div>
          {/* Trading tools */}
          <div className="h-40 bg-gray-800 p-2">
            {/* Add tabs for Balances, Positions, Open Orders, etc. */}
            <div className="flex space-x-2 mb-2">
              <button className="px-2 py-1 bg-gray-700 rounded">Balances</button>
              <button className="px-2 py-1 bg-gray-700 rounded">Positions</button>
              <button className="px-2 py-1 bg-gray-700 rounded">Open Orders</button>
            </div>
            {/* Add content for the selected tab */}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-800 flex flex-col">
          {/* Order Book */}
          <div className="flex-1 overflow-y-auto">
            <OrderBook />
          </div>
          {/* Order Form */}
          <div className="p-2">
            <div className="flex justify-between mb-2">
              <button className="px-2 py-1 bg-gray-700 rounded">Market</button>
              <button className="px-2 py-1 bg-gray-700 rounded">Limit</button>
              <button className="px-2 py-1 bg-gray-700 rounded">Pro</button>
            </div>
            <OrderForm
              placeOrder={placeOrder}
              symbol={selectedSymbol}
              balance={balance}
              maxPositions={10}
              openPositionsCount={userPositions?.positions.length || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerpetualTradingInterface;