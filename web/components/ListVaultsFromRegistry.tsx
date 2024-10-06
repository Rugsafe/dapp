import React, { useState, useEffect } from 'react';
import { PublicKey, Connection, Keypair } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { fetchVaultRegistry, deposit } from './solana/transaction-utils';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID} from '@solana/spl-token';

// const URL = 'http://127.0.0.1:8899';
const URL = 'https://api.devnet.solana.com';

// const CONTRACT_PROGRAM_ID = 'AVFEXtCiwxuBHuMUsnFGoFB44ymVAbMn3QsN6f6pw5yA';
// const CONTRACT_PROGRAM_ID = 'FobNvbQsK5BAniZC2oJhXakjcPiArpsthTGDnX9eHDVY';
const CONTRACT_PROGRAM_ID = '12ixZR6s9XqSJ65RhFUwxitwXXFqV6TPfWQ37kmfLzAd';


interface Vault {
    vaultAccount: string;
    mintTokenAAccount: string;
    mintATokenAAccount: string;
    owner: string;
}

interface Balances {
    userTokenBalance: string;
    userATokenBalance?: string;  // Add this if it's optional
    vaultTokenBalance: string;
  }
  

const deriveStateAccountPDA = async (programId: PublicKey) => {
    const [stateAccountPDA, _] = await PublicKey.findProgramAddress(
        [Buffer.from('vault_registry')],
        programId
    );
    return stateAccountPDA;
};

