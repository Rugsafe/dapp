"use client"

import React, { useState } from 'react';
import TradingChart from './TradingChart';
import PositionsTable from './PositionsTable';
import OrderForm from './OrderForm';
import { useSolanaProgram } from '../../hooks/useSolanaProgram';

const PerpetualTradingInterface: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('ETHUSDT');
  const [currentPrice, setCurrentPrice] = useState(2640);
  const { userPositions, balance, placeOrder } = useSolanaProgram();

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="flex-grow flex">
        <div className="w-3/4 p-4 flex flex-col">
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold mr-2">{selectedSymbol}</span>
              <span className="text-green-500">${currentPrice.toFixed(2)}</span>
            </div>
          </div>
          <TradingChart symbol={selectedSymbol} />
          {userPositions && (
            <PositionsTable 
              positions={userPositions.positions} 
              currentPrice={currentPrice}
            />
          )}
        </div>
        <div className="w-1/4 p-4 border-l border-gray-700 flex flex-col">
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
  );
};

export default PerpetualTradingInterface;