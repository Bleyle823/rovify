/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useAuthOptions } from '@/hooks/useAuthOptions';
import RoviLogo from '@/public/images/contents/rovi-logo.png';
import HomePage from '@/components/HomePage';

export default function RootPage() {
  const { isLoading } = useAuthOptions({
    redirectIfAuthenticated: '/home',
    redirectIfUnauthenticated: '/auth/login'
  });

  useEffect(() => {
    console.log('ROOT: Page rendered');
  }, []);

  // Show loading screen if still loading
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 bg-gradient-to-br from-[#FF5722] to-[#FF7A50] rounded-xl flex items-center justify-center shadow-lg animate-pulse">
            <Image
              src="/images/contents/rovi-logo.png"
              alt="Rovify Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show the original Rovify home page
  return <HomePage />;
}