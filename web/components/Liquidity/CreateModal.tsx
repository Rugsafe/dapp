'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'

interface CreateModalProps {
  isOpen: boolean
  onClose: () => void
}

function CreateModal({ isOpen, onClose }: CreateModalProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null)

    if (!isOpen) return null
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-[#1a1b23] rounded-lg p-6 w-96 max-w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl text-white font-bold">I want to...</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-[#252732] p-4 rounded-lg border border-[#3f3f5a]">
              <h3 className="text-white font-semibold mb-2">Create pool</h3>
              <p className="text-gray-400 text-sm mb-2">
                Select pool type to create a pool for any token pair.
                Read the guide for CLMM or Standard pools.
              </p>
              <div className="flex space-x-2">
                <button 
                  className={`px-3 py-1 rounded-full text-sm flex items-center ${
                    selectedOption === 'concentrated' 
                      ? 'bg-[#4b3a87] text-white' 
                      : 'bg-[#2d2d3d] text-gray-300 hover:bg-[#3a3a4f]'
                  }`}
                  onClick={() => setSelectedOption('concentrated')}
                >
                  <span className="mr-1">●</span>
                  Concentrated Liquidity
                  <span className="ml-2 text-xs bg-[#4b3a87] px-1 rounded">SUGGESTED</span>
                </button>
                <button 
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedOption === 'standard' 
                      ? 'bg-[#4b3a87] text-white' 
                      : 'bg-[#2d2d3d] text-gray-300 hover:bg-[#3a3a4f]'
                  }`}
                  onClick={() => setSelectedOption('standard')}
                >
                  Standard AMM
                </button>
              </div>
            </div>
            
            <button className="w-full bg-[#2d2d3d] text-white p-2 rounded-lg hover:bg-[#3a3a4f]">
              Create Farm
            </button>
            
            <button className="w-full bg-[#2d2d3d] text-white p-2 rounded-lg hover:bg-[#3a3a4f]">
              Burn & Earn (CLMM)
            </button>
          </div>
          
          <div className="mt-6">
            <button className="w-full bg-[#7b61ff] text-white p-2 rounded-lg hover:bg-[#6a52e5]">
              Continue
            </button>
            <button onClick={onClose} className="w-full text-gray-400 p-2 mt-2 hover:text-white">
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
}

export default CreateModal;