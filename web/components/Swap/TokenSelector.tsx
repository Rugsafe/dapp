"use client"

import React from 'react';
import { TokenSelectorProps } from '../../types';

const TokenSelector: React.FC<TokenSelectorProps> = ({ token, onClick, amount, onAmountChange, isInput }) => {
  return (
    <div className="bg-purple-800 bg-opacity-50 rounded-2xl p-4">
      <label className="text-purple-200 text-sm mb-2 block">
        {isInput ? 'From' : 'To'}
      </label>
      <div className="flex items-center">
        <button 
          className="text-white hover:text-purple-200 bg-transparent px-3 py-2 rounded-lg flex items-center"
          onClick={onClick}
        >
          {token.icon} <span className="ml-2">{token.symbol}</span> 
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <input 
          type="number" 
          placeholder="0.0" 
          value={amount}
          onChange={onAmountChange}
          disabled={!isInput}
          className="flex-grow bg-transparent border-none text-right text-white placeholder-purple-300 focus:outline-none"
        />
      </div>
    </div>
  );
};

export default TokenSelector;