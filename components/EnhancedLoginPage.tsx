'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiUser, FiCalendar, FiTrendingUp, FiUsers, FiZap, FiStar, FiHeart, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useError } from '@/context/ErrorContext';
import { useBaseAuth } from '@/hooks/useBaseAuth';
import LoadingSpinner from '@/components/LoadingSpinner';
import RoviLogo from '@/public/images/contents/rovi-logo.png';
import GoogleIcon from '@/public/images/icons/google-logo.svg';
import BaseIcon from '@/public/images/icons/base-logo.png';
import MetaMaskIcon from '@/public/images/icons/metamask-logo.svg';
import { getOAuthRedirectUri } from '@/utils/env';

const DEMO_CREDENTIALS = {
    admin: {
        email: 'admin@rovify.io',
        password: 'demo123',
        userData: {
            id: 'adm-demo-001',
            email: 'admin@rovify.io',
            name: 'Marcus Chen',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            authMethod: 'email' as const,
            role: 'admin',
            company: 'Rovify',
        }
    },
    organiser: {
        email: 'organiser@rovify.io',
        password: 'demo123',
        userData: {
            id: 'org-demo-001',
            email: 'organiser@rovify.io',
            name: 'Sarah Johnson',
            image: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
            authMethod: 'email' as const,
            role: 'organiser',
            company: 'EventCorp',
        }
    },
    attendee: {
        email: 'attendee@rovify.io',
        password: 'demo123',
        userData: {
            id: 'att-demo-001',
            email: 'attendee@rovify.io',
            name: 'Alex Rivera',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            authMethod: 'email' as const,
            role: 'attendee',
            company: 'TechStartup Inc',
        }
    }
};

const EVENT_IMAGES = [
    {
        src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop',
        alt: 'Vibrant concert crowd',
        title: 'Unforgettable Experiences'
    },
    {
        src: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop',
        alt: 'Conference networking',
        title: 'Professional Networking'
    },
    {
        src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop',
        alt: 'Corporate event celebration',
        title: 'Corporate Excellence'
    },
    {
        src: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=600&fit=crop',
        alt: 'Festival celebration',
        title: 'Community Celebrations'
    }
];

const DYNAMIC_MESSAGES = [
    {
        title: "WHERE MOMENTS",
        subtitle: "BEGIN",
        description: "Create unforgettable experiences that connect creators with their communities worldwide."
    },
    {
        title: "STREAM IT!",
        subtitle: "FLEX IT! OWN IT!",
        description: "Revolutionary NFT ticketing and creator marketplace built for the Web3 generation."
    },
    {
        title: "CREATORS FIRST,",
        subtitle: "ALWAYS",
        description: "Direct monetization, global reach, and community building tools in one platform."
    },
    {
        title: "YOUR STORY,",
        subtitle: "YOUR RULES",
        description: "Take control of your content, audience, and revenue with our creator-first platform."
    }
];

