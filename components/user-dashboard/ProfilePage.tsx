'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
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

// Helper function to generate social media URLs
const getSocialUrl = (platform: string, handle: string): string => {
    const cleanHandle = handle.replace('@', '').trim();
    switch (platform) {
        case 'twitter':
            return `https://twitter.com/${cleanHandle}`;
        case 'linkedin':
            return `https://linkedin.com/in/${cleanHandle}`;
        case 'instagram':
            return `https://instagram.com/${cleanHandle}`;
        case 'github':
            return `https://github.com/${cleanHandle}`;
        default:
            return '#';
    }
};

export default function ProfilePage() {
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
            // Validate file type and size
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            const maxSize = 2 * 1024 * 1024; // 2MB

            if (!allowedTypes.includes(file.type)) {
                setError('Please upload a valid image file (JPEG, PNG, or WebP)');
                return;
            }

            if (file.size > maxSize) {
                setError('Image size must be less than 2MB');
                return;
            }

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
                if (!resp.ok) {
                    setError(raw?.message || 'Failed to upload avatar');
                    return;
                }

                const avatarUrl = raw.url || raw.data?.url;
                console.log('Avatar upload response:', raw);
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
                    website: data.websiteUrl || data.website || '',
                    image: data.avatar || data.avatarUrl || initialUser.image,
                    coverImage: initialUser.coverImage,
                    verified: !!data.isActive,
                    joinedDate: data.createdAt || new Date().toISOString(),
                    interests: Array.isArray(data.interests) ? data.interests : initialUser.interests,
                    socialLinks: {
                        twitter: data.twitterHandle || '',
                        linkedin: data.linkedinHandle || '',
                        instagram: data.instagramHandle || '',
                        github: data.githubHandle || ''
                    }
                };
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
                websiteUrl: editingUser.website || undefined,
                twitterHandle: editingUser.socialLinks.twitter || undefined,
                linkedinHandle: editingUser.socialLinks.linkedin || undefined,
                instagramHandle: editingUser.socialLinks.instagram || undefined,
                githubHandle: editingUser.socialLinks.github || undefined,
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
                website: data.websiteUrl ?? data.website ?? editingUser.website,
                socialLinks: {
                    twitter: data.twitterHandle ?? editingUser.socialLinks.twitter,
                    linkedin: data.linkedinHandle ?? editingUser.socialLinks.linkedin,
                    instagram: data.instagramHandle ?? editingUser.socialLinks.instagram,
                    github: data.githubHandle ?? editingUser.socialLinks.github,
                }
            };
            setCurrentUser(updated);
            setEditingUser(updated);
            setIsEditing(false);
        } catch (e) {
            setError('Failed to update profile');
        }
    };

    return (
        <div className="space-y-8">
            {/* Cover & Profile Image */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <div className="relative h-48 bg-gray-100">
                    <Image
                        src={isEditing ? editingUser.coverImage : currentUser.coverImage}
                        alt="Cover"
                        fill
                        sizes="(max-width: 1024px) 100vw, 100vw"
                        style={{ objectFit: 'cover' }}
                        priority
                    />
                    {isEditing && (
                        <button
                            onClick={() => coverImageRef.current?.click()}
                            className="absolute top-4 right-4 bg-white/90 text-gray-700 p-2 rounded-lg hover:bg-white transition-colors border border-gray-200"
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
                            <div className="relative w-32 h-32 rounded-2xl border-4 border-white overflow-hidden shadow-lg">
                                <Image
                                    src={isEditing ? editingUser.image : currentUser.image}
                                    alt={currentUser.name}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 128px"
                                    style={{ objectFit: 'cover' }}
                                    priority
                                    onError={(e) => {
                                        console.error('Image load error:', e);
                                        console.error('Image src:', isEditing ? editingUser.image : currentUser.image);
                                    }}
                                    onLoad={() => {
                                        console.log('Image loaded successfully:', isEditing ? editingUser.image : currentUser.image);
                                    }}
                                />
                                {/* Fallback img tag for debugging */}
                                <img
                                    src={isEditing ? editingUser.image : currentUser.image}
                                    alt={currentUser.name}
                                    className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
                                    onError={(e) => {
                                        console.error('Fallback img error:', e);
                                        console.error('Fallback img src:', isEditing ? editingUser.image : currentUser.image);
                                    }}
                                    onLoad={() => {
                                        console.log('Fallback img loaded:', isEditing ? editingUser.image : currentUser.image);
                                    }}
                                />
                            </div>
                            {isEditing && (
                                <button
                                    onClick={() => profileImageRef.current?.click()}
                                    disabled={isUploadingAvatar}
                                    className="absolute bottom-2 right-2 bg-white border border-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    {isUploadingAvatar ? (
                                        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
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
                                    className="bg-[#FF5900] text-white hover:bg-[#FF5900]/90 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-sm transform hover:scale-105 flex items-center gap-2"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <FiEdit2 className="w-4 h-4" />
                                    Edit Profile
                                </motion.button>
                            ) : (
                                <div className="flex gap-3">
                                    <motion.button
                                        onClick={handleSaveProfile}
                                        className="bg-[#FF5900] text-white hover:bg-[#FF5900]/90 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-sm transform hover:scale-105 flex items-center gap-2"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <FiCheck className="w-4 h-4" />
                                        Save
                                    </motion.button>
                                    <motion.button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditingUser(currentUser);
                                        }}
                                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
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

                            {/* Contact Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={editingUser.email}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5900] focus:border-transparent"
                                        />
                                    ) : (
                                        <p className="text-gray-900">{currentUser.email}</p>
                                    )}
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            value={editingUser.phone}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5900] focus:border-transparent"
                                        />
                                    ) : (
                                        <p className="text-gray-900">{currentUser.phone}</p>
                                    )}
                                </div>
                            </div>

                            {/* Interests */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Interests</h3>
                                <div className="flex flex-wrap gap-2">
                                    {currentUser.interests.map((interest, index) => (
                                        <span
                                            key={index}
                                            className="bg-[#FF5900]/10 text-[#FF5900] px-3 py-1 rounded-full text-sm font-medium"
                                        >
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Stats & Social */}
                        <div className="space-y-6">
                            {/* Stats */}
                            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Stats</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Events Attended</span>
                                        <span className="font-semibold">{currentUser.eventsAttended}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Followers</span>
                                        <span className="font-semibold">{currentUser.followers}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Following</span>
                                        <span className="font-semibold">{currentUser.following}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Points</span>
                                        <span className="font-semibold text-[#FF5900]">{currentUser.points}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Social Links</h3>
                                {isEditing ? (
                                    <div className="space-y-4">
                                        {/* Twitter */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                                                <FiTwitter className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <input
                                                type="text"
                                                value={editingUser.socialLinks.twitter}
                                                onChange={(e) => setEditingUser(prev => ({
                                                    ...prev,
                                                    socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                                                }))}
                                                placeholder="Twitter handle"
                                                className="flex-1 p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </div>

                                        {/* LinkedIn */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                                                <FiLinkedin className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <input
                                                type="text"
                                                value={editingUser.socialLinks.linkedin}
                                                onChange={(e) => setEditingUser(prev => ({
                                                    ...prev,
                                                    socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                                                }))}
                                                placeholder="LinkedIn handle"
                                                className="flex-1 p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </div>

                                        {/* Instagram */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                                                <FiInstagram className="w-4 h-4 text-pink-500" />
                                            </div>
                                            <input
                                                type="text"
                                                value={editingUser.socialLinks.instagram}
                                                onChange={(e) => setEditingUser(prev => ({
                                                    ...prev,
                                                    socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                                                }))}
                                                placeholder="Instagram handle"
                                                className="flex-1 p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </div>

                                        {/* GitHub */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                                                <FiGithub className="w-4 h-4 text-gray-700" />
                                            </div>
                                            <input
                                                type="text"
                                                value={editingUser.socialLinks.github}
                                                onChange={(e) => setEditingUser(prev => ({
                                                    ...prev,
                                                    socialLinks: { ...prev.socialLinks, github: e.target.value }
                                                }))}
                                                placeholder="GitHub handle"
                                                className="flex-1 p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {Object.entries(currentUser.socialLinks).map(([platform, handle]) => (
                                            handle ? (
                                                <div key={platform} className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                                                        {platform === 'twitter' && <FiTwitter className="w-4 h-4 text-blue-500" />}
                                                        {platform === 'linkedin' && <FiLinkedin className="w-4 h-4 text-blue-600" />}
                                                        {platform === 'instagram' && <FiInstagram className="w-4 h-4 text-pink-500" />}
                                                        {platform === 'github' && <FiGithub className="w-4 h-4 text-gray-700" />}
                                                    </div>
                                                    <a
                                                        href={getSocialUrl(platform, handle)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-gray-700 hover:text-[#FF5900] transition-colors capitalize"
                                                    >
                                                        {handle}
                                                    </a>
                                                </div>
                                            ) : null
                                        ))}
                                        {Object.values(currentUser.socialLinks).every(handle => !handle) && (
                                            <p className="text-gray-500 text-sm">No social links added yet.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}