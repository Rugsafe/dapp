import { useState, useEffect } from 'react';
import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { UserPositions, Side } from '../types';
import { fetchUserPositions } from '../utils/solanaUtils';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { LOCALHOST_URL, getConnectionUrl, PERP_CONTRACT_PROGRAM_ID, COLLATERAL_MINT, MAX_POSITIONS } from '../constants';

export const useSolanaProgram = () => {
    const [userPositions, setUserPositions] = useState<UserPositions | null>(null);
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);  // Track loading state for UI feedback
    const wallet = useWallet();
    const connection = new Connection(getConnectionUrl(), 'confirmed');

    // Fetch positions and balance once the wallet is connected
    useEffect(() => {
        if (wallet.publicKey) {
            fetchUserData();
        }
    }, [wallet.publicKey]);

    // Function to fetch both user positions and balance
    const fetchUserData = async () => {
        if (!wallet.publicKey) return;
        setLoading(true);
        try {
            await Promise.all([fetchPositions(), fetchBalance()]);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch user positions
    const fetchPositions = async () => {
        if (!wallet.publicKey) return;
        try {
            const [userPositionsPDA] = await PublicKey.findProgramAddress(
                [Buffer.from('user_positions'), wallet.publicKey.toBuffer()],
                new PublicKey(PERP_CONTRACT_PROGRAM_ID)
            );
            const positions = await fetchUserPositions(connection, userPositionsPDA);
            setUserPositions(positions);
        } catch (error) {
            console.error('Error fetching positions:', error);
        }
    };

    // Fetch SOL balance of the wallet
    const fetchBalance = async () => {
        if (!wallet.publicKey) return;
        try {
            const lamports = await connection.getBalance(wallet.publicKey);
            setBalance(lamports / 1e9);  // Convert from lamports to SOL
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    };

    // Function to place an order and open a position
    // const placeOrder = async (side: Side, size: number, symbol: string) => {
    //     if (!wallet.publicKey || !wallet.signTransaction) return;
    //     if (isNaN(size) || size <= 0) {
    //         throw new Error('Invalid order size');
    //     }
    
    //     try {
    //         setLoading(true);
    
    //         const programId = new PublicKey(PERP_CONTRACT_PROGRAM_ID);
    //         const collateralMint = new PublicKey(COLLATERAL_MINT);
    
    //         // Custody account associated with the program
    //         const custodyAccount = await getAssociatedTokenAddress(collateralMint, programId);
    //         console.log('Custody Account:', custodyAccount.toBase58());
    
    //         // User's associated token account for the collateral mint
    //         const userTokenAccount = await getAssociatedTokenAddress(collateralMint, wallet.publicKey);
    //         console.log('User Token Account:', userTokenAccount.toBase58());
    
    //         // Derive the User Positions PDA
    //         const [userPositionsPDA] = await PublicKey.findProgramAddress(
    //             [Buffer.from('user_positions'), wallet.publicKey.toBuffer()],
    //             programId
    //         );
    
    //         // Get next position index
    //         const nextPositionIndex = userPositions ? userPositions.next_position_idx : 0;
    
    //         // Derive the Position PDA
    //         const [positionPDA] = await PublicKey.findProgramAddress(
    //             [Buffer.from('position'), wallet.publicKey.toBuffer(), Buffer.from(nextPositionIndex.toString())],
    //             programId
    //         );
    
    //         // Prepare instruction data
    //         const instructionData = Buffer.alloc(11);
    //         instructionData.writeUInt8(1, 0); // Module tag
    //         instructionData.writeUInt8(0, 1); // Instruction tag
    //         instructionData.writeUInt8(side === Side.Long ? 0 : 1, 2); // Side byte
    //         instructionData.writeBigUInt64LE(BigInt(size), 3);  // Amount as u64 (little-endian)
    
    //         // Aligning accounts to match Rust test:
    //         const instruction = new TransactionInstruction({
    //             keys: [
    //                 { pubkey: wallet.publicKey, isSigner: true, isWritable: true },  // Payer (user)
    //                 { pubkey: userPositionsPDA, isSigner: false, isWritable: true }, // User's positions PDA
    //                 { pubkey: userTokenAccount, isSigner: false, isWritable: true }, // User's collateral token account
    //                 { pubkey: collateralMint, isSigner: false, isWritable: false },  // Collateral mint
    //                 { pubkey: custodyAccount, isSigner: false, isWritable: true },   // Custody token account
    //                 { pubkey: positionPDA, isSigner: false, isWritable: true },      // Position PDA
    //                 { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // System Program
    //                 { pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), isSigner: false, isWritable: false }, // SPL Token Program
    //                 { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },  // Rent sysvar
    //                 { pubkey: new PublicKey('ATokenQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), isSigner: false, isWritable: false },  // Associated token program
    //             ],
    //             programId,
    //             data: instructionData,
    //         });
    
    //         // Transaction handling
    //         const transaction = new Transaction().add(instruction);
    //         transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    //         transaction.feePayer = wallet.publicKey;
    
    //         const signedTransaction = await wallet.signTransaction(transaction);
    //         const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    //         console.log('Transaction signature:', signature);
    
    //         await connection.confirmTransaction(signature, 'confirmed');
    //         console.log('Order placed successfully.');
    
    //         await fetchUserData();
    //     } catch (error) {
    //         console.error('Error placing order:', error);
    //         throw error;
    //     } finally {
    //         setLoading(false);
    //     }
    // };


const placeOrder = async (side: Side, size: number, symbol: string) => {
    if (!wallet.publicKey || !wallet.signTransaction) return;
    if (isNaN(size) || size <= 0) {
        throw new Error('Invalid order size');
    }

    try {
        setLoading(true);

        const programId = new PublicKey(PERP_CONTRACT_PROGRAM_ID);
        const collateralMint = new PublicKey(COLLATERAL_MINT);

        // Derive the Custody Account for the collateral mint (associated token account)
        const custodyAccount = await getAssociatedTokenAddress(collateralMint, programId);
        console.log('Custody Account:', custodyAccount.toBase58());

        // Derive the user's associated token account for the collateral mint
        const userTokenAccount = await getAssociatedTokenAddress(collateralMint, wallet.publicKey);
        console.log('User Token Account:', userTokenAccount.toBase58());

        // Derive the User Positions PDA
        const [userPositionsPDA] = await PublicKey.findProgramAddress(
            [Buffer.from('user_positions'), wallet.publicKey.toBuffer()],
            programId
        );

        // Get the next position index from userPositions or set it to 0 if none exists
        const nextPositionIndex = userPositions ? userPositions.next_position_idx : 0;

        // Derive the Position PDA for the new position
        const [positionPDA] = await PublicKey.findProgramAddress(
            [Buffer.from('position'), wallet.publicKey.toBuffer(), Buffer.from(nextPositionIndex.toString())],
            programId
        );

        // Create the instruction data for the OpenPosition call
        // const instructionData = Buffer.alloc(11);
        // instructionData.writeUInt8(0, 0); // Module tag for Perpetuals
        // instructionData.writeUInt8(0, 1); // Instruction tag for OpenPosition
        // instructionData.writeUInt8(side === Side.Long ? 0 : 1, 2); // Side byte: 0 for Long, 1 for Short
        // instructionData.writeBigUInt64LE(BigInt(size), 3);  // Amount as u64 in little-endian (8 bytes)

        // Create the instruction data for the OpenPosition call (11 bytes)
        const instructionData = Buffer.alloc(11);

        // Module tag (byte 0)
        instructionData.writeUInt8(0, 0); // Module tag for Perpetuals (replace with actual tag)

        // Instruction tag (byte 1)
        instructionData.writeUInt8(0, 1); // Instruction tag for OpenPosition (replace with actual tag)

        // Side: Long or Short (byte 2)
        instructionData.writeUInt8(side === Side.Long ? 1 : 2, 2); // 1 for Long, 2 for Short

        // Amount (size) as u64 in little-endian format (bytes 3 to 10)
        instructionData.writeBigUInt64LE(BigInt(size), 3);

        // Ensure account order matches the Rust test!
        console.log(programId.toBase58())
        const instruction = new TransactionInstruction({
            keys: [
                // { pubkey: wallet.publicKey, isSigner: true, isWritable: true },  // Payer (user)
                // { pubkey: userPositionsPDA, isSigner: false, isWritable: true }, // User's positions PDA
                // { pubkey: userTokenAccount, isSigner: false, isWritable: true }, // User's collateral token account
                // { pubkey: collateralMint, isSigner: false, isWritable: true },  // Collateral mint (readonly)
                // { pubkey: custodyAccount, isSigner: false, isWritable: true },   // Custody token account
                // { pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), isSigner: false, isWritable: true }, // SPL Token Program
                // { pubkey: SystemProgram.programId, isSigner: false, isWritable: true }, // System Program
                // { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: true },  // Rent sysvar
                // { pubkey: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'), isSigner: false, isWritable: true },  // Associated token program
                // { pubkey: programId, isSigner: false, isWritable: true }, // **Missing program ID**
                // { pubkey: positionPDA, isSigner: false, isWritable: true }, // Position PDA
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },  // Payer (user)
                { pubkey: userPositionsPDA, isSigner: false, isWritable: true }, // User's positions PDA
                { pubkey: userTokenAccount, isSigner: false, isWritable: true }, // User's collateral token account
                { pubkey: collateralMint, isSigner: false, isWritable: false },  // Collateral mint (readonly)
                { pubkey: custodyAccount, isSigner: false, isWritable: true },   // Custody token account
                { pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), isSigner: false, isWritable: false }, // SPL Token Program
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // System Program
                { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },  // Rent sysvar
                { pubkey: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'), isSigner: false, isWritable: false },  // Associated token program
                { pubkey: programId, isSigner: false, isWritable: false }, // **Missing program ID**
                { pubkey: positionPDA, isSigner: false, isWritable: true }, // Position PDA
            ],
            programId,
            data: instructionData,
        });

        console.log("instruction")
        console.log(instruction)
        // Create the transaction, fetch the blockhash right before adding it
        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        console.log(blockhash)
        console.log(lastValidBlockHeight)
        // Create the transaction and assign fee payer and blockhash
        const transaction = new Transaction().add(instruction);
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey;

        // Sign and send the transaction with more control
        const signature = await wallet.sendTransaction(
            transaction,
            connection,
            {
                skipPreflight: true,
                preflightCommitment: 'singleGossip', // Modify preflight strategy as needed
                signers: [] 
            }
        );

        // Confirm the transaction
        await connection.confirmTransaction(signature, 'confirmed');
        console.log('Order placed successfully.');

        console.log('Order placed successfully.');

        // Fetch updated positions and balance after transaction
        await fetchUserData();
    } catch (error) {
        console.error('Error placing order:', error);
        throw error;
    } finally {
        setLoading(false);
    }
};


    return { userPositions, balance, loading, placeOrder };
};
