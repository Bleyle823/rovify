'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiChevronRight, FiTrendingUp, FiClock, FiCalendar, FiTarget, FiHeart, FiMapPin,
    FiDollarSign, FiSearch, FiArrowRight, FiPlus, FiStar, FiUsers, FiTag,
    FiNavigation, FiX, FiLoader, FiCheck, FiAlertCircle, FiCompass, FiZap,
    FiFilter, FiMaximize2, FiMinimize2, FiPlay, FiMusic, FiCoffee, FiWifi, FiMenu,
    FiMoreHorizontal, FiBookmark, FiShare, FiGrid, FiList, FiEye, FiSliders
} from 'react-icons/fi';
import {
    BsDroplet, BsLightningCharge, BsBuilding, BsTree, BsFlag, BsWater,
    BsDoorOpen, BsUmbrella, BsHouseDoor, BsMusicNote, BsBrush,
    BsCameraVideo, BsGlobe, BsGem, BsStars, BsMagic, BsFire, BsTicket,
    BsCardImage, BsCollection, BsDiamond
} from 'react-icons/bs';
import { FaMountainSun } from 'react-icons/fa6';
import { IoGameControllerOutline, IoTicketOutline, IoSparkles } from 'react-icons/io5';
import { GiPartyPopper } from 'react-icons/gi';
import EchoChatWidget from './EchoChatWidget';
import EventMapWidget from './EventMapWidget';
import { useWeb3Events } from '@/contexts/Web3EventContext';
import { useAccount, useChainId } from 'wagmi';
import { getBestIpfsUrl } from '@/utils/ipfs';
import { useError } from '@/context/ErrorContext';
import { useApiClient } from '@/lib/enhanced-api-client';
import AsyncState, { useAsyncState } from '@/components/AsyncState';
import LoadingSpinner, { SkeletonCard } from '@/components/LoadingSpinner';

// Types
interface Event {
    id: string;
    title: string;
    image: string;
    date: Date;
    location: {
        name: string;
        address: string;
        coordinates: { lat: number; lng: number; }
    };
    price: { min: string; max?: string; amount: number };
    attendees: number;
    category: string;
    creator: {
        name: string;
        avatar: string;
        verified: boolean;
    };
    description: string;
    tags: string[];
    isLive?: boolean;
    isNFT?: boolean;
    isVerified?: boolean;
}

interface Category {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    count: number;
}

const CATEGORIES: Category[] = [
    { id: 'music', name: 'Music', icon: <BsMusicNote />, color: 'text-purple-600', bgColor: 'bg-purple-100', count: 124 },
    { id: 'tech', name: 'Tech', icon: <FiZap />, color: 'text-blue-600', bgColor: 'bg-blue-100', count: 89 },
    { id: 'art', name: 'Art', icon: <BsBrush />, color: 'text-pink-600', bgColor: 'bg-pink-100', count: 67 },
    { id: 'gaming', name: 'Gaming', icon: <IoGameControllerOutline />, color: 'text-green-600', bgColor: 'bg-green-100', count: 45 },
    { id: 'sports', name: 'Sports', icon: <FiTarget />, color: 'text-orange-600', bgColor: 'bg-orange-100', count: 78 },
    { id: 'food', name: 'Food & Drink', icon: <FiCoffee />, color: 'text-yellow-600', bgColor: 'bg-yellow-100', count: 56 },
    { id: 'wellness', name: 'Wellness', icon: <FiHeart />, color: 'text-red-600', bgColor: 'bg-red-100', count: 34 },
    { id: 'business', name: 'Business', icon: <BsBuilding />, color: 'text-gray-600', bgColor: 'bg-gray-100', count: 92 },
];

