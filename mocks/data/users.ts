import { User } from '../../types';

export const mockUsers: User[] = [
    {
        id: '1',
        name: 'Coming Soon',
        username: 'coming-soon',
        email: 'coming-soon@example.com',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=987&auto=format&fit=crop',
        bio: 'Coming Soon - Profile details will be available shortly.',
        interests: ['COMING_SOON'],
        followers: 0,
        following: 0,
        walletAddress: 'Coming Soon',
        savedEvents: [],
        attendedEvents: [],
        createdEvents: [],
        preferences: {
            notificationTypes: ['REMINDER'],
            locationRadius: 25,
            currency: 'USD'
        },
        verified: false
    }
];

export const getCurrentUser = (): User => {
    return mockUsers[0]; // Returns Joe RKND as current user
};

export const getUserById = (id: string): User | undefined => {
    return mockUsers.find(user => user.id === id);
};

export const getUsersByEvent = (eventId: string): User[] => {
    return mockUsers.filter(user =>
        user.savedEvents?.includes(eventId) ||
        user.attendedEvents?.includes(eventId)
    );
};

export const getFriendsGoingToEvent = (eventId: string, userId: string): User[] => {
    // In a real app, we'd have a friends table/relation
    // For mock purposes, let's assume all users are friends
    const currentUser = getUserById(userId);
    if (!currentUser) return [];

    return mockUsers.filter(user =>
        user.id !== userId &&
        (user.savedEvents?.includes(eventId) || user.attendedEvents?.includes(eventId))
    );
};