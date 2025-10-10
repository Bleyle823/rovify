/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiMenu, FiX, FiCalendar, FiMapPin,
  FiClock, FiArrowRight, FiHash, FiChevronRight,
  FiHome, FiUser, FiHeart, FiMessageSquare, FiStar
} from 'react-icons/fi';
import { BsMusicNote } from "react-icons/bs";
import { IoSparkles, IoFlash } from "react-icons/io5";
import { usePathname } from 'next/navigation';
import { getCurrentUser } from '@/mocks/data/users';
import { useAuth } from '@/context/AuthContext';
import { useAccount } from 'wagmi';
import { useConnectModal, useAccountModal } from '@rainbow-me/rainbowkit';
import type { User as AppUser } from '@/types';

interface HeaderProps {
  isSidebarExpanded?: boolean;
}

export default function Header({ isSidebarExpanded = false }: HeaderProps) {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('for-you');
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);

  const featuredIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Use app-wide User type
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();

  const searchRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  const recentSearches = [
    'Tech conferences 2025',
    'Music festivals near me',
    'Cooking workshops this weekend',
    'Free events today',
  ];

  const popularCategories = [
    { name: 'Music', icon: <BsMusicNote />, color: 'text-purple-500', bgColor: 'bg-purple-50' },
    { name: 'Tech', icon: <FiHash />, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { name: 'Wellness', icon: <FiHeart />, color: 'text-green-500', bgColor: 'bg-green-50' },
    { name: 'This Weekend', icon: <FiCalendar />, color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
  ];

  const navigationTabs = [
    { id: 'for-you', label: 'For you', href: '/home', icon: <FiHome /> },
    { id: 'nearby', label: 'Nearby', href: '/near-me', icon: <FiMapPin /> },
    // { id: 'friends', label: 'Friends', href: '/rovies', icon: <FiUser /> }
  ];

  const featuredContent = [
    {
      id: '1',
      title: '🎉 Summer Festival 2025',
      subtitle: 'Early bird tickets - 50% OFF',
      description: 'Join thousands for the ultimate music weekend',
      cta: 'Get Tickets',
      gradient: 'from-purple-500 via-pink-500 to-red-500',
      link: '/events/summer-festival',
    },
    {
      id: '2',
      title: '⚡ Premium Membership',
      subtitle: 'Unlock exclusive events & perks',
      description: 'VIP access, priority booking, and special discounts',
      cta: 'Upgrade Now',
      gradient: 'from-blue-500 via-cyan-500 to-teal-500',
      link: '/premium',
    },
    {
      id: '3',
      title: '🎯 Trending This Week',
      subtitle: 'Top 10 events near you',
      description: 'Discover the hottest events in your area',
      cta: 'Explore',
      gradient: 'from-orange-500 via-red-500 to-pink-500',
      link: '/trending',
    },
    {
      id: '4',
      title: '🎵 Live Shows Tonight',
      subtitle: 'Don\'t miss out',
      description: 'Amazing live performances happening now',
      cta: 'See All',
      gradient: 'from-green-500 via-teal-500 to-blue-500',
      link: '/live',
    },
  ];

  // Sync active tab with route
  useEffect(() => {
    if (pathname === '/home') setActiveTab('for-you');
    else if (pathname.includes('/near-me')) setActiveTab('nearby');
    else if (pathname === '/rovies') setActiveTab('friends');
  }, [pathname]);

  // Auto-rotate featured card
  useEffect(() => {
    featuredIntervalRef.current = setInterval(() => {
      setCurrentFeaturedIndex((prev) => (prev === featuredContent.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => {
      if (featuredIntervalRef.current) clearInterval(featuredIntervalRef.current);
    };
  }, []);

  // Resize/scroll + user load (prefer authenticated user when available)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);

    const timer = setTimeout(() => {
      const u = (authUser as AppUser | null) || (getCurrentUser() as AppUser | null);
      setCurrentUser(u);
      setIsLoading(false);
    }, 300);

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSearch(false);
      if (mobileNavRef.current && !mobileNavRef.current.contains(event.target as Node) &&
          !(event.target as Element)?.closest('.mobile-menu-button')) setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(timer);
      if (featuredIntervalRef.current) clearInterval(featuredIntervalRef.current);
    };
  }, [authUser]);

  const toggleSearch = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSearch((v) => !v);
  }, []);

  const toggleMobileMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen((v) => !v);
  }, []);

  const closeMobileMenu = useCallback(() => setIsMenuOpen(false), []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      setShowSearch(false);
    }
  };

  // Safe fallbacks for possibly optional fields on AppUser
  const displayName = currentUser?.name || currentUser?.email || (currentUser?.walletAddress ? `${currentUser.walletAddress.slice(0,6)}...${currentUser.walletAddress.slice(-4)}` : 'Guest');
  const avatarSrc = currentUser?.image || '/images/contents/rovi-logo.png';

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          scrolled ? 'py-2 bg-white/95 backdrop-blur-xl border-b border-gray-200/50'
                   : 'py-4 bg-white/90 backdrop-blur-lg'
        }`}
      >
        <div className="flex justify-between items-center">
          {/* Left: logo - positioned at the very left edge */}
          <div className="flex items-center pl-4 sm:pl-6 lg:pl-8">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                className="h-11 w-11 bg-[#FF5722] rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image
                  src="/images/contents/rovi-logo.png"
                  alt="Rovify Logo"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </motion.div>
              <span className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block group-hover:text-[#FF5722] transition-all duration-300">
                rovify
              </span>
            </Link>
          </div>

          {/* Center: navigation tabs */}
          <div className="hidden lg:block">
            <div className="relative flex items-center bg-gray-50/80 rounded-2xl p-1.5 backdrop-blur-sm">
              {navigationTabs.map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-6 py-2.5 text-sm font-medium transition-all duration-300 rounded-xl flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'text-white bg-[#FF5722]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                  }`}
                >
                  <span className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: search + actions */}
          <div className="flex items-center gap-4 pr-4 sm:pr-6 lg:pr-8">
              {/* Search button + popover */}
              <div className="relative" ref={searchRef}>
                <motion.button
                  whileHover={{ scale: 1.02, y: -0.5 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  onClick={toggleSearch}
                >
                  <FiSearch className="w-4.5 h-4.5" />
                </motion.button>

                <AnimatePresence>
                  {showSearch && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`absolute top-12 z-50 bg-white/98 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100/80 overflow-hidden ${
                        isMobile ? 'fixed left-4 right-4 top-20 max-w-none' : 'right-0 w-80'
                      }`}
                      style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.9)' }}
                    >
                      <div className="p-5">
                        <form onSubmit={handleSearchSubmit}>
                          <div className="relative mb-5">
                            <motion.input
                              initial={{ scale: 0.98, opacity: 0.8 }}
                              animate={{ scale: 1, opacity: 1 }}
                              whileFocus={{ scale: 1.01 }}
                              type="text"
                              placeholder="Search events..."
                              className="w-full py-3 text-sm pl-10 pr-4 bg-gray-50/60 rounded-xl border border-gray-200/60 focus:ring-1 focus:ring-[#FF5722]/30 focus:border-[#FF5722]/50 transition-all text-gray-700 placeholder-gray-400 font-medium hover:bg-gray-50/80 focus:bg-white/80"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              autoFocus
                            />
                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                              <FiSearch className="w-4 h-4" />
                            </motion.div>
                            {searchQuery && (
                              <motion.button
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                type="button"
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200/80 hover:bg-gray-300/80 flex items-center justify-center transition-all"
                                onClick={() => setSearchQuery('')}
                              >
                                <FiX className="w-3 h-3 text-gray-600" />
                              </motion.button>
                            )}
                          </div>
                        </form>

                        {/* Recent */}
                        {recentSearches.length > 0 && (
                          <div className="mb-5">
                            <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                              <FiClock className="w-3.5 h-3.5" />
                              Recent
                            </h3>
                            <div className="space-y-1">
                              {recentSearches.slice(0, 3).map((search, i) => (
                                <motion.button
                                  key={i}
                                  whileHover={{ x: 2, backgroundColor: "rgba(249, 250, 251, 0.8)" }}
                                  whileTap={{ scale: 0.98 }}
                                  className="flex items-center w-full px-3 py-2.5 rounded-lg text-left text-sm text-gray-600 transition-all group"
                                  onClick={() => setSearchQuery(search)}
                                >
                                  <FiClock className="w-3.5 h-3.5 mr-3 text-gray-400 group-hover:text-gray-500" />
                                  <span className="group-hover:text-gray-800 truncate">{search}</span>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Popular */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                            <IoSparkles className="w-3.5 h-3.5" />
                            Popular
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            {popularCategories.slice(0, 4).map((category, index) => (
                              <Link
                                href={`/discover?category=${category.name.toLowerCase()}`}
                                key={index}
                                onClick={() => setShowSearch(false)}
                              >
                                <motion.div
                                  whileHover={{ scale: 1.02, y: -1 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={`flex items-center px-3 py-3 rounded-xl text-xs transition-all group ${category.bgColor} hover:shadow-sm border border-white/50`}
                                >
                                  <span className={`w-4 h-4 flex items-center justify-center mr-2.5 ${category.color}`}>
                                    {category.icon}
                                  </span>
                                  <span className={`font-semibold ${category.color} truncate`}>{category.name}</span>
                                </motion.div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right cluster */}
              {isLoading ? (
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"></div>
              ) : currentUser ? (
                <>

                  {/* Connect / Account */}
                  <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }} className="hidden sm:block">
                    <button
                      onClick={() => {
                        if (isConnected) openAccountModal?.();
                        else openConnectModal?.();
                      }}
                      className="h-11 px-6 bg-[#FF5722] rounded-2xl text-white hover:bg-[#E64A19] transition-all duration-300"
                    >
                      <span className="font-semibold text-sm whitespace-nowrap">
                        {isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
                      </span>
                    </button>
                  </motion.div>

                  {/* Mobile menu */}
                  <motion.button
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    className="mobile-menu-button lg:hidden w-11 h-11 rounded-2xl flex items-center justify-center bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                    onClick={toggleMobileMenu}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isMenuOpen ? 'close' : 'open'}
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
                      </motion.div>
                    </AnimatePresence>
                  </motion.button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors hidden sm:block"
                  >
                    Log In
                  </Link>

                  <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/signup"
                      className="bg-[#FF5722] hover:bg-[#E64A19] transition-all duration-300 px-6 py-2.5 rounded-2xl text-white text-sm font-semibold inline-block"
                    >
                      Sign Up
                    </Link>
                  </motion.div>

                  <motion.button
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    className="mobile-menu-button lg:hidden w-11 h-11 rounded-2xl flex items-center justify-center bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                    onClick={toggleMobileMenu}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isMenuOpen ? 'close' : 'open'}
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
                      </motion.div>
                    </AnimatePresence>
                  </motion.button>
                </>
              )}
            </div>
          </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={mobileNavRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed top-[72px] left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 z-40 lg:hidden max-h-[calc(100vh-72px)] overflow-y-auto"
          >
            <div className="p-6">
              {/* Featured card */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <IoSparkles className="w-5 h-5 text-[#FF5722]" />
                  Featured for You
                </h3>

                <div className="relative overflow-hidden rounded-3xl">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentFeaturedIndex}
                      initial={{ x: 300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -300, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="w-full"
                    >
                      <Link
                        href={featuredContent[currentFeaturedIndex].link}
                        className={`block p-6 rounded-3xl bg-gradient-to-br ${featuredContent[currentFeaturedIndex].gradient} text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]`}
                        onClick={closeMobileMenu}
                      >
                        <div className="relative">
                          <h4 className="font-bold text-xl mb-2 leading-tight">
                            {featuredContent[currentFeaturedIndex].title}
                          </h4>
                          <p className="text-white/90 text-base mb-1 font-medium">
                            {featuredContent[currentFeaturedIndex].subtitle}
                          </p>
                          <p className="text-white/80 text-sm mb-4 leading-relaxed">
                            {featuredContent[currentFeaturedIndex].description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-sm font-semibold">
                              {featuredContent[currentFeaturedIndex].cta}
                              <FiArrowRight className="w-4 h-4 ml-2" />
                            </span>
                            <div className="flex gap-1">
                              {featuredContent.map((_, index) => (
                                <div
                                  key={index}
                                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    index === currentFeaturedIndex ? 'bg-white scale-125' : 'bg-white/50'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Wallet action */}
              <div className="space-y-6">
                <button
                  onClick={() => {
                    if (isConnected) openAccountModal?.();
                    else openConnectModal?.();
                    closeMobileMenu();
                  }}
                  className="block w-full text-left"
                >
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-[#FF5722]/10 to-[#E64A19]/10 hover:from-[#FF5722]/20 hover:to-[#E64A19]/20 w-full py-5 px-6 rounded-2xl text-[#FF5722] font-semibold text-base transition-all flex items-center justify-between shadow-lg border border-[#FF5722]/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#FF5722]/10 flex items-center justify-center shadow-sm">
                        <IoFlash className="w-5 h-5 text-[#FF5722]" />
                      </div>
                      <div>
                        <span className="block font-bold">
                          {isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
                        </span>
                        <span className="text-sm text-[#FF5722]/70">
                          {isConnected ? 'Manage your wallet' : 'Link your crypto wallet'}
                        </span>
                      </div>
                    </div>
                    <FiChevronRight className="w-5 h-5" />
                  </motion.div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global styles used by this header */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(300%) skewX(-12deg); }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </>
  );
}