'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiVideo, FiUsers, FiClock, FiRefreshCw, FiPlay, FiEye } from 'react-icons/fi';

interface StreamItem {
  id: string | null;
  name: string;
  playbackId: string | null;
  createdAt: string;
  thumbnail: string;
  status: string;
  isActive?: boolean;
  viewerCount?: number;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'live': return 'bg-red-500 text-white';
    case 'starting': return 'bg-yellow-500 text-white';
    case 'ending': return 'bg-orange-500 text-white';
    case 'ended': return 'bg-gray-500 text-white';
    case 'scheduled': return 'bg-blue-500 text-white';
    case 'failed': return 'bg-red-600 text-white';
    case 'canceled': return 'bg-gray-600 text-white';
    default: return 'bg-gray-400 text-white';
  }
};

const getStatusLabel = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'live': return 'LIVE';
    case 'starting': return 'STARTING';
    case 'ending': return 'ENDING';
    case 'ended': return 'ENDED';
    case 'scheduled': return 'SCHEDULED';
    case 'failed': return 'FAILED';
    case 'canceled': return 'CANCELED';
    default: return status?.toUpperCase() || 'UNKNOWN';
  }
};

export default function UserLivestreams() {
  const [items, setItems] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/livepeer/getStreams?source=backend', { cache: 'no-store' });
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, []);

  const liveStreams = items.filter(s => s.status?.toLowerCase() === 'live' && s.playbackId);
  const otherStreams = items.filter(s => s.status?.toLowerCase() !== 'live' && s.playbackId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Streams</h1>
          <p className="text-gray-600">Discover and watch live streams from creators around the world</p>
        </div>
        <motion.button
          onClick={load}
          disabled={refreshing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-all ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-6 h-6 border-2 border-[#FF5900] border-t-transparent rounded-full animate-spin"></div>
            <span>Loading streams...</span>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiVideo className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No streams available</h3>
          <p className="text-gray-600 mb-6">There are no live streams at the moment. Check back later!</p>
          <Link 
            href="/organiser-dashboard" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF5900] text-white rounded-xl font-semibold hover:bg-[#FF5900]/90 transition-colors"
          >
            <FiVideo className="w-4 h-4" />
            Start a Stream
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Live Now Section */}
          {liveStreams.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <h2 className="text-xl font-bold text-gray-900">Live Now</h2>
                </div>
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {liveStreams.length} stream{liveStreams.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {liveStreams.map((stream, index) => (
                  <motion.div
                    key={stream.id || stream.playbackId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Link href={`/watch/${stream.playbackId}`} className="block group">
                      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all duration-300">
                        <div className="relative aspect-video bg-gray-100">
                          <Image
                            src={stream.thumbnail || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop'}
                            alt={stream.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          
                          {/* Live Badge */}
                          <div className="absolute top-3 left-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(stream.status)}`}>
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                              {getStatusLabel(stream.status)}
                            </span>
                          </div>

                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                              <FiPlay className="w-6 h-6 text-white ml-1" />
                            </div>
                          </div>

                          {/* Viewer Count */}
                          {stream.viewerCount !== undefined && (
                            <div className="absolute bottom-3 right-3">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded-full">
                                <FiEye className="w-3 h-3" />
                                {stream.viewerCount}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#FF5900] transition-colors">
                            {stream.name || 'Untitled Stream'}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiClock className="w-4 h-4" />
                            <span>Started {new Date(stream.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Other Streams Section */}
          {otherStreams.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Streams</h2>
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {otherStreams.length} stream{otherStreams.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {otherStreams.map((stream, index) => (
                  <motion.div
                    key={stream.id || stream.playbackId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Link href={`/watch/${stream.playbackId}`} className="block group">
                      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300">
                        <div className="relative aspect-video bg-gray-100">
                          <Image
                            src={stream.thumbnail || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop'}
                            alt={stream.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(stream.status)}`}>
                              {getStatusLabel(stream.status)}
                            </span>
                          </div>

                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                              <FiPlay className="w-4 h-4 text-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#FF5900] transition-colors">
                            {stream.name || 'Untitled Stream'}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiClock className="w-4 h-4" />
                            <span>{new Date(stream.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-[#FF5900]/5 to-[#FF5900]/10 rounded-2xl p-6 border border-[#FF5900]/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Ready to go live?</h3>
            <p className="text-gray-600">Start your own livestream and connect with your audience</p>
          </div>
          <Link 
            href="/organiser-dashboard" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF5900] text-white rounded-xl font-semibold hover:bg-[#FF5900]/90 transition-colors shadow-lg hover:shadow-xl"
          >
            <FiVideo className="w-4 h-4" />
            Start Streaming
          </Link>
        </div>
      </div>
    </div>
  );
}


