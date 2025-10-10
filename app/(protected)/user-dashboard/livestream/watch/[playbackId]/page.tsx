'use client';

import React, { useEffect, useState, forwardRef, type CSSProperties, type PropsWithChildren } from 'react';
import * as Player from '@livepeer/react/player';
import {
  LoadingIcon,
  MuteIcon,
  PauseIcon,
  PlayIcon,
  SettingsIcon,
  UnmuteIcon,
} from '@livepeer/react/assets';
import * as Popover from '@radix-ui/react-popover';
import { CheckIcon, ChevronDownIcon, XIcon, Heart, Share2, MessageCircle, Users, Eye, ThumbsUp, Gift, Sparkles, Send as SendIcon, Smile as SmileIcon, ArrowLeft } from 'lucide-react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import Link from 'next/link';

type Src = Parameters<typeof Player.Root>[0]['src'];

export default function WatchStream({ params }: { params: Promise<{ playbackId: string }> }) {
  const { playbackId } = (React as any).use(params);
  const [src, setSrc] = useState<Src>(null);
  const [error, setError] = useState<string | null>(null);
  const [canView, setCanView] = useState<boolean>(false);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [accessChecked, setAccessChecked] = useState<boolean>(false);
  const [streamName, setStreamName] = useState<string>('');
  const [streamThumb, setStreamThumb] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<string>('');
  const [viewerCount, setViewerCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [messages, setMessages] = useState<{ id: string; user: string; text: string; at: number }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: 84532 });
  const [viewerId, setViewerId] = useState<string>('');
  const [elapsedLabel, setElapsedLabel] = useState<string>('00:00:00');

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const res = await fetch(`/api/livepeer/playbackInfo?playbackId=${encodeURIComponent(playbackId)}`, { cache: 'no-store' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || 'Failed to load playback info');
        }
        const data = await res.json();
        setSrc(data?.src ?? null);
        // load display details from streams store
        try {
          const listRes = await fetch('/api/livepeer/getStreams', { cache: 'no-store' });
          const list = await listRes.json();
          const found = Array.isArray(list.items) ? list.items.find((i: any) => i?.playbackId === playbackId) : null;
          if (found) {
            if (found.name) setStreamName(found.name);
            if (found.thumbnail) setStreamThumb(found.thumbnail);
            if (found.createdAt) setCreatedAt(found.createdAt);
          }
        } catch {}
        // Load any stored contract gating info
        try {
          const c = await fetch(`/api/streams/contractByPlaybackId?playbackId=${encodeURIComponent(playbackId)}`, { cache: 'no-store' });
          if (c.ok) {
            const j = await c.json();
            setContractAddress(j?.contractAddress || null);
          }
        } catch {}
      } catch (e) {
        setError((e as Error).message);
      }
    };
    if (playbackId) load();
  }, [playbackId]);

  // Setup viewer identity once
  useEffect(() => {
    try {
      const key = 'rovify.viewerId';
      const existing = localStorage.getItem(key);
      if (existing) {
        setViewerId(existing);
      } else {
        const id = crypto.randomUUID();
        localStorage.setItem(key, id);
        setViewerId(id);
      }
    } catch {
      // fallback
      setViewerId(`${address || 'anon'}-${Date.now()}`);
    }
  }, [address]);

  // Heartbeat + viewer count polling (real metrics)
  useEffect(() => {
    if (!playbackId || !viewerId) return;
    let stopped = false;
    const heartbeat = async () => {
      try {
        await fetch('/api/streams/viewers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playbackId, viewerId }),
        });
      } catch {}
    };
    const refreshCount = async () => {
      try {
        const r = await fetch(`/api/streams/viewers?playbackId=${encodeURIComponent(playbackId)}`, { cache: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          if (!stopped && typeof j?.viewerCount === 'number') setViewerCount(j.viewerCount);
        }
      } catch {}
    };
    heartbeat();
    refreshCount();
    const hb = setInterval(heartbeat, 10_000);
    const pc = setInterval(refreshCount, 5_000);
    return () => { stopped = true; clearInterval(hb); clearInterval(pc); };
  }, [playbackId, viewerId]);

  // Functional elapsed time label (HH:MM:SS)
  useEffect(() => {
    const startMs = createdAt ? Date.parse(createdAt) : Date.now();
    const fmt = (sec: number) => {
      const h = Math.floor(sec / 3600).toString().padStart(2, '0');
      const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
      const s = Math.floor(sec % 60).toString().padStart(2, '0');
      return `${h}:${m}:${s}`;
    };
    const tick = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setElapsedLabel(fmt(diff));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [createdAt]);

  // Gate with Lit by verifying ERC721 ownership on Base Sepolia without Livepeer webhook
  useEffect(() => {
    const checkAccess = async () => {
      try {
        // not gated
        if (!contractAddress) { setCanView(true); setAccessChecked(true); return; }
        // require wallet connection
        if (!isConnected || !address || !publicClient) {
          setCanView(false);
          setError('Connect your wallet on Base Sepolia to verify access.');
          setAccessChecked(true);
          return;
        }
        // prompt a signature for user confirmation (no gas)
        try {
          if (walletClient) {
            await walletClient.signMessage({ message: `Verify access for stream ${playbackId} at ${new Date().toISOString()}` });
          }
        } catch {}
        // read ERC721 balance
        const erc721Abi = [
          { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
        ] as const;
        const bal = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: erc721Abi,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        });
        if (typeof bal === 'bigint' && bal > 0n) {
          setCanView(true);
          setError(null);
          setAccessChecked(true);
        } else {
          setCanView(false);
          setError('You must own the required NFT on Base Sepolia to view this stream.');
          setAccessChecked(true);
        }
      } catch (e) {
        setError('Access check failed. Please ensure your wallet is connected and on Base Sepolia.');
        setCanView(false);
        setAccessChecked(true);
      }
    };
    checkAccess();
  }, [contractAddress, isConnected, address, walletClient, publicClient, playbackId]);

  // removed simulated viewer changes; using real metrics polling above

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-white to-[#FF5900]/5">
      <div className="sticky top-0 z-30 backdrop-blur border-b border-gray-200/70 bg-white/70">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/user-dashboard/livestream" className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <h1 className="text-xl font-bold text-gray-900 truncate">{streamName || `Stream ${playbackId}`}</h1>
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs bg-red-500 text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
            </span>
          </div>
          <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 aspect-video group">
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-white text-sm inline-flex items-center gap-2">
                  <Eye className="w-4 h-4" /> {viewerCount.toLocaleString()}
                </div>
                <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-white text-xs font-mono">{elapsedLabel}</div>
              </div>
              <div className="absolute inset-0">
        {src && canView ? (
          <Player.Root src={src} clipLength={10}>
            <Player.Container
              style={{
                height: '100%',
                width: '100%',
                overflow: 'hidden',
                backgroundColor: 'black',
              }}
            >
              <Player.Video
                title="Live stream"
                style={{
                  height: '100%',
                  width: '100%',
                  objectFit: 'cover',
                }}
              />

              <Player.LoadingIndicator asChild>
                <Loading />
              </Player.LoadingIndicator>

              <Player.ErrorIndicator matcher="all" asChild>
                <Loading />
              </Player.ErrorIndicator>

              <Player.Controls
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.6))',
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  flexDirection: 'column-reverse',
                  gap: 5,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 20,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flex: 1,
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <Player.PlayPauseTrigger
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Player.PlayingIndicator asChild matcher={false}>
                        <PlayIcon style={{ width: 20, height: 20, color: 'white' }} />
                      </Player.PlayingIndicator>
                      <Player.PlayingIndicator asChild>
                        <PauseIcon style={{ width: 20, height: 20, color: 'white' }} />
                      </Player.PlayingIndicator>
                    </Player.PlayPauseTrigger>

                    <Player.LiveIndicator
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 5,
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: '#ef4444',
                          height: 8,
                          width: 8,
                          borderRadius: 9999,
                          boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
                        }}
                      />
                      <span style={{ fontSize: 12, userSelect: 'none', color: 'white', fontWeight: 600 }}>LIVE</span>
                    </Player.LiveIndicator>

                    <Player.MuteTrigger
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Player.VolumeIndicator asChild matcher={false}>
                        <MuteIcon style={{ width: 20, height: 20, color: 'white' }} />
                      </Player.VolumeIndicator>
                      <Player.VolumeIndicator asChild matcher={true}>
                        <UnmuteIcon style={{ width: 20, height: 20, color: 'white' }} />
                      </Player.VolumeIndicator>
                    </Player.MuteTrigger>
                    <Player.Volume
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexGrow: 1,
                        height: 25,
                        alignItems: 'center',
                        maxWidth: 120,
                        touchAction: 'none',
                        userSelect: 'none',
                      }}
                    >
                      <Player.Track
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.7)',
                          position: 'relative',
                          flexGrow: 1,
                          borderRadius: 9999,
                          height: '2px',
                        }}
                      >
                        <Player.Range
                          style={{
                            position: 'absolute',
                            backgroundColor: 'white',
                            borderRadius: 9999,
                            height: '100%',
                          }}
                        />
                      </Player.Track>
                      <Player.Thumb
                        style={{
                          display: 'block',
                          width: 12,
                          height: 12,
                          backgroundColor: 'white',
                          borderRadius: 9999,
                        }}
                      />
                    </Player.Volume>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Player.FullscreenTrigger
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Player.FullscreenIndicator asChild matcher={false}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                        </svg>
                      </Player.FullscreenIndicator>
                      <Player.FullscreenIndicator asChild>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                        </svg>
                      </Player.FullscreenIndicator>
                    </Player.FullscreenTrigger>
                    <Player.PictureInPictureTrigger
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                        <rect x="13" y="11" width="8" height="5" rx="1" fill="white"/>
                      </svg>
                    </Player.PictureInPictureTrigger>
                    <Settings />
                  </div>
                </div>
                <Seek
                  style={{
                    position: 'relative',
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    userSelect: 'none',
                    touchAction: 'none',
                  }}
                />
              </Player.Controls>
            </Player.Container>
          </Player.Root>
        ) : (error || (contractAddress && accessChecked && !canView)) ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white text-sm gap-3">
            <div>{error || 'You do not have access to this stream.'}</div>
            {contractAddress ? (
              <button
                onClick={() => {
                  // trigger re-check
                  setError(null);
                  setCanView(false);
                  // changing state to retrigger effect
                  setContractAddress(contractAddress);
                }}
                className="px-4 py-2 rounded bg-white text-black"
              >
                Verify Access
              </button>
            ) : null}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-sm">Loading…</div>
        )}
        </div>
              {/* Floating reactions inside player container */}
              <div className="absolute right-4 bottom-24 flex flex-col gap-3 z-20">
                <button
                  onClick={() => setIsLiked((v) => !v)}
                  className={`p-3 rounded-full bg-white/10 backdrop-blur hover:bg-white/20 transition ${isLiked ? 'ring-2 ring-red-500' : ''}`}
                  title="Like"
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                </button>
                <button
                  className="p-3 rounded-full bg-white/10 backdrop-blur hover:bg-white/20 transition"
                  title="Thumbs up"
                >
                  <ThumbsUp className="w-5 h-5 text-white" />
                </button>
                <button
                  className="p-3 rounded-full bg-white/10 backdrop-blur hover:bg-white/20 transition"
                  title="Send gift"
                >
                  <Gift className="w-5 h-5 text-white" />
                </button>
              </div>
            {/* Close gradient container */}
            </div>
          </div>

        {/* Stream Details Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Stream Avatar/Logo */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF5900] to-[#FF8C00] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {streamName ? streamName.charAt(0).toUpperCase() : 'R'}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{streamName || 'Live Stream'}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Rovify Events</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF5900]/10 text-[#FF5900] text-xs font-medium">
                    <Sparkles className="w-3 h-3" /> Verified
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsLiked(v => !v)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isLiked 
                  ? 'bg-[#FF5900] text-white shadow-lg shadow-[#FF5900]/20' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Heart className={`w-4 h-4 inline-block mr-2 ${isLiked ? 'fill-white' : ''}`} />
              {isLiked ? 'Following' : 'Follow'}
            </button>
          </div>

          {/* Stream Description */}
          <p className="text-gray-600 leading-relaxed mb-6">
            Join us for an unforgettable live streaming experience. Watch, interact, and connect with your favorite content creators in real-time.
          </p>

          {/* Token Gated Access Info */}
          {contractAddress && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    Token Gated Stream
                    {canView && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        <CheckIcon className="w-3 h-3" /> Access Granted
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    This stream requires ownership of a specific NFT to view.
                  </p>
                  <div className="text-xs font-mono text-gray-500 bg-white/50 px-2 py-1 rounded border border-gray-200 break-all">
                    {contractAddress}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pb-6 border-b border-gray-200">
            <button className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all inline-flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all inline-flex items-center justify-center gap-2">
              <Gift className="w-4 h-4" /> Send Gift
            </button>
          </div>

          {/* Engagement Metrics */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-red-50 to-pink-50 border border-red-100">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mb-2">
                <Heart className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">12.5K</p>
              <p className="text-xs text-gray-600 mt-1">Likes</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mb-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
              <p className="text-xs text-gray-600 mt-1">Messages</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-100">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 mb-2">
                <Eye className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{viewerCount.toLocaleString()}</p>
              <p className="text-xs text-gray-600 mt-1">Viewers</p>
            </div>
          </div>
        </div>
        </div>

        {/* Chat Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white h-[calc(100vh-160px)] flex flex-col sticky top-24">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-[#FF5900]" /><h3 className="font-semibold">Live Chat</h3></div>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700"><Users className="w-3 h-3" />{viewerCount.toLocaleString()}</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="text-xs text-gray-500">Chat will appear here.</div>
              ) : messages.map((m) => (
                <div key={m.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FF5900]/10 text-[#FF5900] flex items-center justify-center text-xs font-semibold">
                    {m.user?.slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-900 truncate">{m.user}</span>
                      <span className="text-[10px] text-gray-500 ml-auto">{new Date(m.at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-gray-700 break-words">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); if (!chatInput.trim()) return; setMessages(prev => [...prev, { id: crypto.randomUUID(), user: (address || 'you'), text: chatInput.trim(), at: Date.now() }]); setChatInput(''); }}
              className="p-3 border-t border-gray-200 flex items-center gap-2"
            >
              <button type="button" className="p-2 rounded-lg border hover:bg-gray-50"><SmileIcon className="w-4 h-4" /></button>
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Send a message..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
              <button type="submit" className="px-3 py-2 rounded-lg bg-[#FF5900] text-white text-sm inline-flex items-center gap-2"><SendIcon className="w-4 h-4" /> Send</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const Seek = forwardRef<HTMLButtonElement, Player.SeekProps>(
  ({ children, ...props }, forwardedRef) => (
    <Player.Seek ref={forwardedRef} {...props}>
      <Player.Track
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          position: 'relative',
          flexGrow: 1,
          borderRadius: 9999,
          height: 2,
        }}
      >
        <Player.SeekBuffer
          style={{
            position: 'absolute',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: 9999,
            height: '100%',
          }}
        />
        <Player.Range
          style={{
            position: 'absolute',
            backgroundColor: 'white',
            borderRadius: 9999,
            height: '100%',
          }}
        />
      </Player.Track>
      <Player.Thumb
        style={{
          display: 'block',
          width: 12,
          height: 12,
          backgroundColor: 'white',
          borderRadius: 9999,
        }}
      />
    </Player.Seek>
  ),
);

const Loading = forwardRef<HTMLDivElement, PropsWithChildren>(
  ({ children, ...props }, forwardedRef) => {
    return (
      <div
        {...props}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          backgroundColor: 'black',
          backdropFilter: 'blur(10px)',
          textAlign: 'center',
        }}
        ref={forwardedRef}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <LoadingIcon
            style={{
              width: '32px',
              height: '32px',
              animation: 'spin infinite 1s linear',
            }}
          />
        </div>
      </div>
    );
  },
);

const Settings = React.forwardRef(
  (
    { style }: { style?: CSSProperties },
    ref: React.Ref<HTMLButtonElement> | undefined,
  ) => {
    return (
      <Popover.Root>
        <Popover.Trigger ref={ref} asChild>
          <button
            type="button"
            style={{
              ...style,
              width: 36,
              height: 36,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: 'none',
            }}
            aria-label="Playback settings"
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <SettingsIcon
              style={{
                width: 20,
                height: 20,
                color: 'white',
              }}
            />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            style={{
              width: 250,
              borderRadius: 5,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(12px)',
              padding: 10,
            }}
            side="top"
            alignOffset={-70}
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <p
                style={{
                  fontSize: 14,
                }}
              >
                Settings
              </p>
              <Player.LiveIndicator
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
                matcher={false}
              >
                <label
                  style={{
                    fontSize: 12,
                  }}
                  htmlFor="qualitySelect"
                >
                  Quality
                </label>
                <Player.RateSelect name="rateSelect">
                  <Player.SelectTrigger
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 30,
                      minWidth: 120,
                      fontSize: 12,
                      gap: 5,
                      padding: 10,
                      borderRadius: 5,
                      outline: 'white solid 1px',
                    }}
                    aria-label="Playback speed"
                  >
                    <Player.SelectValue placeholder="Select a speed..." />
                    <Player.SelectIcon>
                      <ChevronDownIcon style={{ width: 14, height: 14 }} />
                    </Player.SelectIcon>
                  </Player.SelectTrigger>
                  <Player.SelectPortal>
                    <Player.SelectContent
                      style={{
                        borderRadius: 5,
                        backgroundColor: 'black',
                      }}
                    >
                      <Player.SelectViewport style={{ padding: 5 }}>
                        <Player.SelectGroup>
                          <RateSelectItem value={0.5}>0.5x</RateSelectItem>
                          <RateSelectItem value={1}>1x</RateSelectItem>
                        </Player.SelectGroup>
                      </Player.SelectViewport>
                    </Player.SelectContent>
                  </Player.SelectPortal>
                </Player.RateSelect>
              </Player.LiveIndicator>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <label
                  style={{
                    fontSize: 12,
                  }}
                  htmlFor="qualitySelect"
                >
                  Quality
                </label>
                <Player.VideoQualitySelect name="qualitySelect">
                  <Player.SelectTrigger
                    style={{
                      minWidth: 120,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 30,
                      fontSize: 12,
                      gap: 5,
                      padding: 10,
                      borderRadius: 5,
                      outline: 'white solid 1px',
                    }}
                    aria-label="Playback quality"
                  >
                    <Player.SelectValue placeholder="Select a quality..." />
                    <Player.SelectIcon>
                      <ChevronDownIcon style={{ width: 14, height: 14 }} />
                    </Player.SelectIcon>
                  </Player.SelectTrigger>
                  <Player.SelectPortal>
                    <Player.SelectContent
                      style={{
                        borderRadius: 5,
                        backgroundColor: 'black',
                      }}
                    >
                      <Player.SelectViewport style={{ padding: 5 }}>
                        <Player.SelectGroup>
                          <VideoQualitySelectItem value="auto">
                            Auto (HD+)
                          </VideoQualitySelectItem>
                          <VideoQualitySelectItem value="1080p">
                            1080p (HD)
                          </VideoQualitySelectItem>
                          <VideoQualitySelectItem value="360p">
                            360p
                          </VideoQualitySelectItem>
                        </Player.SelectGroup>
                      </Player.SelectViewport>
                    </Player.SelectContent>
                  </Player.SelectPortal>
                </Player.VideoQualitySelect>
              </div>
            </div>
            <Popover.Close
              style={{
                borderRadius: 9999,
                height: 20,
                width: 20,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                top: 5,
                right: 5,
              }}
              aria-label="Close"
            >
              <XIcon />
            </Popover.Close>
            <Popover.Arrow
              style={{
                fill: 'white',
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  },
);

const RateSelectItem = forwardRef<HTMLDivElement, Player.RateSelectItemProps>(
  ({ children, ...props }, forwardedRef) => {
    return (
      <Player.RateSelectItem
        style={{
          fontSize: 12,
          borderRadius: 5,
          display: 'flex',
          alignItems: 'center',
          paddingRight: 35,
          paddingLeft: 25,
          position: 'relative',
          userSelect: 'none',
          height: 30,
        }}
        {...props}
        ref={forwardedRef}
      >
        <Player.SelectItemText>{children}</Player.SelectItemText>
        <Player.SelectItemIndicator
          style={{
            position: 'absolute',
            left: 0,
            width: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckIcon style={{ width: 14, height: 14 }} />
        </Player.SelectItemIndicator>
      </Player.RateSelectItem>
    );
  },
);

const VideoQualitySelectItem = forwardRef<
  HTMLDivElement,
  Player.VideoQualitySelectItemProps
>(({ children, ...props }, forwardedRef) => {
  return (
    <Player.VideoQualitySelectItem
      style={{
        fontSize: 12,
        borderRadius: 5,
        display: 'flex',
        alignItems: 'center',
        paddingRight: 35,
        paddingLeft: 25,
        position: 'relative',
        userSelect: 'none',
        height: 30,
      }}
      {...props}
      ref={forwardedRef}
    >
      <Player.SelectItemText>{children}</Player.SelectItemText>
      <Player.SelectItemIndicator
        style={{
          position: 'absolute',
          left: 0,
          width: 25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckIcon style={{ width: 14, height: 14 }} />
      </Player.SelectItemIndicator>
    </Player.VideoQualitySelectItem>
  );
});