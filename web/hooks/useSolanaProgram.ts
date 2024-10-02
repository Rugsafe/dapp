// hooks/useSolanaProgram.ts
import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { UserPositions, Side, OrderBookEntry } from '../types';
import { fetchUserPositions, fetchOrderBook } from '../utils/solanaUtils';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { LOCALHOST_URL, getConnectionUrl, CONTRACT_PROGRAM_ID, COLLATERAL_MINT, MAX_POSITIONS } from '../constants';

export const useSolanaProgram = () => {
    const [userPositions, setUserPositions] = useState<UserPositions | null>(null);
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [orderBook, setOrderBook] = useState<{ bids: OrderBookEntry[], asks: OrderBookEntry[] }>({ bids: [], asks: [] });

    const wallet = useWallet();
    const connection = new Connection(getConnectionUrl(), 'confirmed');

    const fetchUserData = useCallback(async () => {
        if (!wallet.publicKey) return;
        setLoading(true);
        try {
            await Promise.all([fetchPositions(), fetchBalance()]);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
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

    const fetchBalance = async () => {
        if (!wallet.publicKey) return;
        try {
            const lamports = await connection.getBalance(wallet.publicKey);
            setBalance(lamports / 1e9);
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    };

    useEffect(() => {
        if (wallet.publicKey) {
            fetchUserData();
        }
    }, [wallet.publicKey, fetchUserData]);

    useEffect(() => {
        const fetchOrderBookData = async () => {
            const orderBookData = await fetchOrderBook(connection, new PublicKey(CONTRACT_PROGRAM_ID));
            setOrderBook(orderBookData);
        };

        fetchOrderBookData();
        const interval = setInterval(fetchOrderBookData, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, [connection]);

    const placeOrder = async (side: Side, size: number, symbol: string) => {
        if (!wallet.publicKey || !wallet.signTransaction) {
            throw new Error('Wallet not connected');
        }

        if (isNaN(size) || size <= 0) {
            throw new Error('Invalid order size');
        }

        setLoading(true);
        try {
            console.log(`Placing ${side === Side.Long ? 'Long' : 'Short'} order for ${size} ${symbol}`);

            const collateralMint = new PublicKey(COLLATERAL_MINT);
            const programId = new PublicKey(CONTRACT_PROGRAM_ID);

            const custodyAccount = await getAssociatedTokenAddress(
                collateralMint,
                programId
            );

            const userTokenAccount = await getAssociatedTokenAddress(
                collateralMint,
                wallet.publicKey
            );

            const [userPositionsPDA] = await PublicKey.findProgramAddress(
                [Buffer.from('user_positions'), wallet.publicKey.toBuffer()],
                programId
            );

            const [positionPDA] = await PublicKey.findProgramAddress(
                [
                    Buffer.from('position'),
                    wallet.publicKey.toBuffer(),
                    Buffer.from(userPositions ? userPositions.next_position_idx.toString() : '0')
                ],
                programId
            );

            const instructionData = Buffer.alloc(9);
            instructionData.writeUInt8(side === Side.Long ? 0 : 1, 0);
            instructionData.writeBigUInt64LE(BigInt(size), 1);

            const instruction = new TransactionInstruction({
                keys: [
                    { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                    { pubkey: userPositionsPDA, isSigner: false, isWritable: true },
                    { pubkey: userTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: collateralMint, isSigner: false, isWritable: false },
                    { pubkey: custodyAccount, isSigner: false, isWritable: true },
                    { pubkey: positionPDA, isSigner: false, isWritable: true },
                    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
                    { pubkey: programId, isSigner: false, isWritable: false },
                ],
                programId,
                data: instructionData,
            });

            const transaction = new Transaction().add(instruction);
            transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
            transaction.feePayer = wallet.publicKey;

            const signedTransaction = await wallet.signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signedTransaction.serialize());

            await connection.confirmTransaction(signature);
            console.log('Transaction signature:', signature);

            await fetchPositions();
            await fetchBalance();
            const orderBookData = await fetchOrderBook(connection, new PublicKey(CONTRACT_PROGRAM_ID));
            setOrderBook(orderBookData);

            console.log('Order placed successfully.');
        } catch (error) {
            console.error('Error placing order:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { userPositions, balance, loading, placeOrder, orderBook };
};