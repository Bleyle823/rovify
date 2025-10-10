'use client';

import { UIProvider } from '@/context/UIContext';
import FloatingActionManager from '@/components/FloatingActionManager';
import PageLayout from '@/components/PageLayout';
import ScrollToTop from '@/components/ScrollToTop';
import { Web3Provider } from '@/components/web3/Web3Provider';
import { Web3EventProvider } from '@/contexts/Web3EventContext';

export default function FullUILayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <UIProvider>
            <Web3Provider>
                <Web3EventProvider>
                    <FloatingActionManager>
                        <PageLayout>
                            {children}
                            <ScrollToTop />
                        </PageLayout>
                    </FloatingActionManager>
                </Web3EventProvider>
            </Web3Provider>
        </UIProvider>
    );
}