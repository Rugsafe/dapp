"use client"


import React from 'react';
import { motion } from 'framer-motion';
import { SwapButtonProps } from '../../types';

const SwapButton: React.FC<SwapButtonProps> = ({ onClick }) => {
  return (
    <div className="flex justify-center">
      <motion.button
        whileHover={{ rotate: 180 }}
        transition={{ duration: 0.3 }}
        onClick={onClick}
        className="bg-purple-600 rounded-full p-2 hover:bg-purple-500 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </motion.button>
    </div>
  );
};

export default SwapButton;