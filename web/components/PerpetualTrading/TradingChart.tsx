"use client"

import React from 'react';
import dynamic from 'next/dynamic';
import { AdvancedRealTimeChartProps } from 'react-ts-tradingview-widgets';

const AdvancedRealTimeChart = dynamic<AdvancedRealTimeChartProps>(
  () => import('react-ts-tradingview-widgets').then(mod => mod.AdvancedRealTimeChart),
  { ssr: false }
);

const TradingChart: React.FC = () => {
  return (
    <div className="trading-chart-container" style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#131722',
      color: 'white',
      overflow: 'hidden'
    }}>
      <AdvancedRealTimeChart
        theme="dark"
        autosize
        symbol="BINANCE:ETHUSDT"
        interval="60"
        timezone="Etc/UTC"
        style="1"
        locale="en"
        toolbar_bg="#131722"
        enable_publishing={false}
        allow_symbol_change={false}
        hide_top_toolbar={false}
        hide_legend={false}
        save_image={false}
        withdateranges
      />
    </div>
  );
};

export default TradingChart;