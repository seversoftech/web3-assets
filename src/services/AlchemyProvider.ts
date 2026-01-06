import { Network, Alchemy } from 'alchemy-sdk';
import { IBlockchainDataService, WalletAssets, Token, Nft } from './types';
import { formatUnits } from 'viem';

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

if (!ALCHEMY_API_KEY) {
    throw new Error('defined in environment variables');
}

const CHAIN_TO_NETWORK: Record<number, Network> = {
    1: Network.ETH_MAINNET,
    137: Network.MATIC_MAINNET,
    56: Network.BNB_MAINNET,
    42161: Network.ARB_MAINNET,
    10: Network.OPT_MAINNET,
    8453: Network.BASE_MAINNET,
    43114: Network.AVAX_MAINNET,
    59144: Network.LINEA_MAINNET,
    324: Network.ZKSYNC_MAINNET,
    1101: Network.POLYGONZKEVM_MAINNET,
    250: Network.FANTOM_MAINNET,
};

export class AlchemyDataService implements IBlockchainDataService {
    private getAlchemy(chainId: number): Alchemy {
        const network = CHAIN_TO_NETWORK[chainId] || Network.ETH_MAINNET;
        const settings = {
            apiKey: ALCHEMY_API_KEY,
            network: network,
        };
        return new Alchemy(settings);
    }

