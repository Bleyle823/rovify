'use client';

import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import RoviLogo from '@/public/images/contents/rovi-logo.png';
import ClientWrapper from '@/components/ClientWrapper';
import { useEffect, useState } from 'react';

export default function Home() {
    const { isLoading, user } = useAuth();
    const [loadingTimeout, setLoadingTimeout] = useState(false);

    useEffect(() => {
        console.log('🏠 HOME PAGE: Rendering with auth state -',
            isLoading ? 'Loading' : user ? 'Authenticated' : 'Unauthenticated');
    }, [isLoading, user]);

    // Add timeout to prevent infinite loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isLoading) {
                console.log('🏠 HOME PAGE: Loading timeout reached, forcing render');
                setLoadingTimeout(true);
            }
        }, 5000); // 5 second timeout

        return () => clearTimeout(timer);
    }, [isLoading]);

    // Show loading screen only if actually loading and not timed out
    if (isLoading && !loadingTimeout) {
        console.log('🏠 HOME PAGE: Showing loading screen');
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-white">
                <div className="flex flex-col items-center">
                    <div className="h-12 w-12 bg-gradient-to-br from-[#FF5722] to-[#FF7A50] rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                        <Image
                            src={RoviLogo}
                            alt="Rovify Logo"
                            width={32}
                            height={32}
                            className="object-contain"
                        />
                    </div>
                    <p className="mt-4 text-gray-500">Loading...</p>
                    <p className="mt-2 text-xs text-gray-400">If this takes too long, try refreshing the page</p>
                </div>
            </div>
        );
    }

    console.log('🏠 HOME PAGE: Rendering client wrapper for user', user?.email);
    return <ClientWrapper />;
}