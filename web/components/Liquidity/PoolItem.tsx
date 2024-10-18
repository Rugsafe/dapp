"use client"

import React from "react";
import { PoolItemProps } from "@/types";
import { Star, Zap } from 'lucide-react';
import Link from 'next/link';

const PoolItem: React.FC<PoolItemProps> = ({name, liquidity, volume, fees, apr}) => {
  return (
    <div className="bg-purple-800 p-3 rounded-lg mb-2">
      {/* Mobile layout */}
      <div className="sm:hidden flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <p className="text-white font-semibold">{name}</p>
          <Link href="/dex" passHref>
            <button className="bg-purple-700 p-1.5 rounded-full">
              <Zap size={14} className="text-purple-300" />
            </button>
          </Link>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-white">{volume}</p>
          <div className="flex items-center">
            <p className="text-purple-300 mr-2">{apr}</p>
            <div className="w-20 bg-purple-700 rounded-full h-1">
              <div 
                className="bg-purple-500 h-1 rounded-full" 
                style={{width: `${Math.min(parseFloat(apr), 100)}%`}}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:flex items-center text-sm">
        <div className="w-1/4 flex items-center">
          <Star className="text-purple-300 mr-2" size={16} />
          <p className="text-white font-semibold">{name}</p>
        </div>
        <div className="w-1/5 text-right">
          <p className="text-white">{liquidity}</p>
        </div>
        <div className="w-1/5 text-right">
          <p className="text-white">{volume}</p>
        </div>
        <div className="w-1/6 text-right">
          <p className="text-white">{fees}</p>
        </div>
        <div className="w-1/6 text-right">
          <p className="text-white font-bold">{apr}</p>
        </div>
        <div className="w-1/6 flex items-center justify-end space-x-2">
          <Link href="/dex" passHref>
            <button className="bg-purple-700 p-1.5 rounded-full">
              <Zap size={14} className="text-purple-300" />
            </button>
          </Link>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs transition duration-300">
            Deposit
          </button>
        </div>
      </div>
    </div>
  );
}

export default PoolItem;