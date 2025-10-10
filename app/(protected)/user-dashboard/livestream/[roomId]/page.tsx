'use client';

import React from 'react';

export default function UserLivestreamPage({ params }: { params: { roomId: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-white border border-gray-200 rounded-2xl p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Livestream Viewer</h1>
        <p className="text-sm text-gray-600">Streaming functionality has been removed.</p>
      </div>
    </div>
  );
}
