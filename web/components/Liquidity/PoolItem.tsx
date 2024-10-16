"use client";
import React from "react";
import { PoolItemProps } from "@/types";
import { Star, Activity, Zap } from 'lucide-react';
import Link from 'next/link';

const PoolItem: React.FC<PoolItemProps> = ({ name, liquidity, volume, fees, apr }) => {
  return (
    <div className="bg-purple-800 p-3 rounded-lg mb-1 flex items-center text-sm relative z-5">
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
        <button className="bg-purple-700 p-1.5 rounded-full">
          <Activity size={14} className="text-purple-300" />
        </button>
        <div className="relative group z-20">
          <Link href="/dex">
            <button className="bg-purple-700 p-1.5 rounded-full">
              <Zap size={14} className="text-purple-300" />
            </button>
          </Link>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
            <div className="bg-purple-600 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
              Swap
            </div>
            <div className="w-2 h-2 bg-purple-600 transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
          </div>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs transition duration-300">
          Deposit
        </button>
      </div>
    </div>
  );
};

export default PoolItem;
