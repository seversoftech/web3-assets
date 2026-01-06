export interface Token {
    contractAddress: string;
    name: string;
    symbol: string;
    balance: string; // Formatted balance (e.g. "1.5")
    decimals: number;
    logo?: string;
    balanceRaw: string; // BigInt string
    priceUsd?: number;
    valueUsd?: number;
}

export interface Nft {
    contractAddress: string;
    tokenId: string;
    name: string;
    type: 'ERC721' | 'ERC1155';
    imageUrl?: string;
    collectionName?: string;
}

export interface Transaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    asset: string;
    timestamp?: string;
    type: 'incoming' | 'outgoing';
}

export interface WalletAssets {
    nativeBalance: {
        symbol: string;
        balance: string;
        name: string;
        priceUsd?: number;
        valueUsd?: number;
    };
    tokens: Token[];
    nfts: Nft[];
    transactions: Transaction[];
    totalValueUsd: number;
    gasPriceGwei?: string;
}

export interface IBlockchainDataService {
    getAssets(address: string, chainId: number | string): Promise<WalletAssets>;
}
