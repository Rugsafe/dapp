"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TokenModalProps, Token } from '../../types';

const TokenModal: React.FC<TokenModalProps> = ({ isOpen, onClose, tokens, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTokens = tokens.filter(token => 
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-gray-900 rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Select a token</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              placeholder="Search tokens"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg p-2 mb-4"
            />
            <div className="max-h-80 overflow-y-auto">
              {filteredTokens.map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => onSelect(token)}
                  className="w-full flex items-center p-2 hover:bg-gray-800 rounded-lg"
                >
                  <img src={token.icon} alt={token.name} className="w-8 h-8 mr-2 rounded-full" />
                  <div className="flex flex-col items-start">
                    <span className="text-white font-medium">{token.name}</span>
                    <span className="text-gray-400 text-sm">{token.symbol}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TokenModal;