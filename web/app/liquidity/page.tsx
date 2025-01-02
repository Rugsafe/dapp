"use client"

import React, { useState, useEffect } from 'react'
import { sha256 } from 'js-sha256';
import { useWallet } from '@solana/wallet-adapter-react';
import Header from '@/components/Liquidity/header'
import Stats from '@/components/Liquidity/Stats'
import SearchAndCreate from '@/components/Liquidity/SearchAndCreate'
import PoolList from '@/components/Liquidity/PoolList'
import { PoolItemProps } from '@/types'
import CreateModal from '@/components/Liquidity/CreateModal'
import DepositeModal from '@/components/Liquidity/DepositModal'
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
  createAssociatedTokenAccountInstruction, 
  AccountLayout, 
  createInitializeAccountInstruction, 
  ASSOCIATED_TOKEN_PROGRAM_ID, 
  TOKEN_2022_PROGRAM_ID
} from '@solana/spl-token';
import { ComputeBudgetProgram } from '@solana/web3.js';
import BN from "bn.js";


import { WalletContextState } from '@solana/wallet-adapter-react';
import { Keypair, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

// Define METADATA_PROGRAM_ID
const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
// const METADATA_PROGRAM_ID = new PublicKey("4HusifewV3SFR44ics393pn3RGND8oPTQP4iaFf4TSRK");


/////////////////////////////// TODO:  BREAK OUT BELOW INTO PLACE OUTSIDE OF APP FOLDER

// interface Wallet {
//   sendTransaction: (transaction: Transaction, connection: Connection, options: { skipPreflight: boolean; preflightCommitment: string }) => Promise<string>;
// }
type Wallet = Pick<WalletContextState, 'sendTransaction'>;

const TOKEN_MINT_0 = new PublicKey("A9N5xXpe8AehJpmm6oWFqQBBdPpgyow5mzkp9qYKE35z");
const TOKEN_MINT_1 = new PublicKey("ERGQeRDCc7DPrbfJYZfLCjcymriA19KC3jABmAFfUG6N");

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

  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 400_000, // Request 400,000 compute units
  });

  const instruction = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: publicKey, isSigner: true, isWritable: true },  // poolCreator
      { pubkey: ammConfig, isSigner: false, isWritable: true }, //maybe make writable true
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

  const transaction = new Transaction().add(computeBudgetIx).add(instruction);
  
  const signature = await wallet.sendTransaction(transaction, connection, { 
    skipPreflight: true, 
    preflightCommitment: 'processed', 
    signers: []
  });

  console.log("Transaction signature", signature);
  return signature;
};



const fetchPools = async (connection: Connection, programId: PublicKey): Promise<PoolItemProps[]> => {
  try {
    // Define config index and derive AMM Config PDA
    const configIndices = [0]; // Add more indices if applicable
    const ammConfigList = configIndices.map((configIndex) => {
      const configIndexBuffer = Buffer.alloc(2);
      configIndexBuffer.writeUInt16BE(configIndex, 0);

      return PublicKey.findProgramAddressSync(
        [Buffer.from("amm_config"), configIndexBuffer],
        programId
      )[0];
    });

    // Simulated token mints for pool creation
    const tokenMintPairs = [
      {
        mint0: TOKEN_MINT_0,
        mint1: TOKEN_MINT_1,
      },
    ];

    
    const pools: PoolItemProps[] = [];

    for (const ammConfig of ammConfigList) {
      for (const { mint0, mint1 } of tokenMintPairs) {
        const [poolPDA] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("pool"),
            ammConfig.toBuffer(),
            mint0.toBuffer(),
            mint1.toBuffer(),
          ],
          programId
        );

        const poolAccountInfo = await connection.getAccountInfo(poolPDA);
        if (poolAccountInfo) {
          const data = poolAccountInfo.data;

          // Deserialize pool data
          const tokenVault0 = new PublicKey(data.slice(0, 32)).toBase58();
          // console.log("tokenVault0: ", tokenVault0)
          const tokenVault1 = new PublicKey(data.slice(32, 64)).toBase58();
          // console.log("tokenVault1: ", tokenVault1)
          const liquidity = new BN(data.slice(64, 72), "le").toString();
          // console.log("liquidity: ", liquidity)
          const volume = new BN(data.slice(72, 80), "le").toString();
          // console.log("volume: ", volume)
          // console.log("poolPDA: ", poolPDA.toBase58().slice(0, 6))
          // Construct PoolItemProps
          pools.push({
            name: `Pool ${poolPDA.toBase58().slice(0, 6)}`,
            liquidity: `$${liquidity}`,
            volume: `$${volume}`,
            fees: "$0", // Default fees
            apr: "0%", // Default APR
            poolAccount: poolPDA,
            tokenVault0: new PublicKey(tokenVault0),
            tokenVault1: new PublicKey(tokenVault1),
            tokenMint0: mint0, 
            tokenMint1: mint1, 
          });
        }
      }
    }

    // console.log("Fetched Pools:", pools);
    return pools;
  } catch (error) {
    console.error("Error fetching pools:", error);
    return [];
  }
};



/////////////////////////////// TODO:  BREAK OUT ABOVE INTO PLACE OUTSIDE OF APP FOLDER
///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

