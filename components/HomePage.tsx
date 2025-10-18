/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
    FiCalendar, FiHeart, FiMapPin, FiStar, FiUsers, FiCoffee, FiTrendingUp, FiClock, FiX, FiBook, FiShoppingBag, FiHome, FiZap, FiGlobe, FiBookOpen, FiDollarSign, FiChevronRight, FiSearch, FiBell, FiVideo, FiPlus, FiUser, FiMessageCircle
} from "react-icons/fi";
import {
    BsLightningCharge, BsTree, BsFlag, BsMusicNote, BsBrush, BsFire, BsGem, BsTicket, BsDiamond, BsBuilding, BsCarFront, BsCameraVideo, BsPalette, BsHeartPulse
} from "react-icons/bs";
import { FaMountainSun } from "react-icons/fa6";
import { IoGameControllerOutline } from "react-icons/io5";
import { BsCameraVideoFill } from 'react-icons/bs';
import { useWeb3Events } from '@/contexts/Web3EventContext';
import { useAccount, useChainId } from 'wagmi';
import { getBestIpfsUrl } from '@/utils/ipfs';
import EchoChatWidget from './EchoChatWidget';

// Utils
const shortenAddress = (address: string, prefix: number = 4, suffix: number = 4): string => {
    if (typeof address !== 'string') return '';
    const isHex = /^0x[0-9a-fA-F]{40}$/.test(address);
    if (!isHex) return address;
    return `${address.slice(0, 2 + prefix)}...${address.slice(-suffix)}`;
};

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
    isHot?: boolean;
    isFeatured?: boolean;
}

interface Creator {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    verified: boolean;
    followers: number;
    bio: string;
    eventsCount: number;
    rating: number;
}

type CategoryType = "music" | "tech" | "art" | "games" | "food" | "sports" | "wellness" | "outdoor" | "nightlife" | "education" | "fashion" | "business" | "automotive" | "film" | "health" | "education";
type FilterType = "all" | "trending" | "upcoming" | "nft" | "free" | "this-week";
type ViewType = "grid" | "list";

// Clean categories with your color palette
const CATEGORIES = [
    { id: "music", label: "Music", icon: BsMusicNote, count: 245 },
    { id: "tech", label: "Tech", icon: BsLightningCharge, count: 189 },
    { id: "food", label: "Food", icon: FiCoffee, count: 356 },
    { id: "art", label: "Art", icon: BsBrush, count: 167 },
    { id: "sports", label: "Sports", icon: BsFlag, count: 234 },
    { id: "games", label: "Gaming", icon: IoGameControllerOutline, count: 198 },
    { id: "wellness", label: "Wellness", icon: BsTree, count: 145 },
    { id: "outdoor", label: "Outdoor", icon: FaMountainSun, count: 287 },
    { id: "fashion", label: "Fashion", icon: FiShoppingBag, count: 156 },
    { id: "business", label: "Business", icon: BsBuilding, count: 203 },
    { id: "automotive", label: "Automotive", icon: BsCarFront, count: 89 },
    { id: "film", label: "Film", icon: BsCameraVideo, count: 134 },
    { id: "health", label: "Health", icon: BsHeartPulse, count: 178 },
    { id: "education", label: "Education", icon: FiBookOpen, count: 142 },
];

const FILTERS = [
    { id: "all", label: "All Events", icon: FiCalendar, count: 2145 },
    { id: "trending", label: "Trending", icon: FiTrendingUp, count: 89 },
    { id: "this-week", label: "This Week", icon: FiClock, count: 156 },
    { id: "free", label: "Free", icon: BsGem, count: 67 },
    { id: "nft", label: "NFT", icon: BsTicket, count: 23 },
];

