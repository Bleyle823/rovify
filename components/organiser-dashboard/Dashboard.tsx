/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    FiCalendar, FiClock, FiUsers, FiDollarSign, FiTrendingUp,
    FiTrendingDown, FiEye, FiMessageSquare, FiShare2, FiAward,
    FiMapPin, FiPlus, FiArrowUpRight, FiTarget, FiZap, FiStar
} from 'react-icons/fi';
import { IoFlash, IoSparkles, IoWallet, IoTicket, IoTrendingUp } from "react-icons/io5";
import { HiOutlineSparkles, HiOutlineFire } from "react-icons/hi2";
import { BsTicketPerforated, BsLightningCharge } from "react-icons/bs";
import { useAccount, useBalance, useChainId } from 'wagmi';
import { useWeb3Events } from '@/contexts/Web3EventContext';

// Quick stats will be derived from on-chain data
const buildQuickStats = (eventsCount: number, ticketsOwned: number, walletPretty: string) => ([
    {
        id: 'wallet',
        title: 'Wallet Balance',
        value: walletPretty,
        change: '+0.0%',
        trend: 'up' as const,
        icon: <FiDollarSign className="w-6 h-6" />,
        color: 'from-emerald-500 to-green-600',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-600'
    },
    {
        id: 'events',
        title: 'Active Events',
        value: String(eventsCount),
        change: '+0',
        trend: 'up' as const,
        icon: <BsTicketPerforated className="w-6 h-6" />,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600'
    },
    {
        id: 'tickets',
        title: 'Tickets Owned',
        value: String(ticketsOwned),
        change: '+0',
        trend: 'up' as const,
        icon: <FiUsers className="w-6 h-6" />,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-600'
    },
    {
        id: 'rating',
        title: 'Avg Rating',
        value: '—',
        change: '+0.0',
        trend: 'up' as const,
        icon: <FiStar className="w-6 h-6" />,
        color: 'from-amber-500 to-orange-500',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-600'
    }
]);

const mockUpcomingEvents = [
    {
        id: 'event1',
        title: 'AI & Machine Learning Summit 2025',
        date: '2025-07-15',
        time: '9:00 AM',
        image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop',
        location: 'Tech Convention Center',
        price: 299,
        attendees: 847,
        capacity: 1000,
        daysUntil: 24,
        status: 'selling_fast',
        category: 'Technology'
    },
    {
        id: 'event2',
        title: 'Electronic Music Festival',
        date: '2025-07-28',
        time: '6:00 PM',
        image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop',
        location: 'Downtown Arena',
        price: 129,
        attendees: 1247,
        capacity: 2000,
        daysUntil: 37,
        status: 'on_sale',
        category: 'Music'
    },
    {
        id: 'event3',
        title: 'Startup Pitch Competition',
        date: '2025-08-05',
        time: '2:00 PM',
        image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
        location: 'Innovation Hub',
        price: 89,
        attendees: 156,
        capacity: 200,
        daysUntil: 45,
        status: 'new',
        category: 'Business'
    }
];

const mockRecentActivity = [
    { id: '1', type: 'ticket_sale', event: 'AI Summit', amount: '$299', time: '2 min ago', icon: IoTicket },
    { id: '2', type: 'new_registration', event: 'Music Festival', count: '5 attendees', time: '15 min ago', icon: FiUsers },
    { id: '3', type: 'review_received', event: 'Tech Meetup', rating: '5 stars', time: '1 hour ago', icon: FiStar },
    { id: '4', type: 'milestone_reached', event: 'Startup Pitch', milestone: '100 registrations', time: '3 hours ago', icon: FiTarget },
    { id: '5', type: 'payment_received', event: 'Music Festival', amount: '$1,547', time: '5 hours ago', icon: FiDollarSign }
];

const buildTrendingMetrics = (eventsCount: number, ticketsOwned: number, balancePretty: string) => ([
    { label: 'Active Events', value: String(eventsCount), change: '+0', trend: 'up' },
    { label: 'Tickets Owned', value: String(ticketsOwned), change: '+0', trend: 'up' },
    { label: 'Wallet', value: balancePretty, change: '+0', trend: 'up' },
    { label: 'On-chain Items', value: String(eventsCount + ticketsOwned), change: '+0', trend: 'up' }
]);

