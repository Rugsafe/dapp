import { useState, useEffect } from 'react';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { UserPositions, Side } from '../types';
import { fetchUserPositions } from '../utils/solanaUtils';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { LOCALHOST_URL, getConnectionUrl, CONTRACT_PROGRAM_ID, COLLATERAL_MINT, MAX_POSITIONS } from '../constants';

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
                new PublicKey(CONTRACT_PROGRAM_ID)
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
    const placeOrder = async (side: Side, size: number, symbol: string) => {
        if (!wallet.publicKey || !wallet.signTransaction) return;
        if (isNaN(size) || size <= 0) {
            throw new Error('Invalid order size');
        }

        try {
            console.log(`Placing ${side === Side.Long ? 'Long' : 'Short'} order for ${size} ${symbol}`);
            setLoading(true);

            const programId = new PublicKey(CONTRACT_PROGRAM_ID);
            const collateralMint = new PublicKey(COLLATERAL_MINT);

            // Derive the Custody Account for the collateral mint
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
            const instructionData = Buffer.alloc(9);
            instructionData.writeUInt8(side === Side.Long ? 0 : 1, 0); // 0 for Long, 1 for Short
            instructionData.writeBigUInt64LE(BigInt(size), 1);  // Position size
            
            const openPositionInstructionData = Buffer.from([1, 0, side === Side.Long ? 0 : 1, 1]);


            // Create the transaction instruction
            const instruction = new TransactionInstruction({
                keys: [
                    { pubkey: wallet.publicKey, isSigner: true, isWritable: true },  // Payer (user)
                    { pubkey: userPositionsPDA, isSigner: false, isWritable: true }, // User's positions PDA
                    { pubkey: userTokenAccount, isSigner: false, isWritable: true }, // User's collateral token account
                    { pubkey: collateralMint, isSigner: false, isWritable: false },  // Collateral mint
                    { pubkey: custodyAccount, isSigner: false, isWritable: true },   // Custody token account
                    { pubkey: positionPDA, isSigner: false, isWritable: true },      // Position PDA
                    { pubkey: programId, isSigner: false, isWritable: false },       // Program ID
                    { pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), isSigner: false, isWritable: false }, // SPL Token Program ID
                ],
                programId,
                // data: instructionData,
                data: openPositionInstructionData
            });

            console.log("instruction")
            console.log(instruction)
            console.log("programId")
            console.log(programId.toBase58())

            // Create the transaction and sign it
            const transaction = new Transaction().add(instruction);
            // window.alert(await connection.getRecentBlockhash())
            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            transaction.feePayer = wallet.publicKey;

            const signedTransaction = await wallet.signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signedTransaction.serialize());
            console.log('Transaction signature:', signature);

            // Confirm the transaction
            await connection.confirmTransaction(signature, 'confirmed');
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
