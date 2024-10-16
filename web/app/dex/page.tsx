"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction, 
  sendAndConfirmTransaction, 
  SystemProgram,
} from '@solana/web3.js';
import TokenSelector from '@/components/Swap/TokenSelector';
import SwapButton from '@/components/Swap/SwapButton';
import TokenModal from '@/components/Swap/TokenModal';
import { Token } from '../../types';
import {
  TOKEN_PROGRAM_ID, 
} from '@solana/spl-token';
import { sha256 } from 'js-sha256';
import bs58 from 'bs58';

import * as anchor from "@project-serum/anchor";
import { Program, AnchorProvider } from "@project-serum/anchor";
// import idl from "./idl.json"; // Import your program's IDL file

interface PoolInfo {
  publicKey: PublicKey;
  tokenMint0: PublicKey;
  tokenMint1: PublicKey;
  tokenVault0: PublicKey;
  tokenVault1: PublicKey;
  observationKey: PublicKey;
  mintDecimals0: number;
  mintDecimals1: number;
  tickSpacing: number;
  liquidity: bigint;
  sqrtPriceX64: bigint;
  tickCurrent: number;
  feeGrowthGlobal0X64: bigint;
  feeGrowthGlobal1X64: bigint;
}

const tokens: Token[] = [
  { symbol: 'ZRX', name: '0x Protocol Token', icon: '0x-icon-url' },
  { symbol: '1INCH', name: '1INCH Token', icon: '1inch-icon-url' },
  { symbol: 'AAVE', name: 'Aave Token', icon: 'aave-icon-url' },
  { symbol: 'AEVO', name: 'Aevo', icon: 'aevo-icon-url' },
  { symbol: 'AIOZ', name: 'AIOZ Network', icon: 'aioz-icon-url' },
  { symbol: 'ALEPH', name: 'aleph.im v2', icon: 'aleph-icon-url' },
  { symbol: 'ALT', name: 'AltLayer', icon: 'altlayer-icon-url' },
  { symbol: 'AMP', name: 'Amp', icon: 'amp-icon-url' },
  { symbol: 'Flocka', name: 'Flocka Coin', icon: '🌌' },
  { symbol: 'Solana', name: 'Stardust', icon: '✨' },
  { symbol: 'NOVA', name: 'Supernova', icon: '💥' },
];



const createAmmConfig = async (
  wallet: any,
  publicKey: PublicKey,
  connection: Connection,
  programId: PublicKey,
  configIndex: number,
  tickSpacing: number,
  tradeFeeRate: number,
  protocolFeeRate: number,
  fundFeeRate: number
) => {
  if (!publicKey) {
    alert("Connect your wallet first!");
    return;
  }

  // Compute the PDA for ammConfig
  const configIndexBuffer = Buffer.alloc(2);
  configIndexBuffer.writeUInt16BE(configIndex, 0);

  const [ammConfig, _] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("amm_config"),
      configIndexBuffer,
    ],
    programId
  );

  const rent = new PublicKey("SysvarRent111111111111111111111111111111111");

  // Create the 8-byte discriminator for the create_amm_config instruction
  const discriminator = Buffer.from(sha256.digest('global:create_amm_config')).slice(0, 8);

  // Serialize the instruction data
  // Data layout:
  // index: u16,
  // tick_spacing: u16,
  // trade_fee_rate: u32,
  // protocol_fee_rate: u32,
  // fund_fee_rate: u32
  const dataBuffer = Buffer.alloc(2 + 2 + 4 + 4 + 4);
  let offset = 0;
  dataBuffer.writeUInt16LE(configIndex, offset);
  offset += 2;
  dataBuffer.writeUInt16LE(tickSpacing, offset);
  offset += 2;
  dataBuffer.writeUInt32LE(tradeFeeRate, offset);
  offset += 4;
  dataBuffer.writeUInt32LE(protocolFeeRate, offset);
  offset += 4;
  dataBuffer.writeUInt32LE(fundFeeRate, offset);
  offset += 4;

  const instruction = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: publicKey, isSigner: true, isWritable: true },  // owner
      { pubkey: ammConfig, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: rent, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([
      discriminator,
      dataBuffer,
    ]),
  });

  const transaction = new Transaction().add(instruction);

  const signature = await wallet.sendTransaction(transaction, connection, {
    skipPreflight: true,
    preflightCommitment: 'processed',
    signers: [],
  });

  console.log("AMM Config created with transaction signature:", signature);
  return signature;
};

