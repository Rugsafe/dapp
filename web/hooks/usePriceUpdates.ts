import React, { useState, useEffect, useCallback } from 'react';



export const usePriceUpdates = (initialPrice: number) => {
    const [currentPrice, setCurrentPrice] = useState(initialPrice);
  
    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentPrice(prevPrice => prevPrice + (Math.random() * 2 - 1));
      }, 5000);
      return () => clearInterval(interval);
    }, []);
  
    return currentPrice;
  };