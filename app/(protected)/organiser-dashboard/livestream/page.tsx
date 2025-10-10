import { Metadata } from 'next';
import LivestreamDashboard from '@/components/organiser-dashboard/LivestreamDashboard';

export const metadata: Metadata = {
    title: 'Livestream',
    description: 'Token-gated livestream management for organisers',
};

export default function LivestreamPage() {
    return (
        <div className="space-y-8">
            <LivestreamDashboard />
        </div>
    );
}
