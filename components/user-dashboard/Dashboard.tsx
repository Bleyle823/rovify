/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
    FiCalendar, FiClock, FiUsers, FiDollarSign, FiTrendingUp,
    FiTrendingDown, FiCamera, FiMessageSquare, FiShare2, FiAward
} from 'react-icons/fi';
import { formatEther } from 'viem';
import { IoFlash, IoSparkles, IoWallet, IoTicket } from "react-icons/io5";
import { useAccount, useBalance, useChainId } from 'wagmi';
import { useWeb3Events } from '@/contexts/Web3EventContext';

// All metrics below are derived from on-chain data via Web3EventContext & wagmi

// Enhanced StatCard component
const StatCard = ({ title, value, subtitle, icon, trend, className = "" }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    className?: string;
}) => (
    <motion.div
        className={`bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
    >
        <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-[#FF5900]/10 border border-[#FF5900]/20">
                {icon}
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                    trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                    {trend === 'up' && <FiTrendingUp className="w-4 h-4" />}
                    {trend === 'down' && <FiTrendingDown className="w-4 h-4" />}
                </div>
            )}
        </div>
        <div>
            <p className="text-3xl font-bold mb-1 text-gray-900">{value}</p>
            <p className="text-sm text-gray-600">{title}</p>
            {subtitle && <p className="text-xs mt-1 text-gray-500">{subtitle}</p>}
        </div>
    </motion.div>
);

export default function DashboardPage() {
    const router = useRouter();
    const [roomIdInput, setRoomIdInput] = useState('');
    const [joinError, setJoinError] = useState<string | null>(null);
    const { address, status } = useAccount();
    const chainId = useChainId();
    const { state, loadEvents, loadUserTickets } = useWeb3Events();
    const { data: nativeBalance } = useBalance({ address, query: { enabled: !!address } });

    // Load events and tickets when connected
    useEffect(() => {
        if (status === 'connected') {
            loadEvents();
            loadUserTickets();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const handleJoinLivestream = () => {
        const trimmed = roomIdInput.trim();
        if (!trimmed) {
            setJoinError('Please enter a valid Room ID');
            return;
        }
        setJoinError(null);
        const href = `/user-dashboard/livestream/${trimmed}?autoSign=1`;
        try {
            router.push(href);
            // Fallback in case router doesn't navigate due to segment guards
            setTimeout(() => {
                if (typeof window !== 'undefined' && window.location.pathname.indexOf(trimmed) === -1) {
                    window.location.href = href;
                }
            }, 200);
        } catch (_) {
            if (typeof window !== 'undefined') {
                window.location.href = href;
            }
        }
    };

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                    <div className="mb-6 lg:mb-0">
                        <motion.h1
                            className="text-4xl font-bold mb-3 text-gray-900"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            Welcome back{address ? `, ${address.slice(0, 6)}` : ''}! 👋
                        </motion.h1>
                        <motion.p
                            className="text-gray-600 text-lg mb-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            You have {state.events.length} events available on chain
                        </motion.p>
                        <motion.div
                            className="flex items-center gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="flex items-center gap-2">
                                <IoFlash className="w-5 h-5 text-[#FF5900]" />
                                <span className="font-semibold text-gray-700">{state.userTickets.length} tickets owned</span>
                            </div>
                            <div className="w-px h-6 bg-gray-300"></div>
                            <div className="flex items-center gap-2">
                                <IoSparkles className="w-5 h-5 text-[#FF5900]" />
                                <span className="font-semibold text-gray-700">{chainId ? `Chain ID ${chainId}` : 'Not connected'}</span>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        className="text-center lg:text-right"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <div className="text-3xl font-bold mb-2 text-gray-900">{nativeBalance ? Number(nativeBalance.formatted).toLocaleString(undefined, { maximumFractionDigits: 6 }) : 0} {nativeBalance?.symbol || ''}</div>
                            <div className="text-gray-600 mb-3">Wallet Balance</div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-[#FF5900] rounded-full h-2 transition-all duration-1000" style={{ width: `${Math.min(100, (Number(nativeBalance?.formatted || 0) / 10) * 100)}%` }}></div>
                            </div>
                            <div className="text-sm text-gray-600 mt-2">{state.userTickets.length} on-chain tickets</div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Events This Year"
                    value={state.events.length}
                    subtitle="+6 from last year"
                    icon={<FiCalendar className="w-6 h-6 text-[#FF5900]" />}
                    trend="up"
                />
                <StatCard
                    title="My Tickets"
                    value={state.userTickets.length}
                    subtitle="Owned on chain"
                    icon={<FiUsers className="w-6 h-6 text-[#FF5900]" />}
                    trend="up"
                />
                <StatCard
                    title="Wallet Value"
                    value={`${nativeBalance ? Number(nativeBalance.formatted).toLocaleString(undefined, { maximumFractionDigits: 6 }) : 0} ${nativeBalance?.symbol || ''}`}
                    subtitle={chainId ? `Chain ID ${chainId}` : 'Not connected'}
                    icon={<IoWallet className="w-6 h-6 text-[#FF5900]" />}
                    trend="up"
                />
                <StatCard
                    title="Events Available"
                    value={state.events.length}
                    subtitle="From EventFactory"
                    icon={<FiDollarSign className="w-6 h-6 text-[#FF5900]" />}
                    trend="neutral"
                />
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upcoming Events */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
                        <button className="text-[#FF5900] hover:text-[#FF5900]/90 font-medium text-sm">
                            View all
                        </button>
                    </div>
                    <div className="space-y-4">
                        {state.events.slice(0, 5).map((event: any, index: number) => (
                            <motion.div
                                key={event.id || index}
                                className="flex gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.01, x: 2 }}
                            >
                                <div className="flex w-full">
                                    <div style={{ width: 120, minWidth: 120, height: 80, position: 'relative' }}>
                                        <Image
                                            src={event.imageUrl || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop'}
                                            alt={event.name || 'Event'}
                                            className="w-full h-full object-cover rounded-lg"
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 33vw"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </div>
                                    <div className="flex-1 pl-4">
                                        <h3 className="font-semibold text-gray-900 mb-1">{event.name || 'Event'}</h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                            <div className="flex items-center gap-1">
                                                <FiCalendar className="w-4 h-4" />
                                                <span>{event.startTime ? new Date(event.startTime).toLocaleDateString() : '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FiClock className="w-4 h-4" />
                                                <span>{event.endTime ? new Date(event.endTime).toLocaleTimeString() : ''}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-[#FF5900]">{event.ticketPrice ? `${event.ticketPrice}` : ''}</span>
                                            <span className="text-xs bg-[#FF5900]/10 text-[#FF5900] px-2 py-1 rounded-full">
                                                {event.startTime ? Math.max(0, Math.ceil((new Date(event.startTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0} days
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions & Activity */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <motion.button
                                className="w-full bg-[#FF5900] text-white hover:bg-[#FF5900]/90 rounded-xl p-3 font-semibold transition-all duration-200 shadow-sm hover:shadow-sm transform hover:scale-105"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                🎯 Find Events
                            </motion.button>
                            <motion.button
                                className="w-full bg-[#FF5900] text-white hover:bg-[#FF5900]/90 rounded-xl p-3 font-semibold transition-all duration-200 shadow-sm hover:shadow-sm transform hover:scale-105"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                👥 Invite Friends
                            </motion.button>
                            <div className="space-y-2">
                                <input
                                    value={roomIdInput}
                                    onChange={(e) => setRoomIdInput(e.target.value)}
                                    placeholder="Enter Livestream Room ID"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FF5900] focus:border-transparent font-mono text-sm"
                                />
                                {joinError && (
                                    <div className="text-xs text-red-600">{joinError}</div>
                                )}
                                <motion.button
                                    onClick={handleJoinLivestream}
                                    disabled={!roomIdInput.trim()}
                                    className="w-full bg-[#FF5900] text-white hover:bg-[#FF5900]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl p-3 font-semibold transition-all duration-200 shadow-sm hover:shadow-sm transform hover:scale-105"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    📺 Join Livestream
                                </motion.button>
                                {roomIdInput.trim() && (
                                    <div className="text-xs text-gray-600">
                                        Or open directly: {' '}
                                        <Link
                                            className="text-[#FF5900] hover:underline"
                                            href={`/user-dashboard/livestream/${roomIdInput.trim()}?autoSign=1`}
                                        >
                                            /user-dashboard/livestream/{roomIdInput.trim()}
                                        </Link>
                                    </div>
                                )}
                            </div>
                            <Link href="/tickets?view=nft" className="block">
                                <motion.div
                                    className="w-full bg-[#FF5900] text-white hover:bg-[#FF5900]/90 rounded-xl p-3 font-semibold transition-all duration-200 shadow-sm hover:shadow-sm transform hover:scale-105 text-center"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    🎫 My Tickets
                                </motion.div>
                            </Link>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
                        <div className="space-y-3">
                            {[
                                { id: 'a1', type: 'tickets', user: 'You', event: `${state.userTickets.length} tickets owned`, time: 'now', icon: IoTicket },
                            ].slice(0, 4).map((activity, index) => (
                                <motion.div
                                    key={activity.id}
                                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div className="w-8 h-8 bg-[#FF5900]/20 rounded-full flex items-center justify-center">
                                        <activity.icon className="w-4 h-4 text-[#FF5900]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{activity.user} {activity.event}</p>
                                        <p className="text-xs text-gray-500">{activity.time}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}