const createPool = async (
  wallet: any,
  publicKey: PublicKey,
  connection: Connection,
  programId: PublicKey,
  ammConfig: PublicKey,
  tokenMint0: PublicKey,
  tokenMint1: PublicKey,
  tokenProgram0: PublicKey,
  tokenProgram1: PublicKey, 
  tickArrayBitmap: PublicKey,
  sqrtPriceX64: bigint,
  openTime: number
) => {
  if (!publicKey) {
    alert("Connect your wallet first!");
    return;
  }

  const rent = new PublicKey("SysvarRent111111111111111111111111111111111");

  const [poolAccountKey] = await PublicKey.findProgramAddress(
    [
      Buffer.from("pool"),
      ammConfig.toBuffer(),
      tokenMint0.toBuffer(),
      tokenMint1.toBuffer()
    ],
    programId
  );

  const [tokenVault0] = await PublicKey.findProgramAddress(
    [
      Buffer.from("pool_vault"),
      poolAccountKey.toBuffer(),
      tokenMint0.toBuffer()
    ],
    programId
  );

  const [tokenVault1] = await PublicKey.findProgramAddress(
    [
      Buffer.from("pool_vault"),
      poolAccountKey.toBuffer(),
      tokenMint1.toBuffer()
    ],
    programId
  );

  const [observationKey] = await PublicKey.findProgramAddress(
    [Buffer.from("observation"), poolAccountKey.toBuffer()],
    programId
  );

  // Create the 8-byte discriminator for the createPool instruction
  const discriminator = Buffer.from(sha256.digest('global:create_pool')).slice(0, 8);

  // Handle sqrtPriceX64 correctly
  const sqrtPriceX64Buffer = Buffer.alloc(16);
  sqrtPriceX64Buffer.writeBigUInt64LE(sqrtPriceX64 & BigInt('0xFFFFFFFFFFFFFFFF'), 0);
  sqrtPriceX64Buffer.writeBigUInt64LE(sqrtPriceX64 >> BigInt(64), 8);

  const openTimeBuffer = Buffer.alloc(8);
  openTimeBuffer.writeBigUInt64LE(BigInt(openTime), 0);

  const instruction = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: publicKey, isSigner: true, isWritable: true },  // poolCreator
      { pubkey: ammConfig, isSigner: false, isWritable: false },
      { pubkey: poolAccountKey, isSigner: false, isWritable: true },
      { pubkey: tokenMint0, isSigner: false, isWritable: false },
      { pubkey: tokenMint1, isSigner: false, isWritable: false },
      { pubkey: tokenVault0, isSigner: false, isWritable: true },
      { pubkey: tokenVault1, isSigner: false, isWritable: true },
      { pubkey: observationKey, isSigner: false, isWritable: true },
      { pubkey: tickArrayBitmap, isSigner: false, isWritable: true },
      { pubkey: tokenProgram0, isSigner: false, isWritable: false },
      { pubkey: tokenProgram1, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: rent, isSigner: false, isWritable: false }
    ],
    data: Buffer.concat([
      discriminator,
      sqrtPriceX64Buffer,
      openTimeBuffer,
    ])
  });

  const transaction = new Transaction().add(instruction);
  
  const signature = await wallet.sendTransaction(transaction, connection, { 
    skipPreflight: true, 
    preflightCommitment: 'processed', 
    signers: []
  });

  console.log("Transaction signature", signature);
  return signature;
};


