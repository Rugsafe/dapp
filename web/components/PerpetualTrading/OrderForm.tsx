"use client"
import React, { useState } from 'react';
import { Side } from '../../types';

interface OrderFormProps {
  placeOrder: (side: Side, size: number, symbol: string) => Promise<void>;
  symbol: string;
  balance: number;
  maxPositions: number;
  openPositionsCount: number;
}

const OrderForm: React.FC<OrderFormProps> = ({ placeOrder, symbol, balance, maxPositions, openPositionsCount }) => {
  const [size, setSize] = useState('');

  const handlePlaceOrder = async (side: Side) => {
    try {
      await placeOrder(side, Number(size), symbol);
      setSize('');
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  return (
    <div className="mt-4">
      <input
        type="number"
        placeholder="Size"
        className="w-full bg-gray-700 p-2 rounded mb-2"
        value={size}
        onChange={(e) => setSize(e.target.value)}
      />
      <div className="flex mb-2">
        <button 
          className="flex-1 bg-green-500 py-2 px-4 rounded-l"
          onClick={() => handlePlaceOrder(Side.Long)}
        >
          Buy / Long
        </button>
        <button 
          className="flex-1 bg-red-500 py-2 px-4 rounded-r"
          onClick={() => handlePlaceOrder(Side.Short)}
        >
          Sell / Short
        </button>
      </div>
      <div className="text-sm">
        <div className="flex justify-between">
          <span>Available Balance</span>
          <span>${balance.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Open Positions</span>
          <span>{openPositionsCount} / {maxPositions}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;