// Production events data
const PRODUCTION_EVENTS: Event[] = [
    {
        id: "1",
        title: "Summer Music Festival 2025",
        image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop",
        date: new Date("2025-07-15"),
        location: {
            name: "Central Park",
            address: "New York, NY",
            coordinates: { lat: 40.7829, lng: -73.9654 }
        },
        price: { min: "$45", amount: 45 },
        attendees: 1250,
        category: "music",
        creator: {
            name: "EventPro",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
            verified: true
        },
        description: "Join thousands for the ultimate summer music experience",
        tags: ["outdoor", "festival", "live-music"],
        isHot: true,
        isFeatured: true
    },
    {
        id: "2",
        title: "Tech Innovation Summit 2025",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
        date: new Date("2025-08-20"),
        location: {
            name: "Convention Center",
            address: "San Francisco, CA",
            coordinates: { lat: 37.7749, lng: -122.4194 }
        },
        price: { min: "Free", amount: 0 },
        attendees: 890,
        category: "tech",
        creator: {
            name: "TechEvents",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
            verified: true
        },
        description: "Connect with innovators and builders shaping the future",
        tags: ["networking", "innovation", "startup"],
        isHot: true
    },
    {
        id: "3",
        title: "Digital Art Exhibition: Future Visions",
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop",
        date: new Date("2025-09-10"),
        location: {
            name: "Modern Gallery",
            address: "Los Angeles, CA",
            coordinates: { lat: 34.0522, lng: -118.2437 }
        },
        price: { min: "$25", amount: 25 },
        attendees: 456,
        category: "art",
        creator: {
            name: "ArtCollective",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face",
            verified: false
        },
        description: "Explore cutting-edge digital art from renowned artists",
        tags: ["exhibition", "digital-art", "gallery"],
        isFeatured: true
    },
    {
        id: "4",
        title: "Gaming Championship Finals",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop",
        date: new Date("2025-10-05"),
        location: {
            name: "Esports Arena",
            address: "Austin, TX",
            coordinates: { lat: 30.2672, lng: -97.7431 }
        },
        price: { min: "$30", amount: 30 },
        attendees: 2100,
        category: "games",
        creator: {
            name: "GameMasters",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face",
            verified: true
        },
        description: "Watch the best players compete for the ultimate prize",
        tags: ["esports", "competition", "gaming"],
        isHot: true
    },
    {
        id: "5",
        title: "Street Food Festival",
        image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
        date: new Date("2025-08-12"),
        location: {
            name: "Santa Monica Pier",
            address: "Santa Monica, CA",
            coordinates: { lat: 34.0195, lng: -118.4912 }
        },
        price: { min: "$20", amount: 20 },
        attendees: 3200,
        category: "food",
        creator: {
            name: "FoodieEvents",
            avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=40&h=40&fit=crop&crop=face",
            verified: true
        },
        description: "Taste amazing cuisine from around the world",
        tags: ["food", "festival", "outdoor"],
        isHot: true
    },
    {
        id: "6",
        title: "Yoga & Wellness Retreat",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop",
        date: new Date("2025-06-30"),
        location: {
            name: "Lake Tahoe Resort",
            address: "South Lake Tahoe, CA",
            coordinates: { lat: 38.9399, lng: -119.9772 }
        },
        price: { min: "$85", amount: 85 },
        attendees: 150,
        category: "wellness",
        creator: {
            name: "ZenMasters",
            avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=40&h=40&fit=crop&crop=face",
            verified: true
        },
        description: "Find inner peace in nature's most beautiful setting",
        tags: ["wellness", "yoga", "retreat"],
        isFeatured: true
    },
];

const FEATURED_CREATORS: Creator[] = [
    {
        id: "1",
        name: "Coming Soon",
        email: "olivia@example.com",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
        verified: false,
        followers: 0,
        bio: "Coming Soon - Profile details will be available shortly.",
        eventsCount: 0,
        rating: 0
    },
    {
        id: "2",
        name: "Coming Soon",
        email: "coming-soon@example.com",
        avatarUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&h=100&fit=crop&crop=face",
        verified: false,
        followers: 0,
        bio: "Coming Soon - Profile details will be available shortly.",
        eventsCount: 0,
        rating: 0
    },
    {
        id: "3",
        name: "Coming Soon",
        email: "coming-soon@rovify.io",
        avatarUrl: "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=100&h=100&fit=crop&crop=face",
        verified: false,
        followers: 0,
        bio: "Coming Soon - Profile details will be available shortly.",
        eventsCount: 0,
        rating: 0
    },
];

// Accurate Skeleton Loader Components

// Modern Clean Category Button
const CategoryButton = ({ category, isActive, onClick }: {
    category: typeof CATEGORIES[number];
    isActive: boolean;
    onClick: () => void;
}) => (
    <motion.div
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className="cursor-pointer transition-all duration-200"
    >
        <motion.div 
            className={`p-3 sm:p-4 rounded-full transition-all ${
                isActive 
                    ? 'bg-[#FF5900] text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-[#FF5900] hover:text-white'
            }`}
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
        >
            <category.icon className="w-6 h-6 sm:w-7 sm:h-7" />
        </motion.div>
    </motion.div>
);

