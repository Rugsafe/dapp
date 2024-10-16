"use client"
import React, { useState, useEffect } from 'react';
import TradingChart from './TradingChart';
import OrderForm from './OrderForm';
import { useSolanaProgram } from '../../hooks/useSolanaProgram';
import OrderBook from './Orderbook';

const OptimizedPerpetualTradingInterface: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('ETH-USD');
  const [currentPrice, setCurrentPrice] = useState(2459.5);
  const [activeTab, setActiveTab] = useState('chart');
  const { userPositions, balance, loading, placeOrder } = useSolanaProgram();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrice(prevPrice => prevPrice + (Math.random() * 2 - 1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderMobileView = () => {
    switch (activeTab) {
      case 'chart':
        return <TradingChart />;
      case 'orderbook':
        return <OrderBook />;
      case 'trade':
        return (
          <OrderForm
            placeOrder={placeOrder}
            symbol={selectedSymbol}
            balance={balance}
            maxPositions={10}
            openPositionsCount={userPositions?.positions.length || 0}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Symbol info bar */}
      <div className="p-2 bg-gray-800 flex justify-between items-center">
        <div>
          <span className="font-bold">{selectedSymbol}</span>
          <span className="ml-4">Mark: {currentPrice.toFixed(1)}</span>
          <span className="ml-4">Oracle: {(currentPrice + 1.4).toFixed(1)}</span>
          <span className="ml-4 text-red-500">24h Change: -68.5 / -2.71%</span>
        </div>
        <div className="hidden md:flex space-x-2">
          <button className="px-2 py-1 bg-gray-700 rounded">Cross</button>
          <button className="px-2 py-1 bg-gray-700 rounded">20x</button>
          <button className="px-2 py-1 bg-gray-700 rounded">One-Way</button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop layout */}
        <div className="hidden md:flex flex-1">
          <div className="flex-1 flex flex-col">
            <div className="flex-1">
              <TradingChart />
            </div>
            <div className="bg-gray-800 p-2 flex space-x-2">
              <button className="px-2 py-1 bg-gray-700 rounded">Positions</button>
            </div>
          </div>
          <div className="w-64 bg-gray-800 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <OrderBook />
            </div>
            <div className="p-2">
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

        {/* Mobile layout */}
        <div className='md:hidden flex-1 overflow-y-auto'>
          {renderMobileView()}
          </div>
         </div>

      {/* Mobile navigation */}
      <div className="md:hidden flex bg-gray-800">
        <button 
          className={`flex-1 py-2 ${activeTab === 'chart' ? 'bg-gray-700' : ''}`}
          onClick={() => setActiveTab('chart')}
        >
          Chart
        </button>
        <button 
          className={`flex-1 py-2 ${activeTab === 'orderbook' ? 'bg-gray-700' : ''}`}
          onClick={() => setActiveTab('orderbook')}
        >
          Order Book
        </button>
        <button 
          className={`flex-1 py-2 ${activeTab === 'trade' ? 'bg-gray-700' : ''}`}
          onClick={() => setActiveTab('trade')}
        >
          Trade
        </button>
      </div>       

   
    </div>
  );
};

export default OptimizedPerpetualTradingInterface;