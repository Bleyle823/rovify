'use client';

import { useState } from 'react';
import Image from 'next/image';
// Custom styled components
const Card = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 ${className}`} {...props}>
        {children}
    </div>
);

const Badge = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`} {...props}>
        {children}
    </span>
);

const Button = ({ children, className = '', size = 'md', variant = 'default', ...props }: { 
    children: React.ReactNode; 
    className?: string; 
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'outline' | 'ghost';
    [key: string]: any 
}) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };
    const variantClasses = {
        default: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500',
        outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
    };
    
    return (
        <button 
            className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} 
            {...props}
        >
            {children}
        </button>
    );
};
import { 
  Video, 
  Users, 
  Clock, 
  MapPin, 
  Heart, 
  Share2, 
  ExternalLink,
  Zap,
  Coins,
  Calendar
} from 'lucide-react';

interface LiveEvent {
  id: string;
  title: string;
  image: string;
  viewers: number;
  category: string;
  isLive: boolean;
  location: string;
}

interface NFTDrop {
  id: string;
  title: string;
  image?: string;
  price: string;
  supply: number;
  date: string;
  category: string;
}

const mockLiveEvents: LiveEvent[] = [
  {
    id: '1',
    title: 'Crypto Gaming Tournament',
    image: 'https://images.unsplash.com/photo-1556438064-2d7646166914?w=400&h=300&fit=crop',
    viewers: 1240,
    category: 'Gaming',
    isLive: true,
    location: 'Virtual'
  },
  {
    id: '2',
    title: 'NFT Art Showcase',
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
    viewers: 890,
    category: 'Art',
    isLive: true,
    location: 'Gallery'
  },
  {
    id: '3',
    title: 'DeFi Masterclass',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    viewers: 2100,
    category: 'Education',
    isLive: true,
    location: 'Online'
  }
];

const mockNFTDrops: NFTDrop[] = [
  {
    id: '1',
    title: 'Rovify Genesis Collection',
    image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&h=300&fit=crop',
    price: '0.5 ETH',
    supply: 1000,
    date: 'May 15',
    category: 'Art'
  },
  {
    id: '2',
    title: 'Gaming Tournament Passes',
    price: '0.1 ETH',
    supply: 500,
    date: 'May 20',
    category: 'Gaming'
  },
  {
    id: '3',
    title: 'VIP Event Access',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
    price: '1.0 ETH',
    supply: 100,
    date: 'May 25',
    category: 'Exclusive'
  }
];

export default function RightSidebar() {
  const [activeTab, setActiveTab] = useState<'live' | 'nft'>('live');

  return (
    <aside className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden xl:block w-80">
      {/* Oval Container */}
      <div className="relative bg-white border border-gray-200 rounded-3xl shadow-sm p-6 min-h-[700px] flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Live & Drops</h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Live</span>
            </div>
          </div>
          
          {/* Tab Switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('live')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'live'
                  ? 'bg-white text-orange-500 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Video className="w-4 h-4" />
                Live Events
              </div>
            </button>
            <button
              onClick={() => setActiveTab('nft')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'nft'
                  ? 'bg-white text-orange-500 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Coins className="w-4 h-4" />
                NFT Drops
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'live' ? (
            <div className="space-y-4">
              {mockLiveEvents.map((event) => (
                <Card key={event.id} className="relative overflow-hidden rounded-2xl border-0 shadow-md group cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="relative h-32">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    
                    {/* Live Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <Badge className="bg-red-500 text-white border-0 text-xs">LIVE</Badge>
                    </div>

                    {/* Category Badge */}
                    <Badge className="absolute top-3 right-3 bg-orange-500 text-white border-0 text-xs">
                      {event.category}
                    </Badge>

                    {/* Viewers Count */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white text-xs">
                      <Users className="w-3 h-3" />
                      <span>{event.viewers.toLocaleString()} watching</span>
                    </div>

                    {/* Location */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 text-white/80 text-xs">
                      <MapPin className="w-3 h-3" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                      {event.title}
                    </h4>
                    <div className="flex items-center justify-between">
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                        Join Stream
                      </Button>
                      <div className="flex items-center gap-1">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Heart className="w-4 h-4 text-gray-400" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Share2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {mockNFTDrops.map((drop) => (
                <Card key={drop.id} className="relative overflow-hidden rounded-2xl border-0 shadow-md group cursor-pointer hover:shadow-lg transition-shadow">
                  {drop.image ? (
                    <div className="relative h-32">
                      <Image
                        src={drop.image}
                        alt={drop.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                      
                      {/* Category Badge */}
                      <Badge className="absolute top-3 left-3 bg-purple-500 text-white border-0 text-xs">
                        {drop.category}
                      </Badge>

                      {/* Price */}
                      <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                        <span className="text-white text-xs font-semibold">{drop.price}</span>
                      </div>

                      {/* Supply */}
                      <div className="absolute bottom-3 left-3 text-white text-xs">
                        <span>{drop.supply} available</span>
                      </div>

                      {/* Date */}
                      <div className="absolute bottom-3 right-3 text-white/80 text-xs">
                        <span>{drop.date}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Coins className="w-8 h-8 mx-auto mb-2" />
                        <span className="text-sm font-semibold">{drop.title}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-3">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                      {drop.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                      <span>Supply: {drop.supply}</span>
                      <span>Drop: {drop.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white text-xs">
                        Mint Now
                      </Button>
                      <div className="flex items-center gap-1">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Heart className="w-4 h-4 text-gray-400" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Button variant="outline" className="w-full text-sm">
            View All {activeTab === 'live' ? 'Events' : 'Drops'}
          </Button>
        </div>
      </div>
    </aside>
  );
}
