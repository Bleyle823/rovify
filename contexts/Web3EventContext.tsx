'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseEther } from 'viem';
import { useScaffoldWriteContract } from '@/hooks/web3/useScaffoldWriteContract';
import { useScaffoldReadContract } from '@/hooks/web3/useScaffoldReadContract';
import { getContract } from '@/contracts';

// Types
interface Event {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  location: string;
  startTime: number;
  endTime: number;
  ticketPrice: string;
  maxAttendees: number;
  isVirtual: boolean;
  tags: string[];
  creator: string;
  status: "created" | "active" | "paused" | "cancelled" | "completed";
  ticketsSold: number;
  availableTickets: number;
}

interface Ticket {
  id: number;
  tokenId: number;
  eventId: number;
  eventTitle: string;
  ticketType: string;
  owner: string;
  isTransferable: boolean;
  isUsed: boolean;
  purchaseTime: number;
  seatNumber: number;
}

interface Web3EventState {
  events: Event[];
  userTickets: Ticket[];
  loading: boolean;
  error: string | null;
  aggregate: {
    activeEvents: number;
    totalTicketsSold: number;
    totalRevenueWei: bigint;
    completedEvents: number;
  };
}

type Web3EventAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_EVENTS"; payload: Event[] }
  | { type: "ADD_EVENT"; payload: Event }
  | { type: "SET_USER_TICKETS"; payload: Ticket[] }
  | { type: "SET_AGGREGATE"; payload: { activeEvents: number; totalTicketsSold: number; totalRevenueWei: bigint; completedEvents: number } };

const initialState: Web3EventState = {
  events: [],
  userTickets: [],
  loading: false,
  error: null,
  aggregate: {
    activeEvents: 0,
    totalTicketsSold: 0,
    totalRevenueWei: BigInt(0),
    completedEvents: 0,
  },
};

function web3EventReducer(state: Web3EventState, action: Web3EventAction): Web3EventState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_EVENTS":
      return { ...state, events: action.payload };
    case "ADD_EVENT":
      return { ...state, events: [...state.events, action.payload] };
    case "SET_USER_TICKETS":
      return { ...state, userTickets: action.payload };
    case "SET_AGGREGATE":
      return { ...state, aggregate: action.payload };
    default:
      return state;
  }
}

interface Web3EventContextType {
  state: Web3EventState;
  createEvent: (eventData: Partial<Event>) => Promise<void>;
  mintTicket: (eventId: number, ticketType: string, isTransferable: boolean) => Promise<void>;
  batchMintTickets: (eventId: number, ticketType: string, isTransferable: boolean, quantity: number) => Promise<void>;
  loadEvents: () => Promise<void>;
  loadUserTickets: () => Promise<void>;
  listTicketForSale: (tokenId: number, priceEth: string) => Promise<void>;
  loadAggregateStats: () => Promise<void>;
}

const Web3EventContext = createContext<Web3EventContextType | undefined>(undefined);

export const useWeb3Events = () => {
  const context = useContext(Web3EventContext);
  if (context === undefined) {
    throw new Error("useWeb3Events must be used within a Web3EventProvider");
  }
  return context;
};

interface Web3EventProviderProps {
  children: React.ReactNode;
}

// Helper to safely convert ABI to mutable array
const toMutableAbi = (abi: any): any[] => {
  if (Array.isArray(abi)) {
    return [...abi];
  }
  return [];
};

// Helper to safely convert value to bigint
const toBigInt = (value: any): bigint => {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string') return BigInt(value);
  return BigInt(0);
};

