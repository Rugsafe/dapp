"use client"

import React, { useState } from 'react'
import Header from '@/components/Liquidity/header'
import Stats from '@/components/Liquidity/Stats'
import SearchAndCreate from '@/components/Liquidity/SearchAndCreate'
import PoolList from '@/components/Liquidity/PoolList'
import { PoolItemProps } from '@/types'
import CreateModal from '@/components/Liquidity/CreateModal'

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const pools: PoolItemProps[] = [
    { name: 'SOL-USDT', liquidity: '$1,795,352', volume: '$103,432,661', fees: '$10,343', apr: '212.11%' },
    { name: 'SOL-USDC', liquidity: '$4,700,659', volume: '$99,362,073', fees: '$19,872', apr: '155.71%' },
    { name: 'SOL-USDC', liquidity: '$1,827,020', volume: '$67,936,417', fees: '$6,794', apr: '139.31%' },
    { name: 'USDC-USDT', liquidity: '$3,777,476', volume: '$13,410,840', fees: '$1,341', apr: '13.54%' },
    { name: 'SOL-USDC', liquidity: '$3,399,132', volume: '$8,322,501', fees: '$4,161', apr: '45.32%' },
    { name: 'SOL-mSOL', liquidity: '$288,990', volume: '$7,505,267', fees: '$751', apr: '119.63%' },
    { name: 'SOL-PINGU', liquidity: '$48,010', volume: '$6,710,363', fees: '$671', apr: '510.16%' },
    { name: 'SOL-RAY', liquidity: '$1,610,232', volume: '$5,927,547', fees: '$2,964', apr: '67.18%' },
  ]
  
  return (
    <div className="min-h-screen bg-purple-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Header />
        <div className="mt-4">
          <Stats tvl="$1,332,556,783.04" volume="$1,686,804,329.06" />
          <div className="mt-4">
            <SearchAndCreate onCreateClick={() => setIsModalOpen(true)} />
          </div>
          <div className="mt-4">
            <PoolList pools={pools} />
          </div>
        </div>
        <CreateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </div>
  )
}