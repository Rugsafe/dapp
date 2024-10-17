"use client"

import React, { useState } from 'react'
import { sha256 } from 'js-sha256';
import { useWallet } from '@solana/wallet-adapter-react';
import Header from '@/components/Liquidity/header'
import Stats from '@/components/Liquidity/Stats'
import SearchAndCreate from '@/components/Liquidity/SearchAndCreate'
import PoolList from '@/components/Liquidity/PoolList'
import { PoolItemProps } from '@/types'
import CreateModal from '@/components/Liquidity/CreateModal'
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction, 
  sendAndConfirmTransaction, 
  SystemProgram,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID, 
} from '@solana/spl-token';


/////////////////////////////// TODO:  BREAK OUT BELOW INTO PLACE OUTSIDE OF APP FOLDER

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


/////////////////////////////// TODO:  BREAK OUT ABOVE INTO PLACE OUTSIDE OF APP FOLDER

export default function Home() {
  const { publicKey, sendTransaction } = useWallet(); // using the wallet adapter hook
  const [isModalOpen, setIsModalOpen] = useState(false);
  const connection = new Connection("http://127.0.0.1:8899");
  const wallet = useWallet();

  const pools: PoolItemProps[] = [
    { name: 'SOL-aNEIRO', liquidity: '$0', volume: '$0', fees: '$0', apr: '0%' },
    { name: 'SOL-aFLOCKA', liquidity: '$0', volume: '$0', fees: '$0', apr: '0%' },
    { name: 'SOL-aFLOCKA', liquidity: '$0', volume: '$0', fees: '$0', apr: '0%' },
  ]
  

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
    const tokenMint1 = new PublicKey("8ExJj3un2nqe3ErekY2NqXjwDMQr3V7rFdGHn4cCE8tu");
    const tokenMint0 = new PublicKey("7J8HAnNFjpsue37hNcVr61rJqmzbFaJb3fuVeAxSbrnB");

    
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

  return (
    <div className="min-h-screen bg-purple-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Header />
        <div className="mt-4">
          <Stats tvl="$0" volume="$0" />
          <div className="mt-4">
            <SearchAndCreate onCreateClick={() => setIsModalOpen(true)} />
          </div>
          <div className="mt-4">
            <PoolList pools={pools} />
          </div>
        </div>
        <CreateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} handleCreateAmmConfig={handleCreateAmmConfig} handleCreatePool={handleCreatePool} />
      </div>
    </div>
  )
}