export default function EnhancedHomePage() {
    const { showError, showSuccess, showInfo } = useError();
    const apiClient = useApiClient();
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    
    // Fix: Access Web3Events state properly
    const { state: web3State } = useWeb3Events();
    const web3Events = web3State.events;
    const web3Loading = web3State.loading;
    const web3Error = web3State.error;

    // State management
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState<'date' | 'price' | 'popularity'>('date');

    // Async state for events
    const {
        data: events,
        isLoading: eventsLoading,
        error: eventsError,
        execute: loadEvents,
        reset: resetEvents
    } = useAsyncState<Event[]>();

    // Load events on component mount
    useEffect(() => {
        loadEvents(loadEventsData);
    }, [selectedCategory, sortBy]);

    const loadEventsData = useCallback(async () => {
        try {
            const response = await apiClient.get('/api/events', {
                showErrorToast: false,
            }) as { data?: any[]; error?: string };

            if (response.error) {
                throw new Error(response.error);
            }

            // Transform the data to match our Event interface
            const transformedEvents = (response.data || []).map((event: any) => ({
                id: event.id,
                title: event.title,
                image: event.image || '/images/placeholder-event.jpg',
                date: new Date(event.date),
                location: {
                    name: event.location?.name || 'TBA',
                    address: event.location?.address || '',
                    coordinates: event.location?.coordinates || { lat: 0, lng: 0 }
                },
                price: {
                    min: event.price?.min || 'Free',
                    max: event.price?.max,
                    amount: event.price?.amount || 0
                },
                attendees: event.attendees || 0,
                category: event.category || 'general',
                creator: {
                    name: event.creator?.name || 'Unknown',
                    avatar: event.creator?.avatar || '/images/placeholder-avatar.jpg',
                    verified: event.creator?.verified || false
                },
                description: event.description || '',
                tags: event.tags || [],
                isLive: event.isLive || false,
                isNFT: event.isNFT || false,
                isVerified: event.isVerified || false
            }));

            return transformedEvents;
        } catch (error) {
            console.error('Failed to load events:', error);
            throw error;
        }
    }, [apiClient, selectedCategory, sortBy]);

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;

        try {
            const response = await apiClient.get(`/api/events?search=${encodeURIComponent(searchQuery)}`, {
                showErrorToast: false,
            }) as { data?: any[]; error?: string };

            if (response.error) {
                throw new Error(response.error);
            }

            // Update events with search results
            const transformedEvents = (response.data || []).map((event: any) => ({
                id: event.id,
                title: event.title,
                image: event.image || '/images/placeholder-event.jpg',
                date: new Date(event.date),
                location: {
                    name: event.location?.name || 'TBA',
                    address: event.location?.address || '',
                    coordinates: event.location?.coordinates || { lat: 0, lng: 0 }
                },
                price: {
                    min: event.price?.min || 'Free',
                    max: event.price?.max,
                    amount: event.price?.amount || 0
                },
                attendees: event.attendees || 0,
                category: event.category || 'general',
                creator: {
                    name: event.creator?.name || 'Unknown',
                    avatar: event.creator?.avatar || '/images/placeholder-avatar.jpg',
                    verified: event.creator?.verified || false
                },
                description: event.description || '',
                tags: event.tags || [],
                isLive: event.isLive || false,
                isNFT: event.isNFT || false,
                isVerified: event.isVerified || false
            }));

            // Update the async state with search results
            loadEvents(async () => transformedEvents);
        } catch (error) {
            console.error('Search failed:', error);
            showError('Search Failed', 'Unable to search events. Please try again.');
            throw error;
        }
    }, [searchQuery, apiClient, showError, loadEvents]);

    const handleCategorySelect = useCallback((categoryId: string | null) => {
        setSelectedCategory(categoryId);
        if (categoryId) {
            showInfo('Filter Applied', `Showing events in ${CATEGORIES.find(c => c.id === categoryId)?.name} category`);
        }
    }, [showInfo]);

    const handleEventClick = useCallback((event: Event) => {
        showSuccess('Event Selected', `Opening ${event.title}`);
        // Navigate to event details
        window.location.href = `/events/${event.id}`;
    }, [showSuccess]);

    const filteredEvents = events?.filter(event => {
        if (selectedCategory && event.category !== selectedCategory) {
            return false;
        }
        if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        return true;
    }) || [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        {/* Welcome Section */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Welcome to Rovify
                            </h1>
                            <p className="text-gray-600">
                                Discover amazing events and connect with creators worldwide
                            </p>
                        </div>

                        {/* Search and Actions */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search Bar */}
                            <div className="relative flex-1 max-w-md">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiSearch className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search events..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-colors"
                                />
                            </div>

                            {/* View Toggle */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-colors ${
                                        viewMode === 'grid' ? 'bg-[#FF5722] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <FiGrid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-colors ${
                                        viewMode === 'list' ? 'bg-[#FF5722] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <FiList className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <FiFilter className="w-4 h-4" />
                        Filters
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                    {CATEGORIES.map((category) => (
                        <motion.button
                            key={category.id}
                            onClick={() => handleCategorySelect(selectedCategory === category.id ? null : category.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`p-4 rounded-xl text-center transition-all ${
                                selectedCategory === category.id
                                    ? 'bg-[#FF5722] text-white shadow-lg'
                                    : 'bg-white hover:shadow-md border border-gray-200'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2 ${
                                selectedCategory === category.id ? 'bg-white/20' : category.bgColor
                            }`}>
                                <span className={`text-xl ${
                                    selectedCategory === category.id ? 'text-white' : category.color
                                }`}>
                                    {category.icon}
                                </span>
                            </div>
                            <div className="text-sm font-medium">{category.name}</div>
                            <div className="text-xs opacity-75">{category.count} events</div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Events Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {selectedCategory ? `${CATEGORIES.find(c => c.id === selectedCategory)?.name} Events` : 'All Events'}
                    </h2>
                    <div className="flex items-center gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'date' | 'price' | 'popularity')}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-colors"
                        >
                            <option value="date">Sort by Date</option>
                            <option value="price">Sort by Price</option>
                            <option value="popularity">Sort by Popularity</option>
                        </select>
                    </div>
                </div>

                {/* Events Grid/List */}
                <AsyncState
                    isLoading={eventsLoading}
                    error={eventsError}
                    isEmpty={!eventsLoading && filteredEvents.length === 0}
                    emptyMessage="No events found"
                    onRetry={() => loadEvents(loadEventsData)}
                    loadingComponent={
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    }
                >
                    <div className={`grid gap-6 ${
                        viewMode === 'grid' 
                            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                            : 'grid-cols-1'
                    }`}>
                        {filteredEvents.map((event) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -5 }}
                                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                                onClick={() => handleEventClick(event)}
                            >
                                <div className="relative">
                                    <Image
                                        src={getBestIpfsUrl(event.image)}
                                        alt={event.title}
                                        width={400}
                                        height={200}
                                        className="w-full h-48 object-cover"
                                    />
                                    {event.isLive && (
                                        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                            LIVE
                                        </div>
                                    )}
                                    {event.isNFT && (
                                        <div className="absolute top-3 right-3 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                            NFT
                                        </div>
                                    )}
                                </div>

                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                                            {event.title}
                                        </h3>
                                        {event.isVerified && (
                                            <FiCheck className="w-5 h-5 text-blue-500 flex-shrink-0 ml-2" />
                                        )}
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <FiCalendar className="w-4 h-4" />
                                            <span className="text-sm">
                                                {event.date.toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <FiMapPin className="w-4 h-4" />
                                            <span className="text-sm">{event.location.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <FiUsers className="w-4 h-4" />
                                            <span className="text-sm">{event.attendees} attendees</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="text-lg font-bold text-[#FF5722]">
                                            {event.price.min}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                                <FiHeart className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                                <FiShare className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </AsyncState>
            </div>

            {/* Web3 Events Section */}
            {isConnected && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-8 text-white">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Web3 Events</h2>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <span className="text-sm">Connected to Base</span>
                            </div>
                        </div>

                        <AsyncState
                            isLoading={web3Loading}
                            error={web3Error ? web3Error : null}
                            isEmpty={!web3Loading && (!web3Events || web3Events.length === 0)}
                            emptyMessage="No Web3 events found"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {web3Events?.map((event: any, index: number) => (
                                    <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                                        <h3 className="text-lg font-semibold mb-2">{event.name || event.title}</h3>
                                        <p className="text-white/80 text-sm mb-4">{event.description}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-white/60">
                                                {new Date(event.startTime).toLocaleDateString()}
                                            </span>
                                            <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AsyncState>
                    </div>
                </div>
            )}
        </div>
    );
}