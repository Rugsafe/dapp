import { useState, useEffect } from 'react';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { UserPositions, Side } from '../types';
import { fetchUserPositions } from '../utils/solanaUtils';
import { LOCALHOST_URL, getConnectionUrl, CONTRACT_PROGRAM_ID } from '../constants';

export const useSolanaProgram = () => {
    const [userPositions, setUserPositions] = useState<UserPositions | null>(null);
    const [balance, setBalance] = useState(10000);
    const wallet = useWallet();
    const connection = new Connection(getConnectionUrl(), 'confirmed');

    useEffect(() => {
        if (wallet.publicKey) {
            fetchPositions();
        }
    }, [wallet.publicKey]);

    const fetchPositions = async () => {
        if (!wallet.publicKey) return;
        try {
            const [userPositionsPDA] = await PublicKey.findProgramAddress(
                [Buffer.from('user_positions'), wallet.publicKey.toBuffer()],
                new PublicKey(CONTRACT_PROGRAM_ID)
            );
            const positions = await fetchUserPositions(connection, userPositionsPDA);
            setUserPositions(positions);
        } catch (error) {
            console.error('Error fetching positions:', error);
        }
    };

    const placeOrder = async (side: Side, size: number, symbol: string) => {
        if (!wallet.publicKey || !wallet.signTransaction) return;
        if (isNaN(size) || size <= 0) {
            throw new Error('Invalid order size');
        }

        try {
            console.log(`Placing ${side === Side.Long ? 'Long' : 'Short'} order for ${size} ${symbol}`);
            console.log(`Using program ID: ${CONTRACT_PROGRAM_ID}`);

            // Implement Solana transaction logic
            const transaction = new Transaction();

            // Create the instruction data
            const instructionData = Buffer.alloc(9);
            instructionData.writeUInt8(side === Side.Long ? 0 : 1, 0); // 0 for Long, 1 for Short
            instructionData.writeBigUInt64LE(BigInt(size), 1);

            // Get the user's position PDA
            const [userPositionsPDA] = await PublicKey.findProgramAddress(
                [Buffer.from('user_positions'), wallet.publicKey.toBuffer()],
                new PublicKey(CONTRACT_PROGRAM_ID)
            );

            // Create the instruction
            const instruction = new TransactionInstruction({
                keys: [
                    { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                    { pubkey: userPositionsPDA, isSigner: false, isWritable: true },
                    // Add other necessary account keys here
                ],
                programId: new PublicKey(CONTRACT_PROGRAM_ID),
                data: instructionData,
            });

            transaction.add(instruction);

            // Set recent blockhash and fee payer
            transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
            transaction.feePayer = wallet.publicKey;

            // Sign and send the transaction
            const signedTransaction = await wallet.signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signedTransaction.serialize());

            // Wait for confirmation
            await connection.confirmTransaction(signature);

            console.log('Order placed successfully. Signature:', signature);

            // Update positions after successful order placement
            await fetchPositions();
        } catch (error) {
            console.error('Error placing order:', error);
            throw error;
        }
    };

    return { userPositions, balance, placeOrder };
};