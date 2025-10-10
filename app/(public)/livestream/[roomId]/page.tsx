import { use } from 'react';
import LivestreamViewer from '@/components/livestream/LivestreamViewer';

interface PageProps {
    params: Promise<{ roomId: string }>;
}

export default function LivestreamPage({ params }: PageProps) {
    const { roomId } = use(params);
    return <LivestreamViewer roomId={roomId} />;
}
