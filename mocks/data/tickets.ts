import { Ticket } from '../../types';

// Define a proper type for NFT metadata
interface NftMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
        trait_type: string;
        value: string | number | boolean;
    }>;
}

export const mockTickets: Ticket[] = [
    {
        id: '1',
        eventId: '1',
        ownerId: '1',
        type: 'COMING_SOON',
        price: 0,
        currency: 'USD',
        purchaseDate: new Date('2025-04-10T14:32:11'),
        isNft: false,
        tokenId: 'Coming Soon',
        contractAddress: 'Coming Soon',
        transferable: false,
        status: 'COMING_SOON',
        seatInfo: null,
        qrCode: 'Coming Soon',
        metadata: {
            issuer: 'Coming Soon',
            edition: 'Coming Soon',
            perks: ['Coming Soon']
        }
    }
];

export const getUserTickets = (userId: string): Ticket[] => {
    return mockTickets.filter(ticket => ticket.ownerId === userId);
};

export const getTicketById = (id: string): Ticket | undefined => {
    return mockTickets.find(ticket => ticket.id === id);
};

export const getTicketsByEvent = (eventId: string): Ticket[] => {
    return mockTickets.filter(ticket => ticket.eventId === eventId);
};

export const verifyTicket = (ticketId: string): boolean => {
    const ticket = getTicketById(ticketId);
    return !!ticket && ticket.status === 'ACTIVE';
};

export const getNftTicketMetadata = (tokenId: string): NftMetadata | null => {
    const ticket = mockTickets.find(ticket => ticket.tokenId === tokenId);
    if (!ticket) return null;

    // Define with an index signature to allow string lookups
    const eventTypeToImage: { [key: string]: string } = {
        '1': 'https://images.unsplash.com/photo-1646267852348-1ae945b7d4d6?q=80&w=1932&auto=format&fit=crop', // Music event NFT
        '2': 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=1932&auto=format&fit=crop', // Tech event NFT
        '4': 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?q=80&w=2070&auto=format&fit=crop', // Art event NFT
        '5': 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=1932&auto=format&fit=crop', // Crypto event NFT
        '7': 'https://images.unsplash.com/photo-1636489953081-c4ebbd50fa3a?q=80&w=2071&auto=format&fit=crop', // Gaming event NFT
        '8': 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=2070&auto=format&fit=crop', // Film event NFT
        '10': 'https://images.unsplash.com/photo-1617802690992-15d93263d3a9?q=80&w=2070&auto=format&fit=crop', // VR event NFT
        'default': 'https://images.unsplash.com/photo-1646267852348-1ae945b7d4d6?q=80&w=1932&auto=format&fit=crop'
    };

    const nftImage = eventTypeToImage[ticket.eventId] || eventTypeToImage.default;

    return {
        name: `Rovify Event Ticket #${ticket.tokenId}`,
        description: `Official NFT ticket for event #${ticket.eventId}`,
        image: nftImage,
        attributes: [
            { trait_type: 'Event ID', value: ticket.eventId },
            { trait_type: 'Ticket Type', value: ticket.type },
            { trait_type: 'Transferable', value: ticket.transferable ? 'Yes' : 'No' },
            ...Object.entries(ticket.metadata).map(([key, value]) => {
                return {
                    trait_type: key,
                    value: value === null ? 'N/A' : (Array.isArray(value) ? value.join(', ') : value)
                };
            })
        ]
    };
};