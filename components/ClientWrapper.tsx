'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

const DynamicHomePage = dynamic(() => import('@/components/HomePage'), {
    ssr: false,
    loading: () => (
        <div className="flex h-screen items-center justify-center">
            <div className="animate-spin h-10 w-10 border-4 border-orange-500 rounded-full border-t-transparent"></div>
        </div>
    )
});

export default function ClientWrapper() {
    return (
        <ErrorBoundary>
            <Suspense fallback={
                <div className="flex h-screen items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-4 border-orange-500 rounded-full border-t-transparent"></div>
                </div>
            }>
                <DynamicHomePage />
            </Suspense>
        </ErrorBoundary>
    );
}