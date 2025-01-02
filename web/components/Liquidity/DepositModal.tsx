"use client";

import React, { useState } from "react";
import { PoolItemProps } from "@/types";
import { X } from "lucide-react";

interface DepositeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: PoolItemProps;
  handleAddLiquidity: (pool: PoolItemProps, amount0: number, amount1: number) => Promise<void>;
}

const DepositeModal: React.FC<DepositeModalProps> = ({
  isOpen,
  onClose,
  pool,
  handleAddLiquidity,
}) => {
  const [amount0, setAmount0] = useState<number>(0);
  const [amount1, setAmount1] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddLiquidityClick = async () => {
    if (amount0 <= 0 || amount1 <= 0) {
      setErrorMessage("Amounts must be greater than zero.");
      return;
    }

    setErrorMessage(null); // Clear previous errors
    setIsSubmitting(true); // Show loading state
    try {
      await handleAddLiquidity(pool, amount0, amount1);
      onClose(); // Close the modal after successful transaction
    } catch (error) {
      console.error("Error adding liquidity:", error);
      setErrorMessage("Failed to add liquidity. Please try again.");
    } finally {
      setIsSubmitting(false); // Reset loading state
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-[#1a1b23] rounded-lg p-6 w-96 max-w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-white font-bold">Deposit Liquidity</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-[#252732] p-4 rounded-lg border border-[#3f3f5a]">
            <h3 className="text-white font-semibold mb-2">{pool.name}</h3>
            <p className="text-gray-400 text-sm mb-2">
              Enter the amounts for Token 0 and Token 1 to add liquidity to the selected pool.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Amount Token 0
                </label>
                <input
                  type="number"
                  className="w-full bg-[#1a1b23] text-white border border-[#3f3f5a] rounded-lg p-2"
                  placeholder="Enter amount"
                  value={amount0}
                  onChange={(e) => setAmount0(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Amount Token 1
                </label>
                <input
                  type="number"
                  className="w-full bg-[#1a1b23] text-white border border-[#3f3f5a] rounded-lg p-2"
                  placeholder="Enter amount"
                  value={amount1}
                  onChange={(e) => setAmount1(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={handleAddLiquidityClick}
            className={`w-full bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold py-2 rounded-lg hover:from-blue-600 hover:to-green-600 ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding Liquidity..." : "Add Liquidity"}
          </button>
          <button
            onClick={onClose}
            className="w-full text-gray-400 p-2 mt-2 hover:text-white"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepositeModal;
