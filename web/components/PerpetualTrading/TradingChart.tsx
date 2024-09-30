"use client"

import React from 'react';
import dynamic from 'next/dynamic';
import { AdvancedRealTimeChartProps } from 'react-ts-tradingview-widgets';

const AdvancedRealTimeChart = dynamic<AdvancedRealTimeChartProps>(
  () => import('react-ts-tradingview-widgets').then(mod => mod.AdvancedRealTimeChart),
  { ssr: false }
);

interface TradingChartProps {
  symbol: string;
}

const TradingChart: React.FC<TradingChartProps> = ({ symbol }) => (
  <div className="flex-grow" style={{ minHeight: '400px', maxHeight: '60vh' }}>
    <AdvancedRealTimeChart
      theme="dark"
      autosize
      symbol={`BINANCE:${symbol}`}
      interval="60"
      timezone="Etc/UTC"
      style="1"
      locale="en"
      toolbar_bg="#f1f3f6"
      enable_publishing={false}
      allow_symbol_change={true}
      container_id="tradingview_chart"
      withdateranges={true}
    />
  </div>
);

export default TradingChart;