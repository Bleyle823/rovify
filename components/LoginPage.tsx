/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useBaseAuth } from '@/hooks/useBaseAuth';
import RoviLogo from '@/public/images/contents/rovi-logo.png';
import GoogleIcon from '@/public/images/icons/google-logo.svg';
import BaseIcon from '@/public/images/icons/base-logo.png';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithProvider, isAuthenticated } = useAuth();
  const { authenticateWithBase, isLoading: isBaseLoading, error: baseError } = useBaseAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [walletAvailable, setWalletAvailable] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Typing animation state
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const fullText = "Where every event becomes an unforgettable experience";

  const isValidEmail = email.includes('@') && email.includes('.');

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Check wallet availability
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWalletAvailable(!!window.ethereum);
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/home');
    }
  }, [isAuthenticated, router]);

  // Typing animation effect
  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex]);

  // Handle Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isLoading && email && password) {
        handleLogin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [email, password, isLoading]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (!isValidEmail) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      setShowSuccess(true);
      setTimeout(() => router.replace('/home'), 1500);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      await loginWithProvider('google');
    } catch (error) {
      setError('Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleBaseLogin = async () => {
    try {
      if (!walletAvailable) {
        setError('Wallet not available. Please install MetaMask or another Web3 wallet to continue.');
        return;
      }
      setError('');
      const result = await authenticateWithBase('/home');
      if (!result.success && baseError) {
        setError(baseError);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to authenticate with Base');
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-[#FFFBF7]">
      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.6, bounce: 0.4 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#ff5521] to-[#ff7a47] rounded-full flex items-center justify-center shadow-2xl mx-auto mb-4">
                <FiCheck className="w-10 h-10 text-white" strokeWidth={3} />
              </div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg font-semibold text-gray-900"
              >
                Welcome back!
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Side - Brand Experience */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#FFF5F0] via-[#FFF8F3] to-[#FFFBF7]">
        {/* Warm light gradient overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,85,33,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(255,122,71,0.05),transparent_50%)]" />
        
        {/* Floating gradient orbs with parallax */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-3xl opacity-20"
          style={{
            background: 'radial-gradient(circle, #ff5521 0%, transparent 70%)',
            x: mousePosition.x * 0.5,
            y: mousePosition.y * 0.5
          }}
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] rounded-full blur-3xl opacity-15"
          style={{
            background: 'radial-gradient(circle, #ffb380 0%, transparent 70%)',
            x: mousePosition.x * -0.3,
            y: mousePosition.y * -0.3
          }}
          animate={{ 
            scale: [1.15, 1, 1.15],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle, #ff5521 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10 flex flex-col justify-between p-16 h-full">
          {/* Logo & Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 mb-20">
              {/* Circular logo container */}
              <motion.div 
                className="relative h-12 w-12 bg-white/60 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg border border-[#ff5521]/10"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full" />
                <Image
                  src={RoviLogo}
                  alt="Rovify Logo"
                  width={28}
                  height={28}
                  className="object-contain relative z-10"
                />
              </motion.div>
              <div>
                <span className="text-3xl font-bold tracking-tight text-gray-900">rovify</span>
                <div className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">Event Platform</div>
              </div>
            </div>

            {/* Floating Card with Typing Animation */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="max-w-xl"
            >
              <motion.div
                className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-tr-3xl rounded-bl-3xl p-10 shadow-xl"
                style={{
                  x: mousePosition.x * 0.2,
                  y: mousePosition.y * 0.2
                }}
              >
                <h1 className="text-4xl font-bold leading-tight mb-6">
                  <span className="block text-gray-900 mb-2">Welcome back</span>
                  <span className="block bg-gradient-to-r from-[#ff5521] via-[#ff7a47] to-[#ff8f5e] bg-clip-text text-transparent">
                    to Rovify
                  </span>
                </h1>
                <p className="text-base text-gray-600 leading-relaxed font-normal min-h-[4.5rem]">
                  {displayedText}
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-0.5 h-5 bg-[#ff5521] ml-1 align-middle"
                  />
                </p>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Floating Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 1 }}
            className="flex gap-4"
          >
            {[
              { label: 'Active Users', value: '50K+' },
              { label: 'Events Created', value: '100K+' },
              { label: 'Success Rate', value: '99.9%' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="flex-1 bg-white/40 backdrop-blur-xl border border-white/60 rounded-tr-2xl rounded-bl-2xl p-5 text-center"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                style={{
                  x: mousePosition.x * (0.1 * (index + 1)),
                  y: mousePosition.y * (0.1 * (index + 1))
                }}
              >
                <div className="text-2xl font-bold bg-gradient-to-r from-[#ff5521] to-[#ff7a47] bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-[10px] text-gray-600 uppercase tracking-wide font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `radial-gradient(circle, #ff5521 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }} />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-12 text-center">
            <div className="relative h-12 w-12 bg-gradient-to-br from-[#ff5521] to-[#ff7a47] rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg">
              <Image
                src={RoviLogo}
                alt="Rovify Logo"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ff5521] to-[#ff7a47] bg-clip-text text-transparent">
              rovify
            </h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Sign in
              </h2>
              <p className="text-gray-500 text-sm">
                Continue to your account
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, height: 0 }}
                  animate={{ opacity: 1, scale: 1, height: 'auto' }}
                  exit={{ opacity: 0, scale: 0.95, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-tr-xl rounded-bl-xl text-red-700 shadow-sm">
                    <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-medium">{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <div className="space-y-5">
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className={`h-4 w-4 transition-colors ${
                      email ? 'text-[#ff5521]' : 'text-gray-400'
                    }`} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-tr-2xl rounded-bl-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#ff5521] focus:bg-white transition-all text-sm"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  {email && emailTouched && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        isValidEmail ? 'bg-green-500' : 'bg-orange-400'
                      }`} />
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-semibold text-[#ff5521] hover:text-[#e64a19] transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className={`h-4 w-4 transition-colors ${
                      password ? 'text-[#ff5521]' : 'text-gray-400'
                    }`} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-tr-2xl rounded-bl-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#ff5521] focus:bg-white transition-all text-sm"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-4 w-4" />
                    ) : (
                      <FiEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                onClick={handleLogin}
                disabled={isLoading || isBaseLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-[#ff5521] to-[#ff7a47] text-white font-semibold rounded-tr-2xl rounded-bl-2xl focus:outline-none focus:ring-4 focus:ring-[#ff5521]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#ff5521]/20 hover:shadow-xl hover:shadow-[#ff5521]/30 flex items-center justify-center gap-2 group text-sm"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </div>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-500 font-medium uppercase tracking-wide">Or continue with</span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="flex gap-3">
              {/* Google */}
              <motion.button
                onClick={handleGoogleLogin}
                disabled={isLoading || isBaseLoading}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 bg-white border-2 border-gray-100 rounded-tr-2xl rounded-bl-2xl hover:border-gray-200 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Image
                  src={GoogleIcon}
                  alt="Google"
                  width={18}
                  height={18}
                  className="object-contain"
                />
                <span className="font-semibold text-gray-700 text-sm">Google</span>
              </motion.button>

              {/* Base */}
              <motion.button
                onClick={handleBaseLogin}
                disabled={isLoading || isBaseLoading || !walletAvailable}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 bg-white border-2 border-gray-100 rounded-tr-2xl rounded-bl-2xl hover:border-gray-200 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title={!walletAvailable ? 'No wallet detected. Install MetaMask to continue.' : undefined}
              >
                <Image
                  src={BaseIcon}
                  alt="Base"
                  width={18}
                  height={18}
                  className="object-contain"
                />
                <span className="font-semibold text-gray-700 text-sm">Base</span>
              </motion.button>
            </div>

            {/* Sign Up Link */}
            <p className="mt-8 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                href="/auth/register"
                className="font-semibold text-[#ff5521] hover:text-[#e64a19] transition-colors"
              >
                Create account
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
