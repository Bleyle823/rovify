'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWeb3Events } from '@/contexts/Web3EventContext';
import {
    FiUser, FiCalendar, FiClock, FiMapPin, FiShare2,
    FiDownload, FiEye, FiRefreshCw, FiAward, FiZap
} from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi2';
import { BsTicketPerforated } from 'react-icons/bs';

export default function NFTTicketsView() {
    const { address } = useAccount();
    const { state, loadUserTickets } = useWeb3Events();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (address) {
            loadUserTickets();
        }
    }, [address, loadUserTickets]);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            await loadUserTickets();
        } finally {
            setLoading(false);
        }
    };

    if (!address) {
        return (
            <div className="min-h-96 flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-3xl">
                <motion.div 
                    className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BsTicketPerforated className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">Connect Wallet</h3>
                    <p className="text-gray-600 mb-6">
                        Connect your wallet to view your NFT tickets
                    </p>
                    <div className="flex justify-center">
                        <ConnectButton />
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <BsTicketPerforated className="w-7 h-7 text-orange-500" />
                        My NFT Tickets
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Your blockchain-verified event tickets
                    </p>
                </div>
                
                <motion.button
                    onClick={handleRefresh}
                    disabled={loading || state.loading}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <FiRefreshCw className={`w-4 h-4 ${loading || state.loading ? 'animate-spin' : ''}`} />
                    Refresh
                </motion.button>
            </div>

            {/* Tickets Grid */}
            {state.loading && state.userTickets.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded mb-4"></div>
                            <div className="h-3 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded mb-4"></div>
                            <div className="h-8 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : state.userTickets.length === 0 ? (
                <motion.div
                    className="text-center py-20 bg-white rounded-3xl border border-gray-100"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BsTicketPerforated className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No NFT Tickets Yet</h3>
                    <p className="text-gray-600 mb-6">
                        Create events and mint NFT tickets to see them here
                    </p>
                    <motion.button
                        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.location.href = '/organiser-dashboard/events/create-nft'}
                    >
                        Create NFT Event
                    </motion.button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {state.userTickets.map((ticket, index) => (
                        <motion.div
                            key={ticket.id}
                            className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                        >
                            {/* Background Pattern */}
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            {/* NFT Badge */}
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <HiOutlineSparkles className="w-3 h-3" />
                                NFT
                            </div>

                            <div className="relative">
                                {/* Ticket Header */}
                                <div className="mb-4">
                                    <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                                        {ticket.eventTitle}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                                            {ticket.ticketType}
                                        </span>
                                        <span className={`text-sm px-2 py-1 rounded-full font-medium ${
                                            ticket.isUsed 
                                                ? 'bg-gray-100 text-gray-600' 
                                                : 'bg-green-100 text-green-700'
                                        }`}>
                                            {ticket.isUsed ? 'Used' : 'Active'}
                                        </span>
                                    </div>
                                </div>

                                {/* Ticket Details */}
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <FiUser className="w-4 h-4" />
                                        <span>Token ID: #{ticket.tokenId}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <FiCalendar className="w-4 h-4" />
                                        <span>Event #{ticket.eventId}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <FiClock className="w-4 h-4" />
                                        <span>Minted: {new Date(ticket.purchaseTime * 1000).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <FiZap className="w-4 h-4" />
                                        <span>{ticket.isTransferable ? 'Transferable' : 'Non-transferable'}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <motion.button
                                        className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 px-4 rounded-xl font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <FiEye className="w-4 h-4" />
                                        View
                                    </motion.button>
                                    <motion.button
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-xl transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <FiShare2 className="w-4 h-4" />
                                    </motion.button>
                                    <motion.button
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-xl transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <FiDownload className="w-4 h-4" />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Error Display */}
            {state.error && (
                <motion.div
                    className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">!</span>
                    </div>
                    <div className="text-red-700">{state.error}</div>
                </motion.div>
            )}
        </div>
    );
}