    async getAssets(address: string, chainId: number | string): Promise<WalletAssets> {
        if (chainId === 'solana') {
            return this.getSolanaAssets(address);
        }
        const alchemy = this.getAlchemy(Number(chainId));

        // Determine symbol based on chain
        let nativeSymbol = 'ETH';
        if (chainId === 137) nativeSymbol = 'MATIC';
        if (chainId === 56) nativeSymbol = 'BNB';
        if (chainId === 43114) nativeSymbol = 'AVAX';
        if (chainId === 250) nativeSymbol = 'FTM';

        try {
            // Use Promise.allSettled to allow partial success...
            const results = await Promise.allSettled([
                alchemy.core.getBalance(address),
                alchemy.core.getTokenBalances(address),
                alchemy.nft.getNftsForOwner(address),
            ]);

            // Process Native Balance.
            let nativeVal = '0';
            if (results[0].status === 'fulfilled') {
                nativeVal = formatUnits(BigInt(results[0].value.toString()), 18);
            } else {
                console.error('Failed to fetch native balance:', results[0].reason);
            }

            // Process Tokens
            let tokensResolved: Token[] = [];
            if (results[1].status === 'fulfilled') {
                const tokenBalances = results[1].value;
                const nonZeroTokens = tokenBalances.tokenBalances.filter(t => {
                    return t.tokenBalance && t.tokenBalance !== '0' && t.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000';
                });

                const tokenPromises = nonZeroTokens.map(async (t) => {
                    try {
                        const metadata = await alchemy.core.getTokenMetadata(t.contractAddress);
                        const decimals = metadata.decimals || 18;
                        const balanceBigInt = BigInt(t.tokenBalance || '0');
                        const formatted = formatUnits(balanceBigInt, decimals);

                        const token: Token = {
                            contractAddress: t.contractAddress,
                            name: metadata.name || 'Unknown',
                            symbol: metadata.symbol || '???',
                            balance: formatted,
                            balanceRaw: t.tokenBalance || '0',
                            decimals: decimals,
                            logo: metadata.logo || undefined
                        };
                        return token;
                    } catch (e) {
                        console.error(`Failed to load metadata for ${t.contractAddress}`, e);
                        return null;
                    }
                });

                tokensResolved = (await Promise.all(tokenPromises)).filter((t): t is Token => t !== null);
            } else {
                console.error('Failed to fetch token balances:', results[1].reason);
            }

            // Process NFTs
            let formattedNfts: Nft[] = [];
            if (results[2].status === 'fulfilled') {
                const nfts = results[2].value;
                formattedNfts = nfts.ownedNfts.map(n => {
                    const anyN = n as any;
                    const imageUrl = anyN.image?.cachedUrl || anyN.image?.originalUrl || anyN.media?.[0]?.gateway || undefined;

                    return {
                        contractAddress: n.contract.address,
                        tokenId: n.tokenId,
                        name: n.name || n.tokenId,
                        type: n.tokenType === 'ERC721' ? 'ERC721' : 'ERC1155',
                        imageUrl: imageUrl,
                        collectionName: n.contract.openSeaMetadata?.collectionName || n.contract.name
                    };
                });
            } else {
                console.error('Failed to fetch NFTs:', results[2].reason);
            }

            // Process Transactions (Simple history)
            let transactions: any[] = [];
            try {
                const transfers = await alchemy.core.getAssetTransfers({
                    fromAddress: address,
                    category: ['external', 'erc20' as any],
                    maxCount: 50,
                    order: 'desc' as any,
                });

                const receivedTransfers = await alchemy.core.getAssetTransfers({
                    toAddress: address,
                    category: ['external', 'erc20' as any],
                    maxCount: 50,
                    order: 'desc' as any,
                });

                const allTransfers = [...transfers.transfers, ...receivedTransfers.transfers]
                    .sort((a, b) => b.blockNum.localeCompare(a.blockNum))
                    .slice(0, 50);

                transactions = allTransfers.map(t => ({
                    hash: t.hash,
                    from: t.from,
                    to: t.to,
                    value: t.value?.toString() || '0',
                    asset: t.asset || '???',
                    type: t.from.toLowerCase() === address.toLowerCase() ? 'outgoing' : 'incoming'
                }));
            } catch (e) {
                console.error('Failed to fetch transactions:', e);
            }

            // If all critical calls failed, re-throw the first error to be handled by UI
            if (results[0].status === 'rejected' && results[1].status === 'rejected') {
                throw new Error((results[0] as PromiseRejectedResult).reason?.message || 'Failed to fetch assets');
            }

            // Fetch Gas Price
            let gasPriceGwei = '0';
            try {
                const gasPriceRaw = await alchemy.core.getGasPrice();
                gasPriceGwei = (Number(formatUnits(BigInt(gasPriceRaw.toString()), 9))).toFixed(0);
            } catch (e) {
                console.error('Failed to fetch gas price:', e);
            }

            // Real Price Fetching for Native Asset
            let nativePriceUsd = 0;
            try {
                // Alchemy Prices API for native assets by symbol
                const nativePriceData = await alchemy.prices.getTokenPriceBySymbol([nativeSymbol]);
                nativePriceUsd = nativePriceData.data[0]?.prices[0]?.value ? Number(nativePriceData.data[0].prices[0].value) : 0;
            } catch (e) {
                console.error(`Failed to fetch real price for ${nativeSymbol}:`, e);
                // Production fallback: If API fails, we could use a secondary source or show 0
            }

            const nativeValueUsd = Number(nativeVal) * nativePriceUsd;

            // Real Price Fetching for ERC20 Tokens
            const tokenAddresses = tokensResolved.map(t => t.contractAddress);
            let tokenPrices: Record<string, number> = {};

            if (tokenAddresses.length > 0) {
                try {
                    const network = CHAIN_TO_NETWORK[Number(chainId)] || Network.ETH_MAINNET;
                    const priceResults = await alchemy.prices.getTokenPriceByAddress(
                        tokenAddresses.map(addr => ({
                            network: network,
                            address: addr
                        }))
                    );
                    priceResults.data.forEach(p => {
                        if (p.prices && p.prices.length > 0) {
                            tokenPrices[p.address.toLowerCase()] = Number(p.prices[0].value);
                        }
                    });
                } catch (e) {
                    console.error('Failed to fetch token prices:', e);
                }
            }

            const tokensWithValue = tokensResolved.map(t => {
                const price = tokenPrices[t.contractAddress.toLowerCase()] || 0;
                return {
                    ...t,
                    priceUsd: price,
                    valueUsd: Number(t.balance) * price
                };
            });

            const tokensValueUsd = tokensWithValue.reduce((acc, t) => acc + (t.valueUsd || 0), 0);
            const totalValueUsd = nativeValueUsd + tokensValueUsd;

            return {
                nativeBalance: {
                    symbol: nativeSymbol,
                    balance: nativeVal,
                    name: 'Native Token',
                    priceUsd: nativePriceUsd,
                    valueUsd: nativeValueUsd
                },
                tokens: tokensWithValue,
                nfts: formattedNfts,
                transactions: transactions,
                totalValueUsd: totalValueUsd,
                gasPriceGwei: gasPriceGwei
            };

        } catch (error) {
            console.error("Error in getAssets:", error);
            throw error;
        }
    }

