'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Event } from '@/types';
import { FiCalendar, FiMapPin, FiHeart, FiMessageSquare, FiShare2 } from 'react-icons/fi';
import { getBestIpfsUrl } from '@/utils/ipfs';

interface EventCardProps {
    event: Event;
    variant?: 'default' | 'featured' | 'compact';
    disableLink?: boolean;
}

export default function EventCard({ event, variant = 'default', disableLink = false }: EventCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    const isFeatured = variant === 'featured';
    const isCompact = variant === 'compact';

    // Format date for display
    const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });

    // The card content
    const cardContent = (
        <div
            className={`group relative rounded-3xl overflow-hidden ${isFeatured ? 'h-[45rem]' : isCompact ? 'h-60' : 'h-[30rem]'} w-full transition-all duration-300 bg-white`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                boxShadow: isHovered
                    ? '0 20px 30px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 87, 34, 0.1)'
                    : '0 10px 20px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.05)'
            }}
        >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={getBestIpfsUrl(event.image)}
                    alt={event.title}
                    fill
                    className={`object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
                />

                {/* Gradient Overlay */}
                <div
                    className={`absolute inset-0 z-10 bg-gradient-to-t from-black via-transparent transition-opacity duration-300 ${isHovered ? 'opacity-80' : 'opacity-70'}`}
                />
            </div>

            {/* NFT Badge */}
            {event.hasNftTickets && (
                <div className="absolute top-8 right-8 z-20 bg-[#FF5722] text-white rounded-full px-8 py-4 text-lg font-medium flex items-center gap-4 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1.5l-1.8-1.8A2 2 0 0012.46 2H7.54a2 2 0 00-1.42.59L4.3 4z" />
                    </svg>
                    NFT
                </div>
            )}

            {/* Content */}
            <div className={`absolute bottom-0 left-0 right-0 z-20 p-10 ${isFeatured ? 'pb-16' : isCompact ? 'pb-8' : 'pb-10'}`}>
                <div className="space-y-4">
                    {/* Category & Date */}
                    <div className="flex items-center gap-5 mb-4">
                        <span className="bg-white/20 backdrop-blur-sm px-5 py-3 rounded-full text-white text-lg font-medium">
                            {event.category}
                        </span>
                        <div className="flex items-center text-white/90 text-lg gap-3">
                            <FiCalendar className="w-6 h-6 text-[#FF5722]" />
                            {formattedDate}
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className={`text-white font-bold ${isFeatured ? 'text-5xl' : isCompact ? 'text-2xl line-clamp-1' : 'text-3xl'} line-clamp-2`}>
                        {event.title}
                    </h3>

                    {/* Location & Price */}
                    {!isCompact && (
                        <div className="flex justify-between items-center mt-5">
                            <div className="flex items-center gap-4 text-white/90 text-lg">
                                <FiMapPin className="w-6 h-6 text-[#FF5722]" />
                                {event.location.city}
                            </div>
                            <span className="text-white text-xl font-semibold bg-[#FF5722]/80 backdrop-blur-sm px-5 py-3 rounded-full">
                                {event.price.currency} {event.price.min}
                                {event.price.min !== event.price.max && `+`}
                            </span>
                        </div>
                    )}

                    {/* Social Engagement - Only for featured */}
                    {isFeatured && (
                        <div className="flex gap-10 mt-8">
                            <div className="flex items-center gap-4 text-white/90">
                                <FiHeart className="w-8 h-8 text-[#FF5722]" />
                                <span className="text-lg">{event.likes}</span>
                            </div>
                            <div className="flex items-center gap-4 text-white/90">
                                <FiMessageSquare className="w-8 h-8 text-[#FF5722]" />
                                <span className="text-lg">{event.comments}</span>
                            </div>
                            <div className="flex items-center gap-4 text-white/90">
                                <FiShare2 className="w-8 h-8 text-[#FF5722]" />
                                <span className="text-lg">{event.shares}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Ticket Progress - Only for featured */}
            {isFeatured && (
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-black/30 z-20">
                    <div
                        className="h-full bg-[#FF5722]"
                        style={{ width: `${(event.soldTickets / event.totalTickets) * 100}%` }}
                    />
                </div>
            )}
        </div>
    );

    // Conditionally wrap with Link
    if (disableLink) {
        return cardContent;
    }

    return (
        <Link href={`/events/${event.id}`}>
            {cardContent}
        </Link>
    );
}