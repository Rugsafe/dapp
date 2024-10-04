'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'

export default function V3VaultsDashboard() {
  return (
    <div className="min-h-screen bg-[#0a0b1e] text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Boxes */}
        <div className="flex flex-col md:flex-row gap-8">
          <motion.div 
            className="flex-1 bg-gradient-to-br from-purple-700 to-blue-900 rounded-3xl shadow-lg p-8 flex items-center justify-center"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-6xl font-bold text-center" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
              V3<br />VAULTS
            </h1>
          </motion.div>
          <motion.div 
            className="flex-1 bg-gradient-to-br from-pink-600 to-purple-800 rounded-3xl shadow-lg p-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold mb-4">A BRAVE NEW WORLD FOR YIELD</h2>
            <p className="text-lg">
              Yearn v3 is a new yield paradigm offering better automation,
              composability and flexibility. Enjoy!
            </p>
          </motion.div>
        </div>

        {/* Warning Message */}
        <motion.div 
          className="bg-pink-900 bg-opacity-30 border border-pink-500 rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-pink-500 font-bold mb-2">Ape carefully anon!</h3>
          <p>V3 is a truly flexible yield protocol offering everything from the usual Up Only Vaults to all new risky degen strategies.</p>
        </motion.div>

        {/* Portfolio and Filters */}
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div 
            className="bg-blue-900 bg-opacity-30 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4">Portfolio</h2>
            <p className="text-gray-300">Looks like you need to connect your wallet.</p>
            <p className="text-gray-300">And call your mum. Always important.</p>
          </motion.div>
          <motion.div 
            className="bg-purple-900 bg-opacity-30 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <h2 className="text-3xl font-bold mb-4">Filters</h2>
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="YFI Vault" 
                  className="w-full bg-blue-900 bg-opacity-50 rounded-lg py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <Search className="absolute right-3 top-2.5 text-gray-400" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <select className="bg-blue-900 bg-opacity-50 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-pink-500">
                  <option>Select Blockchain</option>
                </select>
                <select className="bg-blue-900 bg-opacity-50 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-pink-500">
                  <option>Select Category</option>
                </select>
                <select className="bg-blue-900 bg-opacity-50 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-pink-500">
                  <option>Select Type</option>
                </select>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}