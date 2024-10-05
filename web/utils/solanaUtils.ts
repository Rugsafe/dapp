import { Connection, PublicKey } from '@solana/web3.js';
import * as borsh from 'borsh';
import { UserPositions } from '../types';
import {OrderBookEntry} from "../types";


export const fetchUserPositions = async(connection: Connection, userPositionsPDA: PublicKey) => {
    const accountInfo = await connection.getAccountInfo(userPositionsPDA);
    if(accountInfo === null) {
        throw new Error("User could not be found");
    }
    const userPositions = borsh.deserialize(
        UserPositions.schema,
        UserPositions,
        accountInfo.data, 
    );
    return userPositions;
}
export const fetchOrderBook = async(connection: Connection, programId: PublicKey): Promise<{ bids: OrderBookEntry[], asks: OrderBookEntry[] }> => {
    try {
        const [orderBookPDA] = await PublicKey.findProgramAddress(
            [Buffer.from('order_book')],
            programId
        );

        const accountInfo = await connection.getAccountInfo(orderBookPDA);
        
        if (accountInfo && accountInfo.data) {
            // TODO: Implement actual deserialization of account data
            // For now, we'll just return dummy data
            console.log("Order book account found, but using dummy data");
        } else {
            console.log("Order book account not found, using dummy data");
        }
    } catch (error) {
        console.error("Error fetching order book:", error);
    }

    // Return dummy data in all cases for now
    return {
        bids: [
            { price: 2000, size: 1.5 },
            { price: 1990, size: 2.0 },
            { price: 1980, size: 2.5 },
        ],
        asks: [
            { price: 2010, size: 1.0 },
            { price: 2020, size: 2.5 },
            { price: 2030, size: 1.8 },
        ],
    };
};