'use client';

import { FiRadio } from 'react-icons/fi';

export default function LiveStreamsPage() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FiRadio className="w-5 h-5 text-orange-500" />
          Live Streams
        </h1>
      </div>

      <div className="text-center py-12">
        <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiRadio className="w-8 h-8 text-orange-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Streaming Available</h3>
        <p className="text-gray-600">Streaming functionality has been removed from this application.</p>
      </div>
    </div>
  );
}


