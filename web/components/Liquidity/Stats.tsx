"use client"

import React from 'react'
import { StatsProps } from '@/types'

const Stats: React.FC<StatsProps> = ({ tvl, volume }) => {
  return (
    <div className="flex justify-between">
      <div className="bg-purple-900 p-2 rounded-lg">
        <p className="text-purple-300 text-xs">TVL</p>
        <p className="text-white font-bold">{tvl}</p>
      </div>
      <div className="bg-purple-900 p-2 rounded-lg">
        <p className="text-purple-300 text-xs">24h Volume</p>
        <p className="text-white font-bold">{volume}</p>
      </div>
    </div>
  )
}

export default Stats;