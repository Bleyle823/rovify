'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiSquare, FiVideo, FiUsers } from 'react-icons/fi';

interface StreamTestProps {
  roomId?: string | null;
}

const StreamTest: React.FC<StreamTestProps> = ({ roomId }) => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (test: string, success: boolean, message: string, data?: any) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testGenerateToken = async () => {
    if (!roomId) {
      addResult('Generate Token', false, 'No room ID provided');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/generateToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: roomId,
          role: "GUEST",
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        addResult('Generate Token', true, 'Token generated successfully', { token: data.token?.substring(0, 20) + '...' });
      } else {
        addResult('Generate Token', false, data.error || 'Failed to generate token', data);
      }
    } catch (error) {
      addResult('Generate Token', false, 'Network error: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const testRoomMetadata = async () => {
    if (!roomId) {
      addResult('Room Metadata', false, 'No room ID provided');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/roomMetadata?roomId=${roomId}`);
      const data = await response.json();
      
      if (response.ok) {
        addResult('Room Metadata', true, 'Room metadata fetched successfully', data);
      } else {
        addResult('Room Metadata', false, data.error || 'Failed to fetch room metadata', data);
      }
    } catch (error) {
      addResult('Room Metadata', false, 'Network error: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const testTokenVerification = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/verifyTokenAccess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890', // Test address
          tokenContract: '0x1234567890123456789012345678901234567890',
          chain: 'ETHEREUM',
          tokenType: 'ERC721',
          minTokens: 1,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        addResult('Token Verification', true, 'Token verification completed', data);
      } else {
        addResult('Token Verification', false, data.error || 'Failed to verify token', data);
      }
    } catch (error) {
      addResult('Token Verification', false, 'Network error: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Stream Test Suite</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Room: {roomId || 'None'}</span>
          <button
            onClick={clearResults}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <button
          onClick={testGenerateToken}
          disabled={isLoading || !roomId}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <FiPlay className="w-4 h-4" />
          Test Token
        </button>

        <button
          onClick={testRoomMetadata}
          disabled={isLoading || !roomId}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <FiVideo className="w-4 h-4" />
          Test Metadata
        </button>

        <button
          onClick={testTokenVerification}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <FiUsers className="w-4 h-4" />
          Test Verification
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Testing...</span>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {testResults.map((result, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg border text-sm ${
              result.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{result.test}</span>
              <span className="text-xs opacity-75">{result.timestamp}</span>
            </div>
            <p className="mt-1">{result.message}</p>
            {result.data && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs opacity-75">View Data</summary>
                <pre className="mt-1 text-xs bg-black/5 p-2 rounded overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </motion.div>
        ))}
      </div>

      {testResults.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FiSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No tests run yet</p>
          <p className="text-xs">Click a test button to start debugging</p>
        </div>
      )}
    </div>
  );
};

export default StreamTest;
