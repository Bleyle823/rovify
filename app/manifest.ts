import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Rovify | NFT Event Ticketing',
        short_name: 'Rovify',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#111827',
        description: 'Discover and book amazing events with NFT tickets',
        // Keep icons minimal to avoid referencing non-existent files.
        // If you add PWA icons later (e.g., /icon-192.png, /icon-512.png), list them here.
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    };
}


