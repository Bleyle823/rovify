/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { motion } from 'framer-motion';
import { FiUsers, FiUserPlus, FiMessageSquare } from 'react-icons/fi';

export default function FriendsPage() {
    return (
        <div className="space-y-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <h1 className="text-3xl font-bold mb-2 text-gray-900">Your Social Network</h1>
                <p className="text-gray-600 mb-4">Connect, share, and experience events together</p>
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">12</div>
                        <div className="text-gray-600 text-sm">Friends</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">3</div>
                        <div className="text-gray-600 text-sm">Online</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">2</div>
                        <div className="text-gray-600 text-sm">Pending</div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
                <FiUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Friends Section</h3>
                <p className="text-gray-600 mb-6">Manage your friends, send messages, and see who&apos;s online.</p>
                <motion.button
                    className="bg-[#FF5900] hover:bg-[#FF5900]/90 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-sm transform hover:scale-105 flex items-center gap-2 mx-auto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <FiUserPlus className="w-4 h-4" />
                    Add Friends
                </motion.button>
            </div>
        </div>
    );
}