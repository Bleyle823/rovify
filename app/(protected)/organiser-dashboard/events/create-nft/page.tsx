import { Metadata } from 'next';
import CreateNFTEventPage from '@/components/organiser-dashboard/CreateNFTEventPage';

export const metadata: Metadata = {
    title: 'Create NFT Event',
    description: 'Create blockchain-powered events with NFT tickets',
};

export default function CreateNFTEventRoute() {
    return <CreateNFTEventPage />;
}