export default function EnhancedLoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, loginWithProvider, isAuthenticated } = useAuth();
    const { showError, showWarning, showInfo } = useError();
    const { authenticateWithBase, isLoading: isBaseLoading, error: baseError } = useBaseAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
    const [walletAvailable, setWalletAvailable] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Image carousel state
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    // If authenticated, ensure we leave auth pages immediately
    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/home');
        }
    }, [isAuthenticated, router]);

    // Fallback: when success overlay shows, force redirect shortly after
    useEffect(() => {
        if (showSuccess) {
            const t = setTimeout(() => router.replace('/home'), 300);
            return () => clearTimeout(t);
        }
    }, [showSuccess, router]);

    // Image and message rotation effect
    useEffect(() => {
        const imageInterval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % EVENT_IMAGES.length);
        }, 4000);

        const messageInterval = setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % DYNAMIC_MESSAGES.length);
        }, 5000);

        return () => {
            clearInterval(imageInterval);
            clearInterval(messageInterval);
        };
    }, []);

    // Check for MetaMask
    useEffect(() => {
        const checkMetaMask = () => {
            const isInstalled = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
            setIsMetaMaskInstalled(isInstalled);
            setWalletAvailable(isInstalled);
        };

        checkMetaMask();
        window.addEventListener('load', checkMetaMask);
        return () => window.removeEventListener('load', checkMetaMask);
    }, []);

    // Handle base auth errors
    useEffect(() => {
        if (baseError) {
            showError('Wallet Connection Failed', baseError);
        }
    }, [baseError, showError]);

    const validateForm = useCallback(() => {
        const errors: Record<string, string> = {};

        if (!email.trim()) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!password.trim()) {
            errors.password = 'Password is required';
        } else if (password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [email, password]);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            showWarning('Please fix the errors below', 'Check your email and password format');
            return;
        }

        setIsLoading(true);
        setValidationErrors({});

        try {
            await login(email, password);
            setShowSuccess(true);
        } catch (error) {
            // Error handling is now done in the AuthContext
            console.error('Login failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDemoLogin = async (role: keyof typeof DEMO_CREDENTIALS) => {
        const credentials = DEMO_CREDENTIALS[role];
        setEmail(credentials.email);
        setPassword(credentials.password);
        
        setIsLoading(true);
        setValidationErrors({});

        try {
            await login(credentials.email, credentials.password);
            setShowSuccess(true);
        } catch (error) {
            console.error('Demo login failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProviderLogin = async (provider: 'google' | 'github') => {
        setIsLoading(true);
        try {
            await loginWithProvider(provider);
        } catch (error) {
            console.error(`${provider} login failed:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBaseLogin = async () => {
        if (!walletAvailable) {
            showError('Wallet Not Available', 'Please install MetaMask or another Web3 wallet to continue.');
            return;
        }

        try {
            await authenticateWithBase();
        } catch (error) {
            console.error('Base login failed:', error);
        }
    };

    const handleForgotPassword = () => {
        showInfo('Password Reset', 'Please contact support for password reset assistance.');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex">
            {/* Left side - Dynamic content */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF5722]/10 via-transparent to-[#E64A19]/10" />
                
                {/* Animated background elements */}
                <div className="absolute inset-0">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <FloatingElement key={i} delay={i * 0.5} />
                    ))}
                </div>

                {/* Image carousel */}
                <div className="relative w-full h-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentImageIndex}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                            className="absolute inset-0"
                        >
                            <Image
                                src={EVENT_IMAGES[currentImageIndex].src}
                                alt={EVENT_IMAGES[currentImageIndex].alt}
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-black/40" />
                        </motion.div>
                    </AnimatePresence>

                    {/* Content overlay */}
                    <div className="absolute inset-0 flex items-center justify-center p-12">
                        <div className="text-center text-white">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentMessageIndex}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                >
                                    <h1 className="text-5xl font-bold mb-4 tracking-tight">
                                        {DYNAMIC_MESSAGES[currentMessageIndex].title}
                                    </h1>
                                    <h2 className="text-3xl font-semibold mb-6 text-orange-300">
                                        {DYNAMIC_MESSAGES[currentMessageIndex].subtitle}
                                    </h2>
                                    <p className="text-xl text-gray-200 max-w-md mx-auto leading-relaxed">
                                        {DYNAMIC_MESSAGES[currentMessageIndex].description}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Image indicators */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {EVENT_IMAGES.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                    index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right side - Login form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Logo and header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex justify-center mb-6"
                        >
                            <div className="w-16 h-16 bg-gradient-to-br from-[#FF5722] to-[#E64A19] rounded-2xl flex items-center justify-center shadow-lg">
                                <Image
                                    src={RoviLogo}
                                    alt="Rovify Logo"
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                />
                            </div>
                        </motion.div>
                        
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-3xl font-bold text-gray-900 mb-2"
                        >
                            Welcome Back
                        </motion.h1>
                        
                        <motion.p
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-gray-600"
                        >
                            Sign in to your account to continue
                        </motion.p>
                    </div>

                    {/* Login form */}
                    <motion.form
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        onSubmit={handleEmailLogin}
                        className="space-y-6"
                    >
                        {/* Email field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiMail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-colors ${
                                        validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter your email"
                                    disabled={isLoading}
                                />
                            </div>
                            {validationErrors.email && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-1 text-sm text-red-600 flex items-center gap-1"
                                >
                                    <FiAlertCircle className="w-4 h-4" />
                                    {validationErrors.email}
                                </motion.p>
                            )}
                        </div>

                        {/* Password field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiLock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`block w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-colors ${
                                        validationErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter your password"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                            {validationErrors.password && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-1 text-sm text-red-600 flex items-center gap-1"
                                >
                                    <FiAlertCircle className="w-4 h-4" />
                                    {validationErrors.password}
                                </motion.p>
                            )}
                        </div>

                        {/* Forgot password */}
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="text-sm text-[#FF5722] hover:text-[#E64A19] transition-colors"
                                disabled={isLoading}
                            >
                                Forgot your password?
                            </button>
                        </div>

                        {/* Submit button */}
                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-gradient-to-r from-[#FF5722] to-[#E64A19] text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <LoadingSpinner size="sm" color="white" />
                            ) : (
                                <>
                                    Sign In
                                    <FiArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </motion.button>
                    </motion.form>

                    {/* Demo accounts */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="mt-8"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-3 gap-3">
                            {Object.entries(DEMO_CREDENTIALS).map(([role, credentials]) => (
                                <motion.button
                                    key={role}
                                    onClick={() => handleDemoLogin(role as keyof typeof DEMO_CREDENTIALS)}
                                    disabled={isLoading}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="p-3 border border-gray-200 rounded-xl hover:border-[#FF5722]/50 hover:bg-[#FF5722]/5 transition-all duration-200 disabled:opacity-50"
                                >
                                    <div className="text-xs font-medium text-gray-700 capitalize">
                                        {role}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {credentials.email}
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Social login */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="mt-8"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <motion.button
                                onClick={() => handleProviderLogin('google')}
                                disabled={isLoading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all duration-200 disabled:opacity-50"
                            >
                                <Image src={GoogleIcon} alt="Google" width={20} height={20} />
                                <span className="text-sm font-medium text-gray-700">Google</span>
                            </motion.button>

                            <motion.button
                                onClick={handleBaseLogin}
                                disabled={isLoading || isBaseLoading || !walletAvailable}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50"
                            >
                                <Image src={BaseIcon} alt="Base" width={20} height={20} />
                                <span className="text-sm font-medium text-gray-700">Base</span>
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Sign up link */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="mt-8 text-center"
                    >
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link
                                href="/auth/register"
                                className="font-semibold text-[#FF5722] hover:text-[#E64A19] transition-colors"
                            >
                                Sign up
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Success overlay */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-green-500/90 backdrop-blur-sm z-50 flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-white rounded-2xl p-8 text-center shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiCheck className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
                            <p className="text-gray-600">Redirecting you to your dashboard...</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Floating element component
const FloatingElement = ({ delay }: { delay: number }) => {
    return (
        <motion.div
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            initial={{
                x: Math.random() * 400,
                y: Math.random() * 600,
                scale: Math.random() * 0.5 + 0.5
            }}
            animate={{
                x: Math.random() * 400,
                y: Math.random() * 600,
                scale: [0.5, 1, 0.5],
                opacity: [0.2, 0.8, 0.2]
            }}
            transition={{
                duration: Math.random() * 10 + 15,
                repeat: Infinity,
                delay: delay,
                ease: "linear"
            }}
        />
    );
};
