'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FiUsers, 
    FiClock, 
    FiAlertCircle, 
    FiCheckCircle,
    FiExternalLink,
    FiCopy,
    FiShare2,
    FiVideo,
    FiMic,
    FiMicOff,
    FiCamera,
    FiCameraOff,
    FiSettings
} from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi2';
import { BsBroadcast } from 'react-icons/bs';
import { useAccount, useSignMessage } from 'wagmi';
// Streaming functionality removed

interface LivestreamViewerProps {
    roomId: string;
}

interface RoomDetails {
    title: string;
    description: string;
    tokenGating?: {
        tokenType: string;
        chain: string;
        contractAddress: string[];
        minTokens: number;
    };
    status: 'idle' | 'live' | 'ended' | 'error';
    viewerCount: number;
    hostWallets: string[];
}

const LivestreamViewer = ({ roomId }: LivestreamViewerProps) => {
    const { address: account, isConnected } = useAccount();
    const searchParams = useSearchParams();
    const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isJoined, setIsJoined] = useState(false);
    const [expirationTime, setExpirationTime] = useState(0);
    const [message, setMessage] = useState("");
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [streamStarted, setStreamStarted] = useState(false);
    const [showNFTVerification, setShowNFTVerification] = useState(false);

    const { signMessageAsync } = useSignMessage({
        mutation: {
            onSuccess: (data) => {
                authenticateUser(data);
            },
        },
    });

    // Load room details and monitor stream status
    useEffect(() => {
        const loadRoomDetails = async () => {
            try {
                setIsLoading(true);
                // In a real implementation, you would fetch room details from Huddle API
                // For now, we'll simulate this
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                setRoomDetails({
                    title: 'Exclusive Token-Gated Livestream',
                    description: 'Join this exclusive livestream for token holders only',
                    tokenGating: {
                        tokenType: 'ERC721',
                        chain: 'ETHEREUM',
                        contractAddress: ['0x1234567890123456789012345678901234567890'],
                        minTokens: 1
                    },
                    status: 'live',
                    viewerCount: 42,
                    hostWallets: ['0xabcdef1234567890abcdef1234567890abcdef12']
                });

                // Simulate stream starting after 3 seconds
                setTimeout(() => {
                    setStreamStarted(true);
                    if (isConnected && !hasAccess) {
                        setShowNFTVerification(true);
                    }
                }, 3000);
            } catch (err) {
                setError('Failed to load room details');
            } finally {
                setIsLoading(false);
            }
        };

        loadRoomDetails();
    }, [roomId, isConnected, hasAccess]);

    // Authenticate user with signature
    const authenticateUser = async (signature: string) => {
        try {
            setIsVerifying(true);
            setError(null);

            // Call `/api/token` to verify signature and generate access token
            const tokenResponse = await fetch("/api/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    signature,
                    address: account,
                    message,
                    expirationTime,
                    roomId: roomId,
                }),
            });

            if (tokenResponse.ok) {
                const token = await tokenResponse.text();
                setAccessToken(token);
                setHasAccess(true);
                setIsJoined(true);
            } else {
                const errorData = await tokenResponse.json();
                setError(errorData.error || 'Failed to verify access');
            }
        } catch (err) {
            setError('Failed to authenticate');
        } finally {
            setIsVerifying(false);
        }
    };

    // Sign message and authenticate
    const signAndAuthenticate = async () => {
        if (!account) {
            setError('Please connect your wallet first');
            return;
        }

        try {
            const time = {
                issuedAt: Date.now(),
                expiresAt: Date.now() + 1000 * 60 * 5, // 5 minutes
            };
            
            const msg = `Click "Sign" only means you have proved this wallet is owned by you.
We will use the public wallet address to fetch your NFTs.
This request will not trigger any blockchain transaction or cost of any gas fees.
                    
Account: ${account}
                    
Issued At: ${new Date(time.issuedAt).toLocaleString()}
                    
Expires At: ${new Date(time.expiresAt).toLocaleString()}`;
            
            setExpirationTime(time.expiresAt);
            setMessage(msg);
            
            await signMessageAsync({
                message: msg,
            });
        } catch (err) {
            setError('Failed to sign message');
        }
    };

    // Join the livestream
    const joinLivestream = async () => {
        if (!isConnected) {
            setError('Please connect your wallet first using the connect button in the header');
            return;
        }

        await signAndAuthenticate();
    };

    // Auto-start sign flow if URL has autoSign=1
    useEffect(() => {
        const autoSign = searchParams?.get('autoSign') === '1';
        if (autoSign && isConnected && !isJoined && !isVerifying) {
            // Avoid double trigger if already joined or verifying
            joinLivestream();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, isConnected]);

    // Copy room link
    const copyRoomLink = () => {
        const link = window.location.href;
        navigator.clipboard.writeText(link);
    };

    // Share room
    const shareRoom = () => {
        if (navigator.share) {
            navigator.share({
                title: roomDetails?.title || 'Token-Gated Livestream',
                text: roomDetails?.description || 'Join this exclusive token-gated livestream',
                url: window.location.href
            });
        } else {
            copyRoomLink();
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading livestream...</p>
                </div>
            </div>
        );
    }

    if (!roomDetails) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 flex items-center justify-center">
                <div className="text-center">
                    <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Room Not Found</h1>
                    <p className="text-gray-600">The requested livestream room could not be found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                                <BsBroadcast className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">Rovify Livestream</h1>
                                <p className="text-sm text-gray-600">Token-gated access</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {roomDetails.status === 'live' ? (
                                <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    LIVE
                                </div>
                            ) : roomDetails.status === 'ended' ? (
                                <div className="flex items-center gap-2 bg-gray-800 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                                    <FiAlertCircle className="w-4 h-4" />
                                    Stream ended
                                </div>
                            ) : null}
                            
                            <button
                                onClick={copyRoomLink}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Copy link"
                            >
                                <FiCopy className="w-5 h-5 text-gray-600" />
                            </button>
                            
                            <button
                                onClick={shareRoom}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Share"
                            >
                                <FiShare2 className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Stream Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Video Player */}
                        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden aspect-video relative shadow-2xl">
                            {isJoined && accessToken ? (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-gray-300">
                                    Streaming functionality has been removed.
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                    {roomDetails.status === 'ended' ? (
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-gray-700/40 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FiAlertCircle className="w-8 h-8 text-gray-200" />
                                            </div>
                                            <p className="text-white text-lg font-semibold">This stream has ended</p>
                                            <p className="text-gray-400 text-sm mt-1">Thanks for watching! Check back for future streams.</p>
                                        </div>
                                    ) : !streamStarted ? (
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-[#FF5722]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FiVideo className="w-8 h-8 text-[#FF5722]" />
                                            </div>
                                            <p className="text-white text-lg font-medium">Token-Gated Livestream</p>
                                            <p className="text-gray-400 text-sm mt-1">
                                                Waiting for stream to start...
                                            </p>
                                        </div>
                                    ) : showNFTVerification ? (
                                        <div className="text-center max-w-md mx-auto p-6">
                                            <div className="w-20 h-20 bg-[#FF5722]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <HiOutlineSparkles className="w-10 h-10 text-[#FF5722]" />
                                            </div>
                                            <h3 className="text-white text-xl font-semibold mb-2">NFT Verification Required</h3>
                                            <p className="text-gray-400 text-sm mb-6">
                                                The stream has started! Please verify your NFT ownership to access the content.
                                            </p>
                                            <motion.button
                                                onClick={signAndAuthenticate}
                                                disabled={isVerifying}
                                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF5722] to-[#E64A19] text-white rounded-xl hover:from-[#E64A19] hover:to-[#D84315] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                                whileHover={{ scale: isVerifying ? 1 : 1.02 }}
                                                whileTap={{ scale: isVerifying ? 1 : 0.98 }}
                                            >
                                                {isVerifying ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <HiOutlineSparkles className="w-4 h-4" />
                                                )}
                                                {isVerifying ? 'Verifying NFT...' : 'Verify NFT & Join Stream'}
                                            </motion.button>
                                            {error && (
                                                <p className="text-red-400 text-sm mt-4">{error}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-[#FF5722]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FiVideo className="w-8 h-8 text-[#FF5722]" />
                                            </div>
                                            <p className="text-white text-lg font-medium">Token-Gated Livestream</p>
                                            <p className="text-gray-400 text-sm mt-1">
                                                Connect your wallet to verify access
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Stream Status Overlay */}
                            {roomDetails.status === 'live' && !isJoined && (
                                <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#FF5722] text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    LIVE
                                </div>
                            )}
                            {roomDetails.status === 'ended' && (
                                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                                    <FiAlertCircle className="w-4 h-4" />
                                    Stream ended
                                </div>
                            )}
                            
                            {/* Viewer Count Overlay */}
                            {!isJoined && (
                                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm">
                                    <div className="flex items-center gap-1">
                                        <FiUsers className="w-4 h-4" />
                                        {roomDetails.viewerCount}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Stream Info */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">{roomDetails.title}</h2>
                            <p className="text-gray-600 mb-4">{roomDetails.description}</p>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <FiUsers className="w-4 h-4" />
                                    {roomDetails.viewerCount} viewers
                                </div>
                                <div className="flex items-center gap-1">
                                    <FiClock className="w-4 h-4" />
                                    {roomDetails.status === 'live' ? 'Live now' : 'Not live'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Access Control */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Access Requirements</h3>
                            
                            {roomDetails.tokenGating && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-[#FF5722]/10 rounded-xl border border-[#FF5722]/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <HiOutlineSparkles className="w-5 h-5 text-[#FF5722]" />
                                            <span className="font-medium text-[#E64A19]">
                                                {roomDetails.tokenGating.tokenType}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#FF5722]">
                                            Minimum {roomDetails.tokenGating.minTokens} token{roomDetails.tokenGating.minTokens > 1 ? 's' : ''} required
                                        </p>
                                        <p className="text-xs text-[#FF8A65] mt-1 font-mono">
                                            {roomDetails.tokenGating.chain}
                                        </p>
                                    </div>
                                    
                                    {!isConnected ? (
                                        <div className="text-center">
                                            <p className="text-gray-600 mb-4">
                                                Please connect your wallet using the connect button in the header to access this token-gated livestream.
                                            </p>
                                            <div className="p-4 bg-[#FF5722]/10 rounded-xl border border-[#FF5722]/20">
                                                <p className="text-sm text-[#FF5722]">
                                                    💡 Look for the "Connect Wallet" button in the top navigation bar
                                                </p>
                                            </div>
                                        </div>
                                    ) : !hasAccess ? (
                                        <motion.button
                                            onClick={joinLivestream}
                                            disabled={isVerifying}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#FF5722] to-[#E64A19] text-white rounded-xl hover:from-[#E64A19] hover:to-[#D84315] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                            whileHover={{ scale: isVerifying ? 1 : 1.02 }}
                                            whileTap={{ scale: isVerifying ? 1 : 0.98 }}
                                        >
                                            {isVerifying ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <HiOutlineSparkles className="w-4 h-4" />
                                            )}
                                            Sign In with Wallet
                                        </motion.button>
                                    ) : (
                                        <motion.div
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl"
                                        >
                                            <FiCheckCircle className="w-4 h-4" />
                                            Access Granted!
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Status Messages */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
                                >
                                    <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-700 text-sm">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Stream Stats */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stream Information</h3>
                            
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Status</span>
                                    <span className={`text-sm font-medium ${
                                        roomDetails.status === 'live' ? 'text-green-600' : 'text-gray-600'
                                    }`}>
                                        {roomDetails.status === 'live' ? 'Live' : 'Offline'}
                                    </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Viewers</span>
                                    <span className="text-sm font-medium text-gray-900">{roomDetails.viewerCount}</span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Access</span>
                                    <span className="text-sm font-medium text-gray-900">Token-gated</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={copyRoomLink}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                                >
                                    <FiCopy className="w-5 h-5 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-900">Copy Link</span>
                                </button>
                                
                                <button
                                    onClick={shareRoom}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                                >
                                    <FiShare2 className="w-5 h-5 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-900">Share</span>
                                </button>
                                
                                <div className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-sm text-gray-500">
                                    Streaming integrations have been removed.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LivestreamViewer;
