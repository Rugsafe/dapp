"use client"
import React from 'react';
import { Position, Side } from '../../types';

interface PositionsTableProps {
  positions: Position[];
  currentPrice: number;
}

const PositionsTable: React.FC<PositionsTableProps> = ({ positions, currentPrice }) => (
  <div className="mt-4">
    <h2 className="text-xl font-bold mb-2">Open Positions</h2>
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left">
          <th>Side</th>
          <th>Size (USD)</th>
          <th>Entry Price</th>
          <th>Mark Price</th>
          <th>PNL</th>
        </tr>
      </thead>
      <tbody>
        {positions.map((position, index) => (
          <tr key={index}>
            <td className={position.side === Side.Long ? 'text-green-500' : 'text-red-500'}>
              {position.side === Side.Long ? 'Long' : 'Short'}
            </td>
            <td>${position.size_usd.toString()}</td>
            <td>${(position.price / 1e6).toFixed(2)}</td>
            <td>${currentPrice.toFixed(2)}</td>
            <td className={(position.unrealized_profit_usd > position.unrealized_loss_usd) ? 'text-green-500' : 'text-red-500'}>
              ${((position.unrealized_profit_usd - position.unrealized_loss_usd) / 1e6).toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default PositionsTable;