const Swap: React.FC = () => {
  const { publicKey, sendTransaction } = useWallet(); // using the wallet adapter hook
  // const connection = new Connection("https://api.devnet.solana.com"); // should be local
  const connection = new Connection("http://127.0.0.1:8899");
  
  const [fromToken, setFromToken] = useState<Token>(tokens[8]); // Flocka
  const [toToken, setToToken] = useState<Token>(tokens[9]); // Solana
  const [amount, setAmount] = useState<string>('2');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'from' | 'to'>('from');
  const wallet = useWallet();

  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity'>('swap');
  
  //pools
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);


  const handleSwap = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const openModal = (type: 'from' | 'to') => {
    setModalType(type);
    setShowModal(true);
  };

  function calculateSqrtPriceX64(price: number): bigint {
    const MIN_SQRT_PRICE_X64 = BigInt('4295048016');
    const MAX_SQRT_PRICE_X64 = BigInt('79226673521066979257578248091');
    
    const sqrtPrice = Math.sqrt(price);
    const sqrtPriceX64 = BigInt(Math.floor(sqrtPrice * 2 ** 64));
    
    if (sqrtPriceX64 < MIN_SQRT_PRICE_X64) {
      return MIN_SQRT_PRICE_X64;
    } else if (sqrtPriceX64 > MAX_SQRT_PRICE_X64) {
      return MAX_SQRT_PRICE_X64 - BigInt(1);
    } else {
      return sqrtPriceX64;
    }
  }

  const handleTokenSelection = (token: Token) => {
    if (modalType === 'from') {
      setFromToken(token);
    } else {
      setToToken(token);
    }
    setShowModal(false);
  };

  // const fetchPools = async (connection: Connection): Promise<PoolInfo[]> => {
  //   const programId = new PublicKey("E4jqaxpY8zonsVHhuYVFoCMDvgsL411cYCK9d8tGCBYC");
  
  //   try {
  //     const accounts = await connection.getProgramAccounts(programId, {
  //       filters: [
  //         {
  //           memcmp: {
  //             offset: 0,
  //             bytes: bs58.encode(Buffer.from([0x0b, 0x33, 0x18, 0xda, 0x3b, 0x34, 0x85, 0xc9])), // First 8 bytes of SHA256("global:pool")
  //           },
  //         },
  //       ],
  //     });
  
  //     console.log(`Found ${accounts.length} accounts`);
  
  //     const pools: PoolInfo[] = accounts.map(({ pubkey, account }) => {
  //       const data = account.data;
  //       let offset = 8; // Skip the 8-byte discriminator
  
  //       const tokenMint0 = new PublicKey(data.slice(offset, offset + 32));
  //       offset += 32;
  //       const tokenMint1 = new PublicKey(data.slice(offset, offset + 32));
  //       offset += 32;
  //       const tokenVault0 = new PublicKey(data.slice(offset, offset + 32));
  //       offset += 32;
  //       const tokenVault1 = new PublicKey(data.slice(offset, offset + 32));
  //       offset += 32;
  //       const observationKey = new PublicKey(data.slice(offset, offset + 32));
  //       offset += 32;
  
  //       const mintDecimals0 = data[offset];
  //       offset += 1;
  //       const mintDecimals1 = data[offset];
  //       offset += 1;
  //       const tickSpacing = data.readUInt16LE(offset);
  //       offset += 2;
  
  //       const liquidity = data.readBigUInt64LE(offset);
  //       offset += 8;
  //       const sqrtPriceX64 = data.readBigUInt64LE(offset);
  //       offset += 8;
  //       const tickCurrent = data.readInt32LE(offset);
  //       offset += 4;
  
  //       // Skip padding
  //       offset += 4;
  
  //       const feeGrowthGlobal0X64 = data.readBigUInt64LE(offset);
  //       offset += 8;
  //       const feeGrowthGlobal1X64 = data.readBigUInt64LE(offset);
  
  //       return {
  //         publicKey: pubkey,
  //         tokenMint0,
  //         tokenMint1,
  //         tokenVault0,
  //         tokenVault1,
  //         observationKey,
  //         mintDecimals0,
  //         mintDecimals1,
  //         tickSpacing,
  //         liquidity,
  //         sqrtPriceX64,
  //         tickCurrent,
  //         feeGrowthGlobal0X64,
  //         feeGrowthGlobal1X64,
  //       };
  //     });
  
  //     console.log(`Processed ${pools.length} pools`);
  //     return pools;
  //   } catch (err) {
  //     console.error("Error fetching pools:", err);
  //     throw err;
  //   }
  // };

  const fetchPools = async (connection: Connection): Promise<PoolInfo[]> => {
    const programId = new PublicKey("E4jqaxpY8zonsVHhuYVFoCMDvgsL411cYCK9d8tGCBYC");
  
    try {
      const accounts = await connection.getProgramAccounts(programId, {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: bs58.encode(Buffer.from([0x0b, 0x33, 0x18, 0xda, 0x3b, 0x34, 0x85, 0xc9])), // First 8 bytes of SHA256("global:pool")
            },
          },
        ],
      });
  
      console.log(`Found ${accounts.length} accounts`);
  
      const pools: PoolInfo[] = accounts.map(({ pubkey, account }) => {
        const data = account.data;
        let offset = 8; // Skip the 8-byte discriminator
        console.log(data)
        const tokenMint0 = new PublicKey(data.slice(offset, offset + 32));
        offset += 32;
        const tokenMint1 = new PublicKey(data.slice(offset, offset + 32));
        offset += 32;
        const tokenVault0 = new PublicKey(data.slice(offset, offset + 32));
        offset += 32;
        const tokenVault1 = new PublicKey(data.slice(offset, offset + 32));
        offset += 32;
        const observationKey = new PublicKey(data.slice(offset, offset + 32));
        offset += 32;
  
        const mintDecimals0 = data[offset];
        offset += 1;
        const mintDecimals1 = data[offset];
        offset += 1;
        const tickSpacing = data.readUInt16LE(offset);
        offset += 2;
  
        const liquidity = data.readBigUInt64LE(offset);
        offset += 8;
        const sqrtPriceX64 = data.readBigUInt64LE(offset);
        offset += 8;
        const tickCurrent = data.readInt32LE(offset);
        offset += 4;
  
        // Skip padding
        offset += 4;
  
        const feeGrowthGlobal0X64 = data.readBigUInt64LE(offset);
        offset += 8;
        const feeGrowthGlobal1X64 = data.readBigUInt64LE(offset);
  
        return {
          publicKey: pubkey,
          tokenMint0,
          tokenMint1,
          tokenVault0,
          tokenVault1,
          observationKey,
          mintDecimals0,
          mintDecimals1,
          tickSpacing,
          liquidity,
          sqrtPriceX64,
          tickCurrent,
          feeGrowthGlobal0X64,
          feeGrowthGlobal1X64,
        };
      });
  
      console.log(`Processed ${pools.length} pools`);
      return pools;
    } catch (err) {
      console.error("Error fetching pools:", err);
      throw err;
    }
  };
  
  useEffect(() => {
    fetchPools(connection); // Executes fetchPools on mount only
  }, [fetchPools]);
  
  const handleRefresh = () => {
    fetchPools(connection); // Allows manual refresh by the user
  };
  
  const handleCreateAmmConfig = async () => {
    if (!publicKey) {
      console.error("Wallet not connected");
      return;
    }
  
    const programId = new PublicKey("E4jqaxpY8zonsVHhuYVFoCMDvgsL411cYCK9d8tGCBYC");
    const configIndex = 0;
    const tickSpacing = 1;
    const tradeFeeRate = 2500; // 0.25%
    const protocolFeeRate = 300; // 0.03%
    const fundFeeRate = 200; // 0.02%
  
    try {
      const tx = await createAmmConfig(
        wallet,
        publicKey,
        connection,
        programId,
        configIndex,
        tickSpacing,
        tradeFeeRate,
        protocolFeeRate,
        fundFeeRate
      );
      console.log("AMM Config created with transaction signature:", tx);
      return tx;
    } catch (error) {
      console.error("Error creating AMM config:", error);
    }
  };

  const handleCreatePool = async () => {


    if (!publicKey) {
      console.error("Wallet not connected");
      return;
    }
    
    const programId = new PublicKey("E4jqaxpY8zonsVHhuYVFoCMDvgsL411cYCK9d8tGCBYC");
   
    //switched due to constraint in solana-clmm/programs/amm/src/instructions/create_pool.rs
    const tokenMint0 = new PublicKey("9N5y4Vppq6H2wmhZG3LtUgQCwCYbiC4RYUiTfge76D8p");
    const tokenMint1 = new PublicKey("Cp7N9j6wwJ4hL3kp12zifWXnS54vUv8j9qD8mNJ1C3sp");

    
    const configIndex = 0; // Use the appropriate index
    const ammConfig = PublicKey.findProgramAddressSync(
      [
        Buffer.from("amm_config"), //AMM_CONFIG_SEED
        Buffer.from([configIndex >> 8, configIndex & 0xff]) // Big-endian representation
      ],
      programId
    )[0];
    

    console.log("ammConfig: ", ammConfig.toBase58())

    const tokenProgram0 = TOKEN_PROGRAM_ID;
    const tokenProgram1 = TOKEN_PROGRAM_ID;

    const [poolAccountKey] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"), //POOL_SEED
        ammConfig.toBuffer(),
        tokenMint0.toBuffer(),
        tokenMint1.toBuffer()
      ],
      programId
    );

    const tickArrayBitmap = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool_tick_array_bitmap_extension"), //TICK_ARRAY_BITMAP_SEED
        poolAccountKey.toBuffer()
      ],
      programId
    )[0];

    console.log("tickArrayBitmap: ", tickArrayBitmap.toBase58())

    // const sqrtPriceX64 = BigInt("your_sqrt_price_x64_here");
    // const sqrtPriceX64 = BigInt(1 << 64); // sqrt(1) in X64 format
    // const sqrtPriceX64 = BigInt(2n ** 64n); // sqrt(1) in Q64.64 format
    // const sqrtPriceX64 = BigInt(2) << BigInt(63);
    const initialPrice = 1.0001; // Adjust this value based on your desired initial price ratio
    const sqrtPriceX64 = calculateSqrtPriceX64(initialPrice);
    console.log("Calculated sqrtPriceX64:", sqrtPriceX64.toString());


    const openTime = Math.floor(Date.now() / 1000); // Use current time
  
    try {
      const tx = await createPool(wallet, publicKey, connection, programId, ammConfig, tokenMint0, tokenMint1, tokenProgram0, tokenProgram1, tickArrayBitmap, sqrtPriceX64, openTime);
      console.log("Pool created with transaction signature:", tx);
    } catch (error) {
      console.error("Error creating pool:", error);
    }
  };
  

  const renderSwapContent = () => (
    <div className="w-full max-w-md bg-black bg-opacity-20 backdrop-blur-lg border border-purple-500 rounded-3xl overflow-hidden">
      <motion.div 
        className="p-6 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-center text-white mb-8">Swap Anticoins</h1>
        
        <div className="space-y-4">
          <TokenSelector
            token={fromToken}
            onClick={() => openModal('from')}
            amount={amount}
            onAmountChange={(e) => setAmount(e.target.value)}
            isInput={true}
          />

          <SwapButton onClick={handleSwap} />

          <TokenSelector
            token={toToken}
            onClick={() => openModal('to')}
            amount=""
            onAmountChange={() => {}}
            isInput={false}
          />
        </div>

        <button 
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3 rounded-full transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Swap
        </button>

        <p className="text-center text-purple-200 text-sm">
          RugSafe: Where your assets thrive, not just survive          
        </p>
      </motion.div>
    </div>
  );

  const renderLiquidityContent = () => (
    <div className="w-full max-w-md">
      <motion.div 
        className="p-6 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-center text-white mb-8">Liquidity Pools</h1>
        
        {isLoading ? (
          <p className="text-white">Loading pools...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="space-y-4">
            {pools.length === 0 ? (
              <p className="text-white">No pools available.</p>
            ) : (
              pools.map((pool) => (
                <div key={pool.publicKey.toString()} className="bg-purple-800 bg-opacity-50 rounded-lg p-4">
                  <p className="text-white">Pool Address: {pool.publicKey.toString()}</p>
                  <p className="text-white">Token 0: {pool.tokenMint0.toString()}</p>
                  <p className="text-white">Token 1: {pool.tokenMint1.toString()}</p>
                  <p className="text-white">Liquidity: {pool.liquidity}</p>
                  <p className="text-white">Current Tick: {pool.tickCurrent}</p>
                  <p className="text-white">Sqrt Price: {pool.sqrtPriceX64}</p>
                </div>
              ))
            )}
          </div>
        )}
  
        <button 
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 rounded-full transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
        >
          Add Liquidity
        </button>
  
        <div className="mt-4 space-y-4 w-full max-w-md">
          <button 
            onClick={handleCreateAmmConfig}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 rounded-lg"
          >
            Create AMM Config
          </button>
          <button 
            onClick={handleCreatePool}
            className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold py-3 rounded-lg"
          >
            Create Pool
          </button>
        </div>
  
        <p className="text-center text-purple-200 text-sm">
          RugSafe: Where your assets thrive, not just survive          
        </p>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 flex flex-col items-center justify-center p-4">
      <div className="flex mb-4 bg-purple-800 rounded-full p-1">
        <button
          className={`px-4 py-2 rounded-full text-white font-bold transition-all duration-300 ${activeTab === 'swap' ? 'bg-purple-500' : ''}`}
          onClick={() => setActiveTab('swap')}
        >
          Swap
        </button>
        <button
          className={`px-4 py-2 rounded-full text-white font-bold transition-all duration-300 ${activeTab === 'liquidity' ? 'bg-purple-500' : ''}`}
          onClick={() => setActiveTab('liquidity')}
        >
          Liquidity
        </button>
      </div>

      {activeTab === 'swap' ? renderSwapContent() : renderLiquidityContent()}


      <TokenModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        tokens={tokens}
        onSelect={handleTokenSelection}
      />
    </div>
  );
};

export default Swap;