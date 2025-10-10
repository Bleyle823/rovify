/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Bell, Video, Plus, Calendar, Settings, User, LayoutDashboard } from 'lucide-react';
import { IoTicket } from "react-icons/io5";
import { BsCameraVideoFill, BsController } from "react-icons/bs";
import { MdOutlineAddBox, MdOutlineNotifications } from "react-icons/md";
import { AiOutlineShop } from "react-icons/ai";
import { motion, AnimatePresence } from 'framer-motion';

interface NavigationItem {
    href: string;
    icon: React.ReactNode;
    label: string;
}

interface SideNavigationProps {
    isOrganiser?: boolean;
    className?: string;
}

export default function SideNavigation({ isOrganiser = false, className = '' }: SideNavigationProps) {
    const pathname = usePathname();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isDesktop, setIsDesktop] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isShortScreen, setIsShortScreen] = useState(false);
    const [isVeryShortScreen, setIsVeryShortScreen] = useState(false);
    const [isTallScreen, setIsTallScreen] = useState(false);

    // Responsive handling
    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const mobile = width < 768;
            const tablet = width >= 768 && width < 1024;
            const desktop = width >= 1024;
            
            // Height-based responsive states
            const shortScreen = height < 600;
            const veryShortScreen = height < 500;
            const tallScreen = height > 900;
            
            setIsMobile(mobile);
            setIsTablet(tablet);
            setIsDesktop(desktop);
            setIsShortScreen(shortScreen);
            setIsVeryShortScreen(veryShortScreen);
            setIsTallScreen(tallScreen);

            // Auto-collapse sidebar on tablet sizes
            if (tablet) {
                setSidebarCollapsed(true);
            } else if (desktop) {
                setSidebarCollapsed(false);
            }

        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);


    const handleToggleCollapse = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };


    const navigationItems: NavigationItem[] = useMemo(() => [
        { href: '/home', icon: <Home />, label: 'Home' },
        { href: '/feed', icon: <Bell />, label: 'Feed' },
        { href: '/stream', icon: <Video />, label: 'Live' },
        { href: '/gaming', icon: <Search />, label: 'Gaming' },
        { href: '/marketplace', icon: <Calendar />, label: 'Shop' },
        { href: '/user-dashboard', icon: <LayoutDashboard />, label: 'Profile' }
    ], []);

    const isActiveRoute = useCallback((href: string): boolean => {
        if (href === '/home') return pathname === '/home' || pathname === '/';
        return pathname.startsWith(href);
    }, [pathname]);

    const shouldHideNavigation = useMemo(() => {
        const hiddenPaths = ['/checkout', '/payment', '/live-event', '/onboarding'];
        return hiddenPaths.some(path => pathname.includes(path));
    }, [pathname]);

    if (shouldHideNavigation) return null;

    return (
        <>

            {/* Desktop/Tablet Modern Dock */}
            <motion.nav
                className={`fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden md:block ${className}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                {/* Events-style vertical oval container */}
                <div className={`items-center bg-white border border-gray-200 rounded-3xl shadow-sm p-4 flex flex-col justify-between transition-all duration-300 ${
                    sidebarCollapsed ? 'w-16' : 'w-20'
                } ${
                    isVeryShortScreen ? 'min-h-[320px] max-h-[360px]' :
                    isShortScreen ? 'min-h-[360px] max-h-[420px]' :
                    isTallScreen ? 'min-h-[460px] max-h-[520px]' :
                    'min-h-[420px] max-h-[460px]'
                }`}>
                    {/* Top collapse button */}
                    <div className="mb-2 flex items-center justify-end w-full">
                        {isTablet && (
                            <motion.button
                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                onClick={handleToggleCollapse}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <motion.div
                                    animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </motion.div>
                            </motion.button>
                        )}
                    </div>

                    {/* Navigation Items */}
                    <div className={`flex flex-col ${
                        isVeryShortScreen ? 'space-y-2' :
                        isShortScreen ? 'space-y-3' :
                        isTallScreen ? 'space-y-4' :
                        'space-y-3'
                    }`}>
                        {navigationItems.map((item, index) => (
                            <ModernNavItem
                                key={item.href}
                                item={item}
                                index={index}
                                isActive={isActiveRoute(item.href)}
                                hoveredIndex={hoveredIndex}
                                setHoveredIndex={setHoveredIndex}
                                isCollapsed={sidebarCollapsed}
                            />
                        ))}

                        {/* Create Button */}
                        {isOrganiser && (
                            <div className="mt-2 pt-2 border-t border-gray-200/60">
                                <ModernCreateButton />
                            </div>
                        )}
                    </div>

                    {/* Bottom actions like events sidebar */}
                    <div className={`pt-3 border-t border-gray-200/60 flex flex-col items-center ${
                        isVeryShortScreen ? 'mt-1 gap-1' :
                        isShortScreen ? 'mt-2 gap-2' :
                        isTallScreen ? 'mt-3 gap-3' :
                        'mt-2 gap-2'
                    }`}>
                        <Link href="/profile" className="w-11 h-11 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-2xl transition-colors">
                            <User className="w-6 h-6" />
                        </Link>
                        <Link href="/settings" className="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors">
                            <Settings className="w-6 h-6 text-white" />
                        </Link>
                    </div>
                </div>
            </motion.nav>


            {/* Mobile Modern Dock */}
            <ModernMobileDock
                navigationItems={navigationItems}
                isActiveRoute={isActiveRoute}
                isOrganiser={isOrganiser}
                isVeryShortScreen={isVeryShortScreen}
                isShortScreen={isShortScreen}
                isTallScreen={isTallScreen}
            />
        </>
    );
}

// Modern Navigation Item
interface ModernNavItemProps {
    item: NavigationItem;
    index: number;
    isActive: boolean;
    hoveredIndex: number | null;
    setHoveredIndex: (index: number | null) => void;
    isCollapsed?: boolean;
}

function ModernNavItem({
    item,
    index,
    isActive,
    hoveredIndex,
    setHoveredIndex,
    isCollapsed = false
}: ModernNavItemProps) {
    const isHovered = hoveredIndex === index;

    return (
        <motion.div
            className="relative"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
        >
            <Link
                href={item.href}
                className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-colors duration-200 ease-out ${isActive ? 'text-orange-500 bg-orange-50' : isHovered ? 'text-gray-700 bg-gray-100' : 'text-gray-400'}`}
                aria-label={item.label}
            >
                <div className="relative z-10 w-6 h-6">
                    {item.icon}
                </div>
            </Link>

            {/* Tooltip for collapsed state */}
            <AnimatePresence>
                {isCollapsed && isHovered && (
                    <motion.div
                        initial={{ opacity: 0, x: -8, scale: 0.96 }}
                        animate={{ opacity: 1, x: 8, scale: 1 }}
                        exit={{ opacity: 0, x: -8, scale: 0.96 }}
                        className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium whitespace-nowrap pointer-events-none z-50 shadow-xl"
                        transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        {item.label}
                        {/* Arrow */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45 bg-gray-900" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function ModernCreateButton() {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileTap={{ scale: 0.95 }}
        >
            <Link
                href="/organiser-dashboard/events/create-nft"
                className="
          relative flex items-center justify-center
          w-10 h-10 rounded-xl
          bg-orange-500 hover:bg-orange-600
          transition-colors duration-200 ease-out
          group
        "
                aria-label="Create new event"
            >
                {/* Icon */}
                <motion.div
                    animate={{ rotate: isHovered ? 90 : 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    <Plus className="w-5 h-5 text-white" />
                </motion.div>

                {/* Modern Tooltip */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0, x: -8, scale: 0.96 }}
                            animate={{ opacity: 1, x: 8, scale: 1 }}
                            exit={{ opacity: 0, x: -8, scale: 0.96 }}
                            className="
                absolute left-full top-1/2 -translate-y-1/2 ml-3
                px-3 py-2 rounded-lg
                bg-gray-900 text-white text-sm font-medium
                whitespace-nowrap pointer-events-none z-50
                shadow-xl
              "
                            transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            Create NFT Event

                            {/* Arrow */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45 bg-gray-900" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </Link>
        </motion.div>
    );
}

function ModernMobileDock({
    navigationItems,
    isActiveRoute,
    isOrganiser,
    isVeryShortScreen,
    isShortScreen,
    isTallScreen
}: {
    navigationItems: NavigationItem[];
    isActiveRoute: (href: string) => boolean;
    isOrganiser: boolean;
    isVeryShortScreen: boolean;
    isShortScreen: boolean;
    isTallScreen: boolean;
}) {
    const [pressedIndex, setPressedIndex] = useState<number | null>(null);

    const displayItems = navigationItems.slice(0, isOrganiser ? 4 : 5);

    return (
        <div className={`md:hidden fixed left-0 right-0 z-50 ${
            isVeryShortScreen ? 'bottom-2' :
            isShortScreen ? 'bottom-3' :
            isTallScreen ? 'bottom-6' :
            'bottom-0'
        }`}>
            {/* Background Blur Area */}
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />

            {/* Main Navigation Container */}
            <div className="relative">
                {/* Premium Container with Clean Design */}
                <motion.div
                    className={`
            relative bg-white/95 backdrop-blur-xl
            border border-gray-200/60 rounded-[28px]
            shadow-xl shadow-gray-900/8
            overflow-hidden
            ${
                isVeryShortScreen ? 'mx-3 mb-2 mt-1' :
                isShortScreen ? 'mx-3.5 mb-3 mt-1.5' :
                isTallScreen ? 'mx-6 mb-6 mt-3' :
                'mx-4 mb-4 mt-2'
            }
          `}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
                >
                    {/* Navigation Items Container */}
                    <div className="flex items-stretch px-2 py-2">
                        {displayItems.map((item, index) => (
                            <MobileProfessionalNavItem
                                key={item.href}
                                item={item}
                                index={index}
                                isActive={isActiveRoute(item.href)}
                                pressedIndex={pressedIndex}
                                setPressedIndex={setPressedIndex}
                                isVeryShortScreen={isVeryShortScreen}
                                isShortScreen={isShortScreen}
                                isTallScreen={isTallScreen}
                            />
                        ))}

                        {/* Professional Mobile Create Button */}
                        {isOrganiser && (
                            <MobileProfessionalCreateButton
                                pressedIndex={pressedIndex}
                                setPressedIndex={setPressedIndex}
                                isVeryShortScreen={isVeryShortScreen}
                                isShortScreen={isShortScreen}
                                isTallScreen={isTallScreen}
                            />
                        )}
                    </div>

                    {/* Subtle Bottom Accent */}
                    <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-gray-200/40 to-transparent" />
                </motion.div>

                {/* iOS Safe Area with Gradient */}
                <div className="h-safe-area-inset-bottom bg-gradient-to-t from-white via-white/95 to-transparent" />
            </div>
        </div>
    );
}

interface MobileProfessionalNavItemProps {
    item: NavigationItem;
    index: number;
    isActive: boolean;
    pressedIndex: number | null;
    setPressedIndex: (index: number | null) => void;
    isVeryShortScreen: boolean;
    isShortScreen: boolean;
    isTallScreen: boolean;
}

function MobileProfessionalNavItem({
    item,
    index,
    isActive,
    pressedIndex,
    setPressedIndex,
    isVeryShortScreen,
    isShortScreen,
    isTallScreen
}: MobileProfessionalNavItemProps) {
    const isPressed = pressedIndex === index;

    return (
        <Link
            href={item.href}
            className="flex-1 relative"
            onTouchStart={() => setPressedIndex(index)}
            onTouchEnd={() => setPressedIndex(null)}
            onTouchCancel={() => setPressedIndex(null)}
        >
            <motion.div
                className={`
          relative flex flex-col items-center justify-center
          px-3 rounded-[20px]
          cursor-pointer select-none
          ${
              isVeryShortScreen ? 'h-[3.5rem]' :
              isShortScreen ? 'h-[4rem]' :
              isTallScreen ? 'h-[5.5rem]' :
              'h-[4.5rem]'
          }
        `}
                animate={{
                    scale: isPressed ? 0.95 : 1,
                }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 0.5
                }}
            >
                {/* iOS-style Dot Indicator */}
                <AnimatePresence>
                    {isActive && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute top-0.5 w-1.5 h-1.5 bg-orange-500 rounded-full"
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                                duration: 0.3
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Icon Container */}
                <motion.div
                    className="relative mt-1"
                    animate={{
                        y: isActive ? -1 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <motion.div
                        className="w-7 h-7 flex items-center justify-center text-2xl"
                        animate={{
                            color: isActive ? '#f97316' : '#9ca3af',
                            scale: isActive ? 1.1 : 1,
                        }}
                        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        {item.icon}
                    </motion.div>

                    {/* Subtle glow for active state */}
                    <AnimatePresence>
                        {isActive && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 0.2, scale: 1.3 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute inset-0 bg-orange-400 rounded-full blur-md"
                                transition={{ duration: 0.3 }}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Label */}
                <motion.span
                    className="
            text-xs mt-1
            whitespace-nowrap overflow-hidden text-ellipsis
            max-w-full
          "
                    animate={{
                        color: isActive ? '#f97316' : '#9ca3af',
                        fontWeight: isActive ? 600 : 400,
                        fontSize: isActive ? '0.75rem' : '0.7rem',
                    }}
                    transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    {item.label}
                </motion.span>

                {/* Touch Feedback Ripple */}
                <AnimatePresence>
                    {isPressed && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0.3 }}
                            animate={{ scale: 2.2, opacity: 0 }}
                            exit={{ scale: 2.2, opacity: 0 }}
                            className="absolute inset-0 bg-orange-200 rounded-[20px]"
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </Link>
    );
}

interface MobileProfessionalCreateButtonProps {
    pressedIndex: number | null;
    setPressedIndex: (index: number | null) => void;
    isVeryShortScreen: boolean;
    isShortScreen: boolean;
    isTallScreen: boolean;
}

function MobileProfessionalCreateButton({
    pressedIndex,
    setPressedIndex,
    isVeryShortScreen,
    isShortScreen,
    isTallScreen
}: MobileProfessionalCreateButtonProps) {
    const isPressed = pressedIndex === -1;

    return (
        <Link
            href="/organiser-dashboard/events/create-nft"
            className="flex-1 relative"
            onTouchStart={() => setPressedIndex(-1)}
            onTouchEnd={() => setPressedIndex(null)}
            onTouchCancel={() => setPressedIndex(null)}
        >
                <motion.div
                className={`
          relative flex flex-col items-center justify-center
          px-3 rounded-[20px]
          bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600
          cursor-pointer select-none overflow-hidden
          ${
              isVeryShortScreen ? 'h-[3.5rem]' :
              isShortScreen ? 'h-[4rem]' :
              isTallScreen ? 'h-[5.5rem]' :
              'h-[4.5rem]'
          }
        `}
                animate={{
                    scale: isPressed ? 0.95 : 1,
                }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 0.5
                }}
                style={{
                    boxShadow: '0 4px 20px rgba(249, 115, 22, 0.25), 0 2px 8px rgba(249, 115, 22, 0.15)'
                }}
            >
                {/* Create indicator dot (always visible for create button) */}
                <div className="absolute top-0.5 w-1.5 h-1.5 bg-white/90 rounded-full" />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-white/10" />

                {/* Plus Icon */}
                <motion.div
                    className="relative z-10 mb-1 mt-1"
                    animate={{
                        rotate: isPressed ? 90 : 0,
                        scale: isPressed ? 0.95 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <Plus className="w-6 h-6 text-white drop-shadow-sm" />
                </motion.div>

                {/* Create Label */}
                <motion.span
                    className="text-xs font-semibold text-white/95 relative z-10"
                    animate={{
                        opacity: isPressed ? 0.8 : 1,
                    }}
                    transition={{ duration: 0.15 }}
                >
                    Create
                </motion.span>

                {/* Subtle Shimmer Effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                    animate={{
                        x: ['-100%', '200%']
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 4,
                        ease: "easeInOut"
                    }}
                />

                {/* Press Ripple */}
                <AnimatePresence>
                    {isPressed && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0.4 }}
                            animate={{ scale: 2.5, opacity: 0 }}
                            exit={{ scale: 2.5, opacity: 0 }}
                            className="absolute inset-0 bg-white rounded-[20px]"
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </Link>
    );
}

// Premium Mobile Navigation Item
interface MobilePremiumNavItemProps {
    item: NavigationItem;
    index: number;
    isActive: boolean;
    pressedIndex: number | null;
    setPressedIndex: (index: number | null) => void;
    setActiveIndex: (index: number) => void;
}

function MobilePremiumNavItem({
    item,
    index,
    isActive,
    pressedIndex,
    setPressedIndex,
    setActiveIndex
}: MobilePremiumNavItemProps) {
    const isPressed = pressedIndex === index;

    return (
        <Link
            href={item.href}
            className="flex-1 relative"
            onTouchStart={() => {
                setPressedIndex(index);
                setActiveIndex(index);
            }}
            onTouchEnd={() => setPressedIndex(null)}
            onTouchCancel={() => setPressedIndex(null)}
        >
            <motion.div
                className="
          relative flex flex-col items-center justify-center
          h-12 px-3 rounded-[20px]
          cursor-pointer select-none
        "
                animate={{
                    scale: isPressed ? 0.92 : 1,
                }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 0.5
                }}
            >
                {/* Icon Container */}
                <motion.div
                    className="relative"
                    animate={{
                        y: isActive ? -2 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <motion.div
                        className="w-7 h-7 flex items-center justify-center"
                        animate={{
                            color: isActive ? '#f97316' : '#6b7280',
                            scale: isActive ? 1.1 : 1,
                        }}
                        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        {item.icon}
                    </motion.div>

                    {/* Active Glow Effect */}
                    <AnimatePresence>
                        {isActive && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 0.4, scale: 1.2 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute inset-0 bg-orange-400 rounded-full blur-md"
                                transition={{ duration: 0.3 }}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Dynamic Label */}
                <motion.span
                    className="
            text-xs font-medium mt-0.5
            whitespace-nowrap overflow-hidden text-ellipsis
            max-w-full
          "
                    animate={{
                        color: isActive ? '#f97316' : '#9ca3af',
                        opacity: isActive ? 1 : 0.75,
                        y: isActive ? 1 : 0,
                        fontSize: isActive ? '0.75rem' : '0.7rem',
                        fontWeight: isActive ? 600 : 500,
                    }}
                    transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    {item.label}
                </motion.span>

                {/* Ripple Effect for Touch */}
                <AnimatePresence>
                    {isPressed && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0.3 }}
                            animate={{ scale: 2, opacity: 0 }}
                            exit={{ scale: 2, opacity: 0 }}
                            className="absolute inset-0 bg-orange-200 rounded-[20px]"
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </Link>
    );
}

// Premium Mobile Create Button
interface MobilePremiumCreateButtonProps {
    pressedIndex: number | null;
    setPressedIndex: (index: number | null) => void;
}

function MobilePremiumCreateButton({
    pressedIndex,
    setPressedIndex
}: MobilePremiumCreateButtonProps) {
    const isPressed = pressedIndex === -1; // Use -1 for create button

    return (
        <Link
            href="/create"
            className="flex-1 relative"
            onTouchStart={() => setPressedIndex(-1)}
            onTouchEnd={() => setPressedIndex(null)}
            onTouchCancel={() => setPressedIndex(null)}
        >
            <motion.div
                className="
          relative flex flex-col items-center justify-center
          h-12 px-3 rounded-[20px]
          bg-gradient-to-br from-orange-500 via-orange-500 to-red-500
          cursor-pointer select-none overflow-hidden
        "
                animate={{
                    scale: isPressed ? 0.92 : 1,
                }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 0.5
                }}
                style={{
                    boxShadow: '0 4px 20px rgba(249, 115, 22, 0.25), 0 2px 8px rgba(249, 115, 22, 0.15)'
                }}
            >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />

                {/* Plus Icon */}
                <motion.div
                    className="relative z-10"
                    animate={{
                        rotate: isPressed ? 45 : 0,
                        scale: isPressed ? 0.9 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <Plus className="w-6 h-6 text-white drop-shadow-sm" />
                </motion.div>

                {/* Create Label */}
                <motion.span
                    className="text-xs font-semibold text-white/95 mt-0.5 relative z-10"
                    animate={{
                        opacity: isPressed ? 0.8 : 1,
                    }}
                    transition={{ duration: 0.15 }}
                >
                    Create
                </motion.span>

                {/* Shimmer Effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                    animate={{
                        x: ['-100%', '200%']
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3,
                        ease: "easeInOut"
                    }}
                />

                {/* Press Ripple */}
                <AnimatePresence>
                    {isPressed && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0.4 }}
                            animate={{ scale: 2.5, opacity: 0 }}
                            exit={{ scale: 2.5, opacity: 0 }}
                            className="absolute inset-0 bg-white rounded-[20px]"
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </Link>
    );
}