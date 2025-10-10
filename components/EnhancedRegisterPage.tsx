'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheck, FiAlertCircle, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useError } from '@/context/ErrorContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import RoviLogo from '@/public/images/contents/rovi-logo.png';
import GoogleIcon from '@/public/images/icons/google-logo.svg';
import MetaMaskIcon from '@/public/images/icons/metamask-logo.svg';
import AppleIcon from '@/public/images/icons/apple-logo.svg';

interface ValidationErrors {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
}

interface PasswordStrength {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    valid: boolean;
}

export default function EnhancedRegisterPage() {
    const router = useRouter();
    const { register, loginWithProvider } = useAuth();
    const { showError, showSuccess, showWarning } = useError();
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        valid: false
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear validation error for this field
        if (validationErrors[name as keyof ValidationErrors]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }

        // Update password strength if password field changed
        if (name === 'password') {
            updatePasswordStrength(value);
        }
    };

    const updatePasswordStrength = (password: string) => {
        const strength = {
            minLength: password.length >= 8,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            valid: false
        };
        strength.valid = strength.minLength && strength.hasUppercase && strength.hasLowercase && strength.hasNumber;
        setPasswordStrength(strength);
    };

    const validateStep1 = useCallback((): boolean => {
        const errors: ValidationErrors = {};

        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        } else if (formData.name.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData.name, formData.email]);

    const validateStep2 = useCallback((): boolean => {
        const errors: ValidationErrors = {};

        if (!passwordStrength.valid) {
            errors.password = 'Password does not meet requirements';
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData.password, formData.confirmPassword, passwordStrength.valid]);

    const handleNextStep = () => {
        if (validateStep1()) {
            setStep(2);
        } else {
            showWarning('Please fix the errors below', 'Check your name and email format');
        }
    };

    const handlePrevStep = () => {
        setStep(1);
        setValidationErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateStep2()) {
            showWarning('Please fix the errors below', 'Check your password requirements');
            return;
        }

        setIsLoading(true);
        setValidationErrors({});

        try {
            await register(formData.name, formData.email, formData.password);
            showSuccess('Welcome to Rovify!', 'Your account has been created successfully.');
            router.push('/home');
        } catch (error) {
            // Error handling is done in the AuthContext
            console.error('Registration failed:', error);
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

    const getPasswordStrengthColor = () => {
        const validCount = Object.values(passwordStrength).filter(Boolean).length - 1; // -1 for valid property
        if (validCount <= 2) return 'bg-red-500';
        if (validCount <= 3) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getPasswordStrengthText = () => {
        const validCount = Object.values(passwordStrength).filter(Boolean).length - 1;
        if (validCount <= 2) return 'Weak';
        if (validCount <= 3) return 'Medium';
        return 'Strong';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
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
                        Create Account
                    </motion.h1>
                    
                    <motion.p
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-gray-600"
                    >
                        Join Rovify and start creating amazing experiences
                    </motion.p>
                </div>

                {/* Progress indicator */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            step >= 1 ? 'bg-[#FF5722] text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                            {step > 1 ? <FiCheck className="w-4 h-4" /> : '1'}
                        </div>
                        <div className={`w-16 h-1 rounded-full ${
                            step >= 2 ? 'bg-[#FF5722]' : 'bg-gray-200'
                        }`} />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            step >= 2 ? 'bg-[#FF5722] text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                            2
                        </div>
                    </div>
                </motion.div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="bg-white rounded-2xl shadow-xl p-8"
                >
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
                                
                                {/* Name field */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiUser className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="name"
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-colors ${
                                                validationErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                            placeholder="Enter your full name"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {validationErrors.name && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-1 text-sm text-red-600 flex items-center gap-1"
                                        >
                                            <FiAlertCircle className="w-4 h-4" />
                                            {validationErrors.name}
                                        </motion.p>
                                    )}
                                </div>

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
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
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

                                <motion.button
                                    onClick={handleNextStep}
                                    disabled={isLoading}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-gradient-to-r from-[#FF5722] to-[#E64A19] text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    Continue
                                    <FiArrowRight className="w-4 h-4" />
                                </motion.button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Security</h2>
                                    <button
                                        onClick={handlePrevStep}
                                        className="text-gray-500 hover:text-gray-700 transition-colors"
                                        disabled={isLoading}
                                    >
                                        <FiX className="w-5 h-5" />
                                    </button>
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
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={`block w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-colors ${
                                                validationErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                            placeholder="Create a strong password"
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

                                    {/* Password strength indicator */}
                                    {formData.password && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mt-3"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-600">Password strength:</span>
                                                <span className={`text-sm font-medium ${
                                                    passwordStrength.valid ? 'text-green-600' : 'text-gray-600'
                                                }`}>
                                                    {getPasswordStrengthText()}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                                                    style={{
                                                        width: `${(Object.values(passwordStrength).filter(Boolean).length - 1) * 20}%`
                                                    }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Password requirements */}
                                    <div className="mt-3 space-y-1">
                                        {[
                                            { check: passwordStrength.minLength, text: 'At least 8 characters' },
                                            { check: passwordStrength.hasUppercase, text: 'One uppercase letter' },
                                            { check: passwordStrength.hasLowercase, text: 'One lowercase letter' },
                                            { check: passwordStrength.hasNumber, text: 'One number' },
                                        ].map((requirement, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className={`flex items-center gap-2 text-sm ${
                                                    requirement.check ? 'text-green-600' : 'text-gray-500'
                                                }`}
                                            >
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                                    requirement.check ? 'bg-green-100' : 'bg-gray-100'
                                                }`}>
                                                    {requirement.check && <FiCheck className="w-3 h-3" />}
                                                </div>
                                                {requirement.text}
                                            </motion.div>
                                        ))}
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

                                {/* Confirm password field */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiLock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className={`block w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-colors ${
                                                validationErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                            placeholder="Confirm your password"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            disabled={isLoading}
                                        >
                                            {showConfirmPassword ? (
                                                <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            ) : (
                                                <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            )}
                                        </button>
                                    </div>
                                    {validationErrors.confirmPassword && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-1 text-sm text-red-600 flex items-center gap-1"
                                        >
                                            <FiAlertCircle className="w-4 h-4" />
                                            {validationErrors.confirmPassword}
                                        </motion.p>
                                    )}
                                </div>

                                <motion.button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={isLoading || !passwordStrength.valid}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-gradient-to-r from-[#FF5722] to-[#E64A19] text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <LoadingSpinner size="sm" color="white" />
                                    ) : (
                                        <>
                                            Create Account
                                            <FiArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
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
                            <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
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
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                        >
                            <Image src={AppleIcon} alt="Apple" width={20} height={20} />
                            <span className="text-sm font-medium text-gray-700">Apple</span>
                        </motion.button>
                    </div>
                </motion.div>

                {/* Sign in link */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mt-8 text-center"
                >
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link
                            href="/auth/login"
                            className="font-semibold text-[#FF5722] hover:text-[#E64A19] transition-colors"
                        >
                            Sign in
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
