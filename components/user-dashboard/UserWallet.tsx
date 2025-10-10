// app/dashboard/wallet/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiCopy, FiPlus, FiSend, FiRefreshCcw, FiArrowDown, FiTrendingUp
} from 'react-icons/fi';
import { FaEthereum, FaBitcoin } from "react-icons/fa";
import { IoTicket, IoWallet } from "react-icons/io5";
import { useAccount, useBalance, useChainId, usePublicClient, useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { getContract } from '@/contracts';
import { useWeb3Events } from '@/contexts/Web3EventContext';

// Lightweight currency formatter for display; USD conversion omitted for now
const formatNumber = (n: number | string) => {
    const num = typeof n === 'string' ? Number(n) : n;
    if (Number.isNaN(num)) return '0';
    return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
};

export default function WalletPage() {
    const [walletTab, setWalletTab] = useState<'overview' | 'transactions' | 'portfolio'>('overview');
    const { address, status } = useAccount();
    const chainId = useChainId();
    const publicClient = usePublicClient();
    const { state: web3State } = useWeb3Events();

    // Native balance (ETH or chain native)
    const { data: nativeBalance } = useBalance({
        address,
        query: { enabled: !!address },
    });

    // Try to read RovifyToken ERC20 balance if deployed on active chain
    const rovifyToken = useMemo(() => {
        try {
            if (!chainId) return null;
            const c = getContract('RovifyToken', chainId);
            if (!c?.address) return null;
            return c;
        } catch {
            return null;
        }
    }, [chainId]);

    // ERC-20 reads
    const { data: tokenDecimals } = useReadContract({
        address: rovifyToken?.address as `0x${string}` | undefined,
        abi: erc20Abi,
        functionName: 'decimals',
        query: { enabled: !!rovifyToken?.address },
    });
    const { data: tokenSymbol } = useReadContract({
        address: rovifyToken?.address as `0x${string}` | undefined,
        abi: erc20Abi,
        functionName: 'symbol',
        query: { enabled: !!rovifyToken?.address },
    });
    const { data: tokenBalance } = useReadContract({
        address: rovifyToken?.address as `0x${string}` | undefined,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address as `0x${string}`] : undefined,
        query: { enabled: !!rovifyToken?.address && !!address },
    });

    // Derive portfolio items from real balances
    const portfolio = useMemo(() => {
        const items: { symbol: string; name: string; amount: number; value: number; change: number }[] = [];
        const nativeAmt = nativeBalance ? Number(nativeBalance.formatted) : 0;
        items.push({ symbol: 'ETH', name: 'Ethereum', amount: nativeAmt, value: nativeAmt, change: 0 });
        // Append ERC-20 if available
        if (rovifyToken && tokenBalance !== undefined) {
            const dec = typeof tokenDecimals === 'number' ? tokenDecimals : Number(tokenDecimals ?? 18);
            const raw = typeof tokenBalance === 'bigint' ? tokenBalance : BigInt(tokenBalance ?? 0);
            const denom = Math.pow(10, dec);
            const formatted = Number(raw) / denom;
            items.push({ symbol: (tokenSymbol as string) || 'RVFY', name: 'RovifyToken', amount: formatted, value: formatted, change: 0 });
        }
        return items;
    }, [nativeBalance, rovifyToken, tokenBalance, tokenDecimals, tokenSymbol]);

    const totalPortfolioNative = useMemo(() => {
        return portfolio.reduce((sum, it) => sum + it.value, 0);
    }, [portfolio]);

    const displayAddress = address || '0x0000000000000000000000000000000000000000';
    const connected = status === 'connected';
    const networkLabel = chainId ? `Chain ID ${chainId}` : 'Not connected';

    return (
        <div className="space-y-8">
            {/* Wallet Header */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5900]/5 rounded-full blur-3xl"></div>

                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 text-gray-900">Wallet Overview</h1>
                        <p className="text-gray-600 mb-4">Manage your crypto assets and transactions</p>
                        <div className="flex items-center gap-2 text-sm">
                            <div className={`w-2 h-2 ${connected ? 'bg-green-400' : 'bg-gray-400'} rounded-full animate-pulse`}></div>
                            <span>{connected ? `Connected • ${networkLabel}` : 'Wallet not connected'}</span>
                        </div>
                    </div>
                    <div className="mt-6 lg:mt-0">
                        <div className="bg-[#FF5900]/10 border border-[#FF5900]/20 rounded-2xl p-6">
                            <div className="text-3xl font-bold mb-1 text-gray-900">{formatNumber(totalPortfolioNative)} {nativeBalance?.symbol || 'ETH'}</div>
                            <div className="text-gray-600 text-sm">Total Portfolio (native)</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wallet Navigation */}
            <div className="bg-white rounded-xl p-2 border border-gray-100 flex overflow-x-auto">
                {(['overview', 'transactions', 'portfolio'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setWalletTab(tab)}
                        className={`px-6 py-3 rounded-lg font-medium transition-all flex-1 min-w-0 ${walletTab === tab
                            ? 'bg-[#FF5900] text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Wallet Content */}
            <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={walletTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="h-full"
                    >
                        {walletTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Portfolio Summary */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6">Asset Breakdown</h3>
                                        <div className="space-y-4">
                                            {portfolio.map((asset, index) => (
                                                <motion.div
                                                    key={asset.symbol}
                                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-[#FF5900] rounded-full flex items-center justify-center">
                                                            {asset.symbol === 'ETH' && <FaEthereum className="w-6 h-6 text-white" />}
                                                            {asset.symbol === 'BTC' && <FaBitcoin className="w-6 h-6 text-white" />}
                                                            {asset.symbol === 'USDC' && <span className="text-white font-bold">$</span>}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">{asset.symbol}</h4>
                                                            <p className="text-sm text-gray-600">{asset.name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-gray-900">{formatNumber(asset.value)} {asset.symbol}</p>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-sm text-gray-600">{formatNumber(asset.amount)}</span>
                                                            <span className={`text-sm font-medium ${asset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {asset.change >= 0 ? '+' : ''}{asset.change}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recent Activity */}
                                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                                        <div className="space-y-4">
                                            {[
                                                { action: `${web3State.userTickets.length} tickets owned`, event: 'Rovify Tickets', time: 'now', type: 'nft' },
                                            ].map((activity, index) => (
                                                <motion.div
                                                    key={index}
                                                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'nft' ? 'bg-purple-100' :
                                                        activity.type === 'defi' ? 'bg-blue-100' : 'bg-green-100'
                                                        }`}>
                                                        {activity.type === 'nft' && <IoTicket className="w-5 h-5 text-purple-600" />}
                                                        {activity.type === 'defi' && <IoWallet className="w-5 h-5 text-blue-600" />}
                                                        {activity.type === 'swap' && <FiRefreshCcw className="w-5 h-5 text-green-600" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{activity.action}</p>
                                                        <p className="text-sm text-gray-600">{activity.event}</p>
                                                    </div>
                                                    <span className="text-sm text-gray-500">{activity.time}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                        <h3 className="font-bold text-gray-900 mb-6">Quick Actions</h3>
                                        <div className="space-y-4">
                                            <motion.button
                                                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 font-semibold hover:shadow-lg transition-all"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <FiPlus className="w-5 h-5 mr-2 inline" />
                                                Add Funds
                                            </motion.button>
                                            <motion.button
                                                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 font-semibold hover:shadow-lg transition-all"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <FiSend className="w-5 h-5 mr-2 inline" />
                                                Send Crypto
                                            </motion.button>
                                            <motion.button
                                                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 font-semibold hover:shadow-lg transition-all"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <FiRefreshCcw className="w-5 h-5 mr-2 inline" />
                                                Swap Tokens
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Wallet Info */
                                    }
                                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                        <h3 className="font-bold text-gray-900 mb-4">Wallet Info</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Address</span>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(displayAddress)}
                                                    className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
                                                >
                                                    <span className="font-mono">
                                                        {displayAddress.slice(0, 6)}...{displayAddress.slice(-4)}
                                                    </span>
                                                    <FiCopy className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Network</span>
                                                <span className="font-medium">{networkLabel}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Status</span>
                                                <span className={`${connected ? 'text-green-600' : 'text-gray-600'} font-medium`}>{connected ? 'Connected' : 'Disconnected'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {walletTab === 'transactions' && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Transaction History</h3>
                                <div className="space-y-4">
                                    {[] /* TODO: Replace with on-chain history or app events */.map((tx, index) => (
                                        <motion.div
                                            key={index}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-blue-100`}>
                                                    <FiArrowDown className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Activity</h4>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <span>{new Date().toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <button className="text-orange-600 hover:underline">—</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-semibold text-gray-900`}>—</p>
                                                <p className="text-sm text-gray-600">—</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {walletTab === 'portfolio' && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Portfolio Performance</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-green-50 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-600">24h Change</span>
                                            <FiTrendingUp className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div className="text-2xl font-bold text-green-600">+$127.50</div>
                                        <div className="text-sm text-green-600">+3.1%</div>
                                    </div>
                                    <div className="bg-blue-50 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-600">7d Change</span>
                                            <FiTrendingUp className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="text-2xl font-bold text-blue-600">+$445.20</div>
                                        <div className="text-sm text-blue-600">+11.7%</div>
                                    </div>
                                    <div className="bg-purple-50 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-600">30d Change</span>
                                            <FiTrendingUp className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div className="text-2xl font-bold text-purple-600">+$892.75</div>
                                        <div className="text-sm text-purple-600">+26.6%</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}