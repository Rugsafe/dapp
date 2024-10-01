import { Connection, PublicKey } from '@solana/web3.js';
import * as borsh from 'borsh';
import { UserPositions } from '../types';


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