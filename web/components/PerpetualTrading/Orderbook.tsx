"use client"
import React, { useState, useEffect } from 'react'

interface Order {
  price: number
  size: number
  total: number
}

export default function OrderBook() {
  const [buyOrders, setBuyOrders] = useState<Order[]>([])
  const [sellOrders, setSellOrders] = useState<Order[]>([])
  const [maxSize, setMaxSize] = useState(0)

  useEffect(() => {
    const fetchOrderBook = () => {
      const generateOrders = (basePrice: number, count: number, increment: number, isAsk: boolean): Order[] => {
        return Array.from({ length: count }, (_, i) => {
          const price = basePrice + (i * increment)
          const size = Math.random() * 30 + (isAsk ? Math.random() * 20 : Math.random() * 10)
          return { price, size, total: 0 }
        }).map((order, _, arr) => ({
          ...order,
          total: arr.slice(0, arr.indexOf(order) + 1).reduce((sum, o) => sum + o.size, 0)
        }))
      }

      const currentPrice = 2683.65
      const newBuyOrders = generateOrders(currentPrice - 1, 10, -2, false).reverse()
      const newSellOrders = generateOrders(currentPrice + 1, 10, 2, true)
      
      setBuyOrders(newBuyOrders)
      setSellOrders(newSellOrders)
      setMaxSize(Math.max(...newBuyOrders.map(o => o.size), ...newSellOrders.map(o => o.size)))
    }

    fetchOrderBook()
    const interval = setInterval(fetchOrderBook, 5000)
    return () => clearInterval(interval)
  }, [])

  const OrderRow = ({ order, isBuy }: { order: Order; isBuy: boolean }) => (
    <tr className="text-xs">
      <td className={`text-right p-0.5 ${isBuy ? 'text-green-500' : 'text-red-500'}`}>
        {order.price.toFixed(1)}
      </td>
      <td className="text-right p-0.5 relative">
        <div className="absolute inset-0 opacity-40" style={{
          width: `${(order.size / maxSize) * 100}%`,
          backgroundColor: isBuy ? 'rgba(0, 255, 0, 0.4)' : 'rgba(255, 0, 0, 0.4)',
          transition: 'width 0.5s ease-in-out'
        }}></div>
        <span className="relative z-10">{order.size.toFixed(4)}</span>
      </td>
      <td className="text-right p-0.5">{order.total.toFixed(4)}</td>
    </tr>
  )

  return (
    <div className="bg-gray-900 text-white p-2 rounded-lg">
      <h2 className="text-sm font-bold mb-1">Order Book</h2>
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 300px)' }}>
        <table className="w-full">
          <thead>
            <tr className="text-xxs text-gray-500">
              <th className="text-right p-0.5">Price</th>
              <th className="text-right p-0.5">Size (ETH)</th>
              <th className="text-right p-0.5">Total (ETH)</th>
            </tr>
          </thead>
          <tbody>
            {sellOrders.map((order, index) => (
              <OrderRow key={`sell-${index}`} order={order} isBuy={false} />
            ))}
            <tr>
              <td colSpan={3} className="text-center font-bold p-0.5 text-yellow-500 text-xs">
                2683.65
              </td>
            </tr>
            {buyOrders.map((order, index) => (
              <OrderRow key={`buy-${index}`} order={order} isBuy={true} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}