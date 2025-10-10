import { Event } from '../../types';

export const mockEvents: Event[] = [
    {
        id: '1',
        title: 'Coming Soon Event',
        description: 'Coming Soon - Event details will be announced shortly.',
        image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop',
        date: new Date('2025-06-15T20:00:00'),
        endDate: new Date('2025-06-16T04:00:00'),
        location: {
            name: 'Coming Soon',
            address: 'Coming Soon',
            city: 'Coming Soon',
            coordinates: { lat: 40.7128, lng: -74.006 }
        },
        organiser: {
            id: '1',
            name: 'Coming Soon',
            image: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=2070&auto=format&fit=crop',
            verified: false
        },
        category: 'MUSIC',
        subcategory: 'Coming Soon',
        price: {
            min: 0,
            max: 0,
            currency: 'USD',
            amount: 0
        },
        hasNftTickets: false,
        totalTickets: 0,
        soldTickets: 0,
        tags: ['coming-soon'],
        attendees: [],
        likes: 0,
        comments: 0,
        shares: 0,
        venue: undefined,
        imageUrl: undefined,
        popularity: undefined
    },
    {
        id: '2',
        title: 'Coming Soon Event',
        description: 'Coming Soon - Event details will be announced shortly.',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop',
        date: new Date('2025-07-10T09:00:00'),
        endDate: new Date('2025-07-12T18:00:00'),
        location: {
            name: 'Coming Soon',
            address: 'Coming Soon',
            city: 'Coming Soon',
            coordinates: { lat: 37.7749, lng: -122.4194 }
        },
        organiser: {
            id: '2',
            name: 'Coming Soon',
            image: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=2081&auto=format&fit=crop',
            verified: false
        },
        category: 'CONFERENCE',
        subcategory: 'Coming Soon',
        price: {
            min: 0,
            max: 0,
            currency: 'USD',
            amount: 0
        },
        hasNftTickets: false,
        totalTickets: 0,
        soldTickets: 0,
        tags: ['coming-soon'],
        attendees: [],
        likes: 0,
        comments: 0,
        shares: 0,
        venue: undefined,
        imageUrl: undefined,
        popularity: undefined
    }
];

export const getEventById = (id: string): Event | undefined => {
    return mockEvents.find(event => event.id === id);
};

export const getEventsByCategory = (category: string): Event[] => {
    return mockEvents.filter(event => event.category === category.toUpperCase());
};

export const getUpcomingEvents = (): Event[] => {
    const now = new Date();
    return mockEvents
        .filter(event => new Date(event.date) > now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getTrendingEvents = (): Event[] => {
    return [...mockEvents]
        .sort((a, b) => (b.likes + b.shares) - (a.likes + a.shares))
        .slice(0, 5);
};

export const getNftEvents = (): Event[] => {
    return mockEvents.filter(event => event.hasNftTickets);
};