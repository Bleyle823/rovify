'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiEdit2, FiCheck, FiX, FiCamera, FiMapPin, FiCalendar,
    FiTwitter, FiLinkedin, FiInstagram, FiGithub
} from 'react-icons/fi';

// Minimal initial user shape
const initialUser = {
    id: '',
    name: '',
    username: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    website: '',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=300&fit=crop',
    verified: false,
    level: '',
    points: 0,
    followers: 0,
    following: 0,
    eventsAttended: 0,
    totalSpent: 0,
    interests: [],
    joinedDate: new Date().toISOString(),
    socialLinks: {
        twitter: '',
        linkedin: '',
        instagram: '',
        github: ''
    }
};

export default function ProfilePageDebug() {
    const [currentUser, setCurrentUser] = useState(initialUser as typeof initialUser);
    const [isEditing, setIsEditing] = useState(false);
    const [editingUser, setEditingUser] = useState(initialUser as typeof initialUser);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [error, setError] = useState('');

    // File refs
    const profileImageRef = useRef<HTMLInputElement>(null);
    const coverImageRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (type: 'profile' | 'cover', file: File) => {
        if (type === 'profile') {
            // Upload avatar to backend
            try {
                setIsUploadingAvatar(true);
                setError('');
                const token = typeof window !== 'undefined' ? localStorage.getItem('rovify_access_token') : null;
                if (!token) {
                    setError('Not authenticated');
                    return;
                }

                const formData = new FormData();
                formData.append('file', file);

                const resp = await fetch('/api/users/avatar', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                const raw = await resp.json();
                console.log('Avatar upload response:', raw);
                if (!resp.ok) {
                    setError(raw?.message || 'Failed to upload avatar');
                    return;
                }

                const avatarUrl = raw.url || raw.data?.url;
                console.log('Avatar URL:', avatarUrl);
                if (avatarUrl) {
                    setEditingUser(prev => ({ ...prev, image: avatarUrl }));
                }
            } catch (e) {
                setError('Failed to upload avatar');
            } finally {
                setIsUploadingAvatar(false);
            }
        } else {
            // For cover image, just preview locally for now
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target?.result as string;
                setEditingUser(prev => ({ ...prev, coverImage: imageUrl }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Load profile from backend
    useEffect(() => {
        const loadProfile = async () => {
            try {
                setIsLoading(true);
                const token = typeof window !== 'undefined' ? localStorage.getItem('rovify_access_token') : null;
                if (!token) {
                    setError('Not authenticated');
                    setIsLoading(false);
                    return;
                }
                const resp = await fetch('/api/users/profile', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                    cache: 'no-store'
                });
                const raw = await resp.json();
                if (!resp.ok) {
                    setError(raw?.message || 'Failed to load profile');
                    setIsLoading(false);
                    return;
                }
                const data = raw?.data ?? raw;
                // Map backend user to UI shape
                const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ') || data.name || '';
                const mapped = {
                    ...initialUser,
                    id: data.id || '',
                    name: fullName,
                    username: data.username || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    bio: data.bio || '',
                    location: data.location || '',
                    website: data.website || '',
                    image: data.avatar || data.avatarUrl || initialUser.image,
                    coverImage: initialUser.coverImage,
                    verified: !!data.isActive,
                    joinedDate: data.createdAt || new Date().toISOString(),
                    interests: Array.isArray(data.interests) ? data.interests : initialUser.interests,
                    socialLinks: initialUser.socialLinks
                };
                console.log('Loaded profile:', mapped);
                setCurrentUser(mapped);
                setEditingUser(mapped);
            } catch (e) {
                setError('Failed to load profile');
            } finally {
                setIsLoading(false);
            }
        };
        loadProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSaveProfile = async () => {
        try {
            setError('');
            const token = typeof window !== 'undefined' ? localStorage.getItem('rovify_access_token') : null;
            if (!token) {
                setError('Not authenticated');
                return;
            }
            // Map name to firstName/lastName for backend
            const nameParts = (editingUser.name || '').trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ');
            const payload: Record<string, unknown> = {
                firstName,
                lastName,
                username: editingUser.username || undefined,
                bio: editingUser.bio || undefined,
                avatar: editingUser.image || undefined,
                phone: editingUser.phone || undefined,
                location: editingUser.location || undefined,
                website: editingUser.website || undefined,
            };

            const resp = await fetch('/api/users/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const raw = await resp.json();
            if (!resp.ok) {
                setError(raw?.message || 'Failed to update profile');
                return;
            }
            const data = raw?.data ?? raw;
            const updatedFullName = [data.firstName, data.lastName].filter(Boolean).join(' ') || editingUser.name;
            const updated = {
                ...editingUser,
                name: updatedFullName,
                username: data.username ?? editingUser.username,
                bio: data.bio ?? editingUser.bio,
                image: data.avatar ?? editingUser.image,
                phone: data.phone ?? editingUser.phone,
                location: data.location ?? editingUser.location,
                website: data.website ?? editingUser.website,
            };
            setCurrentUser(updated);
            setEditingUser(updated);
            setIsEditing(false);
        } catch (e) {
            setError('Failed to update profile');
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="bg-[#FF5900]/10 border border-[#FF5900]/20 text-[#FF5900] px-4 py-3 rounded">
                <strong>Debug Mode:</strong> This version uses regular img tags instead of Next.js Image component for testing.
            </div>
            
            {/* Cover & Profile Image */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="relative h-48 bg-gray-100">
                    <img
                        src={isEditing ? editingUser.coverImage : currentUser.coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            console.error('Cover image error:', e);
                            console.error('Cover image src:', isEditing ? editingUser.coverImage : currentUser.coverImage);
                        }}
                        onLoad={() => {
                            console.log('Cover image loaded:', isEditing ? editingUser.coverImage : currentUser.coverImage);
                        }}
                    />
                    {isEditing && (
                        <button
                            onClick={() => coverImageRef.current?.click()}
                            className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition-colors"
                        >
                            <FiCamera className="w-4 h-4" />
                        </button>
                    )}
                    <input
                        ref={coverImageRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload('cover', e.target.files[0])}
                    />
                </div>

                <div className="px-8 pb-8">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 mb-6">
                        <div className="relative">
                            <div className="relative w-32 h-32 rounded-2xl border-4 border-white overflow-hidden shadow-xl">
                                <img
                                    src={isEditing ? editingUser.image : currentUser.image}
                                    alt={currentUser.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        console.error('Avatar image error:', e);
                                        console.error('Avatar image src:', isEditing ? editingUser.image : currentUser.image);
                                    }}
                                    onLoad={() => {
                                        console.log('Avatar image loaded:', isEditing ? editingUser.image : currentUser.image);
                                    }}
                                />
                            </div>
                            {isEditing && (
                                <button
                                    onClick={() => profileImageRef.current?.click()}
                                    disabled={isUploadingAvatar}
                                    className="absolute bottom-2 right-2 bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploadingAvatar ? (
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <FiCamera className="w-3 h-3" />
                                    )}
                                </button>
                            )}
                                <input
                                ref={profileImageRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleImageUpload('profile', e.target.files[0])}
                            />
                        </div>

                        <div className="mt-4 sm:mt-0">
                            {!isEditing ? (
                                <motion.button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-[#FF5900] hover:bg-[#FF5900]/90 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-sm flex items-center gap-2"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FiEdit2 className="w-4 h-4" />
                                    Edit Profile
                                </motion.button>
                            ) : (
                                <div className="flex gap-3">
                                    <motion.button
                                        onClick={handleSaveProfile}
                                        className="bg-[#FF5900] hover:bg-[#FF5900]/90 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-sm flex items-center gap-2"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <FiCheck className="w-4 h-4" />
                                        Save
                                    </motion.button>
                                    <motion.button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditingUser(currentUser);
                                        }}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <FiX className="w-4 h-4" />
                                        Cancel
                                    </motion.button>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* Debug Info */}
                    <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                        <strong>Debug Info:</strong><br/>
                        Current Avatar URL: {currentUser.image}<br/>
                        Editing Avatar URL: {editingUser.image}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Profile Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editingUser.name}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                                            className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-[#FF5900] focus:outline-none"
                                        />
                                    ) : (
                                        <h1 className="text-3xl font-bold text-gray-900">{currentUser.name}</h1>
                                    )}
                                    {currentUser.verified && (
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                            <FiCheck className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-gray-600 mb-1">@{currentUser.username}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-1">
                                        <FiMapPin className="w-4 h-4" />
                                        <span>{currentUser.location}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FiCalendar className="w-4 h-4" />
                                        <span>Joined {new Date(currentUser.joinedDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                {isEditing ? (
                                    <div>
                                        <textarea
                                            value={editingUser.bio}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, bio: e.target.value }))}
                                            rows={3}
                                            maxLength={500}
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5900]/20 focus:border-[#FF5900]"
                                            placeholder="Tell us about yourself..."
                                        />
                                        <div className="text-right text-sm text-gray-500 mt-1">
                                            {editingUser.bio.length}/500 characters
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-700">{currentUser.bio || 'No bio provided yet.'}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