// iOS-Style Event Card with Equal Heights
const EventCard = ({ event, viewType = "grid", onBuy, isBuying }: {
    event: Event;
    viewType?: ViewType;
    onBuy?: (eventId: string) => Promise<void> | void;
    isBuying?: boolean;
}) => {
    const isListView = viewType === "list";

    if (isListView) {
        return (
            <Link href={`/events/${event.id}`}>
                <motion.div
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex gap-4 p-5 rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-300 cursor-pointer bg-white shadow-sm hover:shadow-sm"
                >
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        <Image
                            src={getBestIpfsUrl(event.image)}
                            alt={event.title}
                            fill
                            className="object-cover"
                        />
                        {event.isHot && (
                            <div className="absolute top-1.5 left-1.5 bg-[#FF5900] text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                HOT
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{event.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center gap-1.5">
                                <FiCalendar className="w-3.5 h-3.5 text-[#3329CF]" />
                                {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <FiMapPin className="w-3.5 h-3.5 text-[#FF5900]" />
                                {event.location.name}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Image
                                    src={event.creator.avatar}
                                    alt={event.creator.name}
                                    width={16}
                                    height={16}
                                    className="rounded-full"
                                />
                                <span className="text-sm text-gray-600 font-medium">{event.creator.name}</span>
                                {event.creator.verified && (
                                    <FiStar className="w-3 h-3 text-[#3329CF] fill-current" />
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-gray-900 bg-gray-50 px-2.5 py-1 rounded-full">
                                    {event.price.amount === 0 ? 'Free' : event.price.min}
                                </span>
                                {onBuy && (
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBuy?.(event.id); }}
                                        className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#FF5900] text-white hover:bg-[#FF5900]/90 transition-all duration-200 shadow-sm hover:shadow-sm transform hover:scale-105"
                                        disabled={!!isBuying}
                                    >
                                        {isBuying ? 'Buying…' : 'Buy'}
                                    </button>
                                )}
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <FiUsers className="w-3 h-3" />
                                    {event.attendees}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </Link>
        );
    }

    return (
        <Link href={`/events/${event.id}`}>
            <div className="group bg-white rounded-xl sm:rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden cursor-pointer">
                <div className="relative h-40 sm:h-44 md:h-48 overflow-hidden bg-gray-100 rounded-t-xl sm:rounded-t-2xl">
                    <Image
                        src={getBestIpfsUrl(event.image)}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex gap-1.5 sm:gap-2">
                        <span className="bg-white text-gray-900 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                            {event.price.amount === 0 ? 'Free' : event.price.min}
                        </span>
                        {event.isHot && (
                            <span className="bg-[#FF5900] text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1">
                                <BsFire className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                HOT
                            </span>
                        )}
                    </div>

                    <button
                        className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 rounded-full bg-white hover:bg-gray-50 transition-colors"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >
                        <FiHeart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 hover:text-[#FF5900]" />
                    </button>
                </div>

                <div className="p-3 sm:p-4">
                    <h3 className="font-bold text-gray-900 mb-1.5 sm:mb-2 line-clamp-2 text-base sm:text-lg leading-tight">{event.title}</h3>

                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">
                        <FiCalendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF5900]" />
                        <span className="font-medium">{event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                        <FiMapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                        <span className="truncate">{event.location.name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            <Image
                                src={event.creator.avatar}
                                alt={event.creator.name}
                                width={18}
                                height={18}
                                className="rounded-full w-[18px] h-[18px] sm:w-5 sm:h-5"
                            />
                            <span className="text-xs sm:text-sm text-gray-600 truncate" title={event.creator.name}>
                                {shortenAddress(event.creator.name)}
                            </span>
                            {event.creator.verified && (
                                <FiStar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FF5900] fill-current flex-shrink-0" />
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                                <FiUsers className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                {event.attendees}
                            </span>
                            {onBuy && (
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBuy?.(event.id); }}
                                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-[#FF5900] text-white hover:bg-[#FF5900]/90 transition-all duration-200 shadow-sm hover:shadow-sm whitespace-nowrap"
                                    disabled={!!isBuying}
                                >
                                    {isBuying ? 'Buying…' : 'Buy NFT'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

// Enhanced Trending Event Card with Context
const TrendingEventCard = ({ event, trendReason, trendMetric }: {
    event: Event;
    trendReason?: string;
    trendMetric?: string;
}) => (
    <Link href={`/events/${event.id}`}>
        <motion.div
            whileHover={{ scale: 1.01, x: 2 }}
            whileTap={{ scale: 0.99 }}
            className="relative flex gap-3 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-[#FF5900]/10"
        >
            {/* Trending Pulse Effect */}
            <motion.div
                className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5900]/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            />

            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                <Image
                    src={getBestIpfsUrl(event.image)}
                    alt={event.title}
                    fill
                    className="object-cover"
                />
                {/* Trending Badge */}
                <div className="absolute -top-1 -right-1 bg-[#FF5900] text-white text-xs p-1 rounded-full">
                    <FiTrendingUp className="w-2.5 h-2.5" />
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">{event.title}</h4>

                {/* Trending Reason */}
                <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs font-medium text-[#FF5900] bg-[#FF5900]/10 px-2 py-0.5 rounded-full">
                        {trendReason || "🔥 Going Viral"}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                    <span className="font-medium">{event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span className="flex items-center gap-1">
                        <FiUsers className="w-3 h-3" />
                        {event.attendees}
                    </span>
                </div>

                {/* Trend Metric */}
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#C281FF] bg-[#C281FF]/10 px-2 py-0.5 rounded-full">
                        {event.price.amount === 0 ? 'Free' : event.price.min}
                    </span>
                    <span className="text-xs font-bold text-[#18E299] flex items-center gap-1">
                        <motion.div
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            ↗
                        </motion.div>
                        {trendMetric || "+347%"}
                    </span>
                </div>
            </div>
        </motion.div>
    </Link>
);

// iOS-Style Creator Card
const CreatorCard = ({ creator }: { creator: Creator }) => (
    <Link href={`/creator/${creator.id}`}>
        <motion.div
            whileHover={{ scale: 1.01, x: 2 }}
            whileTap={{ scale: 0.99 }}
            className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer"
        >
            <div className="relative">
                <Image
                    src={creator.avatarUrl}
                    alt={creator.name}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-white shadow-sm"
                />
                {creator.verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-[#3329CF] rounded-full p-1 border-2 border-white">
                        <FiStar className="w-2.5 h-2.5 text-white" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{creator.name}</p>
                <p className="text-xs text-gray-600 truncate mb-1">{creator.bio}</p>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                        {creator.followers >= 1000 ? `${(creator.followers / 1000).toFixed(1)}k` : creator.followers} followers
                    </span>
                    <span className="text-xs text-[#18E299] flex items-center gap-1 bg-[#18E299]/10 px-2 py-0.5 rounded-full font-semibold">
                        <FiStar className="w-3 h-3" />
                        {creator.rating}
                    </span>
                </div>
            </div>
        </motion.div>
    </Link>
);

// iOS-Style Bottom Sheet for Mobile with Enhanced Scrolling
const MobileBottomSheet = ({ isOpen, onClose, trendingEvents, featuredCreators }: {
    isOpen: boolean;
    onClose: () => void;
    trendingEvents: Event[];
    featuredCreators: Creator[];
}) => {
    const [dragConstraints, setDragConstraints] = useState({ top: 0, bottom: 0 });

    const handleDragEnd = (event: MouseEvent | TouchEvent, info: PanInfo) => {
        if (info.offset.y > 100) {
            onClose();
        }
    };

    const trendingReasons = [
        "🔥 Going Viral",
        "⚡ Selling Fast",
        "🎉 Most Shared",
        "🌟 Editor's Pick"
    ];

    const trendMetrics = ["+347%", "+289%", "+156%", "+423%"];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 lg:hidden"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 200 }}
                        dragElastic={{ top: 0, bottom: 0.2 }}
                        onDragEnd={handleDragEnd}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed left-0 right-0 bg-white rounded-t-3xl z-50 lg:hidden shadow-sm flex flex-col"
                        style={{
                            bottom: '80px', // Account for bottom navbar (typically 64-80px)
                            height: 'calc(100vh - 160px)', // Total height minus navbar and some spacing
                            maxHeight: 'calc(100vh - 160px)'
                        }}
                    >
                        {/* Drag Handle - Fixed at top */}
                        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>

                        {/* Header - Fixed at top */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-gray-900">Discover</h2>
                                <span className="bg-[#FF5900]/10 text-[#FF5900] text-xs px-2 py-1 rounded-full font-bold">
                                    Hot
                                </span>
                            </div>
                            <motion.button
                                onClick={onClose}
                                whileTap={{ scale: 0.9 }}
                                className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-sm"
                            >
                                <FiX className="w-5 h-5" />
                            </motion.button>
                        </div>

                        {/* Scrollable Content - Takes remaining space */}
                        <div
                            className="flex-1 overflow-y-auto overscroll-contain px-6"
                            style={{
                                WebkitOverflowScrolling: 'touch',
                                scrollBehavior: 'smooth'
                            }}
                        >
                            <div className="space-y-6 py-6 pb-12">
                                {/* Enhanced Trending Section */}
                                <div className="bg-[#FF5900]/5 rounded-2xl p-5 border border-[#FF5900]/10">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="relative">
                                            <div className="w-10 h-10 bg-[#FF5900]/20 rounded-xl flex items-center justify-center">
                                                <BsFire className="w-5 h-5 text-[#FF5900]" />
                                            </div>
                                            <motion.div
                                                className="absolute inset-0 bg-[#FF5900]/30 rounded-xl"
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">Trending Now</h3>
                                            <p className="text-sm text-gray-600 font-medium">What&apos;s hot this week</p>
                                        </div>
                                        <motion.div
                                            className="ml-auto bg-[#FF5900] text-white text-xs px-3 py-1.5 rounded-full font-bold"
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            Live
                                        </motion.div>
                                    </div>
                                    <div className="space-y-2">
                                        {trendingEvents.slice(0, 4).map((event, index) => (
                                            <TrendingEventCard
                                                key={event.id}
                                                event={event}
                                                trendReason={trendingReasons[index]}
                                                trendMetric={trendMetrics[index]}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Featured Creators */}
                                <div className="bg-[#C281FF]/5 rounded-2xl p-5 border border-[#C281FF]/10">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-10 h-10 bg-[#C281FF]/20 rounded-xl flex items-center justify-center">
                                            <FiUsers className="w-5 h-5 text-[#C281FF]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">Featured Creators</h3>
                                            <p className="text-sm text-gray-600 font-medium">Top event organizers</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {featuredCreators.map((creator) => (
                                            <CreatorCard key={creator.id} creator={creator} />
                                        ))}
                                    </div>
                                </div>

                                {/* Enhanced Stats with Brand Colors */}
                                <div className="bg-[#3329CF] rounded-2xl p-5 text-white">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                            <BsDiamond className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="font-bold text-white text-lg">Live Platform Stats</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                                            <span className="text-sm text-white/90 font-medium">Total Events</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white">2,145</span>
                                                <span className="text-xs text-[#18E299] font-bold bg-[#18E299]/20 px-2 py-0.5 rounded-full">+12%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                                            <span className="text-sm text-white/90 font-medium">Active Creators</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white">489</span>
                                                <span className="text-xs text-[#18E299] font-bold bg-[#18E299]/20 px-2 py-0.5 rounded-full">+8%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                                            <span className="text-sm text-white/90 font-medium">This Week</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white">156</span>
                                                <span className="text-xs text-[#18E299] font-bold bg-[#18E299]/20 px-2 py-0.5 rounded-full">+24%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// Interface for live streams
interface LiveStream {
    id: string;
    name: string;
    playbackId: string;
    thumbnail: string;
    createdAt: string;
    status: string;
    isActive?: boolean;
    viewerCount?: number;
}

// Utility functions for livestream status
const getStreamStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'live': return 'bg-red-500 text-white';
        case 'starting': return 'bg-yellow-500 text-white';
        case 'ending': return 'bg-orange-500 text-white';
        case 'ended': return 'bg-gray-500 text-white';
        case 'scheduled': return 'bg-blue-500 text-white';
        case 'failed': return 'bg-red-600 text-white';
        case 'canceled': return 'bg-gray-600 text-white';
        default: return 'bg-red-500 text-white';
    }
};

const getStreamStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'live': return 'LIVE';
        case 'starting': return 'STARTING';
        case 'ending': return 'ENDING';
        case 'ended': return 'ENDED';
        case 'scheduled': return 'SCHEDULED';
        case 'failed': return 'FAILED';
        case 'canceled': return 'CANCELED';
        default: return 'LIVE';
    }
};

// Main Component
export default function HomePage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [currentCategory, setCurrentCategory] = useState<CategoryType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [buyingId, setBuyingId] = useState<string | null>(null);
    const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);

    // Load events from on-chain (Web3)
    const { state: web3State, loadEvents: loadWeb3Events, mintTicket } = useWeb3Events();
    const { address: connectedAddress } = useAccount();
    const activeChainId = useChainId();
    const mapsKey = process.env.NEXT_PUBLIC_MAPS_API_KEY || "";

    // Kick off loading when account/chain changes
    useEffect(() => {
        try {
            loadWeb3Events();
        } catch (error) {
            console.error('Error loading Web3 events:', error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connectedAddress, activeChainId]);

    // Load live streams
    useEffect(() => {
        const loadStreams = async () => {
            try {
                const res = await fetch('/api/livepeer/getStreams?source=backend', { cache: 'no-store' });
                const data = await res.json();
                setLiveStreams(Array.isArray(data.items) ? data.items : []);
            } catch (error) {
                console.error('Error loading live streams:', error);
                setLiveStreams([]);
            }
        };
        loadStreams();
        // Refresh streams every 30 seconds
        const interval = setInterval(loadStreams, 30000);
        return () => clearInterval(interval);
    }, []);

    // Transform events whenever web3 state updates
    useEffect(() => {
        setIsLoading(true);
        try {
            // Fallback to production events if Web3 events fail to load
            const eventsToTransform = web3State?.events || [];
            const transformed = eventsToTransform.map((e: any): Event => ({
                id: String(e.id),
                title: e.name || `Event #${e.id}`,
                image: e.imageUrl || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop',
                date: new Date(Number(e.startTime)),
                location: {
                    name: e.location || 'Unknown Location',
                    address: e.location || 'Unknown Address',
                    coordinates: { lat: 0, lng: 0 },
                },
                price: {
                    min: (() => {
                        const num = Number(e.ticketPrice ?? 0) / 1e18;
                        return num > 0 ? `${num.toFixed(3)} ETH` : 'Free';
                    })(),
                    amount: Number(e.ticketPrice ?? 0) / 1e18,
                },
                attendees: e.ticketsSold ?? 0,
                category: 'nft',
                creator: {
                    name: e.creator || '',
                    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
                    verified: true,
                },
                description: e.description || '',
                tags: Array.isArray(e.tags) ? [...e.tags, 'nft'] : ['nft'],
                isHot: Math.random() > 0.7,
                isFeatured: false,
            }));
            
            // Use Web3 events if available, otherwise fallback to production events
            if (transformed.length > 0) {
                setEvents(transformed);
            } else {
                console.log('No Web3 events found, using production events as fallback');
                setEvents(PRODUCTION_EVENTS);
            }
        } catch (err) {
            console.error('Error transforming events:', err);
            // Fallback to production events on error
            setEvents(PRODUCTION_EVENTS);
        } finally {
            setIsLoading(false);
        }
    }, [web3State.events]);

    const handleBuy = async (eventId: string) => {
        if (buyingId) return;
        setBuyingId(eventId);
        try {
            // Use a default ticket type and allow transfer for now
            await mintTicket(Number(eventId), 'Standard', true);
            // Optionally refresh events after purchase
            await loadWeb3Events();
        } catch (e) {
            console.error('Buy failed', e);
        } finally {
            setBuyingId(null);
        }
    };

    const filteredEvents = events.filter(event => {
        if (currentCategory && event.category !== currentCategory) return false;
        return true;
    });

// Minimal left sidebar to mirror modern layout
const LocalSidebar = () => {
    const navItems = [
        { icon: FiHome, label: "Home", active: true, href: "/home" },
        { icon: FiSearch, label: "Search" },
        { icon: FiBell, label: "Notifications" },
        { icon: FiVideo, label: "Videos", href: "/user-dashboard/livestream" },
        { icon: FiPlus, label: "Create", href: "/organiser-dashboard" },
        { icon: FiCalendar, label: "Calendar" },
        { icon: FiUser, label: "Profile", href: "/user-dashboard" },
    ];
    return (
        <aside className="fixed left-0 top-0 h-screen w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6 gap-6 z-30">
            <nav className="flex-1 flex flex-col gap-4 w-full items-center mt-[10vh]">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const classes = `w-10 h-10 flex items-center justify-center rounded-lg transition-all hover:bg-gray-50 ${item.active ? 'text-[#FF5900]' : ''}`;
                    return item.href ? (
                        <Link key={item.label} href={item.href} className={classes}>
                            <Icon className="w-5 h-5" />
                        </Link>
                    ) : (
                        <button key={item.label} className={classes}>
                            <Icon className="w-5 h-5" />
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
};

    // Compute real-time counts per category from loaded events
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const cat of CATEGORIES) counts[cat.id] = 0;
        for (const e of events) {
            if (e.category && Object.prototype.hasOwnProperty.call(counts, e.category)) {
                counts[e.category] += 1;
            }
        }
        return counts;
    }, [events]);

    const categoriesWithCounts = useMemo(() => (
        CATEGORIES.map(cat => ({ ...cat, count: categoryCounts[cat.id] ?? 0 }))
    ), [categoryCounts]);


    return (
        <>
            <LocalSidebar />
            <div className="min-h-screen bg-white">
                <div className="ml-16 flex min-h-screen w-full pr-12 sm:pr-10 md:pr-12 lg:pr-14 xl:pr-16">
                    {/* Main Content */}
                    <main className="flex-1 w-full min-w-0 px-4 sm:px-6 md:px-8 py-6 sm:py-8 max-w-none">
                        {/* Header */}
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="mb-6 sm:mb-8"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-xs sm:text-sm text-gray-600">
                                        <motion.span 
                                            className="w-2 h-2 bg-green-500 rounded-full"
                                            animate={{ scale: [1, 1.3, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        />
                                        <span className="font-medium">Discover what's happening near you</span>
                                    </div>
                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Discover Events</h1>
                                    <p className="text-sm text-gray-600">
                                        Find amazing experiences in your city and beyond
                                    </p>
                                </div>
                                <motion.div
                                    whileHover={{ rotate: 5 }}
                                    className="hidden md:flex items-center gap-3 bg-gradient-to-br from-[#FF5900]/10 to-[#FF5900]/5 px-5 py-3 rounded-2xl border border-[#FF5900]/20"
                                >
                                    <FiZap className="w-5 h-5 text-[#FF5900]" />
                                    <div>
                                        <p className="text-xs text-gray-600 font-medium">Total Events</p>
                                        <p className="text-lg font-bold text-[#FF5900]">2,145</p>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>

                        <div className="bg-gradient-to-b from-gray-50/50 to-white border border-gray-200 rounded-3xl shadow-sm p-6 md:p-8">
                        {/* Hero Banner: Discover Events with background image and RSVP */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="relative overflow-hidden rounded-3xl border-0 shadow-xl mb-8 group"
                        >
                            <div className="relative h-[320px] md:h-[420px]">
                                <Image
                                    src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&h=900&fit=crop"
                                    alt="Discover Events Banner"
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.6, delay: 0.2 }}
                                        className="flex items-center gap-3 mb-3"
                                    >
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FF5900] text-white shadow-lg">
                                            🔥 Featured
                                        </span>
                                        <div className="flex items-center gap-2 text-white/90 text-xs font-medium bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                            <FiCalendar className="w-4 h-4" />
                                            <span>Oct 20, 2025 • 7:00 PM</span>
                                        </div>
                                    </motion.div>

                                    <motion.h2 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.3 }}
                                        className="text-2xl md:text-5xl font-bold text-white mb-3 leading-tight"
                                    >
                                        Experience Live Events<br className="hidden md:block" /> Around You
                                    </motion.h2>

                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.6, delay: 0.4 }}
                                        className="flex items-center gap-2 text-white/90 text-sm mb-6"
                                    >
                                        <FiMapPin className="w-4 h-4 text-[#FF5900]" />
                                        <span className="font-medium">Global & Local Venues • 2,145 Active Events</span>
                                    </motion.div>

                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.5 }}
                                        className="flex flex-wrap items-center gap-3"
                                    >
                                        <Link href="/events" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#FF5900] text-white font-semibold shadow-2xl ring-2 ring-white/40 hover:ring-white/60 hover:bg-[#FF5900]/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70 transition-all duration-200">
                                            <FiCalendar className="w-4 h-4" />
                                            RSVP Now
                                        </Link>
                                        <Link href="/share" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-gray-900 font-semibold border border-white shadow-2xl hover:bg-white/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 transition-all duration-200">
                                            <FiUsers className="w-4 h-4" />
                                            Share
                                        </Link>
                                    </motion.div>
                                </div>

                                <motion.div 
                                    className="absolute top-6 right-6 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/20"
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    <div className="flex items-center gap-2 text-white">
                                        <FiUsers className="w-4 h-4" />
                                        <span className="text-sm font-bold">1.2K+ Attending</span>
                                    </div>
                                </motion.div>

                                <div className="absolute bottom-6 right-6 hidden md:flex gap-2">
                                    <motion.div 
                                        className="w-2 h-2 bg-white rounded-full"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    />
                                    <div className="w-2 h-2 bg-white/50 rounded-full hover:bg-white transition-colors cursor-pointer" />
                                    <div className="w-2 h-2 bg-white/50 rounded-full hover:bg-white transition-colors cursor-pointer" />
                                </div>
                            </div>
                        </motion.div>
                            {/* Filters under hero */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="flex gap-3 mb-8 overflow-x-auto scrollbar-hide pb-2"
                            >
                                <motion.span 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm cursor-pointer font-medium shadow-sm hover:shadow-md transition-all whitespace-nowrap"
                                >
                                    <FiMapPin className="w-4 h-4" /> Nairobi
                                </motion.span>
                                <motion.span 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 text-sm cursor-pointer font-medium hover:border-[#FF5900] hover:text-[#FF5900] hover:bg-[#FF5900]/5 transition-all whitespace-nowrap"
                                >
                                    <FiCalendar className="w-4 h-4" /> This Weekend
                                </motion.span>
                                <motion.span 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 text-sm cursor-pointer font-medium hover:border-[#FF5900] hover:text-[#FF5900] hover:bg-[#FF5900]/5 transition-all whitespace-nowrap"
                                >
                                    <FiDollarSign className="w-4 h-4" /> Any Price
                                </motion.span>
                                <motion.span 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 text-sm cursor-pointer font-medium hover:border-[#FF5900] hover:text-[#FF5900] hover:bg-[#FF5900]/5 transition-all whitespace-nowrap"
                                >
                                    <BsTicket className="w-4 h-4" /> NFT Tickets
                                </motion.span>
                            </motion.div>

                            {/* Categories */}
                        <div className="mb-4 sm:mb-6 md:mb-8">
                            <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto pb-2 sm:pb-3 md:pb-4 scrollbar-hide">
                                    {categoriesWithCounts.map((category) => (
                                        <CategoryButton
                                            key={category.id}
                                            category={category}
                                            isActive={currentCategory === category.id}
                                            onClick={() => setCurrentCategory(
                                                currentCategory === category.id ? null : category.id as CategoryType
                                            )}
                                        />
                                    ))}
                                </div>
                                </div>

                            {/* Live Now - Streams from backend */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.25 }}
                                className="mb-10"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Live Now</h2>
                                        <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">LIVE</span>
                                    </div>
                                    <Link href="/user-dashboard/livestream" className="text-[#FF5900] text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                                        See all
                                        <FiChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                                {liveStreams.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500 text-sm border border-dashed border-gray-200 rounded-2xl">
                                        No live streams at the moment
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                                        {liveStreams.slice(0, 8).map((stream, index) => (
                                            <motion.div
                                                key={stream.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, delay: 0.05 * index }}
                                            >
                                                <Link href={`/watch/${stream.playbackId}`}>
                                                    <div className="group bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden cursor-pointer shadow-sm">
                                                        <div className="relative h-44 overflow-hidden bg-gray-100">
                                                            <Image
                                                                src={stream.thumbnail || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop'}
                                                                alt={stream.name}
                                                                fill
                                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                            />
                                                            <div className="absolute top-3 left-3 flex items-center gap-2">
                                                                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${getStreamStatusColor(stream.status)}`}>
                                                                    {stream.status?.toLowerCase() === 'live' && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                                                                    {getStreamStatusLabel(stream.status)}
                                                                </span>
                                                                <span className="bg-white/90 text-gray-900 text-[10px] font-semibold px-2 py-1 rounded-full">
                                                                    {new Date(stream.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="p-4">
                                                            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{stream.name || 'Live Stream'}</h3>
                                                            <div className="flex items-center justify-between text-xs text-gray-600">
                                                                <span className="flex items-center gap-1">
                                                                    <FiVideo className="w-3.5 h-3.5" /> Livestream
                                                                </span>
                                                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                                                                    {stream.status || 'live'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            {/* Popular Events */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                                            Popular Events <span className="text-gray-500 font-medium">in Nairobi</span>
                                        </h2>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <motion.span 
                                                className="w-2 h-2 bg-[#FF5900] rounded-full"
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                            {filteredEvents.length} events found
                                        </p>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="text-sm font-semibold text-[#FF5900] hover:text-[#FF5900]/80 transition-colors flex items-center gap-1"
                                    >
                                        View All
                                        <FiChevronRight className="w-4 h-4" />
                                    </motion.button>
                                </div>
                                <motion.div 
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                >
                                    {filteredEvents.map((event, index) => (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: 0.1 * index }}
                                        >
                                            <EventCard
                                                event={event}
                                                onBuy={handleBuy}
                                                isBuying={buyingId === event.id}
                                            />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>
                        </div>
                    </main>

                    {/* Right Sidebar */}
                    <aside className="hidden lg:block w-80 p-6 sm:p-8 border-l border-gray-200 bg-gradient-to-b from-gray-50/50 to-white">
                        {/* Currently Live */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="mb-8"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900">Currently Live</h2>
                                </div>
                                <Link href="/user-dashboard/livestream" className="text-[#FF5900] text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                                    See all
                                    <FiChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <div className="space-y-3">
                                {liveStreams.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 text-sm">
                                        No live streams at the moment
                                    </div>
                                ) : (
                                    liveStreams.slice(0, 3).map((stream, index) => (
                                        <Link key={stream.id} href={`/watch/${stream.playbackId}`}>
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, delay: 0.1 * index }}
                                    whileHover={{ scale: 1.02 }}
                                    className="relative h-32 rounded-2xl overflow-hidden group cursor-pointer shadow-sm border border-gray-200 hover:shadow-md transition-all"
                                >
                                    <div className="absolute inset-0">
                                                    <Image 
                                                        src={stream.thumbnail || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=200&fit=crop'} 
                                                        alt={stream.name} 
                                                        fill 
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300" 
                                                    />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                    </div>
                                    <div className="relative p-4 h-full flex flex-col justify-end">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${getStreamStatusColor(stream.status)}`}>
                                                {stream.status?.toLowerCase() === 'live' && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>}
                                                {getStreamStatusLabel(stream.status)}
                                            </span>
                                                        <span className="text-white/80 text-xs font-medium">
                                                            {new Date(stream.createdAt).toLocaleDateString()}
                                                        </span>
                                        </div>
                                                    <h3 className="text-white font-bold text-sm line-clamp-1 mb-1">{stream.name}</h3>
                                        <div className="flex items-center gap-2 text-white/70 text-xs">
                                                        <FiVideo className="w-3 h-3" />
                                                        <span>Livestream</span>
                                        </div>
                                    </div>
                                </motion.div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </motion.div>

                        {/* NFT Drops */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-[#FF5900]/10 rounded-lg flex items-center justify-center">
                                        <BsTicket className="w-4 h-4 text-[#FF5900]" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900">NFT Drops</h2>
                                </div>
                                <Link href="/drops" className="text-[#FF5900] text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                                    See all
                                    <FiChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <div className="space-y-3">
                                {events.filter(e => e.category === 'nft').slice(0, 2).map((event, index) => (
                                    <motion.div 
                                        key={`drop-${event.id}`} 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.1 * index }}
                                        whileHover={{ scale: 1.02 }}
                                        className="relative h-32 rounded-2xl overflow-hidden group cursor-pointer shadow-sm border border-gray-200 hover:shadow-md transition-all"
                                    >
                                        <div className="absolute inset-0">
                                            <Image src={getBestIpfsUrl(event.image)} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                        </div>
                                        <div className="relative p-4 h-full flex flex-col justify-end">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-[#FF5900] text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                                                    {event.price.amount === 0 ? 'Free' : event.price.min}
                                                </span>
                                                <span className="text-white/80 text-xs font-medium">
                                                    {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <h3 className="text-white font-bold text-sm line-clamp-1 mb-1">{event.title}</h3>
                                            <div className="flex items-center gap-2 text-white/70 text-xs">
                                                <FiUsers className="w-3 h-3" />
                                                <span>{event.attendees} attending</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </aside>
                </div>
            </div>

            {/* Right Sidebar removed to maximize center content */}

            {/* Floating Livestream Guide CTA - Responsive */}
            <motion.div 
                className="fixed bottom-6 right-6 z-40"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
            >
                <Link href="/organiser-dashboard">
                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="hidden sm:flex items-center gap-3 bg-gradient-to-r from-[#FF5900] to-[#FF5900]/90 text-white px-6 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 group"
                        title="Open organiser dashboard to start a livestream"
                        animate={{ 
                            boxShadow: ["0 20px 25px -5px rgba(255, 89, 0, 0.3)", "0 25px 50px -12px rgba(255, 89, 0, 0.4)", "0 20px 25px -5px rgba(255, 89, 0, 0.3)"]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <motion.div
                            animate={{ rotate: [0, 5, 0, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <BsCameraVideoFill className="w-5 h-5" />
                        </motion.div>
                        <div className="flex flex-col items-start">
                            <span className="font-bold text-sm">Create Livestream</span>
                            <span className="text-xs text-white/80">Go live in seconds</span>
                        </div>
                        <motion.div
                            className="w-2 h-2 bg-white rounded-full"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </motion.button>
                </Link>
                
                {/* Mobile Icon Version */}
                <Link href="/organiser-dashboard">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex sm:hidden items-center justify-center w-12 h-12 bg-gradient-to-r from-[#FF5900] to-[#FF5900]/90 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200"
                        title="Create Livestream"
                        animate={{ 
                            boxShadow: ["0 20px 25px -5px rgba(255, 89, 0, 0.3)", "0 25px 50px -12px rgba(255, 89, 0, 0.4)", "0 20px 25px -5px rgba(255, 89, 0, 0.3)"]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <motion.div
                            animate={{ rotate: [0, 5, 0, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <BsCameraVideoFill className="w-5 h-5" />
                        </motion.div>
                    </motion.button>
                </Link>
            </motion.div>

            {/* Echo Chat Widget - Responsive */}
            <div className="hidden sm:block">
                <EchoChatWidget position="bottom-left" />
            </div>
            
            {/* Mobile Echo Chat Icon */}
            <div className="fixed bottom-6 left-6 z-40 sm:hidden">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200"
                    title="Open Chat"
                >
                    <FiMessageCircle className="w-5 h-5" />
                </motion.button>
            </div>


            <style jsx global>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .line-clamp-1 {
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 1;
                }
                .line-clamp-2 {
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2;
                }
                
                /* Enhanced mobile scrolling */
                .overscroll-contain {
                    overscroll-behavior: contain;
                }
                
                /* Smooth momentum scrolling for iOS */
                .overflow-y-auto {
                    -webkit-overflow-scrolling: touch;
                    scroll-behavior: smooth;
                }
                
                /* Prevent body scroll when bottom sheet is open */
                body.bottom-sheet-open {
                    overflow: hidden;
                    position: fixed;
                    width: 100%;
                }
            `}</style>
        </>
    );
}