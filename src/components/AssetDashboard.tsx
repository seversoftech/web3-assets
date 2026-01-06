'use client';

import React, { useState } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AlchemyDataService } from '@/services/AlchemyProvider';
import { WalletAssets, Token, Nft } from '@/services/types';
import { GasTracker } from './GasTracker';

const dataService = new AlchemyDataService();

export function AssetDashboard() {
    const { address: evmAddress, isConnected: isEvmConnected, chainId: evmChainId } = useAccount();
    const { publicKey, connected: isSolanaConnected } = useWallet();
    const { switchChain } = useSwitchChain();
    const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
    const [selectedNetwork, setSelectedNetwork] = useState<number | 'solana'>(1);
    const [activeTab, setActiveTab] = useState<'tokens' | 'nfts' | 'activity'>('tokens');
    const [searchQuery, setSearchQuery] = useState('');
    const [displayCount, setDisplayCount] = useState(5);
    const observerTarget = React.useRef(null);





    // Update selected network when EVM chain changes
    React.useEffect(() => {
        if (evmChainId && selectedNetwork !== 'solana') {
            setSelectedNetwork(evmChainId);
        }
    }, [evmChainId]);

    const getCurrentNetworkName = () => {
        if (selectedNetwork === 'solana') return 'Solana';
        switch (selectedNetwork) {
            case 1: return 'Ethereum';
            case 137: return 'Polygon';
            case 56: return 'BNB Smart Chain';
            case 42161: return 'Arbitrum One';
            case 10: return 'Optimism';
            case 8453: return 'Base';
            case 43114: return 'Avalanche';
            case 59144: return 'Linea';
            case 324: return 'ZkSync Era';
            case 1101: return 'Polygon zkEVM';
            case 250: return 'Fantom';
            default: return 'EVM Network';
        }
    };

    const handleNetworkSelect = (chainId: number | 'solana') => {
        if (chainId === 'solana') {
            setSelectedNetwork('solana');
        } else {
            switchChain({ chainId });
            setSelectedNetwork(chainId);
        }
        setIsNetworkDropdownOpen(false);
    }

    const currentAddress = selectedNetwork === 'solana' ? publicKey?.toBase58() : evmAddress;
    const isConnected = selectedNetwork === 'solana' ? isSolanaConnected : isEvmConnected;

    const { data: assets, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ['assets', currentAddress, selectedNetwork],
        queryFn: async () => {
            if (!currentAddress || !selectedNetwork) return null;
            return await dataService.getAssets(currentAddress, selectedNetwork);
        },
        enabled: !!currentAddress && !!selectedNetwork,
        staleTime: 30000,
    });

    React.useEffect(() => {
        setDisplayCount(5);
    }, [activeTab, selectedNetwork, currentAddress]);

    React.useEffect(() => {
        if (activeTab !== 'activity' || !assets?.transactions) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setDisplayCount((prev) => Math.min(prev + 5, assets.transactions.length));
                }
            },
            { threshold: 0.1, rootMargin: '50px' }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [activeTab, assets?.transactions]);

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-gray-400">
                <h2 className="text-2xl font-bold mb-4 text-white">Welcome</h2>
                <p className="mb-8">Please connect your wallet to view your assets.</p>

                <div className="flex flex-col gap-4 items-center">
                    <div className="flex bg-black/40 p-1 border border-white/10 mb-4 rounded-lg">
                        <div className="relative">
                            <button
                                onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                                className="px-6 py-3 text-sm font-medium bg-primary text-white rounded-lg shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2"
                            >
                                {getCurrentNetworkName()}
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isNetworkDropdownOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                            </button>

                            {isNetworkDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-xl z-50 max-h-[300px] overflow-y-auto">
                                    <div className="p-1 space-y-0.5">
                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">EVM Networks</div>
                                        {[
                                            { id: 1, name: 'Ethereum' },
                                            { id: 59144, name: 'Linea' },
                                            { id: 324, name: 'ZkSync Era' },
                                            { id: 137, name: 'Polygon' },
                                            { id: 42161, name: 'Arbitrum' },
                                            { id: 10, name: 'Optimism' },
                                            { id: 8453, name: 'Base' },
                                            { id: 56, name: 'BNB Chain' },
                                            { id: 43114, name: 'Avalanche' },
                                            { id: 1101, name: 'Polygon zkEVM' },
                                            { id: 250, name: 'Fantom' },
                                        ].map(net => (
                                            <button
                                                key={net.id}
                                                onClick={() => handleNetworkSelect(net.id)}
                                                className={`w-full text-left px-2 py-2 text-sm rounded-md transition-colors ${selectedNetwork === net.id ? 'bg-primary/10 text-primary' : 'hover:bg-accent hover:text-accent-foreground'}`}
                                            >
                                                {net.name}
                                            </button>
                                        ))}

                                        <div className="my-1 border-t border-border"></div>
                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Non-EVM</div>
                                        <button
                                            onClick={() => handleNetworkSelect('solana')}
                                            className={`w-full text-left px-2 py-2 text-sm rounded-md transition-colors ${selectedNetwork === 'solana' ? 'bg-[#9945FF]/10 text-[#9945FF]' : 'hover:bg-accent hover:text-accent-foreground'}`}
                                        >
                                            Solana
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedNetwork === 'solana' ? (
                        <div className="solana-button-container">
                            <WalletMultiButton />
                        </div>
                    ) : (
                        <p className="text-xs opacity-50">Connect via the button in the top right header</p>
                    )}
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (error) {
        const errorMessage = (error as Error).message;
        const isApiKeyError = errorMessage.includes('eth_getBalance') || errorMessage.includes('demo');
        const isNetworkError = errorMessage.includes('not enabled') || errorMessage.includes('403');

        return (
            <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-xl text-red-200">
                <h3 className="font-bold mb-2">Error Loading Assets</h3>
                <p className="font-mono text-sm opacity-80 mb-4">{errorMessage}</p>

                {isApiKeyError && !isNetworkError && (
                    <div className="bg-black/40 p-4 rounded-lg border border-white/10 text-white">
                        <h4 className="font-bold text-yellow-400 mb-2">⚠️ Missing API Key</h4>
                        <p className="text-sm text-gray-300 mb-2">
                            The app is using the default "demo" key which may be rate-limited or restricted.
                        </p>
                        <p className="text-sm text-gray-300">
                            Please create a <code className="bg-black/50 px-1 py-0.5 rounded text-yellow-200">.env.local</code> file in the root directory and add your Alchemy API Key:
                        </p>
                        <pre className="mt-2 bg-black/50 p-2 rounded text-xs text-gray-400 overflow-x-auto">
                            NEXT_PUBLIC_ALCHEMY_API_KEY=your_actual_api_key_here
                        </pre>
                    </div>
                )}

                {isNetworkError && (
                    <div className="bg-black/40 p-4 rounded-lg border border-white/10 text-white">
                        <h4 className="font-bold text-yellow-400 mb-2">⚠️ Network Not Enabled</h4>
                        <p className="text-sm text-gray-300 mb-2">
                            The current network is not enabled for your specific Alchemy App Key.
                        </p>
                        <p className="text-sm text-gray-300">
                            Please go to the <a href="https://dashboard.alchemy.com/" target="_blank" className="underline text-primary-400">Alchemy Dashboard</a>, select your App, and enable the network (e.g. BNB Mainnet) under "Network" settings.
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            Alternatively, switch your wallet to Ethereum Mainnet or Polygon.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    if (!assets) return null;

    const filteredTokens = assets.tokens.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredNfts = assets.nfts.filter(n =>
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.collectionName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 border border-border">
                <div className="flex bg-black/5 p-1 border border-border rounded-lg relative z-20">
                    <button
                        onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                        className="px-4 py-2 text-xs font-bold uppercase transition-all bg-primary text-primary-foreground shadow-sm flex items-center gap-2"
                    >
                        {getCurrentNetworkName()}
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isNetworkDropdownOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                    </button>

                    {isNetworkDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl max-h-[300px] overflow-y-auto">
                            <div className="p-1 space-y-0.5">
                                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">EVM Networks</div>
                                {[
                                    { id: 1, name: 'Ethereum' },
                                    { id: 59144, name: 'Linea' },
                                    { id: 324, name: 'ZkSync Era' },
                                    { id: 137, name: 'Polygon' },
                                    { id: 42161, name: 'Arbitrum' },
                                    { id: 10, name: 'Optimism' },
                                    { id: 8453, name: 'Base' },
                                    { id: 56, name: 'BNB Chain' },
                                    { id: 43114, name: 'Avalanche' },
                                    { id: 1101, name: 'Polygon zkEVM' },
                                    { id: 250, name: 'Fantom' },
                                ].map(net => (
                                    <button
                                        key={net.id}
                                        onClick={() => handleNetworkSelect(net.id)}
                                        className={`w-full text-left px-2 py-2 text-xs font-medium rounded-sm transition-colors ${selectedNetwork === net.id ? 'bg-primary/10 text-primary' : 'hover:bg-accent hover:text-accent-foreground'}`}
                                    >
                                        {net.name}
                                    </button>
                                ))}

                                <div className="my-1 border-t border-border"></div>
                                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Non-EVM</div>
                                <button
                                    onClick={() => handleNetworkSelect('solana')}
                                    className={`w-full text-left px-2 py-2 text-xs font-medium rounded-sm transition-colors ${selectedNetwork === 'solana' ? 'bg-[#9945FF]/10 text-[#9945FF]' : 'hover:bg-accent hover:text-accent-foreground'}`}
                                >
                                    Solana
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <p className="text-muted-foreground text-xs font-mono opacity-60">
                        {currentAddress?.slice(0, 10)}...{currentAddress?.slice(-6)}
                    </p>
                    {selectedNetwork === 'solana' && (
                        <div className="solana-button-container small scale-90">
                            <WalletMultiButton />
                        </div>
                    )}
                </div>
            </div>

            {/* Portfolio Insight Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-primary text-primary-foreground p-8 border border-border overflow-hidden relative group">
                <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99z" /></svg>
                </div>
                <div className="space-y-1 relative z-10">
                    <p className="text-sm font-medium uppercase tracking-[0.2em] opacity-80">Portfolio Balance</p>
                    <h2 className="text-5xl font-black tracking-tighter">
                        ${assets.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                </div>
                <div className="flex flex-wrap gap-4 relative z-10">
                    {selectedNetwork !== 'solana' && <GasTracker gasPrice={assets.gasPriceGwei} isRefetching={isRefetching} />}
                    <button
                        onClick={() => refetch()}
                        disabled={isRefetching}
                        className={`flex items-center gap-2 px-4 py-1 border border-primary-foreground/30 hover:bg-primary-foreground hover:text-primary transition-all text-xs font-bold uppercase tracking-widest ${isRefetching ? 'animate-pulse' : ''}`}
                    >
                        {isRefetching ? 'Syncing...' : 'Sync'}
                    </button>
                </div>
            </div>

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card p-6 border border-border shadow-sm flex justify-between items-start">
                    <div>
                        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Native Asset</p>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-foreground tracking-tight">
                                {Number(assets.nativeBalance.balance).toFixed(4)}
                            </span>
                            <span className="text-lg text-primary font-semibold">{assets.nativeBalance.symbol}</span>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <p className="text-muted-foreground text-sm font-mono">${(assets.nativeBalance.valueUsd || 0).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground/50 font-mono tracking-tighter">@ ${assets.nativeBalance.priceUsd}</p>
                    </div>
                </div>

                <div className="bg-card p-6 border border-border shadow-sm flex flex-col justify-center">
                    <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-2">Wallet Address</p>
                    <code className="text-foreground bg-muted px-3 py-2 font-mono text-sm break-all border border-border">
                        {currentAddress}
                    </code>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border">
                <div className="flex space-x-4">
                    <button
                        onClick={() => setActiveTab('tokens')}
                        className={`pb-3 px-4 text-lg font-medium transition-colors relative ${activeTab === 'tokens' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Tokens ({assets.tokens.length})
                        {activeTab === 'tokens' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('nfts')}
                        className={`pb-3 px-4 text-lg font-medium transition-colors relative ${activeTab === 'nfts' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        NFTs ({assets.nfts.length})
                        {activeTab === 'nfts' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`pb-3 px-4 text-lg font-medium transition-colors relative ${activeTab === 'activity' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Activity ({assets.transactions.length})
                        {activeTab === 'activity' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
                        )}
                    </button>
                </div>

                {(activeTab === 'tokens' || activeTab === 'nfts') && (
                    <div className="pb-2 md:pb-0">
                        <input
                            type="text"
                            placeholder="Search assets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-muted border border-border px-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-64"
                        />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'tokens' && (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredTokens.length === 0 ? (
                            <p className="text-muted-foreground text-center py-10">No tokens found.</p>
                        ) : (
                            filteredTokens.map((token) => (
                                <div
                                    key={token.contractAddress}
                                    className="bg-card p-4 flex items-center justify-between border border-border hover:border-primary/20 transition-all shadow-sm"
                                >
                                    <div className="flex items-center gap-4">
                                        {token.logo ? (
                                            <img src={token.logo} alt={token.name} className="w-10 h-10 bg-muted object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 bg-muted flex items-center justify-center text-xs font-bold font-mono text-muted-foreground">
                                                {token.symbol.slice(0, 2)}
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="text-foreground font-semibold">{token.name}</h4>
                                            <p className="text-muted-foreground text-sm uppercase">{token.symbol}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-foreground font-bold">{Number(token.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                                        <p className="text-muted-foreground text-[10px] font-mono">${(token.valueUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'nfts' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredNfts.length === 0 ? (
                            <p className="col-span-full text-muted-foreground text-center py-10">No NFTs found.</p>
                        ) : (
                            filteredNfts.map((nft) => (
                                <div
                                    key={`${nft.contractAddress}-${nft.tokenId}`}
                                    className="bg-card overflow-hidden border border-border hover:border-primary/30 transition-all hover:shadow-md"
                                >
                                    <div className="aspect-square bg-muted relative">
                                        {nft.imageUrl ? (
                                            <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                                                No Image
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 bg-background/90 px-2 py-1 text-xs text-foreground backdrop-blur-sm border border-border">
                                            {nft.type}
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <h4 className="text-foreground font-medium truncate" title={nft.name}>{nft.name}</h4>
                                        <p className="text-muted-foreground text-xs truncate uppercase tracking-tighter">{nft.collectionName || 'Unknown Collection'}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="space-y-3">
                        {assets.transactions.length === 0 ? (
                            <p className="text-muted-foreground text-center py-10">No recent activity found.</p>
                        ) : (
                            <>
                                {assets.transactions.slice(0, displayCount).map((tx) => (
                                    <div key={tx.hash} className="bg-card p-4 border border-border flex items-center justify-between text-sm shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 ${tx.type === 'incoming' ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-600'}`}>
                                                {tx.type === 'incoming' ?
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 14-7 7-7-7" /><path d="M12 3v18" /></svg> :
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18" /><path d="m5 10 7-7 7 7" /></svg>
                                                }
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">
                                                    {tx.type === 'incoming' ? 'From: ' : 'To: '}
                                                    <span className="font-mono font-normal opacity-60 ml-1">{tx.from === currentAddress ? tx.to.slice(0, 6) + '...' + tx.to.slice(-4) : tx.from.slice(0, 6) + '...' + tx.from.slice(-4)}</span>
                                                </p>
                                                <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" className="text-xs text-primary hover:underline font-mono">
                                                    {tx.hash.slice(0, 10)}...
                                                </a>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${tx.type === 'incoming' ? 'text-green-600' : 'text-orange-600'}`}>
                                                {tx.type === 'incoming' ? '+' : '-'}{Number(tx.value).toFixed(4)} {tx.asset}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {assets.transactions.length > displayCount && (
                                    <div ref={observerTarget} className="w-full flex flex-col items-center justify-center p-4 gap-2">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-border rounded-full animate-bounce delay-75"></div>
                                            <div className="w-1.5 h-1.5 bg-border rounded-full animate-bounce delay-150 mx-1"></div>
                                            <div className="w-1.5 h-1.5 bg-border rounded-full animate-bounce delay-200"></div>
                                        </div>
                                        <button
                                            onClick={() => setDisplayCount(prev => Math.min(prev + 5, assets.transactions.length))}
                                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            Load More
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