export const Web3EventProvider: React.FC<Web3EventProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(web3EventReducer, initialState);
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Get contract info - support both Base Sepolia and localhost
  const activeChainId = chainId ?? 84532; // default to Base Sepolia
  
  // Get contracts with error handling
  let eventFactoryContract, eventTicketNFTContract, rovifyTokenContract, ticketMarketplaceContract;
  try {
    eventFactoryContract = getContract('EventFactory', activeChainId as number);
    eventTicketNFTContract = getContract('EventTicketNFT', activeChainId as number);
    rovifyTokenContract = getContract('RovifyToken', activeChainId as number);
    try {
      ticketMarketplaceContract = getContract('TicketMarketplace', activeChainId as number);
    } catch {
      ticketMarketplaceContract = { address: '0x0000000000000000000000000000000000000000' as `0x${string}`, abi: [] };
    }
  } catch (error) {
    console.warn(`No contracts deployed on chain ${activeChainId}:`, error);
    // Use dummy contract info to prevent crashes
    eventFactoryContract = { address: '0x0000000000000000000000000000000000000000' as `0x${string}`, abi: [] };
    eventTicketNFTContract = { address: '0x0000000000000000000000000000000000000000' as `0x${string}`, abi: [] };
    rovifyTokenContract = { address: '0x0000000000000000000000000000000000000000' as `0x${string}`, abi: [] };
    ticketMarketplaceContract = { address: '0x0000000000000000000000000000000000000000' as `0x${string}`, abi: [] };
  }

  // Contract write hooks - use helper to create mutable ABI copies
  const { writeContractAsync: createEventAsync } = useScaffoldWriteContract({
    contractName: 'EventFactory',
    abi: toMutableAbi(eventFactoryContract.abi.length > 0 
      ? eventFactoryContract.abi 
      : [{ type: 'function', name: 'createEvent', inputs: [], outputs: [], stateMutability: 'nonpayable' }]),
    address: eventFactoryContract.address,
  });

  const { writeContractAsync: mintTicketAsync } = useScaffoldWriteContract({
    contractName: 'EventTicketNFT',
    abi: toMutableAbi(eventTicketNFTContract.abi.length > 0 
      ? eventTicketNFTContract.abi 
      : [{ type: 'function', name: 'mintTicket', inputs: [], outputs: [], stateMutability: 'nonpayable' }]),
    address: eventTicketNFTContract.address,
  });

  const { writeContractAsync: batchMintTicketsAsync } = useScaffoldWriteContract({
    contractName: 'EventTicketNFT',
    abi: toMutableAbi(eventTicketNFTContract.abi.length > 0 
      ? eventTicketNFTContract.abi 
      : [{ type: 'function', name: 'batchMintTickets', inputs: [], outputs: [], stateMutability: 'nonpayable' }]),
    address: eventTicketNFTContract.address,
  });

  const { writeContractAsync: approveTokenAsync } = useScaffoldWriteContract({
    contractName: 'RovifyToken',
    abi: toMutableAbi(rovifyTokenContract.abi.length > 0 
      ? rovifyTokenContract.abi 
      : [{ type: 'function', name: 'approve', inputs: [], outputs: [], stateMutability: 'nonpayable' }]),
    address: rovifyTokenContract.address,
  });

  // Contract read hooks
  const { data: platformConfig } = useScaffoldReadContract({
    contractName: 'EventFactory',
    functionName: 'getPlatformConfig',
    abi: toMutableAbi(eventFactoryContract.abi),
    address: eventFactoryContract.address,
  });

  const { data: currentAllowance } = useScaffoldReadContract({
    contractName: 'RovifyToken',
    functionName: 'allowance',
    args: address && eventFactoryContract.address ? [address, eventFactoryContract.address] : undefined,
    abi: toMutableAbi(rovifyTokenContract.abi),
    address: rovifyTokenContract.address,
  });

  // Create a new event
  const createEvent = useCallback(async (eventData: Partial<Event>) => {
    if (!address) throw new Error('Wallet not connected');
    if (activeChainId !== 84532 && activeChainId !== 31337) throw new Error('Please switch to supported chain');
    if (eventFactoryContract.abi.length === 0) throw new Error('Contracts not deployed on this chain');

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      // Prepare event parameters
      const eventParams = {
        name: eventData.name || "",
        description: eventData.description || "",
        imageUrl: eventData.imageUrl || "",
        location: eventData.location || "",
        startTime: BigInt(Math.floor((eventData.startTime || Date.now()) / 1000)),
        endTime: BigInt(Math.floor((eventData.endTime || Date.now() + 86400000) / 1000)),
        ticketPrice: parseEther(eventData.ticketPrice || "0"),
        maxAttendees: BigInt(eventData.maxAttendees || 100),
        isVirtual: eventData.isVirtual || false,
        tags: eventData.tags || [],
      };

      // Check and approve creation fee if needed
      if (platformConfig && (platformConfig as any).creationFee > 0) {
        const creationFee = (platformConfig as any).creationFee;
        const allowance = toBigInt(currentAllowance);
        
        if (allowance < creationFee) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (approveTokenAsync as any)({
            functionName: 'approve',
            args: [eventFactoryContract.address as `0x${string}`, creationFee],
          });
        }
      }

      // Create the event
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (createEventAsync as any)({
        functionName: 'createEvent',
        args: [eventParams],
      });

      console.log('Event created successfully:', result);
      
      // Reload events after creation
      await loadEvents();
      
    } catch (error) {
      console.error('Error creating event:', error);
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : "Failed to create event" });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [address, activeChainId, createEventAsync, approveTokenAsync, platformConfig, currentAllowance, eventFactoryContract.address]);

  // Mint a single ticket
  const mintTicket = useCallback(async (eventId: number, ticketType: string, isTransferable: boolean) => {
    if (!address) throw new Error('Wallet not connected');
    if (activeChainId !== 84532 && activeChainId !== 31337) throw new Error('Please switch to supported chain');
    if (eventTicketNFTContract.abi.length === 0) throw new Error('Contracts not deployed on this chain');

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (mintTicketAsync as any)({
        functionName: 'mintTicket',
        args: [address as `0x${string}`, BigInt(eventId), ticketType, isTransferable],
      });

      console.log('Ticket minted successfully:', result);
      
      // Reload user tickets after minting
      await loadUserTickets();
      
    } catch (error) {
      console.error('Error minting ticket:', error);
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : "Failed to mint ticket" });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [address, activeChainId, mintTicketAsync]);

  // Batch mint tickets
  const batchMintTickets = useCallback(async (eventId: number, ticketType: string, isTransferable: boolean, quantity: number) => {
    if (!address) throw new Error('Wallet not connected');
    if (activeChainId !== 84532 && activeChainId !== 31337) throw new Error('Please switch to supported chain');
    if (eventTicketNFTContract.abi.length === 0) throw new Error('Contracts not deployed on this chain');

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (batchMintTicketsAsync as any)({
        functionName: 'batchMintTickets',
        args: [address as `0x${string}`, BigInt(eventId), ticketType, isTransferable, BigInt(quantity)],
      });

      console.log('Tickets batch minted successfully:', result);
      
      // Reload user tickets after minting
      await loadUserTickets();
      
    } catch (error) {
      console.error('Error batch minting tickets:', error);
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : "Failed to batch mint tickets" });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [address, activeChainId, batchMintTicketsAsync]);

  // List an owned ticket for sale on secondary marketplace
  const listTicketForSale = useCallback(async (tokenId: number, priceEth: string) => {
    if (!address) throw new Error('Wallet not connected');
    if (activeChainId !== 84532 && activeChainId !== 31337) throw new Error('Please switch to supported chain');
    if (ticketMarketplaceContract.abi.length === 0) throw new Error('Marketplace not deployed on this chain');

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const priceWei = parseEther(priceEth || '0');
      if (!walletClient) throw new Error('Wallet not connected');
      // Ensure marketplace is approved to transfer user's tickets
      if (eventTicketNFTContract.address && eventTicketNFTContract.abi.length > 0) {
        try {
          const isApproved = await publicClient?.readContract({
            address: eventTicketNFTContract.address as `0x${string}`,
            abi: toMutableAbi(eventTicketNFTContract.abi),
            functionName: 'isApprovedForAll',
            args: [address as `0x${string}`, ticketMarketplaceContract.address as `0x${string}`],
          });
          if (!isApproved) {
            await walletClient.writeContract({
              address: eventTicketNFTContract.address as `0x${string}`,
              abi: toMutableAbi(eventTicketNFTContract.abi),
              functionName: 'setApprovalForAll',
              args: [ticketMarketplaceContract.address as `0x${string}`, true],
            });
          }
        } catch (e) {
          console.warn('Approval check/set failed, attempting to proceed:', e);
        }
      }

      // Default listing duration: 7 days; disable RVFY by default
      const durationSeconds = BigInt(7 * 24 * 60 * 60);

      const result = await walletClient.writeContract({
        address: ticketMarketplaceContract.address as `0x${string}`,
        abi: toMutableAbi(ticketMarketplaceContract.abi),
        functionName: 'listTicket',
        args: [BigInt(tokenId), priceWei, durationSeconds, false],
        chain: undefined,
      });

      console.log('Ticket listed successfully:', result);
      // Optionally refresh tickets
      await loadUserTickets();
    } catch (error) {
      console.error('Error listing ticket:', error);
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : "Failed to list ticket" });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, activeChainId, walletClient, publicClient, ticketMarketplaceContract.address, ticketMarketplaceContract.abi, ticketMarketplaceContract.abi.length, eventTicketNFTContract.address, eventTicketNFTContract.abi]);

  // Load all events
  const loadEvents = useCallback(async () => {
    if (!publicClient) {
      console.log('Web3EventContext: No public client available');
      return;
    }
    
    // Support both localhost and Base Sepolia
    if (activeChainId !== 84532 && activeChainId !== 31337) {
      console.log('Web3EventContext: Unsupported chain ID:', activeChainId);
      return;
    }

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      // Check if contracts exist for this chain
      let contractAddress: `0x${string}` | undefined;
      let contractAbi: any;
      try {
        const contract = getContract('EventFactory', activeChainId);
        contractAddress = contract.address;
        contractAbi = contract.abi;
      } catch (error) {
        console.warn(`Web3EventContext: No EventFactory contract deployed on chain ${activeChainId}`);
        dispatch({ type: "SET_EVENTS", payload: [] });
        return;
      }

      if (!contractAddress || !contractAbi) {
        console.warn(`Web3EventContext: Missing contract address or ABI for chain ${activeChainId}`);
        dispatch({ type: "SET_EVENTS", payload: [] });
        return;
      }

      const currentIdResult = await publicClient.readContract({
        address: contractAddress,
        abi: toMutableAbi(contractAbi),
        functionName: 'getCurrentEventId',
        args: [], // Always provide args, even if empty
      });
      const currentId = toBigInt(currentIdResult);

      const INITIAL_EVENTS_LIMIT = BigInt(10); // only fetch the most recent N for speed
      const lastId = currentId - BigInt(1); // events likely 1..lastId
      if (lastId <= BigInt(0)) {
        dispatch({ type: "SET_EVENTS", payload: [] });
        return;
      }

      const startId = lastId - INITIAL_EVENTS_LIMIT + BigInt(1) > BigInt(0) ? lastId - INITIAL_EVENTS_LIMIT + BigInt(1) : BigInt(1);
      const ids: bigint[] = [];
      for (let i = lastId; i >= startId; i--) {
        ids.push(i);
        if (i === BigInt(1)) break; // prevent underflow
      }

      const results = await Promise.allSettled(ids.map(i =>
        publicClient.readContract({
          address: contractAddress,
          abi: toMutableAbi(contractAbi),
          functionName: 'getEvent',
          args: [i],
        }).then(eventData => ({ i, eventData }))
      ));

      const events: Event[] = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<{ i: bigint; eventData: any }>).value)
        .map(({ i, eventData }) => ({
          id: Number(i),
          name: eventData.name,
          description: eventData.description,
          imageUrl: eventData.imageUrl,
          location: eventData.location,
          startTime: Number(eventData.startTime) * 1000,
          endTime: Number(eventData.endTime) * 1000,
          ticketPrice: eventData.ticketPrice.toString(),
          maxAttendees: Number(eventData.maxAttendees),
          isVirtual: eventData.isVirtual,
          tags: eventData.tags,
          creator: address || '',
          status: 'active',
          ticketsSold: 0,
          availableTickets: Number(eventData.maxAttendees),
        }));

      dispatch({ type: "SET_EVENTS", payload: events });
    } catch (error) {
      console.error('Error loading events:', error);
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : "Failed to load events" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [publicClient, activeChainId, address]);

  // Aggregate stats across events (best-effort, guarded by try/catch for ABI differences)
  const loadAggregateStats = useCallback(async () => {
    if (!publicClient) return;
    if (activeChainId !== 84532 && activeChainId !== 31337) return;

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      // Resolve EventFactory and Ticket contracts
      let factoryAddr: `0x${string}` | undefined;
      let factoryAbi: any[] = [];
      let ticketAddr: `0x${string}` | undefined;
      let ticketAbi: any[] = [];
      try {
        const ef = getContract('EventFactory', activeChainId);
        factoryAddr = ef.address as `0x${string}`;
        factoryAbi = toMutableAbi(ef.abi);
      } catch {}
      try {
        const tnft = getContract('EventTicketNFT', activeChainId);
        ticketAddr = tnft.address as `0x${string}`;
        ticketAbi = toMutableAbi(tnft.abi);
      } catch {}

      if (!factoryAddr || factoryAbi.length === 0) {
        dispatch({ type: "SET_AGGREGATE", payload: { activeEvents: 0, totalTicketsSold: 0, totalRevenueWei: BigInt(0), completedEvents: 0 } });
        return;
      }

      // Helper to try a function and return undefined on failure
      const tryRead = async (address: `0x${string}`, abi: any[], functionName: string, args: any[] = []) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return await publicClient.readContract({ 
            address, 
            abi, 
            functionName: functionName as any, 
            args 
          });
        } catch {
          return undefined;
        }
      };

      // Determine current range of events
      const currentIdResult = await publicClient.readContract({
        address: factoryAddr,
        abi: factoryAbi,
        functionName: 'getCurrentEventId',
        args: [], // Always provide args
      });
      const currentId = toBigInt(currentIdResult);
      
      const lastId = currentId - BigInt(1);
      if (lastId <= BigInt(0)) {
        dispatch({ type: "SET_AGGREGATE", payload: { activeEvents: 0, totalTicketsSold: 0, totalRevenueWei: BigInt(0), completedEvents: 0 } });
        return;
      }

      const MAX_EVENTS = BigInt(25);
      const startId = lastId - MAX_EVENTS + BigInt(1) > BigInt(0) ? lastId - MAX_EVENTS + BigInt(1) : BigInt(1);

      let activeEvents = 0;
      let totalTicketsSold = 0;
      let totalRevenueWei = BigInt(0);
      let completedEvents = 0;

      for (let i = lastId; i >= startId; i--) {
        // Fetch event core data
        const ev: any = await tryRead(factoryAddr, factoryAbi, 'getEvent', [i]);
        if (!ev) continue;
        activeEvents += 1;

        // Ticket price and potential status
        const ticketPriceWei: bigint = ev.ticketPrice as bigint ?? BigInt(0);
        const status: string | undefined = ev.status as string | undefined;
        if (status === 'completed') completedEvents += 1;

        // Try to get ticketsSold via various possible functions
        let soldForEvent = 0;
        const fromFactoryStats: any = await tryRead(factoryAddr, factoryAbi, 'getEventStats', [i]);
        if (fromFactoryStats && typeof fromFactoryStats.ticketsSold !== 'undefined') {
          try { soldForEvent = Number(fromFactoryStats.ticketsSold); } catch {}
        } else {
          const fromFactoryDirect = await tryRead(factoryAddr, factoryAbi, 'getTicketsSold', [i]);
          if (typeof fromFactoryDirect !== 'undefined') {
            try { soldForEvent = Number(fromFactoryDirect); } catch {}
          } else if (ticketAddr && ticketAbi.length > 0) {
            const fromTicket = await tryRead(ticketAddr, ticketAbi, 'getTicketsSold', [i]);
            if (typeof fromTicket !== 'undefined') {
              try { soldForEvent = Number(fromTicket); } catch {}
            }
          }
        }

        totalTicketsSold += soldForEvent;
        try {
          totalRevenueWei += BigInt(soldForEvent) * (ticketPriceWei || BigInt(0));
        } catch {}

        if (i === BigInt(1)) break;
      }

      dispatch({ type: "SET_AGGREGATE", payload: { activeEvents, totalTicketsSold, totalRevenueWei, completedEvents } });
    } catch (error) {
      console.warn('Aggregate stats failed:', error);
      dispatch({ type: "SET_AGGREGATE", payload: { activeEvents: 0, totalTicketsSold: 0, totalRevenueWei: BigInt(0), completedEvents: 0 } });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [publicClient, activeChainId]);

  // Load user's tickets
  const loadUserTickets = useCallback(async () => {
    if (!address || !publicClient) return;
    if (activeChainId !== 84532 && activeChainId !== 31337) return;

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      // Check if contracts exist for this chain
      let ticketContractAddress, ticketContractAbi, eventContractAddress, eventContractAbi;
      try {
        const ticketContract = getContract('EventTicketNFT', activeChainId);
        const eventContract = getContract('EventFactory', activeChainId);
        ticketContractAddress = ticketContract.address;
        ticketContractAbi = toMutableAbi(ticketContract.abi);
        eventContractAddress = eventContract.address;
        eventContractAbi = toMutableAbi(eventContract.abi);
      } catch (error) {
        console.warn(`Web3EventContext: No contracts deployed on chain ${activeChainId}`);
        dispatch({ type: "SET_USER_TICKETS", payload: [] });
        return;
      }

      const tokenIds = await publicClient.readContract({
        address: ticketContractAddress,
        abi: ticketContractAbi,
        functionName: 'getOwnerTickets',
        args: [address as `0x${string}`],
      }) as bigint[];

      // Fetch all tickets' metadata in parallel
      const metadataResults = await Promise.allSettled(
        tokenIds.map(tokenId =>
          publicClient.readContract({
            address: ticketContractAddress,
            abi: ticketContractAbi,
            functionName: 'getTicketMetadata',
            args: [tokenId],
          }).then(metadata => ({ tokenId, metadata }))
        )
      );

      // Resolve unique event names by querying EventFactory.getEvent for each eventId
      const uniqueEventIds = Array.from(
        new Set(
          metadataResults
            .filter(r => r.status === 'fulfilled')
            .map(r => Number((r as PromiseFulfilledResult<{ tokenId: bigint; metadata: any }>).value.metadata.eventId))
        )
      );

      const eventInfoResults = await Promise.allSettled(
        uniqueEventIds.map(eid =>
          publicClient.readContract({
            address: eventContractAddress,
            abi: eventContractAbi,
            functionName: 'getEvent',
            args: [BigInt(eid)],
          }).then(eventData => ({ eventId: eid, eventData }))
        )
      );

      const eventIdToName: Record<number, string> = {};
      eventInfoResults.forEach(r => {
        if (r.status === 'fulfilled') {
          const { eventId, eventData } = (r as PromiseFulfilledResult<{ eventId: number; eventData: any }>).value;
          eventIdToName[eventId] = eventData.name || `Event #${eventId}`;
        }
      });

      const tickets: Ticket[] = metadataResults
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<{ tokenId: bigint; metadata: any }>).value)
        .map(({ tokenId, metadata }) => {
          const eid = Number(metadata.eventId);
          return {
            id: Number(tokenId),
            tokenId: Number(tokenId),
            eventId: eid,
            eventTitle: eventIdToName[eid] || `Event #${eid}`,
            ticketType: metadata.ticketType,
            owner: metadata.originalPurchaser,
            isTransferable: metadata.isTransferable,
            isUsed: metadata.isUsed,
            purchaseTime: Number(metadata.purchaseTime),
            seatNumber: Number(metadata.seatNumber),
          } as Ticket;
        });

      dispatch({ type: "SET_USER_TICKETS", payload: tickets });
    } catch (error) {
      console.error('Error loading user tickets:', error);
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : "Failed to load user tickets" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [address, activeChainId, publicClient]);

  const value: Web3EventContextType = {
    state,
    createEvent,
    mintTicket,
    batchMintTickets,
    loadEvents,
    loadUserTickets,
    listTicketForSale,
    loadAggregateStats,
  };

  return (
    <Web3EventContext.Provider value={value}>
      {children}
    </Web3EventContext.Provider>
  );
};