    private async getSolanaAssets(address: string): Promise<WalletAssets> {
        // Solana implementation using Alchemy DAS API
        const rpcUrl = `https://solana-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

        // 1. Connectivity Check: Fetch SOL Balance (Standard RPC)
        // This confirms the API key is valid and the network is reachable.
        let solBalance = '0';
        try {
            const solResponse = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getBalance',
                    params: [address]
                }),
            });
            const solData = await solResponse.json();

            if (solData.error) {
                console.error('Solana RPC Error (getBalance):', solData.error);
                throw new Error(`Solana RPC Error: ${solData.error.message}`);
            }

            if (!solData.result) {
                throw new Error('Solana RPC Error: No result returned for balance');
            }

            solBalance = (solData.result.value / 1e9).toString();
        } catch (e: any) {
            throw new Error(`Failed to connect to Solana: ${e.message}`);
        }

        // 2. Fetch Assets (DAS API)
        // If this fails, it's likely the "Read API" is not enabled in Alchemy.
        let items: any[] = [];
        try {
            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 'my-id',
                    method: 'getAssetsByOwner',
                    params: {
                        ownerAddress: address,
                        page: 1,
                        limit: 50,
                        // Removed displayOptions to ensure maximum compatibility
                    },
                }),
            });

            const data = await response.json();

            if (data.error) {
                console.error('Solana DAS API Error:', data.error);
                // Differentiate DAS error from generic connection error
                throw new Error(`Solana DAS Error: ${data.error.message} (Is "Read API" enabled?)`);
            }

            if (!data.result) {
                console.error('Unexpected Solana API response structure:', data);
                throw new Error('Solana DAS Error: Invalid response structure');
            }

            items = data.result.items || [];
            items = data.result.items || [];
        } catch (e: any) {
            // If DAS fails (e.g. Read API not enabled), we log it but do NOT throw.
            // This allows the user to still see their SOL balance.
            console.warn('Failed to fetch Solana assets (DAS) - returning empty list:', e.message);
            // items remains empty array
        }

        // Native Price (Logic unchanged)
        let solPriceUsd = 0;
        try {
            const alchemy = this.getAlchemy(1);
            const solPriceData = await alchemy.prices.getTokenPriceBySymbol(['SOL']);
            solPriceUsd = solPriceData.data[0]?.prices[0]?.value ? Number(solPriceData.data[0].prices[0].value) : 180;
        } catch (e) {
            console.error('Failed to fetch SOL price:', e);
            solPriceUsd = 180;
        }

        const tokens: Token[] = [];
        const nfts: Nft[] = [];

        items.forEach((item: any) => {
            const isNft = item.interface === 'LegacyNFT' || item.interface === 'V1_NFT' || item.interface === 'V2_NFT' || item.interface === 'ProgrammableNFT';

            if (isNft) {
                nfts.push({
                    contractAddress: item.id,
                    tokenId: '0',
                    name: item.content?.metadata?.name || 'Unknown NFT',
                    type: 'ERC721',
                    imageUrl: item.content?.links?.image || item.content?.files?.[0]?.uri,
                    collectionName: item.content?.metadata?.symbol
                });
            } else if (item.interface === 'FungibleToken' || item.interface === 'FungibleAsset') {
                const balance = item.token_info?.balance || '0';
                const decimals = item.token_info?.decimals || 0;
                const formatted = (Number(balance) / Math.pow(10, decimals)).toString();

                tokens.push({
                    contractAddress: item.id,
                    name: item.content?.metadata?.name || item.id.slice(0, 8),
                    symbol: item.content?.metadata?.symbol || '???',
                    balance: formatted,
                    balanceRaw: balance.toString(),
                    decimals: decimals,
                    logo: item.content?.links?.image,
                    priceUsd: item.token_info?.price_info?.price_per_token || 0,
                    valueUsd: (Number(formatted) * (item.token_info?.price_info?.price_per_token || 0))
                });
            }
        });

        const totalValueUsd = (Number(solBalance) * solPriceUsd) + tokens.reduce((acc, t) => acc + (t.valueUsd || 0), 0);

        return {
            nativeBalance: {
                symbol: 'SOL',
                balance: solBalance,
                name: 'Solana',
                priceUsd: solPriceUsd,
                valueUsd: Number(solBalance) * solPriceUsd
            },
            tokens,
            nfts,
            transactions: [],
            totalValueUsd,
            gasPriceGwei: '0'
        };
    }
}
