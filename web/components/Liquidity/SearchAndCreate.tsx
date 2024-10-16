"use client"

import React from 'react'
import { Search as SearchIcon, Plus } from 'lucide-react'

interface SearchAndCreateProps {
  onCreateClick: () => void;
}

const SearchAndCreate: React.FC<SearchAndCreateProps> = ({ onCreateClick }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="relative flex-grow mr-4">
        <input
          type="text"
          placeholder="Search all"
          className="w-full bg-purple-800 text-white p-2 pl-10 rounded-lg h-10"
        />
        <SearchIcon className="absolute left-3 top-2.5 text-purple-300" size={20} />
      </div>
      <button 
        onClick={onCreateClick}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center h-10"
      >
        <Plus size={20} className="mr-2" />
        Create
      </button>
    </div>
  )
}

export default SearchAndCreate