import { Metadata } from 'next';
import XMTPDebug from '@/components/chat/XMTPDebug';

export const metadata: Metadata = {
    title: 'XMTP Debug - Rovify',
    description: 'Debug XMTP functionality',
};

export default function XMTPDebugPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <XMTPDebug />
            </div>
        </div>
    );
}
