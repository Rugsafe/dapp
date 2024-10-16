"use client"

import React from "react";
import PoolItem from "./PoolItem";
import { PoolItemProps } from "@/types";

interface PoolListProps {
    pools: PoolItemProps[]
}

const PoolList: React.FC<PoolListProps> = ({pools}) => {
    return (
        <div className="relative">
            <div className="bg-purple-800 p-3 rounded-t-lg mb-1 flex items-center text-purple-300 text-sm sticky top-0" style={{ zIndex: 10 }}>
                <div className="w-1/4">Pool</div>
                <div className="w-1/5 text-right">Liquidity</div>
                <div className="w-1/5 text-right">Volume 24H</div>
                <div className="w-1/6 text-right">Fees 24H</div>
                <div className="w-1/6 text-right">APR 24H</div>
                <div className="w-1/6"></div>
            </div>
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {pools.map((pool, index) => (
                    <PoolItem key={index} {...pool} />
                ))}
            </div>
        </div>
    )
}

export default PoolList;