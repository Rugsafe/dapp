"use client"

import React from "react";

const Header: React.FC = () => {
  return (
    <div className="mb-2">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
        Liquidity Pools
      </h1>
      <p className="text-purple-300 text-sm">Provide liquidity, earn yield.</p>
    </div>
  )
}

export default Header;