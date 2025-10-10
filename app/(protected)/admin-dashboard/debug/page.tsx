'use client';

import { useAccount } from 'wagmi';
import { useWeb3Events } from '@/contexts/Web3EventContext';

export default function AdminDebugPage() {
    const { isConnected, address, chainId } = useAccount();
    const { state, loadEvents } = useWeb3Events();

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Admin Dashboard Debug</h1>
            
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Web3 Connection Status</h2>
                    <div className="space-y-2">
                        <p><strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}</p>
                        <p><strong>Address:</strong> {address || 'Not connected'}</p>
                        <p><strong>Chain ID:</strong> {chainId || 'Not connected'}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Web3EventContext Status</h2>
                    <div className="space-y-2">
                        <p><strong>Loading:</strong> {state?.loading ? 'Yes' : 'No'}</p>
                        <p><strong>Error:</strong> {state?.error || 'None'}</p>
                        <p><strong>Events Count:</strong> {state?.events?.length || 0}</p>
                        <p><strong>User Tickets Count:</strong> {state?.userTickets?.length || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Actions</h2>
                    <button
                        onClick={() => {
                            try {
                                loadEvents();
                                console.log('loadEvents called successfully');
                            } catch (error) {
                                console.error('Error calling loadEvents:', error);
                            }
                        }}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                    >
                        Load Events
                    </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Events Data</h2>
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                        {JSON.stringify(state?.events || [], null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
}
