import { Web3Provider } from '@/components/web3/Web3Provider';
import { Web3EventProvider } from '@/contexts/Web3EventContext';

export default function MinimalUILayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Web3Provider>
            <Web3EventProvider>
                <div className="min-h-screen">
                    <main className="container mx-auto py-4 px-4">
                        {children}
                    </main>
                </div>
            </Web3EventProvider>
        </Web3Provider>
    );
}