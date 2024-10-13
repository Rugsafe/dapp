"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TokenSelector from '@/components/Swap/TokenSelector';
import SwapButton from '@/components/Swap/SwapButton';
import TokenModal from '@/components/Swap/TokenModal';
import { Token } from '../../types';

const tokens: Token[] = [
  { symbol: 'ZRX', name: '0x Protocol Token', icon: '0x-icon-url' },
  { symbol: '1INCH', name: '1INCH Token', icon: '1inch-icon-url' },
  { symbol: 'AAVE', name: 'Aave Token', icon: 'aave-icon-url' },
  { symbol: 'AEVO', name: 'Aevo', icon: 'aevo-icon-url' },
  { symbol: 'AIOZ', name: 'AIOZ Network', icon: 'aioz-icon-url' },
  { symbol: 'ALEPH', name: 'aleph.im v2', icon: 'aleph-icon-url' },
  { symbol: 'ALT', name: 'AltLayer', icon: 'altlayer-icon-url' },
  { symbol: 'AMP', name: 'Amp', icon: 'amp-icon-url' },
  { symbol: 'Flocka', name: 'Flocka Coin', icon: '🌌' },
  { symbol: 'Solana', name: 'Stardust', icon: '✨' },
  { symbol: 'NOVA', name: 'Supernova', icon: '💥' },
];

const RugSafeSwap: React.FC = () => {
  const [fromToken, setFromToken] = useState<Token>(tokens[8]); // Flocka
  const [toToken, setToToken] = useState<Token>(tokens[9]); // Solana
  const [amount, setAmount] = useState<string>('2');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'from' | 'to'>('from');

  const handleSwap = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const openModal = (type: 'from' | 'to') => {
    setModalType(type);
    setShowModal(true);
  };

  const handleTokenSelection = (token: Token) => {
    if (modalType === 'from') {
      setFromToken(token);
    } else {
      setToToken(token);
    }
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black bg-opacity-20 backdrop-blur-lg border border-purple-500 rounded-3xl overflow-hidden">
        <motion.div 
          className="p-6 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-center text-white mb-8">RugSafe Swap</h1>
          
          <div className="space-y-4">
            <TokenSelector
              token={fromToken}
              onClick={() => openModal('from')}
              amount={amount}
              onAmountChange={(e) => setAmount(e.target.value)}
              isInput={true}
            />

            <SwapButton onClick={handleSwap} />

            <TokenSelector
              token={toToken}
              onClick={() => openModal('to')}
              amount=""
              onAmountChange={() => {}}
              isInput={false}
            />
          </div>

          <button 
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3 rounded-full transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Launch Swap
          </button>

          <p className="text-center text-purple-200 text-sm">
            RugSafe: Where your assets thrive, not just survive          
          </p>
        </motion.div>
      </div>

      <TokenModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        tokens={tokens}
        onSelect={handleTokenSelection}
      />
    </div>
  );
};

export default RugSafeSwap;