export default function Home() {
  const connection = new Connection("http://127.0.0.1:8899");
  const wallet = useWallet();
  
  const { publicKey, sendTransaction } = useWallet(); // using the wallet adapter hook
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<PoolItemProps | null>(null);
  const [pools, setPools] = useState<PoolItemProps[]>([]);

  useEffect(() => {
    const loadPools = async () => {
      const programId = new PublicKey("GU2PbowqNvMYpWPa2P5H9gs5pAqRnQtFheR23T5AJtPV");
      const fetchedPools = await fetchPools(connection, programId);
      setPools(fetchedPools);
    };
  
    loadPools();
  }, [connection]);
  


  // dev
  // const pools: PoolItemProps[] = [
  //   {
  //     name: "USDC-aTokenA",
  //     liquidity: "$0",
  //     volume: "$0",
  //     fees: "$0",
  //     apr: "0%",
  //     poolAccount: new PublicKey("3WQFx2ZAqskXggKByQq7WKRePthJomAcfQfbV6fjwv3K"),
  //     tokenVault0: new PublicKey("Ep8tjzfEwWufdX1siXN4orBvi7wbCXPmicRJYG9yPYL"),
  //     tokenVault1: new PublicKey("nRT2rCSPhp39Vi7DJuw562YaxQHXoHJtu4G3h9GoGwm"),
  //   },
  // ];
  
  
  const handleOpenDepositModal = (pool: PoolItemProps) => {
    setSelectedPool(pool);
    setIsDepositModalOpen(true);
  };

  const handleCloseDepositModal = () => {
    setSelectedPool(null);
    setIsDepositModalOpen(false);
  };

  const handleCreateAmmConfig = async () => {
    if (!publicKey) {
      console.error("Wallet not connected");
      return;
    }
  
    const programId = new PublicKey("GU2PbowqNvMYpWPa2P5H9gs5pAqRnQtFheR23T5AJtPV");
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
    
    const programId = new PublicKey("GU2PbowqNvMYpWPa2P5H9gs5pAqRnQtFheR23T5AJtPV");
   
    //switched due to constraint in solana-clmm/programs/amm/src/instructions/create_pool.rs
    const tokenMint0 = TOKEN_MINT_0;
    const tokenMint1 = TOKEN_MINT_1;
    
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


  ////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////
  

//   const handleAddLiquidity = async (pool: PoolItemProps, amount0: number, amount1: number) => {
//     try {
//         console.log("Start handleAddLiquidity");

//         if (!publicKey) {
//             console.error("Wallet not connected");
//             return;
//         }
//         console.log("Wallet connected:", publicKey.toBase58());

//         const programId = new PublicKey("GU2PbowqNvMYpWPa2P5H9gs5pAqRnQtFheR23T5AJtPV");
//         console.log("Program ID:", programId.toBase58());

//         const poolAccountKey = new PublicKey(pool.poolAccount);
//         console.log("Pool account key:", poolAccountKey.toBase58());

//         const tokenVault0 = new PublicKey(pool.tokenVault0);
//         console.log("Token vault 0:", tokenVault0.toBase58());

//         const tokenVault1 = new PublicKey(pool.tokenVault1);
//         console.log("Token vault 1:", tokenVault1.toBase58());




//         // ###############################################################################################################################################

//         const tokenMint0 = new PublicKey(pool.tokenMint0);
//         const tokenMint1 = new PublicKey(pool.tokenMint1);

//         // const userTokenAccount0 = await getAssociatedTokenAddress(tokenMint0, publicKey);
//         const userTokenAccount0 = await getAssociatedTokenAddress(
//           tokenMint0, 
//           publicKey,
//           false,
//           TOKEN_PROGRAM_ID
//         );

//         // const userTokenAccount1 = await getAssociatedTokenAddress(tokenMint1, publicKey);

//         const userTokenAccount1 = await getAssociatedTokenAddress(
//           tokenMint1, 
//           publicKey,
//           false,
//           TOKEN_PROGRAM_ID
//       );




//         // ##############################################################################################################################
//         const tickLowerIndex = -1000;
//         const tickUpperIndex = 1000;
//         const tickArrayLowerStartIndex = -1000;
//         const tickArrayUpperStartIndex = 1000;

//         const liquidity = new BN(amount0).mul(new BN(amount1));
//         console.log("Liquidity:", liquidity.toString());

//         const amount0Max = new BN(amount0);
//         console.log("Amount 0 max:", amount0Max.toString());

//         const amount1Max = new BN(amount1);
//         console.log("Amount 1 max:", amount1Max.toString());

//         const [nftMintKey] = PublicKey.findProgramAddressSync(
//             [Buffer.from("position_nft"), publicKey.toBuffer(), poolAccountKey.toBuffer()],
//             programId
//         );
//         console.log("NFT mint key:", nftMintKey.toBase58());

//         const [metadataAccountKey] = PublicKey.findProgramAddressSync(
//             [Buffer.from("metadata"), nftMintKey.toBuffer()],
//             programId
//         );
        
//         console.log("Metadata account key:", metadataAccountKey.toBase58());

//         const tickArrayLowerSeed = Buffer.alloc(4);
        
//         tickArrayLowerSeed.writeInt32LE(-1000, 0);
//         console.log("Tick array lower seed:", tickArrayLowerSeed);

//         const tickArrayUpperSeed = Buffer.alloc(4);
//         tickArrayUpperSeed.writeInt32LE(1000, 0);
//         console.log("Tick array upper seed:", tickArrayUpperSeed);

//         const protocolPositionSeed = Buffer.alloc(4);
//         protocolPositionSeed.writeInt32LE(-1000, 0);
//         console.log("Protocol position seed:", protocolPositionSeed);

//         const [protocolPosition] = PublicKey.findProgramAddressSync(
//           [
//               Buffer.from("position"),
//               poolAccountKey.toBuffer(),
//               new BN(tickLowerIndex).toArrayLike(Buffer, "le", 4),
//               new BN(tickUpperIndex).toArrayLike(Buffer, "le", 4),
//           ],
//           programId
//       );
//         console.log("Protocol position key:", protocolPosition.toBase58());

//         const [tickArrayLower] = PublicKey.findProgramAddressSync(
//           [
//               Buffer.from("tick_array"),
//               poolAccountKey.toBuffer(),
//               new BN(tickArrayLowerStartIndex).toArrayLike(Buffer, "le", 4)
//           ],
//           programId
//       );

//         console.log("Tick array lower key:", tickArrayLower.toBase58());

//         // const [tickArrayUpper] = PublicKey.findProgramAddressSync(
//         //     [Buffer.from("tick_array"), poolAccountKey.toBuffer(), tickArrayUpperSeed],
//         //     programId
//         // );
//         const [tickArrayUpper] = PublicKey.findProgramAddressSync(
//           [
//               Buffer.from("tick_array"),
//               poolAccountKey.toBuffer(),
//               new BN(tickArrayUpperStartIndex).toArrayLike(Buffer, "le", 4)
//           ],
//           programId
//         );
//         console.log("Tick array upper key:", tickArrayUpper.toBase58());

        
//         const baseFlag = Buffer.from([0]); // Assuming no base flag for now
//         console.log("Base flag buffer:", baseFlag);

//         const tickLowerIndexBuffer = Buffer.alloc(4);
//         tickLowerIndexBuffer.writeInt32LE(tickLowerIndex, 0);
        
//         const tickUpperIndexBuffer = Buffer.alloc(4);
//         tickUpperIndexBuffer.writeInt32LE(tickUpperIndex, 0);
        
//         const liquidityBuffer = Buffer.alloc(16); // u128 is 16 bytes
//         liquidity.toArrayLike(Buffer, "le", 16).copy(liquidityBuffer);
        
//         const amount0MaxBuffer = Buffer.alloc(8);
//         amount0Max.toArrayLike(Buffer, "le", 8).copy(amount0MaxBuffer);
        
//         const amount1MaxBuffer = Buffer.alloc(8);
//         amount1Max.toArrayLike(Buffer, "le", 8).copy(amount1MaxBuffer);
        
//         const withMetadataBuffer = Buffer.from([1]); // true for with_metadata
//         const baseFlagBuffer = Buffer.from([0]); // false for base_flag
        

//         // const openPositionV2Discriminator = Buffer.from("4db84ad67056f1c7", "hex");
//         // const openPositionV2Discriminator = Buffer.from(
//         //   sha256.digest('global:open_position_v2')
//         // ).slice(0, 8);
//         const openPositionV2Discriminator = Buffer.from(
//           sha256.digest('global:open_position_v2')
//         ).slice(0, 8);

//         console.log("Open position V2 discriminator:", openPositionV2Discriminator);


//         const instructionData = Buffer.concat([
//           openPositionV2Discriminator,               // 8 bytes discriminator
//           liquidity.toArrayLike(Buffer, "le", 16),  // 16 bytes liquidity
//           amount0Max.toArrayLike(Buffer, "le", 8),  // 8 bytes amount_0_max
//           amount1Max.toArrayLike(Buffer, "le", 8),  // 8 bytes amount_1_max
//           new BN(tickLowerIndex).toArrayLike(Buffer, "le", 4),
//           new BN(tickUpperIndex).toArrayLike(Buffer, "le", 4),
//           new BN(tickArrayLowerStartIndex).toArrayLike(Buffer, "le", 4),
//           new BN(tickArrayUpperStartIndex).toArrayLike(Buffer, "le", 4),
//           withMetadataBuffer,
//           baseFlagBuffer,
//       ]);
//         console.log("Instruction data:", instructionData.toString("hex"));

//         const [personalPosition] = PublicKey.findProgramAddressSync(
//           [Buffer.from("position"), nftMintKey.toBuffer()],
//           programId
//         );
    
//         // const nftAta = await getAssociatedTokenAddress(nftMintKey, publicKey);
//         const nftAta = await getAssociatedTokenAddress(
//           nftMintKey, 
//           publicKey,
//           false,
//           TOKEN_PROGRAM_ID
//         );
  
//         // Create NFT ATA
//         const createNftAtaIx = createAssociatedTokenAccountInstruction(
//           publicKey,          // payer
//           nftAta,            // ata
//           publicKey,          // owner
//           nftMintKey,        // mint
//           TOKEN_PROGRAM_ID  // Use Token 2022 program
//       );

//         // Rest of your existing code for PDA derivation...
    
//         const [metadataAccount] = PublicKey.findProgramAddressSync(
//           [
//               Buffer.from("metadata"),
//               METADATA_PROGRAM_ID.toBuffer(),
//               nftMintKey.toBuffer()
//           ],
//           METADATA_PROGRAM_ID
//       );
//         console.log("Metadata account key:", metadataAccountKey.toBase58());

//         const [tickArrayBitmap] = PublicKey.findProgramAddressSync(
//           [
//               Buffer.from("pool_tick_array_bitmap_extension"),
//               poolAccountKey.toBuffer()
//           ],
//           programId
//         );

//         // Create ATAs if they don't exist
//         const createTokenAta0Ix = createAssociatedTokenAccountInstruction(
//           publicKey,          // payer
//           userTokenAccount0,  // ata
//           publicKey,          // owner
//           tokenMint0,        // mint
//           TOKEN_PROGRAM_ID  // Use Token 2022 program
//         );

//         const createTokenAta1Ix = createAssociatedTokenAccountInstruction(
//           publicKey,          // payer
//           userTokenAccount1,  // ata
//           publicKey,          // owner
//           tokenMint1,        // mint
//           TOKEN_PROGRAM_ID  // Use Token 2022 program
//       );

//         const openPositionIx = new TransactionInstruction({
//           programId,
//           keys: [
//               { pubkey: publicKey, isSigner: true, isWritable: true },             // payer
//               { pubkey: publicKey, isSigner: false, isWritable: false },           // position_nft_owner
//               { pubkey: nftMintKey, isSigner: false, isWritable: true },          // position_nft_mint
//               { pubkey: nftAta, isSigner: false, isWritable: true },              // position_nft_account
//               { pubkey: metadataAccount, isSigner: false, isWritable: true },  // metadata_account, not metadataAccountKey
//               { pubkey: poolAccountKey, isSigner: false, isWritable: true },      // pool_state
//               { pubkey: protocolPosition, isSigner: false, isWritable: true },    // protocol_position
//               { pubkey: tickArrayLower, isSigner: false, isWritable: true },      // tick_array_lower
//               { pubkey: tickArrayUpper, isSigner: false, isWritable: true },      // tick_array_upper
//               { pubkey: personalPosition, isSigner: false, isWritable: true },    // personal_position 
//               { pubkey: userTokenAccount0, isSigner: false, isWritable: true },   // token_account_0
//               { pubkey: userTokenAccount1, isSigner: false, isWritable: true },   // token_account_1
//               { pubkey: tokenVault0, isSigner: false, isWritable: true },         // token_vault_0
//               { pubkey: tokenVault1, isSigner: false, isWritable: true },         // token_vault_1
//               { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent
//               { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
//               { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },    // token_program
//               { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // associated_token_program
//               { pubkey: METADATA_PROGRAM_ID, isSigner: false, isWritable: false }, // metadata_program
//               { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program_2022
//               { pubkey: new PublicKey(pool.tokenMint0), isSigner: false, isWritable: false }, // vault_0_mint
//               { pubkey: new PublicKey(pool.tokenMint1), isSigner: false, isWritable: false }, // vault_1_mint
//               { pubkey: tickArrayBitmap, isSigner: false, isWritable: true }, 
//           ],
//           data: instructionData,
//         });

//         console.log("Open position instruction created:", openPositionIx);

//         const transaction = new Transaction();
//         transaction.feePayer = publicKey;

//         // Add ATA creation instructions first
//         try {

//           // First actually call the vault creation function
//           const createVaultAccounts = async () => {
//             const transaction = new Transaction();
//             transaction.feePayer = publicKey;

//             // Check if vault accounts exist
//             const vault0Info = await connection.getAccountInfo(tokenVault0);
//             const vault1Info = await connection.getAccountInfo(tokenVault1);

//             if (!vault0Info) {
//               console.log("Creating tokenVault0...");
//               transaction.add(
//                 SystemProgram.createAccount({
//                   fromPubkey: publicKey,
//                   newAccountPubkey: tokenVault0,
//                   lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
//                   space: AccountLayout.span,
//                   programId: TOKEN_PROGRAM_ID,
//                 })
//               );
//               transaction.add(
//                 // createInitializeAccountInstruction(
//                 //   TOKEN_PROGRAM_ID,
//                 //   tokenMint0,
//                 //   tokenVault0,
//                 //   poolAccountKey // Set the PDA as the owner
//                 // )
//                 createInitializeAccountInstruction(
//                   tokenVault0,
//                   tokenMint0,
//                   poolAccountKey, // Set the PDA as the owner
//                   TOKEN_PROGRAM_ID
//               )
//               );
//             }

//             if (!vault1Info) {
//               console.log("Creating tokenVault1...");
//               transaction.add(
//                 SystemProgram.createAccount({
//                   fromPubkey: publicKey,
//                   newAccountPubkey: tokenVault1,
//                   lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
//                   space: AccountLayout.span,
//                   programId: TOKEN_PROGRAM_ID,
//                 })
//               );
//               transaction.add(
//                 // createInitializeAccountInstruction(
//                 //   TOKEN_PROGRAM_ID,
//                 //   tokenMint1,
//                 //   tokenVault1,
//                 //   poolAccountKey // Set the PDA as the owner
//                 // )
//                 createInitializeAccountInstruction(
//                   tokenVault1,
//                   tokenMint1,
//                   poolAccountKey, // Set the PDA as the owner
//                   TOKEN_PROGRAM_ID
//               )
//               );
//             }

//             if (transaction.instructions.length > 0) {
//               console.log("Sending vault creation transaction...");
//               // await wallet.sendTransaction(transaction, connection, {
//               //   skipPreflight: true,
//               //   preflightCommitment: "processed",
//               // });
//               // Wait for confirmation
//               // await new Promise(resolve => setTimeout(resolve, 2000));
//             }
//           };


//           await createVaultAccounts();  // Actually call the function!


//           /////////////

//         } catch (error) {
//           // console.error("Transaction failed:", error.message);
//           console.error("Full error details:", error);
//           throw error; // Re-throw to allow handling in the calling function
//         }

//         transaction.add(openPositionIx);
//         console.log("Transaction prepared:", transaction);

//         console.log("Simulating transaction...");
//         const simulationResult = await connection.simulateTransaction(transaction);
//         console.log("Simulation result:", simulationResult);

//         const signature = await wallet.sendTransaction(transaction, connection, {
//             skipPreflight: true,
//             preflightCommitment: "processed",
//         });
//         console.log("Transaction signature:", signature);
//     } catch (error) {
//         console.error("Error adding liquidity:", error);
//     }
// };




// const handleAddLiquidity = async (pool: PoolItemProps, amount0: number, amount1: number) => {
//   try {
//       console.log("Start handleAddLiquidity");

//       if (!publicKey) {
//           console.error("Wallet not connected");
//           return;
//       }
//       console.log("Wallet connected:", publicKey.toBase58());

//       const programId = new PublicKey("GU2PbowqNvMYpWPa2P5H9gs5pAqRnQtFheR23T5AJtPV");
//       console.log("Program ID:", programId.toBase58());

//       const poolAccountKey = new PublicKey(pool.poolAccount);
//       console.log("Pool account key:", poolAccountKey.toBase58());

//       const tokenVault0 = new PublicKey(pool.tokenVault0);
//       console.log("Token vault 0:", tokenVault0.toBase58());

//       const tokenVault1 = new PublicKey(pool.tokenVault1);
//       console.log("Token vault 1:", tokenVault1.toBase58());

//       const tokenMint0 = new PublicKey(pool.tokenMint0);
//       const tokenMint1 = new PublicKey(pool.tokenMint1);

//       const userTokenAccount0 = await getAssociatedTokenAddress(
//           tokenMint0,
//           publicKey,
//           false,
//           TOKEN_PROGRAM_ID
//       );

//       const userTokenAccount1 = await getAssociatedTokenAddress(
//           tokenMint1,
//           publicKey,
//           false,
//           TOKEN_PROGRAM_ID
//       );

//       const tickLowerIndex = -1000;
//       const tickUpperIndex = 1000;
//       const tickArrayLowerStartIndex = -1000;
//       const tickArrayUpperStartIndex = 1000;

//       const liquidity = new BN(amount0).mul(new BN(amount1));
//       const amount0Max = new BN(amount0);
//       const amount1Max = new BN(amount1);

//       const [nftMintKey] = PublicKey.findProgramAddressSync(
//           [Buffer.from("position_nft"), publicKey.toBuffer(), poolAccountKey.toBuffer()],
//           programId
//       );

//       const [protocolPosition] = PublicKey.findProgramAddressSync(
//           [
//               Buffer.from("position"),
//               poolAccountKey.toBuffer(),
//               new BN(tickLowerIndex).toArrayLike(Buffer, "le", 4),
//               new BN(tickUpperIndex).toArrayLike(Buffer, "le", 4),
//           ],
//           programId
//       );

//       const transaction = new Transaction();
//       transaction.feePayer = publicKey;

//       // Check and initialize token vaults if needed
//       const vault0Info = await connection.getAccountInfo(tokenVault0);
//       if (!vault0Info) {
//           transaction.add(
//               SystemProgram.createAccount({
//                   fromPubkey: publicKey,
//                   newAccountPubkey: tokenVault0,
//                   lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
//                   space: AccountLayout.span,
//                   programId: TOKEN_PROGRAM_ID,
//               })
//           );
//           transaction.add(
//               createInitializeAccountInstruction(
//                   tokenVault0,
//                   tokenMint0,
//                   poolAccountKey,
//                   TOKEN_PROGRAM_ID
//               )
//           );
//       }

//       const vault1Info = await connection.getAccountInfo(tokenVault1);
//       if (!vault1Info) {
//           transaction.add(
//               SystemProgram.createAccount({
//                   fromPubkey: publicKey,
//                   newAccountPubkey: tokenVault1,
//                   lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
//                   space: AccountLayout.span,
//                   programId: TOKEN_PROGRAM_ID,
//               })
//           );
//           transaction.add(
//               createInitializeAccountInstruction(
//                   tokenVault1,
//                   tokenMint1,
//                   poolAccountKey,
//                   TOKEN_PROGRAM_ID
//               )
//           );
//       }

//       // OpenPositionV2 instruction
//       const instructionData = Buffer.concat([
//           Buffer.from(sha256.digest('global:open_position_v2')).slice(0, 8), // Discriminator
//           liquidity.toArrayLike(Buffer, "le", 16), // Liquidity
//           amount0Max.toArrayLike(Buffer, "le", 8), // Max amount for token 0
//           amount1Max.toArrayLike(Buffer, "le", 8), // Max amount for token 1
//           new BN(tickLowerIndex).toArrayLike(Buffer, "le", 4), // Tick lower index
//           new BN(tickUpperIndex).toArrayLike(Buffer, "le", 4), // Tick upper index
//           new BN(tickArrayLowerStartIndex).toArrayLike(Buffer, "le", 4), // Tick array lower
//           new BN(tickArrayUpperStartIndex).toArrayLike(Buffer, "le", 4), // Tick array upper
//           Buffer.from([1]), // Metadata flag
//           Buffer.from([0]), // Base flag
//       ]);

//       const openPositionIx = new TransactionInstruction({
//           programId,
//           keys: [
//               { pubkey: publicKey, isSigner: true, isWritable: true }, // payer
//               { pubkey: publicKey, isSigner: false, isWritable: false }, // position NFT owner
//               { pubkey: nftMintKey, isSigner: false, isWritable: true }, // position NFT mint
//               { pubkey: userTokenAccount0, isSigner: false, isWritable: true }, // token account 0
//               { pubkey: userTokenAccount1, isSigner: false, isWritable: true }, // token account 1
//               { pubkey: tokenVault0, isSigner: false, isWritable: true }, // token vault 0
//               { pubkey: tokenVault1, isSigner: false, isWritable: true }, // token vault 1
//               { pubkey: protocolPosition, isSigner: false, isWritable: true }, // protocol position
//               { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent sysvar
//               { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system program
//               { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token program
//           ],
//           data: instructionData,
//       });

//       transaction.add(openPositionIx);

//       // Simulate and send transaction
//       console.log("Simulating transaction...");
//       const simulationResult = await connection.simulateTransaction(transaction);
//       console.log("Simulation result:", simulationResult);

//       const signature = await wallet.sendTransaction(transaction, connection, {
//           skipPreflight: true,
//           preflightCommitment: "processed",
//       });
//       console.log("Transaction signature:", signature);
//   } catch (error) {
//       console.error("Error adding liquidity:", error);
//   }
// };


// const handleAddLiquidity = async (pool: PoolItemProps, amount0: number, amount1: number) => {
//   try {
//     console.log("Start handleAddLiquidity");

//     if (!publicKey) {
//       console.error("Wallet not connected");
//       return;
//     }
//     console.log("Wallet connected:", publicKey.toBase58());

//     const programId = new PublicKey("GU2PbowqNvMYpWPa2P5H9gs5pAqRnQtFheR23T5AJtPV");
//     console.log("Program ID:", programId.toBase58());

//     const poolAccountKey = new PublicKey(pool.poolAccount);
//     console.log("Pool account key:", poolAccountKey.toBase58());

//     // Validate pool_state ownership
//     const poolStateInfo = await connection.getAccountInfo(poolAccountKey);
//     if (!poolStateInfo) {
//       console.error("pool_state account does not exist.");
//       return;
//     }
//     console.log("pool_state account owner:", poolStateInfo.owner.toBase58());
//     if (!poolStateInfo.owner.equals(programId)) {
//       console.error(
//         `pool_state account is owned by ${poolStateInfo.owner.toBase58()}, expected ${programId.toBase58()}`
//       );
//       return;
//     }

//     const tokenVault0 = new PublicKey(pool.tokenVault0);
//     const tokenVault1 = new PublicKey(pool.tokenVault1);
//     const tokenMint0 = new PublicKey(pool.tokenMint0);
//     const tokenMint1 = new PublicKey(pool.tokenMint1);

//     const userTokenAccount0 = await getAssociatedTokenAddress(
//       tokenMint0,
//       publicKey,
//       false,
//       TOKEN_PROGRAM_ID
//     );
//     const userTokenAccount1 = await getAssociatedTokenAddress(
//       tokenMint1,
//       publicKey,
//       false,
//       TOKEN_PROGRAM_ID
//     );

//     const tickLowerIndex = -1000;
//     const tickUpperIndex = 1000;
//     const tickArrayLowerStartIndex = -1000;
//     const tickArrayUpperStartIndex = 1000;

//     const liquidity = new BN(amount0).mul(new BN(amount1));
//     const amount0Max = new BN(amount0);
//     const amount1Max = new BN(amount1);

//     const [nftMintKey] = PublicKey.findProgramAddressSync(
//       [Buffer.from("position_nft"), publicKey.toBuffer(), poolAccountKey.toBuffer()],
//       programId
//     );

//     const [protocolPosition] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("position"),
//         poolAccountKey.toBuffer(),
//         new BN(tickLowerIndex).toArrayLike(Buffer, "le", 4),
//         new BN(tickUpperIndex).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const transaction = new Transaction();
//     transaction.feePayer = publicKey;

//     // OpenPositionV2 instruction
//     const instructionData = Buffer.concat([
//       Buffer.from(sha256.digest('global:open_position_v2')).slice(0, 8), // Discriminator
//       liquidity.toArrayLike(Buffer, "le", 16), // Liquidity
//       amount0Max.toArrayLike(Buffer, "le", 8), // Max amount for token 0
//       amount1Max.toArrayLike(Buffer, "le", 8), // Max amount for token 1
//       new BN(tickLowerIndex).toArrayLike(Buffer, "le", 4), // Tick lower index
//       new BN(tickUpperIndex).toArrayLike(Buffer, "le", 4), // Tick upper index
//       new BN(tickArrayLowerStartIndex).toArrayLike(Buffer, "le", 4), // Tick array lower start index
//       new BN(tickArrayUpperStartIndex).toArrayLike(Buffer, "le", 4), // Tick array upper start index
//       Buffer.from([1]), // Metadata flag
//       Buffer.from([0]), // Base flag
//     ]);

//     const openPositionIx = new TransactionInstruction({
//       programId,
//       keys: [
//         { pubkey: publicKey, isSigner: true, isWritable: true }, // payer
//         { pubkey: publicKey, isSigner: false, isWritable: false }, // position NFT owner
//         { pubkey: nftMintKey, isSigner: false, isWritable: true }, // position NFT mint
//         { pubkey: userTokenAccount0, isSigner: false, isWritable: true }, // token account 0
//         { pubkey: userTokenAccount1, isSigner: false, isWritable: true }, // token account 1
//         { pubkey: tokenVault0, isSigner: false, isWritable: true }, // token vault 0
//         { pubkey: tokenVault1, isSigner: false, isWritable: true }, // token vault 1
//         { pubkey: protocolPosition, isSigner: false, isWritable: true }, // protocol position
//         { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent sysvar
//         { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system program
//         { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token program
//       ],
//       data: instructionData,
//     });

//     transaction.add(openPositionIx);

//     // Simulate and send transaction
//     console.log("Simulating transaction...");
//     const simulationResult = await connection.simulateTransaction(transaction);
//     console.log("Simulation result:", simulationResult);

//     const signature = await wallet.sendTransaction(transaction, connection, {
//       skipPreflight: true,
//       preflightCommitment: "processed",
//     });
//     console.log("Transaction signature:", signature);
//   } catch (error) {
//     console.error("Error adding liquidity:", error);
//   }
// };




// const handleAddLiquidity = async (pool: PoolItemProps, amount0: number, amount1: number) => {
//   try {
//       console.log("Start handleAddLiquidity");

//       if (!publicKey) {
//           console.error("Wallet not connected");
//           return;
//       }
//       console.log("Wallet connected:", publicKey.toBase58());

//       const programId = new PublicKey("GU2PbowqNvMYpWPa2P5H9gs5pAqRnQtFheR23T5AJtPV");
//       console.log("Program ID:", programId.toBase58());

//       const poolAccountKey = new PublicKey(pool.poolAccount);
//       const tokenVault0 = new PublicKey(pool.tokenVault0);
//       const tokenVault1 = new PublicKey(pool.tokenVault1);

//       console.log("Pool account key:", poolAccountKey.toBase58());
//       console.log("Token vault 0:", tokenVault0.toBase58());
//       console.log("Token vault 1:", tokenVault1.toBase58());

//       const tokenMint0 = new PublicKey(pool.tokenMint0);
//       const tokenMint1 = new PublicKey(pool.tokenMint1);

//       const createVaultAccounts = async () => {
//           const transaction = new Transaction();
//           transaction.feePayer = publicKey;

//           // Check if vault accounts exist
//           const vault0Info = await connection.getAccountInfo(tokenVault0);
//           const vault1Info = await connection.getAccountInfo(tokenVault1);

//           if (!vault0Info) {
//               console.log("Creating tokenVault0...");
//               transaction.add(
//                   SystemProgram.createAccount({
//                       fromPubkey: publicKey,
//                       newAccountPubkey: tokenVault0,
//                       lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
//                       space: AccountLayout.span,
//                       programId: TOKEN_PROGRAM_ID,
//                   })
//               );
//               transaction.add(
//                   createInitializeAccountInstruction(
//                       tokenVault0,
//                       tokenMint0,
//                       poolAccountKey, // Set the pool PDA as the owner
//                       TOKEN_PROGRAM_ID
//                   )
//               );
//           }

//           if (!vault1Info) {
//               console.log("Creating tokenVault1...");
//               transaction.add(
//                   SystemProgram.createAccount({
//                       fromPubkey: publicKey,
//                       newAccountPubkey: tokenVault1,
//                       lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
//                       space: AccountLayout.span,
//                       programId: TOKEN_PROGRAM_ID,
//                   })
//               );
//               transaction.add(
//                   createInitializeAccountInstruction(
//                       tokenVault1,
//                       tokenMint1,
//                       poolAccountKey, // Set the pool PDA as the owner
//                       TOKEN_PROGRAM_ID
//                   )
//               );
//           }

//           if (transaction.instructions.length > 0) {
//               console.log("Sending vault creation transaction...");
//               const signature = await wallet.sendTransaction(transaction, connection, {
//                   skipPreflight: false,
//                   preflightCommitment: "processed",
//               });
//               console.log("Vault creation transaction signature:", signature);
//               // Wait for confirmation
//               await connection.confirmTransaction(signature, "processed");
//           } else {
//               console.log("No vault accounts needed to be created.");
//           }
//       };

//       // Call the vault creation function
//       await createVaultAccounts();

//       const liquidity = new BN(amount0).mul(new BN(amount1));
//       console.log("Liquidity:", liquidity.toString());

//       // Simulate and send the open position transaction
//       const transaction = new Transaction();
//       transaction.feePayer = publicKey;

//       // Add your instruction here (e.g., openPositionIx)
//       console.log("Simulating transaction...");
//       const simulationResult = await connection.simulateTransaction(transaction);
//       console.log("Simulation result:", simulationResult);

//       const signature = await wallet.sendTransaction(transaction, connection, {
//           skipPreflight: true,
//           preflightCommitment: "processed",
//       });
//       console.log("Transaction signature:", signature);
//   } catch (error) {
//       console.error("Error adding liquidity:", error);
//   }
// };



// const handleAddLiquidity = async (pool: PoolItemProps, amount0: number, amount1: number) => {
//   try {
//     console.log("Start handleAddLiquidity");

//     if (!publicKey) {
//       console.error("Wallet not connected");
//       return;
//     }
//     console.log("Wallet connected:", publicKey.toBase58());

//     const programId = new PublicKey("GU2PbowqNvMYpWPa2P5H9gs5pAqRnQtFheR23T5AJtPV");
//     console.log("Program ID:", programId.toBase58());

//     const poolAccountKey = new PublicKey(pool.poolAccount);
//     console.log("Pool account key:", poolAccountKey.toBase58());

//     // Validate pool_state ownership
//     const poolStateInfo = await connection.getAccountInfo(poolAccountKey);
//     if (!poolStateInfo) {
//       console.error("pool_state account does not exist.");
//       return;
//     }
//     console.log("pool_state account owner:", poolStateInfo.owner.toBase58());
//     if (!poolStateInfo.owner.equals(programId)) {
//       console.error(
//         `pool_state account is owned by ${poolStateInfo.owner.toBase58()}, expected ${programId.toBase58()}`
//       );
//       return;
//     }

//     const tokenVault0 = new PublicKey(pool.tokenVault0);
//     const tokenVault1 = new PublicKey(pool.tokenVault1);
//     const tokenMint0 = new PublicKey(pool.tokenMint0);
//     const tokenMint1 = new PublicKey(pool.tokenMint1);

//     const userTokenAccount0 = await getAssociatedTokenAddress(
//       tokenMint0,
//       publicKey,
//       false,
//       TOKEN_PROGRAM_ID
//     );
//     const userTokenAccount1 = await getAssociatedTokenAddress(
//       tokenMint1,
//       publicKey,
//       false,
//       TOKEN_PROGRAM_ID
//     );

//     const [tickArrayLower] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("tick_array"),
//         poolAccountKey.toBuffer(),
//         new BN(-1000).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const [tickArrayUpper] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("tick_array"),
//         poolAccountKey.toBuffer(),
//         new BN(1000).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const [protocolPosition] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("position"),
//         poolAccountKey.toBuffer(),
//         new BN(-1000).toArrayLike(Buffer, "le", 4),
//         new BN(1000).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const [personalPosition] = PublicKey.findProgramAddressSync(
//       [Buffer.from("position"), publicKey.toBuffer(), poolAccountKey.toBuffer()],
//       programId
//     );

//     const [nftMintKey] = PublicKey.findProgramAddressSync(
//       [Buffer.from("position_nft"), publicKey.toBuffer(), poolAccountKey.toBuffer()],
//       programId
//     );

//     const [metadataAccountKey] = PublicKey.findProgramAddressSync(
//       [Buffer.from("metadata"), nftMintKey.toBuffer()],
//       METADATA_PROGRAM_ID
//     );

//     const liquidity = new BN(amount0).mul(new BN(amount1));
//     const amount0Max = new BN(amount0);
//     const amount1Max = new BN(amount1);

//     const transaction = new Transaction();
//     transaction.feePayer = publicKey;

//     // OpenPositionV2 instruction
//     const instructionData = Buffer.concat([
//       Buffer.from(sha256.digest('global:open_position_v2')).slice(0, 8), // Discriminator
//       liquidity.toArrayLike(Buffer, "le", 16), // Liquidity
//       amount0Max.toArrayLike(Buffer, "le", 8), // Max amount for token 0
//       amount1Max.toArrayLike(Buffer, "le", 8), // Max amount for token 1
//       new BN(-1000).toArrayLike(Buffer, "le", 4), // Tick lower index
//       new BN(1000).toArrayLike(Buffer, "le", 4), // Tick upper index
//       new BN(-1000).toArrayLike(Buffer, "le", 4), // Tick array lower start index
//       new BN(1000).toArrayLike(Buffer, "le", 4), // Tick array upper start index
//       Buffer.from([1]), // Metadata flag
//       Buffer.from([0]), // Base flag
//     ]);

//     const openPositionIx = new TransactionInstruction({
//       programId,
//       keys: [
//         { pubkey: publicKey, isSigner: true, isWritable: true }, // payer
//         { pubkey: publicKey, isSigner: false, isWritable: false }, // position_nft_owner
//         { pubkey: nftMintKey, isSigner: false, isWritable: true }, // position_nft_mint
//         { pubkey: metadataAccountKey, isSigner: false, isWritable: true }, // metadata_account
//         { pubkey: poolAccountKey, isSigner: false, isWritable: true }, // pool_state
//         { pubkey: protocolPosition, isSigner: false, isWritable: true }, // protocol_position
//         { pubkey: tickArrayLower, isSigner: false, isWritable: true }, // tick_array_lower
//         { pubkey: tickArrayUpper, isSigner: false, isWritable: true }, // tick_array_upper
//         { pubkey: personalPosition, isSigner: false, isWritable: true }, // personal_position
//         { pubkey: userTokenAccount0, isSigner: false, isWritable: true }, // token_account_0
//         { pubkey: userTokenAccount1, isSigner: false, isWritable: true }, // token_account_1
//         { pubkey: tokenVault0, isSigner: false, isWritable: true }, // token_vault_0
//         { pubkey: tokenVault1, isSigner: false, isWritable: true }, // token_vault_1
//         { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent sysvar
//         { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system program
//         { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token program
//         { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // associated_token_program
//         { pubkey: METADATA_PROGRAM_ID, isSigner: false, isWritable: false }, // metadata_program
//         { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program_2022
//         { pubkey: tokenMint0, isSigner: false, isWritable: false }, // vault_0_mint
//         { pubkey: tokenMint1, isSigner: false, isWritable: false }, // vault_1_mint
//       ],
//       data: instructionData,
//     });

//     transaction.add(openPositionIx);

//     // Simulate and send transaction
//     console.log("Simulating transaction...");
//     const simulationResult = await connection.simulateTransaction(transaction);
//     console.log("Simulation result:", simulationResult);

//     const signature = await wallet.sendTransaction(transaction, connection, {
//       skipPreflight: true,
//       preflightCommitment: "processed",
//     });
//     console.log("Transaction signature:", signature);
//   } catch (error) {
//     console.error("Error adding liquidity:", error);
//   }
// };


// const handleAddLiquidity = async (pool: PoolItemProps, amount0: number, amount1: number) => {
//   try {
//     console.log("Start handleAddLiquidity");

//     if (!publicKey) {
//       console.error("Wallet not connected");
//       return;
//     }
//     console.log("Wallet connected:", publicKey.toBase58());

//     const programId = new PublicKey("GU2PbowqNvMYpWPa2P5H9gs5pAqRnQtFheR23T5AJtPV");
//     console.log("Program ID:", programId.toBase58());

//     const poolAccountKey = new PublicKey(pool.poolAccount);
//     console.log("Pool account key:", poolAccountKey.toBase58());

//     // Validate pool_state ownership
//     const poolStateInfo = await connection.getAccountInfo(poolAccountKey);
//     if (!poolStateInfo) {
//       throw new Error("pool_state account does not exist.");
//     }

//     console.log("pool_state account owner:", poolStateInfo.owner.toBase58());
//     if (!poolStateInfo.owner.equals(programId)) {
//       throw new Error(
//         `pool_state account is owned by ${poolStateInfo.owner.toBase58()}, expected ${programId.toBase58()}`
//       );
//     }

//     const tokenVault0 = new PublicKey(pool.tokenVault0);
//     const tokenVault1 = new PublicKey(pool.tokenVault1);
//     const tokenMint0 = new PublicKey(pool.tokenMint0);
//     const tokenMint1 = new PublicKey(pool.tokenMint1);

//     const userTokenAccount0 = await getAssociatedTokenAddress(
//       tokenMint0,
//       publicKey,
//       false,
//       TOKEN_PROGRAM_ID
//     );
//     const userTokenAccount1 = await getAssociatedTokenAddress(
//       tokenMint1,
//       publicKey,
//       false,
//       TOKEN_PROGRAM_ID
//     );

//     const [tickArrayLower] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("tick_array"),
//         poolAccountKey.toBuffer(),
//         new BN(-1000).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const [tickArrayUpper] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("tick_array"),
//         poolAccountKey.toBuffer(),
//         new BN(1000).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const [protocolPosition] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("position"),
//         poolAccountKey.toBuffer(),
//         new BN(-1000).toArrayLike(Buffer, "le", 4),
//         new BN(1000).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const [personalPosition] = PublicKey.findProgramAddressSync(
//       [Buffer.from("position"), publicKey.toBuffer(), poolAccountKey.toBuffer()],
//       programId
//     );

//     const [nftMintKey] = PublicKey.findProgramAddressSync(
//       [Buffer.from("position_nft"), publicKey.toBuffer(), poolAccountKey.toBuffer()],
//       programId
//     );

//     const [metadataAccountKey] = PublicKey.findProgramAddressSync(
//       [Buffer.from("metadata"), nftMintKey.toBuffer()],
//       METADATA_PROGRAM_ID
//     );

//     const liquidity = new BN(amount0).mul(new BN(amount1));
//     const amount0Max = new BN(amount0);
//     const amount1Max = new BN(amount1);

//     const transaction = new Transaction();
//     transaction.feePayer = publicKey;

//     // OpenPositionV2 instruction
//     const instructionData = Buffer.concat([
//       Buffer.from(sha256.digest('global:open_position_v2')).slice(0, 8), // Discriminator
//       liquidity.toArrayLike(Buffer, "le", 16), // Liquidity
//       amount0Max.toArrayLike(Buffer, "le", 8), // Max amount for token 0
//       amount1Max.toArrayLike(Buffer, "le", 8), // Max amount for token 1
//       new BN(-1000).toArrayLike(Buffer, "le", 4), // Tick lower index
//       new BN(1000).toArrayLike(Buffer, "le", 4), // Tick upper index
//       new BN(-1000).toArrayLike(Buffer, "le", 4), // Tick array lower start index
//       new BN(1000).toArrayLike(Buffer, "le", 4), // Tick array upper start index
//       Buffer.from([1]), // Metadata flag
//       Buffer.from([0]), // Base flag
//     ]);

//     const openPositionIx = new TransactionInstruction({
//       programId,
//       keys: [
//         { pubkey: publicKey, isSigner: true, isWritable: true }, // payer
//         { pubkey: publicKey, isSigner: false, isWritable: false }, // position_nft_owner
//         { pubkey: nftMintKey, isSigner: false, isWritable: true }, // position_nft_mint
//         { pubkey: metadataAccountKey, isSigner: false, isWritable: true }, // metadata_account
//         { pubkey: poolAccountKey, isSigner: false, isWritable: true }, // pool_state
//         { pubkey: protocolPosition, isSigner: false, isWritable: true }, // protocol_position
//         { pubkey: tickArrayLower, isSigner: false, isWritable: true }, // tick_array_lower
//         { pubkey: tickArrayUpper, isSigner: false, isWritable: true }, // tick_array_upper
//         { pubkey: personalPosition, isSigner: false, isWritable: true }, // personal_position
//         { pubkey: userTokenAccount0, isSigner: false, isWritable: true }, // token_account_0
//         { pubkey: userTokenAccount1, isSigner: false, isWritable: true }, // token_account_1
//         { pubkey: tokenVault0, isSigner: false, isWritable: true }, // token_vault_0
//         { pubkey: tokenVault1, isSigner: false, isWritable: true }, // token_vault_1
//         { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent sysvar
//         { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system program
//         { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token program
//         { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // associated_token_program
//         { pubkey: METADATA_PROGRAM_ID, isSigner: false, isWritable: false }, // metadata_program
//         { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program_2022
//         { pubkey: tokenMint0, isSigner: false, isWritable: false }, // vault_0_mint
//         { pubkey: tokenMint1, isSigner: false, isWritable: false }, // vault_1_mint
//       ],
//       data: instructionData,
//     });

//     transaction.add(openPositionIx);

//     // Simulate and send transaction
//     console.log("Simulating transaction...");
//     const simulationResult = await connection.simulateTransaction(transaction);
//     console.log("Simulation result:", simulationResult);

//     const signature = await wallet.sendTransaction(transaction, connection, {
//       skipPreflight: true,
//       preflightCommitment: "processed",
//     });
//     console.log("Transaction signature:", signature);
//   } catch (error) {
//     console.error("Error adding liquidity:", error);
//   }
// };

  

// const handleAddLiquidity = async (pool: PoolItemProps, amount0: number, amount1: number) => {
//   try {
//     console.log("Start handleAddLiquidity");

//     if (!publicKey) {
//       console.error("Wallet not connected");
//       return;
//     }
//     console.log("Wallet connected:", publicKey.toBase58());

//     const programId = new PublicKey("GU2PbowqNvMYpWPa2P5H9gs5pAqRnQtFheR23T5AJtPV");
//     console.log("Program ID:", programId.toBase58());

//     const poolAccountKey = new PublicKey(pool.poolAccount);
//     console.log("Pool account key:", poolAccountKey.toBase58());

//     // Validate pool_state ownership and reinitialize if necessary
//     const poolStateInfo = await connection.getAccountInfo(poolAccountKey);
//     if (!poolStateInfo) {
//       console.log("pool_state account does not exist. Initializing...");
//       const initPoolStateIx = new TransactionInstruction({
//         programId,
//         keys: [
//           { pubkey: poolAccountKey, isSigner: false, isWritable: true },
//           { pubkey: publicKey, isSigner: true, isWritable: true }, // payer
//           { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
//         ],
//         data: Buffer.alloc(0), // Add any necessary initialization data
//       });

//       const transaction = new Transaction().add(initPoolStateIx);
//       await wallet.sendTransaction(transaction, connection, {
//         skipPreflight: true,
//         preflightCommitment: "processed",
//       });

//       console.log("Initialized pool_state successfully.");
//     } else {
//       console.log("pool_state account exists. Validating ownership...");
//       console.log("pool_state account owner:", poolStateInfo.owner.toBase58());
//       if (!poolStateInfo.owner.equals(programId)) {
//         throw new Error(
//           `pool_state account is owned by ${poolStateInfo.owner.toBase58()}, expected ${programId.toBase58()}`
//         );
//       }
//     }

//     const tokenVault0 = new PublicKey(pool.tokenVault0);
//     const tokenVault1 = new PublicKey(pool.tokenVault1);
//     const tokenMint0 = new PublicKey(pool.tokenMint0);
//     const tokenMint1 = new PublicKey(pool.tokenMint1);

//     const userTokenAccount0 = await getAssociatedTokenAddress(
//       tokenMint0,
//       publicKey,
//       false,
//       TOKEN_PROGRAM_ID
//     );
//     const userTokenAccount1 = await getAssociatedTokenAddress(
//       tokenMint1,
//       publicKey,
//       false,
//       TOKEN_PROGRAM_ID
//     );

//     const [tickArrayLower] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("tick_array"),
//         poolAccountKey.toBuffer(),
//         new BN(-1000).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const [tickArrayUpper] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("tick_array"),
//         poolAccountKey.toBuffer(),
//         new BN(1000).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const [protocolPosition] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("position"),
//         poolAccountKey.toBuffer(),
//         new BN(-1000).toArrayLike(Buffer, "le", 4),
//         new BN(1000).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const [personalPosition] = PublicKey.findProgramAddressSync(
//       [Buffer.from("position"), publicKey.toBuffer(), poolAccountKey.toBuffer()],
//       programId
//     );

//     const [nftMintKey] = PublicKey.findProgramAddressSync(
//       [Buffer.from("position_nft"), publicKey.toBuffer(), poolAccountKey.toBuffer()],
//       programId
//     );

//     const [metadataAccountKey] = PublicKey.findProgramAddressSync(
//       [Buffer.from("metadata"), nftMintKey.toBuffer()],
//       METADATA_PROGRAM_ID
//     );

//     const liquidity = new BN(amount0).mul(new BN(amount1));
//     const amount0Max = new BN(amount0);
//     const amount1Max = new BN(amount1);

//     const transaction = new Transaction();
//     transaction.feePayer = publicKey;

//     // OpenPositionV2 instruction
//     const instructionData = Buffer.concat([
//       Buffer.from(sha256.digest("global:open_position_v2")).slice(0, 8), // Discriminator
//       liquidity.toArrayLike(Buffer, "le", 16), // Liquidity
//       amount0Max.toArrayLike(Buffer, "le", 8), // Max amount for token 0
//       amount1Max.toArrayLike(Buffer, "le", 8), // Max amount for token 1
//       new BN(-1000).toArrayLike(Buffer, "le", 4), // Tick lower index
//       new BN(1000).toArrayLike(Buffer, "le", 4), // Tick upper index
//       new BN(-1000).toArrayLike(Buffer, "le", 4), // Tick array lower start index
//       new BN(1000).toArrayLike(Buffer, "le", 4), // Tick array upper start index
//       Buffer.from([1]), // Metadata flag
//       Buffer.from([0]), // Base flag
//     ]);

//     const openPositionIx = new TransactionInstruction({
//       programId,
//       keys: [
//         { pubkey: publicKey, isSigner: true, isWritable: true }, // payer
//         { pubkey: publicKey, isSigner: false, isWritable: false }, // position_nft_owner
//         { pubkey: nftMintKey, isSigner: false, isWritable: true }, // position_nft_mint
//         { pubkey: metadataAccountKey, isSigner: false, isWritable: true }, // metadata_account
//         { pubkey: poolAccountKey, isSigner: false, isWritable: true }, // pool_state
//         { pubkey: protocolPosition, isSigner: false, isWritable: true }, // protocol_position
//         { pubkey: tickArrayLower, isSigner: false, isWritable: true }, // tick_array_lower
//         { pubkey: tickArrayUpper, isSigner: false, isWritable: true }, // tick_array_upper
//         { pubkey: personalPosition, isSigner: false, isWritable: true }, // personal_position
//         { pubkey: userTokenAccount0, isSigner: false, isWritable: true }, // token_account_0
//         { pubkey: userTokenAccount1, isSigner: false, isWritable: true }, // token_account_1
//         { pubkey: tokenVault0, isSigner: false, isWritable: true }, // token_vault_0
//         { pubkey: tokenVault1, isSigner: false, isWritable: true }, // token_vault_1
//         { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent sysvar
//         { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system program
//         { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token program
//         { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // associated_token_program
//         { pubkey: METADATA_PROGRAM_ID, isSigner: false, isWritable: false }, // metadata_program
//         { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program_2022
//         { pubkey: tokenMint0, isSigner: false, isWritable: false }, // vault_0_mint
//         { pubkey: tokenMint1, isSigner: false, isWritable: false }, // vault_1_mint
//       ],
//       data: instructionData,
//     });

//     transaction.add(openPositionIx);

//     // Simulate and send transaction
//     console.log("Simulating transaction...");
//     const simulationResult = await connection.simulateTransaction(transaction);
//     console.log("Simulation result:", simulationResult);

//     const signature = await wallet.sendTransaction(transaction, connection, {
//       skipPreflight: true,
//       preflightCommitment: "processed",
//     });
//     console.log("Transaction signature:", signature);
//   } catch (error) {
//     console.error("Error adding liquidity:", error);
//   }
// };


// const handleAddLiquidity = async (pool: PoolItemProps, amount0: number, amount1: number) => {
//   try {
//     console.log("Start handleAddLiquidity");

//     if (!publicKey) {
//       console.error("Wallet not connected");
//       return;
//     }
//     console.log("Wallet connected:", publicKey.toBase58());

//     const programId = new PublicKey("GU2PbowqNvMYpWPa2P5H9gs5pAqRnQtFheR23T5AJtPV");
//     console.log("Program ID:", programId.toBase58());

//     const poolAccountKey = new PublicKey(pool.poolAccount);
//     console.log("Pool account key:", poolAccountKey.toBase58());

//     // Validate pool_state ownership
//     const poolStateInfo = await connection.getAccountInfo(poolAccountKey);
//     if (!poolStateInfo) {
//       throw new Error("pool_state account does not exist.");
//     }
//     console.log("pool_state account owner:", poolStateInfo.owner.toBase58());
//     if (!poolStateInfo.owner.equals(programId)) {
//       throw new Error(
//         `pool_state account is owned by ${poolStateInfo.owner.toBase58()}, expected ${programId.toBase58()}`
//       );
//     }

//     const tokenVault0 = new PublicKey(pool.tokenVault0);
//     const tokenVault1 = new PublicKey(pool.tokenVault1);
//     const tokenMint0 = new PublicKey(pool.tokenMint0);
//     const tokenMint1 = new PublicKey(pool.tokenMint1);

//     const userTokenAccount0 = await getAssociatedTokenAddress(
//       tokenMint0,
//       publicKey,
//       false,
//       TOKEN_PROGRAM_ID
//     );
//     const userTokenAccount1 = await getAssociatedTokenAddress(
//       tokenMint1,
//       publicKey,
//       false,
//       TOKEN_PROGRAM_ID
//     );

//     const [tickArrayLower] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("tick_array"),
//         poolAccountKey.toBuffer(),
//         new BN(-1000).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const [tickArrayUpper] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("tick_array"),
//         poolAccountKey.toBuffer(),
//         new BN(1000).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const [protocolPosition] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("position"),
//         poolAccountKey.toBuffer(),
//         new BN(-1000).toArrayLike(Buffer, "le", 4),
//         new BN(1000).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const [personalPosition] = PublicKey.findProgramAddressSync(
//       [Buffer.from("position"), publicKey.toBuffer(), poolAccountKey.toBuffer()],
//       programId
//     );

//     const [nftMintKey] = PublicKey.findProgramAddressSync(
//       [Buffer.from("position_nft"), publicKey.toBuffer(), poolAccountKey.toBuffer()],
//       programId
//     );

//     const nftAta = await getAssociatedTokenAddress(
//       nftMintKey,
//       publicKey,
//       false,
//       TOKEN_PROGRAM_ID
//     );

//     const [metadataAccountKey] = PublicKey.findProgramAddressSync(
//       [Buffer.from("metadata"), nftMintKey.toBuffer()],
//       METADATA_PROGRAM_ID
//     );

//     const [tickArrayBitmap] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("pool_tick_array_bitmap_extension"),
//         poolAccountKey.toBuffer(),
//       ],
//       programId
//     );

//     const liquidity = new BN(amount0).mul(new BN(amount1));
//     const amount0Max = new BN(amount0);
//     const amount1Max = new BN(amount1);

//     const transaction = new Transaction();
//     transaction.feePayer = publicKey;

//     // OpenPositionV2 instruction
//     const instructionData = Buffer.concat([
//       Buffer.from(sha256.digest("global:open_position_v2")).slice(0, 8), // Discriminator
//       liquidity.toArrayLike(Buffer, "le", 16), // Liquidity
//       amount0Max.toArrayLike(Buffer, "le", 8), // Max amount for token 0
//       amount1Max.toArrayLike(Buffer, "le", 8), // Max amount for token 1
//       new BN(-1000).toArrayLike(Buffer, "le", 4), // Tick lower index
//       new BN(1000).toArrayLike(Buffer, "le", 4), // Tick upper index
//       new BN(-1000).toArrayLike(Buffer, "le", 4), // Tick array lower start index
//       new BN(1000).toArrayLike(Buffer, "le", 4), // Tick array upper start index
//       Buffer.from([1]), // Metadata flag
//       Buffer.from([0]), // Base flag
//     ]);

//     const openPositionIx = new TransactionInstruction({
//       programId,
//       keys: [
//         { pubkey: publicKey, isSigner: true, isWritable: true }, // payer
//         { pubkey: publicKey, isSigner: false, isWritable: false }, // position_nft_owner
//         { pubkey: nftMintKey, isSigner: false, isWritable: true }, // position_nft_mint
//         { pubkey: nftAta, isSigner: false, isWritable: true }, // position_nft_account
//         { pubkey: metadataAccountKey, isSigner: false, isWritable: true }, // metadata_account
//         { pubkey: poolAccountKey, isSigner: false, isWritable: true }, // pool_state
//         { pubkey: protocolPosition, isSigner: false, isWritable: true }, // protocol_position
//         { pubkey: tickArrayLower, isSigner: false, isWritable: true }, // tick_array_lower
//         { pubkey: tickArrayUpper, isSigner: false, isWritable: true }, // tick_array_upper
//         { pubkey: personalPosition, isSigner: false, isWritable: true }, // personal_position
//         { pubkey: userTokenAccount0, isSigner: false, isWritable: true }, // token_account_0
//         { pubkey: userTokenAccount1, isSigner: false, isWritable: true }, // token_account_1
//         { pubkey: tokenVault0, isSigner: false, isWritable: true }, // token_vault_0
//         { pubkey: tokenVault1, isSigner: false, isWritable: true }, // token_vault_1
//         { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent sysvar
//         { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system program
//         { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token program
//         { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // associated_token_program
//         { pubkey: METADATA_PROGRAM_ID, isSigner: false, isWritable: false }, // metadata_program
//         { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program_2022
//         { pubkey: tokenMint0, isSigner: false, isWritable: false }, // vault_0_mint
//         { pubkey: tokenMint1, isSigner: false, isWritable: false }, // vault_1_mint
//         { pubkey: tickArrayBitmap, isSigner: false, isWritable: true }, // tick_array_bitmap_extension
//       ],
//       data: instructionData,
//     });

//     transaction.add(openPositionIx);

//     // Simulate and send transaction
//     console.log("Simulating transaction...");
//     const simulationResult = await connection.simulateTransaction(transaction);
//     console.log("Simulation result:", simulationResult);

//     const signature = await wallet.sendTransaction(transaction, connection, {
//       skipPreflight: true,
//       preflightCommitment: "processed",
//     });
//     console.log("Transaction signature:", signature);
//   } catch (error) {
//     console.error("Error adding liquidity:", error);
//   }
// };



// const handleAddLiquidity = async (pool: PoolItemProps, amount0: number, amount1: number) => {
//   try {
//     console.log("Start handleAddLiquidity");

//     if (!publicKey) {
//       console.error("Wallet not connected");
//       return;
//     }
//     console.log("Wallet connected:", publicKey.toBase58());

//     const programId = new PublicKey("GU2PbowqNvMYpWPa2P5H9gs5pAqRnQtFheR23T5AJtPV");
//     console.log("Program ID:", programId.toBase58());

//     const poolAccountKey = new PublicKey(pool.poolAccount);
//     const tokenVault0 = new PublicKey(pool.tokenVault0);
//     const tokenVault1 = new PublicKey(pool.tokenVault1);
//     const tokenMint0 = new PublicKey(pool.tokenMint0);
//     const tokenMint1 = new PublicKey(pool.tokenMint1);

//     const transaction = new Transaction();
//     transaction.feePayer = publicKey;

//     // Check and initialize token_vault_0
//     const tokenVault0Info = await connection.getAccountInfo(tokenVault0);
//     if (!tokenVault0Info) {
//       console.log("Initializing token_vault_0...");
//       transaction.add(
//         SystemProgram.createAccount({
//           fromPubkey: publicKey,
//           newAccountPubkey: tokenVault0,
//           lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
//           space: AccountLayout.span,
//           programId: TOKEN_PROGRAM_ID,
//         })
//       );
//       transaction.add(
//         createInitializeAccountInstruction(
//           tokenVault0,
//           tokenMint0,
//           poolAccountKey,
//           TOKEN_PROGRAM_ID
//         )
//       );
//     }

//     // Check and initialize token_vault_1
//     const tokenVault1Info = await connection.getAccountInfo(tokenVault1);
//     if (!tokenVault1Info) {
//       console.log("token_vault_1 does not exist. Initializing...");
//       transaction.add(
//         SystemProgram.createAccount({
//           fromPubkey: publicKey,
//           newAccountPubkey: tokenVault1,
//           lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
//           space: AccountLayout.span,
//           programId: TOKEN_PROGRAM_ID,
//         })
//       );
//       transaction.add(
//         createInitializeAccountInstruction(
//           tokenVault1,
//           tokenMint1,
//           poolAccountKey, // Set the correct owner (PDA)
//           TOKEN_PROGRAM_ID
//         )
//       );
//     } else {
//       console.log("token_vault_1 exists. Validating ownership...");
//       if (!tokenVault1Info.owner.equals(poolAccountKey)) {
//         throw new Error(
//           `token_vault_1 is owned by ${tokenVault1Info.owner.toBase58()}, expected ${poolAccountKey.toBase58()}. Reinitialize token_vault_1.`
//         );
//       }
//     }

//     const userTokenAccount0 = await getAssociatedTokenAddress(
//       tokenMint0,
//       publicKey,
//       false,
//       TOKEN_PROGRAM_ID
//     );
//     const userTokenAccount1 = await getAssociatedTokenAddress(
//       tokenMint1,
//       publicKey,
//       false,
//       TOKEN_PROGRAM_ID
//     );

//     const [tickArrayLower] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("tick_array"),
//         poolAccountKey.toBuffer(),
//         new BN(-1000).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const [tickArrayUpper] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("tick_array"),
//         poolAccountKey.toBuffer(),
//         new BN(1000).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const [protocolPosition] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("position"),
//         poolAccountKey.toBuffer(),
//         new BN(-1000).toArrayLike(Buffer, "le", 4),
//         new BN(1000).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const [personalPosition] = PublicKey.findProgramAddressSync(
//       [Buffer.from("position"), publicKey.toBuffer(), poolAccountKey.toBuffer()],
//       programId
//     );

//     const [nftMintKey] = PublicKey.findProgramAddressSync(
//       [Buffer.from("position_nft"), publicKey.toBuffer(), poolAccountKey.toBuffer()],
//       programId
//     );

//     const nftAta = await getAssociatedTokenAddress(
//       nftMintKey,
//       publicKey,
//       false,
//       TOKEN_PROGRAM_ID
//     );

//     const [metadataAccountKey] = PublicKey.findProgramAddressSync(
//       [Buffer.from("metadata"), nftMintKey.toBuffer()],
//       METADATA_PROGRAM_ID
//     );

//     // Validate metadata account
//     const metadataAccountInfo = await connection.getAccountInfo(metadataAccountKey);
//     if (!metadataAccountInfo) {
//       throw new Error(`Metadata account ${metadataAccountKey.toBase58()} does not exist.`);
//     }
//     if (!metadataAccountInfo.owner.equals(METADATA_PROGRAM_ID)) {
//       throw new Error(
//         `Metadata account ${metadataAccountKey.toBase58()} is owned by ${metadataAccountInfo.owner.toBase58()}, expected ${METADATA_PROGRAM_ID.toBase58()}.`
//       );
//     }

//     const liquidity = new BN(amount0).mul(new BN(amount1));
//     const amount0Max = new BN(amount0);
//     const amount1Max = new BN(amount1);

//     const instructionData = Buffer.concat([
//       Buffer.from(sha256.digest("global:open_position_v2")).slice(0, 8), // Discriminator
//       liquidity.toArrayLike(Buffer, "le", 16), // Liquidity
//       amount0Max.toArrayLike(Buffer, "le", 8), // Max amount for token 0
//       amount1Max.toArrayLike(Buffer, "le", 8), // Max amount for token 1
//       new BN(-1000).toArrayLike(Buffer, "le", 4), // Tick lower index
//       new BN(1000).toArrayLike(Buffer, "le", 4), // Tick upper index
//       new BN(-1000).toArrayLike(Buffer, "le", 4), // Tick array lower start index
//       new BN(1000).toArrayLike(Buffer, "le", 4), // Tick array upper start index
//       Buffer.from([1]), // Metadata flag
//       Buffer.from([0]), // Base flag
//     ]);

//     const openPositionIx = new TransactionInstruction({
//       programId,
//       keys: [
//         { pubkey: publicKey, isSigner: true, isWritable: true }, // payer
//         { pubkey: publicKey, isSigner: false, isWritable: false }, // position_nft_owner
//         { pubkey: nftMintKey, isSigner: false, isWritable: true }, // position_nft_mint
//         { pubkey: nftAta, isSigner: false, isWritable: true }, // position_nft_account
//         { pubkey: metadataAccountKey, isSigner: false, isWritable: true }, // metadata_account
//         { pubkey: poolAccountKey, isSigner: false, isWritable: true }, // pool_state
//         { pubkey: protocolPosition, isSigner: false, isWritable: true }, // protocol_position
//         { pubkey: tickArrayLower, isSigner: false, isWritable: true }, // tick_array_lower
//         { pubkey: tickArrayUpper, isSigner: false, isWritable: true }, // tick_array_upper
//         { pubkey: personalPosition, isSigner: false, isWritable: true }, // personal_position
//         { pubkey: userTokenAccount0, isSigner: false, isWritable: true }, // token_account_0
//         { pubkey: userTokenAccount1, isSigner: false, isWritable: true }, // token_account_1
//         { pubkey: tokenVault0, isSigner: false, isWritable: true }, // token_vault_0
//         { pubkey: tokenVault1, isSigner: false, isWritable: true }, // token_vault_1
//         { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent sysvar
//         { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system program
//         { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token program
//         { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // associated_token_program
//         { pubkey: METADATA_PROGRAM_ID, isSigner: false, isWritable: false }, // metadata_program
//         { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program_2022
//         { pubkey: tokenMint0, isSigner: false, isWritable: false }, // vault_0_mint
//         { pubkey: tokenMint1, isSigner: false, isWritable: false }, // vault_1_mint
//       ],
//       data: instructionData,
//     });

//     transaction.add(openPositionIx);

//     // Simulate and send transaction
//     console.log("Simulating transaction...");
//     const simulationResult = await connection.simulateTransaction(transaction);
//     console.log("Simulation result:", simulationResult);

//     const signature = await wallet.sendTransaction(transaction, connection, {
//       skipPreflight: false,
//       preflightCommitment: "processed",
//     });
//     console.log("Transaction signature:", signature);
//   } catch (error) {
//     console.error("Error adding liquidity:", error);
//   }
// };


// const handleAddLiquidity = async (pool: PoolItemProps, amount0: number, amount1: number) => {
//   try {
//     console.log("Start handleAddLiquidity");

//     if (!publicKey) {
//       console.error("Wallet not connected");
//       return;
//     }
//     console.log("Wallet connected:", publicKey.toBase58());

//     const programId = new PublicKey("GU2PbowqNvMYpWPa2P5H9gs5pAqRnQtFheR23T5AJtPV");
//     console.log("Program ID:", programId.toBase58());

//     const poolAccountKey = new PublicKey(pool.poolAccount);
//     const tokenVault0 = new PublicKey(pool.tokenVault0);
//     const tokenVault1 = new PublicKey(pool.tokenVault1);
//     const tokenMint0 = new PublicKey(pool.tokenMint0);
//     const tokenMint1 = new PublicKey(pool.tokenMint1);

//     const transaction = new Transaction();
//     transaction.feePayer = publicKey;

//     // Check and initialize token_vault_0
//     const tokenVault0Info = await connection.getAccountInfo(tokenVault0);
//     if (!tokenVault0Info) {
//       console.log("Initializing token_vault_0...");
//       transaction.add(
//         SystemProgram.createAccount({
//           fromPubkey: publicKey,
//           newAccountPubkey: tokenVault0,
//           lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
//           space: AccountLayout.span,
//           programId: TOKEN_PROGRAM_ID,
//         })
//       );
//       transaction.add(
//         createInitializeAccountInstruction(
//           tokenVault0,
//           tokenMint0,
//           poolAccountKey,
//           TOKEN_PROGRAM_ID
//         )
//       );
//     }

//     // Check and initialize token_vault_1
//     const tokenVault1Info = await connection.getAccountInfo(tokenVault1);
//     if (!tokenVault1Info) {
//       console.log("token_vault_1 does not exist. Initializing...");
//       transaction.add(
//         SystemProgram.createAccount({
//           fromPubkey: publicKey,
//           newAccountPubkey: tokenVault1,
//           lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
//           space: AccountLayout.span,
//           programId: TOKEN_PROGRAM_ID,
//         })
//       );
//       transaction.add(
//         createInitializeAccountInstruction(
//           tokenVault1,
//           tokenMint1,
//           poolAccountKey, // Set the correct owner (PDA)
//           TOKEN_PROGRAM_ID
//         )
//       );
//     } else {
//       console.log("token_vault_1 exists. Validating ownership...");
//       if (!tokenVault1Info.owner.equals(poolAccountKey)) {
//         throw new Error(
//           `token_vault_1 is owned by ${tokenVault1Info.owner.toBase58()}, expected ${poolAccountKey.toBase58()}. Reinitialize token_vault_1.`
//         );
//       }
//     }

//     const userTokenAccount0 = await getAssociatedTokenAddress(
//       tokenMint0,
//       publicKey,
//       false,
//       TOKEN_PROGRAM_ID
//     );
//     const userTokenAccount1 = await getAssociatedTokenAddress(
//       tokenMint1,
//       publicKey,
//       false,
//       TOKEN_PROGRAM_ID
//     );

//     const [tickArrayLower] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("tick_array"),
//         poolAccountKey.toBuffer(),
//         new BN(-1000).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const [tickArrayUpper] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("tick_array"),
//         poolAccountKey.toBuffer(),
//         new BN(1000).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const [protocolPosition] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("position"),
//         poolAccountKey.toBuffer(),
//         new BN(-1000).toArrayLike(Buffer, "le", 4),
//         new BN(1000).toArrayLike(Buffer, "le", 4),
//       ],
//       programId
//     );

//     const [personalPosition] = PublicKey.findProgramAddressSync(
//       [Buffer.from("position"), publicKey.toBuffer(), poolAccountKey.toBuffer()],
//       programId
//     );

//     const [nftMintKey] = PublicKey.findProgramAddressSync(
//       [Buffer.from("position_nft"), publicKey.toBuffer(), poolAccountKey.toBuffer()],
//       programId
//     );

//     const nftAta = await getAssociatedTokenAddress(
//       nftMintKey,
//       publicKey,
//       false,
//       TOKEN_PROGRAM_ID
//     );

//     const [metadataAccountKey] = PublicKey.findProgramAddressSync(
//       [Buffer.from("metadata"), nftMintKey.toBuffer()],
//       METADATA_PROGRAM_ID
//     );

//     // Validate metadata account
//     const metadataAccountInfo = await connection.getAccountInfo(metadataAccountKey);
//     if (!metadataAccountInfo) {
//       throw new Error(`Metadata account ${metadataAccountKey.toBase58()} does not exist.`);
//     }
//     if (!metadataAccountInfo.owner.equals(METADATA_PROGRAM_ID)) {
//       throw new Error(
//         `Metadata account ${metadataAccountKey.toBase58()} is owned by ${metadataAccountInfo.owner.toBase58()}, expected ${METADATA_PROGRAM_ID.toBase58()}.`
//       );
//     }

//     const liquidity = new BN(amount0).mul(new BN(amount1));
//     const amount0Max = new BN(amount0);
//     const amount1Max = new BN(amount1);

//     const instructionData = Buffer.concat([
//       Buffer.from(sha256.digest("global:open_position_v2")).slice(0, 8), // Discriminator
//       liquidity.toArrayLike(Buffer, "le", 16), // Liquidity
//       amount0Max.toArrayLike(Buffer, "le", 8), // Max amount for token 0
//       amount1Max.toArrayLike(Buffer, "le", 8), // Max amount for token 1
//       new BN(-1000).toArrayLike(Buffer, "le", 4), // Tick lower index
//       new BN(1000).toArrayLike(Buffer, "le", 4), // Tick upper index
//       new BN(-1000).toArrayLike(Buffer, "le", 4), // Tick array lower start index
//       new BN(1000).toArrayLike(Buffer, "le", 4), // Tick array upper start index
//       Buffer.from([1]), // Metadata flag
//       Buffer.from([0]), // Base flag
//     ]);

//     const openPositionIx = new TransactionInstruction({
//       programId,
//       keys: [
//         { pubkey: publicKey, isSigner: true, isWritable: true }, // payer
//         { pubkey: publicKey, isSigner: false, isWritable: false }, // position_nft_owner
//         { pubkey: nftMintKey, isSigner: false, isWritable: true }, // position_nft_mint
//         { pubkey: nftAta, isSigner: false, isWritable: true }, // position_nft_account
//         { pubkey: metadataAccountKey, isSigner: false, isWritable: true }, // metadata_account
//         { pubkey: poolAccountKey, isSigner: false, isWritable: true }, // pool_state
//         { pubkey: protocolPosition, isSigner: false, isWritable: true }, // protocol_position
//         { pubkey: tickArrayLower, isSigner: false, isWritable: true }, // tick_array_lower
//         { pubkey: tickArrayUpper, isSigner: false, isWritable: true }, // tick_array_upper
//         { pubkey: personalPosition, isSigner: false, isWritable: true }, // personal_position
//         { pubkey: userTokenAccount0, isSigner: false, isWritable: true }, // token_account_0
//         { pubkey: userTokenAccount1, isSigner: false, isWritable: true }, // token_account_1
//         { pubkey: tokenVault0, isSigner: false, isWritable: true }, // token_vault_0
//         { pubkey: tokenVault1, isSigner: false, isWritable: true }, // token_vault_1
//         { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent sysvar
//         { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system program
//         { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token program
//         { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // associated_token_program
//         { pubkey: METADATA_PROGRAM_ID, isSigner: false, isWritable: false }, // metadata_program
//         { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program_2022
//         { pubkey: tokenMint0, isSigner: false, isWritable: false }, // vault_0_mint
//         { pubkey: tokenMint1, isSigner: false, isWritable: false }, // vault_1_mint
//       ],
//       data: instructionData,
//     });

//     transaction.add(openPositionIx);

//     // Simulate and send transaction
//     console.log("Simulating transaction...");
//     const simulationResult = await connection.simulateTransaction(transaction);
//     console.log("Simulation result:", simulationResult);

//     const signature = await wallet.sendTransaction(transaction, connection, {
//       skipPreflight: false,
//       preflightCommitment: "processed",
//     });
//     console.log("Transaction signature:", signature);
//   } catch (error) {
//     console.error("Error adding liquidity:", error);
//   }
// };


const handleAddLiquidity = async (pool: PoolItemProps, amount0: number, amount1: number) => {
  try {
    console.log("Start handleAddLiquidity");

    if (!publicKey) {
      console.error("Wallet not connected");
      return;
    }
    console.log("Wallet connected:", publicKey.toBase58());

    const programId = new PublicKey("GU2PbowqNvMYpWPa2P5H9gs5pAqRnQtFheR23T5AJtPV");
    console.log("Program ID:", programId.toBase58());

    const poolAccountKey = new PublicKey(pool.poolAccount);
    const tokenVault0 = new PublicKey(pool.tokenVault0);
    const tokenVault1 = new PublicKey(pool.tokenVault1);
    const tokenMint0 = new PublicKey(pool.tokenMint0);
    const tokenMint1 = new PublicKey(pool.tokenMint1);

    const transaction = new Transaction();
    transaction.feePayer = publicKey;

    // Check and initialize token_vault_0
    const tokenVault0Info = await connection.getAccountInfo(tokenVault0);
    if (!tokenVault0Info) {
      console.log("Initializing token_vault_0...");
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: tokenVault0,
          lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
          space: AccountLayout.span,
          programId: TOKEN_PROGRAM_ID,
        })
      );
      transaction.add(
        createInitializeAccountInstruction(
          tokenVault0,
          tokenMint0,
          poolAccountKey,
          TOKEN_PROGRAM_ID
        )
      );
    }

    // Check and initialize token_vault_1
    const tokenVault1Info = await connection.getAccountInfo(tokenVault1);
    if (!tokenVault1Info) {
      console.log("token_vault_1 does not exist. Initializing...");
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: tokenVault1,
          lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
          space: AccountLayout.span,
          programId: TOKEN_PROGRAM_ID,
        })
      );
      transaction.add(
        createInitializeAccountInstruction(
          tokenVault1,
          tokenMint1,
          poolAccountKey, // Set the correct owner (PDA)
          TOKEN_PROGRAM_ID
        )
      );
    } else {
      console.log("token_vault_1 exists. Validating ownership...");
      if (!tokenVault1Info.owner.equals(poolAccountKey)) {
        throw new Error(
          `token_vault_1 is owned by ${tokenVault1Info.owner.toBase58()}, expected ${poolAccountKey.toBase58()}. Reinitialize token_vault_1.`
        );
      }
    }

    const userTokenAccount0 = await getAssociatedTokenAddress(
      tokenMint0,
      publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    const userTokenAccount1 = await getAssociatedTokenAddress(
      tokenMint1,
      publicKey,
      false,
      TOKEN_PROGRAM_ID
    );

    const [tickArrayLower] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("tick_array"),
        poolAccountKey.toBuffer(),
        new BN(-1000).toArrayLike(Buffer, "le", 4),
      ],
      programId
    );

    const [tickArrayUpper] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("tick_array"),
        poolAccountKey.toBuffer(),
        new BN(1000).toArrayLike(Buffer, "le", 4),
      ],
      programId
    );

    const [protocolPosition] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("position"),
        poolAccountKey.toBuffer(),
        new BN(-1000).toArrayLike(Buffer, "le", 4),
        new BN(1000).toArrayLike(Buffer, "le", 4),
      ],
      programId
    );

    const [personalPosition] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), publicKey.toBuffer(), poolAccountKey.toBuffer()],
      programId
    );

    const [nftMintKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("position_nft"), publicKey.toBuffer(), poolAccountKey.toBuffer()],
      programId
    );

    const nftAta = await getAssociatedTokenAddress(
      nftMintKey,
      publicKey,
      false,
      TOKEN_PROGRAM_ID
    );

    const [metadataAccountKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), nftMintKey.toBuffer()],
      METADATA_PROGRAM_ID
    );

    // Check and initialize metadata account
    const metadataAccountInfo = await connection.getAccountInfo(metadataAccountKey);
    if (!metadataAccountInfo) {
      console.log(`Metadata account ${metadataAccountKey.toBase58()} does not exist. Skipping creation since it's handled by the program.`);
    } else if (!metadataAccountInfo.owner.equals(METADATA_PROGRAM_ID)) {
      throw new Error(
        `Metadata account ${metadataAccountKey.toBase58()} is owned by ${metadataAccountInfo.owner.toBase58()}, expected ${METADATA_PROGRAM_ID.toBase58()}.`
      );
    }

    const liquidity = new BN(amount0).mul(new BN(amount1));
    const amount0Max = new BN(amount0);
    const amount1Max = new BN(amount1);

    const instructionData = Buffer.concat([
      Buffer.from(sha256.digest("global:open_position_v2")).slice(0, 8), // Discriminator
      liquidity.toArrayLike(Buffer, "le", 16), // Liquidity
      amount0Max.toArrayLike(Buffer, "le", 8), // Max amount for token 0
      amount1Max.toArrayLike(Buffer, "le", 8), // Max amount for token 1
      
      
      new BN(-1000).toArrayLike(Buffer, "le", 4), // Tick lower index
      new BN(1000).toArrayLike(Buffer, "le", 4), // Tick upper index
      new BN(-1000).toArrayLike(Buffer, "le", 4), // Tick array lower start index
      new BN(1000).toArrayLike(Buffer, "le", 4), // Tick array upper start index

      Buffer.from([1]), // Metadata flag
      Buffer.from([0]), // Base flag
    ]);

    console.log("METADATA_PROGRAM_ID: ", METADATA_PROGRAM_ID.toBase58())

    console.log("Accounts being used in the transaction:");
    console.log("Public Key (Payer):", publicKey.toBase58());
    console.log("Pool Account Key:", poolAccountKey.toBase58());
    console.log("Token Vault 0:", tokenVault0.toBase58());
    console.log("Token Vault 1:", tokenVault1.toBase58());
    console.log("Token Mint 0:", tokenMint0.toBase58());
    console.log("Token Mint 1:", tokenMint1.toBase58());
    console.log("User Token Account 0:", userTokenAccount0.toBase58());
    console.log("User Token Account 1:", userTokenAccount1.toBase58());
    console.log("Tick Array Lower:", tickArrayLower.toBase58());
    console.log("Tick Array Upper:", tickArrayUpper.toBase58());
    console.log("Protocol Position:", protocolPosition.toBase58());
    console.log("Personal Position:", personalPosition.toBase58());
    console.log("NFT Mint Key:", nftMintKey.toBase58());
    console.log("NFT Associated Token Account:", nftAta.toBase58());
    console.log("Metadata Account Key:", metadataAccountKey.toBase58());

    
    const openPositionIx = new TransactionInstruction({    
      programId,
      keys: [
        { pubkey: publicKey, isSigner: true, isWritable: true }, // payer
        { pubkey: publicKey, isSigner: false, isWritable: false }, // position_nft_owner
        { pubkey: nftMintKey, isSigner: true, isWritable: true }, // position_nft_mint
        { pubkey: nftAta, isSigner: false, isWritable: true }, // position_nft_account
        { pubkey: metadataAccountKey, isSigner: false, isWritable: false }, // metadata_account
        { pubkey: poolAccountKey, isSigner: false, isWritable: true }, // pool_state
        { pubkey: protocolPosition, isSigner: false, isWritable: true }, // protocol_position
        { pubkey: tickArrayLower, isSigner: false, isWritable: true }, // tick_array_lower
        { pubkey: tickArrayUpper, isSigner: false, isWritable: true }, // tick_array_upper
        { pubkey: personalPosition, isSigner: false, isWritable: true }, // personal_position
        { pubkey: userTokenAccount0, isSigner: false, isWritable: true }, // token_account_0
        { pubkey: userTokenAccount1, isSigner: false, isWritable: true }, // token_account_1
        { pubkey: tokenVault0, isSigner: false, isWritable: true }, // token_vault_0
        { pubkey: tokenVault1, isSigner: false, isWritable: true }, // token_vault_1
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent sysvar
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system program
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token program
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // associated_token_program
        { pubkey: METADATA_PROGRAM_ID, isSigner: false, isWritable: false }, // metadata_program
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program_2022
        { pubkey: tokenMint0, isSigner: false, isWritable: false }, // vault_0_mint
        { pubkey: tokenMint1, isSigner: false, isWritable: false }, // vault_1_mint
      ],
      data: instructionData,
    });

    transaction.add(openPositionIx);

    // Simulate and send transaction
    console.log("Simulating transaction...");
    const simulationResult = await connection.simulateTransaction(transaction);
    console.log("Simulation result:", simulationResult);

    const signature = await wallet.sendTransaction(transaction, connection, {
      skipPreflight: false,
      preflightCommitment: "processed",
    });
    console.log("Transaction signature:", signature);
  } catch (error) {
    console.error("Error adding liquidity:", error);
  }
};



  /////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////
  
  const findUserTokenAccount = async (
    owner: PublicKey,
    mint: PublicKey
  ): Promise<PublicKey> => {
    const [associatedTokenAccount] = await PublicKey.findProgramAddress(
      [
        owner.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
      
    );
    return associatedTokenAccount;
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
            <PoolList 
              pools={pools} 
              handleAddLiquidity={handleAddLiquidity}
              onOpenDepositModal={handleOpenDepositModal}
            />
          </div>
        </div>
        <CreateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} handleCreateAmmConfig={handleCreateAmmConfig} handleCreatePool={handleCreatePool} />
        {isDepositModalOpen && selectedPool && (
          <DepositeModal
            isOpen={isDepositModalOpen}
            onClose={handleCloseDepositModal}
            pool={selectedPool}
            handleAddLiquidity={handleAddLiquidity}
          />
        )}
      </div>
    </div>
  )
}