// Clean StatCard component - 2025 design
const StatCard = ({
    stat,
    index,
    gradient = false
}: {
    stat: ReturnType<typeof buildQuickStats>[number],
    index: number,
    gradient?: boolean
}) => (
    <motion.div
        className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.bgColor} ${stat.textColor}`}>
                {stat.icon}
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${stat.trend === 'up' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                {stat.trend === 'up' ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
                {stat.change}
            </div>
        </div>
        <div>
            <p className="text-3xl font-bold mb-1 text-gray-900">{stat.value}</p>
            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
        </div>
    </motion.div>
);

// EventCard component - Clean 2025 design
const EventCard = ({ event, index }: { event: typeof mockUpcomingEvents[0], index: number }) => {
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'selling_fast':
                return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <HiOutlineFire className="w-3 h-3" /> };
            case 'new':
                return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: <HiOutlineSparkles className="w-3 h-3" /> };
            default:
                return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: <IoTrendingUp className="w-3 h-3" /> };
        }
    };

    const statusStyle = getStatusStyle(event.status);
    const fillPercentage = (event.attendees / event.capacity) * 100;

    return (
        <motion.div
            className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <div className="flex gap-4">
                <div className="relative flex-shrink-0">
                    <div style={{ width: 100, height: 80, position: 'relative' }}>
                        <Image
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover rounded-xl"
                            fill
                            sizes="100px"
                        />
                    </div>
                    <div className={`absolute -top-2 -right-2 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm`}>
                        {statusStyle.icon}
                        {event.status.replace('_', ' ')}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-orange-600 transition-colors">
                            {event.title}
                        </h3>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                            {event.daysUntil} days
                        </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                            <FiCalendar className="w-4 h-4" />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <FiClock className="w-4 h-4" />
                            <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <FiMapPin className="w-4 h-4" />
                            <span className="truncate">{event.location}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-lg font-bold text-orange-600">${event.price}</span>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FiUsers className="w-4 h-4" />
                                <span>{event.attendees}/{event.capacity}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${fillPercentage}%` }}
                                    transition={{ delay: index * 0.2, duration: 1 }}
                                />
                            </div>
                            <span className="text-xs text-gray-500">{Math.round(fillPercentage)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default function Dashboard() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const { address, status } = useAccount();
    const chainId = useChainId();
    const { data: nativeBalance } = useBalance({ address, query: { enabled: !!address } });
    const { state, loadEvents, loadUserTickets } = useWeb3Events();

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (status === 'connected') {
            loadEvents();
            loadUserTickets();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    return (
        <div className="space-y-6">
            {/* Hero Section - Clean 2025 Design */}
            <motion.div
                className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                                <IoSparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    Welcome back{address ? `, ${address.slice(0, 6)}...${address.slice(-4)}` : ''}! 👋
                                </h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    {state.events.length} active events • {state.userTickets.length} tickets owned
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm">
                                <BsLightningCharge className="w-4 h-4 text-gray-700" />
                                <span className="font-medium text-gray-700">Chain {chainId || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-sm">
                                <FiCalendar className="w-4 h-4 text-orange-700" />
                                <span className="font-medium text-orange-700">{state.events.length} events</span>
                            </div>
                            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-sm">
                                <IoTicket className="w-4 h-4 text-blue-700" />
                                <span className="font-medium text-blue-700">{state.userTickets.length} tickets</span>
                            </div>
                        </div>
                    </div>

                    <div className="lg:text-right">
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 rounded-2xl p-6 lg:min-w-[280px]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Wallet Balance</span>
                                <IoWallet className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                                {nativeBalance ? Number(nativeBalance.formatted).toLocaleString(undefined, { maximumFractionDigits: 4 }) : 0}
                            </div>
                            <div className="text-sm font-medium text-gray-600 mb-3">{nativeBalance?.symbol || 'ETH'}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full" style={{ width: '45%' }}></div>
                                </div>
                                <span className="font-medium">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {buildQuickStats(
                    state.events.length,
                    state.userTickets.length,
                    `${nativeBalance ? Number(nativeBalance.formatted).toLocaleString(undefined, { maximumFractionDigits: 6 }) : 0} ${nativeBalance?.symbol || ''}`
                ).map((stat, index) => (
                    <StatCard
                        key={stat.id}
                        stat={stat}
                        index={index}
                        gradient={index === 0}
                    />
                ))}
            </div>

            {/* Trending Metrics */}
            <motion.div
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                        Trending Metrics
                    </h2>
                    <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">Last 30 days</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {buildTrendingMetrics(
                        state.events.length,
                        state.userTickets.length,
                        `${nativeBalance ? Number(nativeBalance.formatted).toLocaleString(undefined, { maximumFractionDigits: 6 }) : 0} ${nativeBalance?.symbol || ''}`
                    ).map((metric, index) => (
                        <motion.div
                            key={metric.label}
                            className="p-4 bg-gray-50 border border-gray-200 rounded-xl"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                        >
                            <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                            <div className="text-sm text-gray-600 mb-2">{metric.label}</div>
                            <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg text-green-700 bg-green-50">
                                <FiTrendingUp className="w-3 h-3" />
                                {metric.change}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Events Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Upcoming Events */}
                    <motion.div
                        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                                Upcoming Events
                            </h2>
                            <div className="flex items-center gap-3 flex-wrap">
                                <button
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all shadow-sm"
                                    onClick={() => window.location.href = '/organiser-dashboard/events/create-nft'}
                                >
                                    <HiOutlineSparkles className="w-4 h-4" />
                                    <span className="hidden sm:inline">NFT Event</span>
                                </button>
                                {/* Removed secondary Create Event button as requested */}
                                <button className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center gap-1">
                                    View all
                                    <FiArrowUpRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {state.events.slice(0, 5).map((event: any, index: number) => (
                                <EventCard key={event.id || index} event={{
                                    id: String(event.id || index),
                                    title: event.name || 'Event',
                                    date: event.startTime ? new Date(event.startTime).toISOString().slice(0,10) : '',
                                    time: event.endTime ? new Date(event.endTime).toLocaleTimeString() : '',
                                    image: event.imageUrl || 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop',
                                    location: event.location || '—',
                                    price: Number(event.ticketPrice || 0),
                                    attendees: event.ticketsSold || 0,
                                    capacity: event.availableTickets || 0,
                                    daysUntil: event.startTime ? Math.max(0, Math.ceil((new Date(event.startTime).getTime() - Date.now()) / (1000*60*60*24))) : 0,
                                    status: 'on_sale',
                                    category: 'General',
                                }} index={index} />
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Sidebar Content */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <motion.div
                        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-5 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                            Quick Actions
                        </h3>
                        <div className="space-y-2">
                            {[
                                { label: 'Create NFT Event', icon: '✨', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', href: '/organiser-dashboard/events/create-nft' },
                                { label: 'View Analytics', icon: '📊', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', href: '/organiser-dashboard/analytics' },
                                { label: 'Check Payments', icon: '💰', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', href: '/organiser-dashboard/payments' },
                                { label: 'Marketing Tools', icon: '📱', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', href: '/organiser-dashboard/marketing' }
                            ].map((action, index) => (
                                <button
                                    key={action.label}
                                    className={`w-full ${action.bg} ${action.text} border ${action.border} hover:bg-opacity-70 rounded-xl p-3 font-medium transition-all text-sm text-left flex items-center gap-2`}
                                    onClick={() => window.location.href = action.href}
                                >
                                    <span>{action.icon}</span>
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div
                        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-5 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                            Recent Activity
                        </h3>
                        <div className="space-y-3">
                            {[
                                { id: '1', type: 'events', event: `${state.events.length} events active`, amount: '', time: 'now', icon: FiCalendar },
                                { id: '2', type: 'tickets', event: `${state.userTickets.length} tickets owned`, amount: '', time: 'now', icon: IoTicket },
                                { id: '3', type: 'wallet', event: `${nativeBalance ? Number(nativeBalance.formatted).toLocaleString(undefined, { maximumFractionDigits: 6 }) : 0} ${nativeBalance?.symbol || ''} balance`, amount: '', time: chainId ? `Chain ${chainId}` : '—', icon: IoWallet },
                            ].map((activity, index) => (
                                <div
                                    key={activity.id}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
                                >
                                    <div className="w-10 h-10 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center">
                                        <activity.icon className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {activity.event}
                                        </p>
                                        {activity.amount && (
                                            <p className="text-xs text-gray-600 truncate">
                                                {activity.amount}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}