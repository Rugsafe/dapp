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
  const [orderType, setOrderType] = useState<'Market' | 'Limit'>('Market');
  const [size, setSize] = useState('');
  const [limitPrice, setLimitPrice] = useState('');

  const handlePlaceOrder = async (side: Side) => {
    try {
      await placeOrder(side, Number(size), symbol);
      setSize('');
      setLimitPrice('');
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  return (
    <div className="mt-auto">
      <div className="flex mb-2">
        <button 
          className={`flex-1 py-2 px-4 ${orderType === 'Market' ? 'bg-blue-500' : 'bg-gray-700'} rounded-l`}
          onClick={() => setOrderType('Market')}
        >
          Market
        </button>
        <button 
          className={`flex-1 py-2 px-4 ${orderType === 'Limit' ? 'bg-blue-500' : 'bg-gray-700'} rounded-r`}
          onClick={() => setOrderType('Limit')}
        >
          Limit
        </button>
      </div>
      <input
        type="number"
        placeholder="Size"
        className="w-full bg-gray-700 p-2 rounded mb-2"
        value={size}
        onChange={(e) => setSize(e.target.value)}
      />
      {orderType === 'Limit' && (
        <input
          type="number"
          placeholder="Limit Price"
          className="w-full bg-gray-700 p-2 rounded mb-2"
          value={limitPrice}
          onChange={(e) => setLimitPrice(e.target.value)}
        />
      )}
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
      <div className="flex justify-between text-sm mb-2">
        <span>Available Balance</span>
        <span>${balance.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm mb-2">
        <span>Open Positions</span>
        <span>{openPositionsCount} / {maxPositions}</span>
      </div>
    </div>
  );
};

export default OrderForm;