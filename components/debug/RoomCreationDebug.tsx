'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const RoomCreationDebug = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const testSimpleRoom = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/testCreateRoomSimple', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const testTokenGatedRoom = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/testCreateRoom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: 'Test Token-Gated Room',
                    tokenGatingInfo: {
                        tokenType: 'ERC721',
                        chain: 'ETHEREUM',
                        contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', // Bored Ape Yacht Club
                        minTokens: 1
                    }
                })
            });

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Creation Debug</h3>
            
            <div className="space-y-4">
                <div className="flex gap-3">
                    <motion.button
                        onClick={testSimpleRoom}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : null}
                        Test Simple Room
                    </motion.button>

                    <motion.button
                        onClick={testTokenGatedRoom}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : null}
                        Test Token-Gated Room
                    </motion.button>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <h4 className="text-red-800 font-medium mb-2">Error:</h4>
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {result && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <h4 className="text-gray-800 font-medium mb-2">Result:</h4>
                        <pre className="text-gray-700 text-sm overflow-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomCreationDebug;
