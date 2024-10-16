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
    { name: 'SOL-aNEIRO', liquidity: '$0', volume: '$0', fees: '$0', apr: '0%' },
    { name: 'SOL-aFLOCKA', liquidity: '$0', volume: '$0', fees: '$0', apr: '0%' },
    { name: 'SOL-aFLOCKA', liquidity: '$0', volume: '$0', fees: '$0', apr: '0%' },
  ]
  
  return (
    <div className="min-h-screen bg-purple-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Header />
        <div className="mt-4">
          <Stats tvl="$0" volume="$0" />
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