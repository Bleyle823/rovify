'use client';

import { motion } from 'framer-motion';
import { FiWifi, FiPlayCircle } from 'react-icons/fi';

export default function RightLiveEventsWidget() {
    return (
        <div
            className="hidden lg:block fixed right-6 top-1/2 -translate-y-1/2 z-40"
            aria-label="Live events widget"
        >
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35 }}
                className="w-64 max-w-[18rem] bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-3xl shadow-xl overflow-hidden"
                style={{ boxShadow: '0 12px 30px rgba(2,6,23,0.12)' }}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex w-2 h-2 rounded-full bg-gray-400" />
                        <h3 className="text-sm font-semibold text-gray-900">Live Events</h3>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                        <FiWifi className="w-4 h-4" />
                        Offline
                    </div>
                </div>

                {/* Content */}
                <div className="px-5 py-6 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiPlayCircle className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No streaming available</p>
                </div>
            </motion.div>
        </div>
    );
}


