'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface StreamItem {
  id: string | null;
  name: string;
  playbackId: string | null;
  createdAt: string;
  thumbnail: string;
  status: string;
}

export default function UserLivestreams() {
  const [items, setItems] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/livepeer/getStreams', { cache: 'no-store' });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Live Streams</h1>
        <p className="text-sm text-gray-600">Click a card to watch the stream.</p>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-gray-600">No live streams available.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="col-span-full flex items-center justify-between">
            <p className="text-sm text-gray-600">{items.length} active stream(s)</p>
            <button onClick={load} className={`text-sm px-3 py-1.5 rounded-lg border ${refreshing ? 'opacity-60' : ''}`}>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          {items.filter((s) => !!s.playbackId).map((s) => (
            <Link key={(s.id || s.playbackId || Math.random()).toString()} href={`/user-dashboard/livestream/watch/${s.playbackId}`} className="block group">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition">
                <div className="aspect-video bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.thumbnail} alt={s.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">{new Date(s.createdAt).toLocaleString()}</div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white">LIVE</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900 truncate mt-1">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.status}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