const ListVaultsFromRegistry: React.FC = () => {
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [balances, setBalances] = useState<{[key: string]: Balances}>({});
    const wallet = useWallet();
    const connection = new Connection(URL, 'confirmed');

    useEffect(() => {
        if (wallet.connected) {
            listVaults();
        }
    }, [wallet.connected]);

    const listVaults = async () => {
        try {
            const programId = new PublicKey(CONTRACT_PROGRAM_ID);
            const stateAccountPubkey = await deriveStateAccountPDA(programId);
            const vaultRegistry = await fetchVaultRegistry(stateAccountPubkey, connection);
    
            console.log("vaultRegistry.vaults", vaultRegistry.vaults);
    
            const formattedVaults = vaultRegistry.vaults.map((vault) => ({
                vaultAccount: vault.vaultAccount.toBase58(),
                mintTokenAAccount: vault.mintTokenA.toBase58(), // Using the correct field name for Token A mint
                mintATokenAAccount: vault.mintATokenA.toBase58(), // Using the correct field name for ATokenA mint
                owner: vault.owner.toBase58(),
            }));
    
            console.log("formattedVaults", formattedVaults);
    
            setVaults(formattedVaults);
            await fetchBalances(formattedVaults);
        } catch (error) {
            console.error('Error fetching vault registry:', error);
        }
    };
    // const fetchBalances = async (vaults: any) => {
    //     const newBalances = {};
    
    //     for (const vault of vaults) {
    //         try {
    //             console.log(`Fetching balances for vault ${vault.vaultAccount}`);
    //             console.log(`Vault Account: ${vault.vaultAccount}`);
    
    //             if (!vault.userTokenAccount || !vault.userATokenAccount) {
    //                 console.error(`Vault ${vault.vaultAccount} is missing token accounts`);
    //                 continue;
    //             }
    
    //             const userTokenAccountBalance = await connection.getTokenAccountBalance(new PublicKey(vault.userTokenAccount));
    //             const userATokenAccountBalance = await connection.getTokenAccountBalance(new PublicKey(vault.userATokenAccount));
    //             const vaultTokenAccountBalance = await connection.getTokenAccountBalance(new PublicKey(vault.vaultAccount));
    
    //             console.log(`User Token Balance: ${userTokenAccountBalance.value.uiAmount}`);
    //             console.log(`User aToken Balance: ${userATokenAccountBalance.value.uiAmount}`);
    //             console.log(`Vault Token Balance: ${vaultTokenAccountBalance.value.uiAmount}`);
    
    //             newBalances[vault.vaultAccount] = {
    //                 userTokenBalance: userTokenAccountBalance.value.amount,
    //                 userATokenBalance: userATokenAccountBalance.value.amount,
    //                 vaultTokenBalance: vaultTokenAccountBalance.value.amount,
    //             };
    //         } catch (error) {
    //             console.error(`Error fetching balances for vault ${vault.vaultAccount}:`, error);
    //         }
    //     }
    
    //     setBalances(newBalances);
    // };

    const fetchBalances = async (vaults: Vault[]) => {
        const newBalances: { [key: string]: Balances } = {};
    
        for (const vault of vaults) {
            try {
                console.log(`vault ${vault}`);
                console.log(vault);
                console.log(`Fetching balances for vault ${vault.vaultAccount}`);
                console.log(`Vault Account: ${vault.vaultAccount}`);
    
                // Generate associated token account addresses dynamically
                const userTokenAccount = await getAssociatedTokenAddress(
                    new PublicKey(vault.mintTokenAAccount),
                    wallet.publicKey as PublicKey
                );
    
                const userATokenAccount = await getAssociatedTokenAddress(
                    new PublicKey(vault.mintATokenAAccount),
                    wallet.publicKey as PublicKey
                );
    
                console.log("DEV: userTokenAccount:", userTokenAccount.toBase58());
                console.log("DEV: userATokenAccount:", userATokenAccount.toBase58());
    
                const userTokenAccountBalance = await connection.getTokenAccountBalance(userTokenAccount);
                const userATokenAccountBalance = await connection.getTokenAccountBalance(userATokenAccount);
                const vaultTokenAccountBalance = await connection.getTokenAccountBalance(new PublicKey(vault.vaultAccount));
    
                console.log(`userTokenAccountBalance: ${userTokenAccountBalance.value.uiAmount}`);
                console.log(`userATokenAccountBalance: ${userATokenAccountBalance.value.uiAmount}`);
                console.log(`vaultTokenAccountBalance: ${vaultTokenAccountBalance.value.uiAmount}`);
    
                newBalances[vault.vaultAccount] = {
                    userTokenBalance: userTokenAccountBalance.value.amount,
                    userATokenBalance: userATokenAccountBalance.value.amount,  // Now correctly typed
                    vaultTokenBalance: vaultTokenAccountBalance.value.amount,
                };
            } catch (error) {
                console.error(`Error fetching balances for vault ${vault.vaultAccount}:`, error);
            }
        }
    
        console.log("newBalances:", newBalances);
        setBalances(newBalances);
    };
    

    const handleDeposit = async (vault: {
        mintTokenAAccount: string, 
        mintATokenAAccount: string, 
        owner: string, 
        vaultAccount: string}) => {
        try {
            console.log("vault")
            console.log(vault)

    
            const programId = new PublicKey(CONTRACT_PROGRAM_ID);
            const mintTokenAPubkey = new PublicKey(vault.mintTokenAAccount);
            const mintATokenAPubkey = new PublicKey(vault.mintATokenAAccount);
            
            // const vaultPubkey = new PublicKey("nBzomwsoJpu8CiRL5f7iJkN5cLJryMeTwPC8nNJciqr");
            const vaultPubkey = await getAssociatedTokenAddress(
                mintTokenAPubkey,           // Mint address
                programId,        // Owner of the associated token account
                false,                   // Allow owner off curve
                TOKEN_PROGRAM_ID,        // Token program ID
                ASSOCIATED_TOKEN_PROGRAM_ID // Associated token program ID
            );
            
            window.alert(`vaultPubkey: ${vaultPubkey}`)
            
            // const userTokenAPubkey = new PublicKey("Dof5p3fEhZhXttrPeEPiKwLoac5ftRyJJnma24ZYF4qZ");
            const userTokenAPubkey = await getAssociatedTokenAddress(
                mintTokenAPubkey,           // Mint address
                wallet.publicKey as PublicKey,        // Owner of the associated token account
                false,                   // Allow owner off curve
                TOKEN_PROGRAM_ID,        // Token program ID
                ASSOCIATED_TOKEN_PROGRAM_ID // Associated token program ID
            );
            
            window.alert(`userTokenAPubkey: ${userTokenAPubkey}`)

            // const userATokenAPubkey = new PublicKey(vault.mint);
            const userATokenAPubkey = await getAssociatedTokenAddress(
                mintATokenAPubkey,           // Mint address
                wallet.publicKey as PublicKey,        // Owner of the associated token account
                false,                   // Allow owner off curve
                TOKEN_PROGRAM_ID,        // Token program ID
                ASSOCIATED_TOKEN_PROGRAM_ID // Associated token program ID
            );

            window.alert(`userATokenAPubkey: ${userATokenAPubkey}`)

            const depositAmount = 100; // Example deposit amount
    
            const signature = await deposit(
                programId,
                mintTokenAPubkey,
                mintATokenAPubkey,
                vaultPubkey,
                userTokenAPubkey,
                userATokenAPubkey,
                depositAmount,
                wallet,
                connection
            );
    
            console.log('Deposit transaction signature:', signature);
        } catch (error) {
            console.error('Deposit failed:', error);
        }
    };

    const handleWithdraw = (vaultAddress: any) => {
        console.log(`Withdraw clicked for vault: ${vaultAddress}`);
        // Implement withdraw logic here
    };

    return (
        <div className="vault-registry max-w-12xl mx-auto mt-0">
            {/* <h2 className="text-3xl font-bold text-center text-white mb-10">Vaults</h2> */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ border: "0px solid red"}}>
                
                {
                    vaults.map((vault, index) => ( 
                        <div
                            key={index}
                            className="bg-gray-800 shadow-lg rounded-lg p-6 transition-transform transform hover:scale-105"
                            style={{ minWidth: '320px', maxWidth: '100%' }} // Adjust min-width if necessary and limit max-width
                        >
                            <div className="flex items-center mb-4">
                                {/* Circular chain logo */}
                                <img
                                    src="assets/img/solana.png"
                                    alt="Chain Logo"
                                    className="w-10 h-10 rounded-full mr-4" 
                                />
                                <h3 className="text-xl font-semibold text-white mb-4">Vault #{index + 1}</h3>
                            </div>
                            <div className="overflow-x-auto whitespace-nowrap">
                                <p className="text-gray-400 mb-2">
                                    <strong className="text-white">Vault Account:</strong> {vault.vaultAccount}
                                </p>
                                <p className="text-gray-400 mb-2">
                                    <strong className="text-white">Mint Token A Account:</strong> {vault.mintTokenAAccount}
                                </p>
                                <p className="text-gray-400 mb-2">
                                    <strong className="text-white">Mint AToken A Account:</strong> {vault.mintATokenAAccount}
                                </p>
                                <p className="text-gray-400 mb-2">
                                    <strong className="text-white">Owner:</strong> {vault.owner}
                                </p>
                                <p className="text-gray-400 mb-2">
                                    <strong className="text-white">User Token Balance:</strong> {balances[vault.vaultAccount]?.userTokenBalance || '-'}
                                </p>
                                <p className="text-gray-400 mb-2">
                                    <strong className="text-white">User aToken Balance:</strong> {balances[vault.vaultAccount]?.userATokenBalance || '-'}
                                </p>
                                <p className="text-gray-400 mb-2">
                                    <strong className="text-white">Vault Token Balance:</strong> {balances[vault.vaultAccount]?.vaultTokenBalance || '-'}
                                </p>
                            </div>
                            <div className="flex justify-between mt-4">
                                <button
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition w-full mr-2"
                                    onClick={() => handleDeposit(vault)}
                                >
                                    Deposit
                                </button>
                                {/* <button
                                    className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md transition flex-1 mx-2"
                                    onClick={() => handleBurn(vault)}
                                >
                                    Burn
                                </button> */}
                                <button
                                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition w-full ml-2"
                                    onClick={() => handleWithdraw(vault.vaultAccount)}
                                >
                                    Withdraw
                                </button>
                            </div>
                        </div>
                    ))
                }
                
                {/* <div
                    key="1"
                    className="bg-gray-800 shadow-lg rounded-lg p-6 transition-transform transform hover:scale-105"
                    style={{ minWidth: '320px', maxWidth: '100%' }}
                >
                    
                    <div className="flex items-center mb-4">
                        <img
                            src="assets/img/solana.png" 
                            alt="Chain Logo"
                            className="w-10 h-10 rounded-full mr-4"
                        />
                        <h3 className="text-xl font-semibold text-white">Vault #1</h3>
                    </div>

                    <div className="overflow-x-auto whitespace-nowrap">
                        <p className="text-gray-400 mb-2">
                            <strong className="text-white">Vault Account:</strong>nBzomwsoJpu8CiRL5f7iJkN5cLJryMeTwPC8nNJciqr
                        </p>
                        <p className="text-gray-400 mb-2">
                            <strong className="text-white">Mint Token A Account:</strong> DG3jdET19heUQjp8fdL54FBvFd5oFWZZjCG8XgmFAHQJ
                        </p>
                        <p className="text-gray-400 mb-2">
                            <strong className="text-white">Mint AToken A Account:</strong> 5UgXHoPaFKA8iDqZoQnyTDqEYnzKtwRZMSjGr6223XyG
                        </p>
                        <p className="text-gray-400 mb-2">
                            <strong className="text-white">Owner:</strong>7WAS4T6sUPSDzStbGxEFgd8cfuCDLM7cmqWEfUqkhNjk
                        </p>
                        <p className="text-gray-400 mb-2">
                            <strong className="text-white">User Token Balance:</strong> 900
                        </p>
                        <p className="text-gray-400 mb-2">
                            <strong className="text-white">User aToken Balance:</strong> 100
                        </p>
                        <p className="text-gray-400 mb-2">
                            <strong className="text-white">Vault Token Balance:</strong> 100x
                        </p>
                    </div>
                    <div className="flex justify-between mt-4">
                        <button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition w-full mr-2"
                        >
                            Deposit
                        </button>
                        <button
                            className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md transition flex-1 mx-2"
                        >
                            Burn
                        </button>
                        <button
                            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition w-full ml-2"
                        >
                            Withdraw
                        </button>
                    </div>
                </div>


                <div
                    key="1"
                    className="bg-gray-800 shadow-lg rounded-lg p-6 transition-transform transform hover:scale-105"
                    style={{ minWidth: '320px', maxWidth: '100%' }}
                >
                    <div className="flex items-center mb-4">
                        <img
                            src="assets/img/solana.png" // Replace with the path to the chain logo
                            alt="Chain Logo"
                            className="w-10 h-10 rounded-full mr-4" // Circle logo with margin to right
                        />
                        <h3 className="text-xl font-semibold text-white">Vault #1</h3>
                    </div>
                    <div className="overflow-x-auto whitespace-nowrap">
                        <p className="text-gray-400 mb-2">
                            <strong className="text-white">Vault Account:</strong>nBzomwsoJpu8CiRL5f7iJkN5cLJryMeTwPC8nNJciqr
                        </p>
                        <p className="text-gray-400 mb-2">
                            <strong className="text-white">Mint Token A Account:</strong> DG3jdET19heUQjp8fdL54FBvFd5oFWZZjCG8XgmFAHQJ
                        </p>
                        <p className="text-gray-400 mb-2">
                            <strong className="text-white">Mint AToken A Account:</strong> 5UgXHoPaFKA8iDqZoQnyTDqEYnzKtwRZMSjGr6223XyG
                        </p>
                        <p className="text-gray-400 mb-2">
                            <strong className="text-white">Owner:</strong>7WAS4T6sUPSDzStbGxEFgd8cfuCDLM7cmqWEfUqkhNjk
                        </p>
                        <p className="text-gray-400 mb-2">
                            <strong className="text-white">User Token Balance:</strong> 900
                        </p>
                        <p className="text-gray-400 mb-2">
                            <strong className="text-white">User aToken Balance:</strong> 100
                        </p>
                        <p className="text-gray-400 mb-2">
                            <strong className="text-white">Vault Token Balance:</strong> 100x
                        </p>
                    </div>
                    <div className="flex justify-between mt-4">
                        <button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition w-full mr-2"
                        >
                            Deposit
                        </button>
                        <button
                            className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md transition flex-1 mx-2"
                        >
                            Burn
                        </button>
                        <button
                            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition w-full ml-2"
                        >
                            Withdraw
                        </button>
                    </div>
                </div> */}




            </div>
        </div>
    );
    
};

export default ListVaultsFromRegistry;