'use client';

import { useEffect, useRef, useState } from 'react';
import { FiVideo, FiSettings, FiEye, FiMessageCircle, FiX } from 'react-icons/fi';
import * as Broadcast from '@livepeer/react/broadcast';
import { getIngest } from '@livepeer/react/external';
import {
    DisableAudioIcon,
    DisableVideoIcon,
    EnableAudioIcon,
    EnableVideoIcon,
    EnterFullscreenIcon,
    ExitFullscreenIcon,
    PictureInPictureIcon,
    StartScreenshareIcon,
    StopScreenshareIcon,
    StopIcon,
    LoadingIcon,
    OfflineErrorIcon,
} from '@livepeer/react/assets';

const LivestreamDashboard = () => {
    const [showSettings, setShowSettings] = useState(false);
    const [streamKey, setStreamKey] = useState('');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [streamName, setStreamName] = useState('');
    const [contractAddress, setContractAddress] = useState('');
    const [shouldAutoEnable, setShouldAutoEnable] = useState(false);
    const [streamImage, setStreamImage] = useState<string>('');
    const [imagePreview, setImagePreview] = useState<string>('');
    const enableBtnRef = useRef<HTMLButtonElement | null>(null);
    const [viewerCount, setViewerCount] = useState(0);
    const [liveStartedAt, setLiveStartedAt] = useState<number | null>(null);
    const [elapsedLabel, setElapsedLabel] = useState('00:00:00');
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Rehydrate persisted state to survive refreshes
    useEffect(() => {
        try {
            const savedKey = localStorage.getItem('rovify.livepeer.streamKey') || '';
            const savedName = localStorage.getItem('rovify.livepeer.streamName') || '';
            const auto = localStorage.getItem('rovify.livepeer.autoStart') === '1';
            if (savedKey) setStreamKey(savedKey);
            if (savedName) setStreamName(savedName);
            if (auto) setShouldAutoEnable(true);
        } catch {}
    }, []);

    // Attempt to auto-start broadcast when possible
    useEffect(() => {
        if (streamKey && shouldAutoEnable && enableBtnRef.current) {
            try {
                enableBtnRef.current.click();
            } catch {}
        }
    }, [streamKey, shouldAutoEnable]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setCreateError('Please select an image file');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setCreateError('Image size must be less than 5MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setStreamImage(result);
            setImagePreview(result);
            setCreateError(null);
        };
        reader.readAsDataURL(file);
    };

    const handleCreateStream = async () => {
        try {
            setCreating(true);
            setCreateError(null);
            const res = await fetch('/api/livepeer/createStream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: streamName?.trim() || 'Rovify Broadcast', 
                    contractAddress: contractAddress?.trim() || undefined,
                    image: streamImage || undefined
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || 'Failed to create stream');
            }
            const data = await res.json();
            if (data?.streamKey) {
                setStreamKey(data.streamKey);
                setShouldAutoEnable(true);
                try {
                    localStorage.setItem('rovify.livepeer.streamKey', data.streamKey);
                    localStorage.setItem('rovify.livepeer.streamName', streamName?.trim() || 'Rovify Broadcast');
                    localStorage.setItem('rovify.livepeer.autoStart', '1');
                } catch {}
            }
        } catch (e) {
            setCreateError((e as Error).message);
        } finally {
            setCreating(false);
        }
    };

    const handleToggleBroadcast = () => {
        if (!streamKey) return;
        try {
            enableBtnRef.current?.click();
        } catch {}
    };

    const handleStopBroadcast = () => {
        if (!streamKey) return;
        try {
            enableBtnRef.current?.click();
        } catch {}
    };

    // When live badge shows, start duration clock
    useEffect(() => {
        // heuristic: when streamKey present and auto-enable toggled, mark start
        if (streamKey && liveStartedAt === null) {
            setLiveStartedAt(Date.now());
        }
    }, [streamKey]);

    useEffect(() => {
        if (liveStartedAt === null) return;
        const fmt = (sec: number) => {
            const h = Math.floor(sec / 3600).toString().padStart(2, '0');
            const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
            const s = Math.floor(sec % 60).toString().padStart(2, '0');
            return `${h}:${m}:${s}`;
        };
        const tick = () => {
            const diff = Math.max(0, Math.floor((Date.now() - liveStartedAt) / 1000));
            setElapsedLabel(fmt(diff));
        };
        tick();
        const t = setInterval(tick, 1000);
        return () => clearInterval(t);
    }, [liveStartedAt]);

    // Resolve playbackId from streams.json and poll real viewer count using same heartbeat API
    useEffect(() => {
        let stopped = false;
        let playbackId: string | null = null;
        const getPlaybackId = async () => {
            try {
                const res = await fetch('/api/livepeer/getStreams', { cache: 'no-store' });
                const j = await res.json();
                const found = Array.isArray(j.items) ? j.items.find((i: any) => i?.streamKey === streamKey) : null;
                playbackId = found?.playbackId || null;
            } catch {}
        };
        const poll = async () => {
            if (!playbackId) return;
            try {
                const r = await fetch(`/api/streams/viewers?playbackId=${encodeURIComponent(playbackId)}`, { cache: 'no-store' });
                if (r.ok) {
                    const jj = await r.json();
                    if (!stopped && typeof jj?.viewerCount === 'number') setViewerCount(jj.viewerCount);
                }
            } catch {}
        };
        const run = async () => {
            await getPlaybackId();
            await poll();
        };
        run();
        const i = setInterval(run, 5000);
        return () => { stopped = true; clearInterval(i); };
    }, [streamKey]);

    const handleClearStream = async () => {
        // Delete stream from streams.json
        try {
            const savedKey = localStorage.getItem('rovify.livepeer.streamKey');
            if (savedKey) {
                await fetch('/api/livepeer/deleteStream', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ streamKey: savedKey }),
                });
            }
        } catch (e) {
            console.error('Failed to delete stream:', e);
        }

        setStreamKey('');
        setStreamName('');
        setStreamImage('');
        setImagePreview('');
        setShouldAutoEnable(false);
        try {
            localStorage.removeItem('rovify.livepeer.streamKey');
            localStorage.removeItem('rovify.livepeer.streamName');
            localStorage.removeItem('rovify.livepeer.autoStart');
        } catch {}
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                            <FiVideo className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Livestream</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Manage your live broadcasts
                            </p>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <FiSettings className="w-4 h-4" />
                    <span className="text-sm font-medium">Settings</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Stream Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Video Player */}
                    <div className="overflow-hidden border border-gray-200 rounded-2xl bg-white shadow-sm">
                        <div className="relative bg-gray-950 aspect-video flex items-center justify-center group">
                        {streamKey ? (
                            <Broadcast.Root ingestUrl={getIngest(streamKey)}>
                                <Broadcast.Container className="h-full w-full bg-gray-950">
                                    <Broadcast.Video title="Current livestream" className="h-full w-full" />

                                    {/* Comprehensive controls and overlays */}
                                    <Broadcast.LoadingIndicator className="w-full relative h-full">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                            <LoadingIcon className="w-8 h-8 animate-spin" />
                                        </div>
                                    </Broadcast.LoadingIndicator>

                                    <Broadcast.ErrorIndicator matcher="not-permissions" className="absolute inset-0 text-center bg-gray-950 flex flex-col items-center justify-center gap-4">
                                        <OfflineErrorIcon className="h-[120px] w-full sm:flex hidden" />
                                        <div className="flex flex-col gap-1">
                                                <div className="text-2xl font-bold text-white">Broadcast failed</div>
                                            <div className="text-sm text-gray-100">There was an error with broadcasting - it is retrying in the background.</div>
                                        </div>
                                    </Broadcast.ErrorIndicator>

                                        {/* Video Controls Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex items-center justify-between text-white">
                                                <div className="flex items-center gap-4">
                                                    <Broadcast.EnabledIndicator asChild>
                                                        <Broadcast.EnabledTrigger className="p-2 bg-red-500/80 hover:bg-red-600/80 rounded-lg transition-colors">
                                                            <StopIcon className="w-4 h-4" />
                                                        </Broadcast.EnabledTrigger>
                                                    </Broadcast.EnabledIndicator>

                                                    <Broadcast.VideoEnabledTrigger className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                                        <Broadcast.VideoEnabledIndicator asChild matcher={false}>
                                                            <DisableVideoIcon className="w-4 h-4" />
                                                        </Broadcast.VideoEnabledIndicator>
                                                        <Broadcast.VideoEnabledIndicator asChild matcher={true}>
                                                            <EnableVideoIcon className="w-4 h-4" />
                                                        </Broadcast.VideoEnabledIndicator>
                                                    </Broadcast.VideoEnabledTrigger>

                                                    <Broadcast.AudioEnabledTrigger className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                                        <Broadcast.AudioEnabledIndicator asChild matcher={false}>
                                                            <DisableAudioIcon className="w-4 h-4" />
                                                        </Broadcast.AudioEnabledIndicator>
                                                        <Broadcast.AudioEnabledIndicator asChild matcher={true}>
                                                            <EnableAudioIcon className="w-4 h-4" />
                                                        </Broadcast.AudioEnabledIndicator>
                                                    </Broadcast.AudioEnabledTrigger>

                                                    <span className="text-sm">00:00 / 00:00</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Broadcast.ScreenshareTrigger className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                                        <Broadcast.ScreenshareIndicator asChild>
                                                            <StopScreenshareIcon className="w-4 h-4" />
                                                        </Broadcast.ScreenshareIndicator>
                                                        <Broadcast.ScreenshareIndicator matcher={false} asChild>
                                                            <StartScreenshareIcon className="w-4 h-4" />
                                                        </Broadcast.ScreenshareIndicator>
                                                    </Broadcast.ScreenshareTrigger>

                                                    <Broadcast.PictureInPictureTrigger className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                                        <PictureInPictureIcon className="w-4 h-4" />
                                                    </Broadcast.PictureInPictureTrigger>

                                                    <Broadcast.FullscreenTrigger className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                                        <Broadcast.FullscreenIndicator asChild>
                                                            <ExitFullscreenIcon className="w-4 h-4" />
                                                        </Broadcast.FullscreenIndicator>
                                                        <Broadcast.FullscreenIndicator matcher={false} asChild>
                                                            <EnterFullscreenIcon className="w-4 h-4" />
                                                        </Broadcast.FullscreenIndicator>
                                                    </Broadcast.FullscreenTrigger>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Start/Stop Broadcast Button */}
                                        <Broadcast.EnabledIndicator matcher={false} className="absolute inset-0 flex items-center justify-center">
                                            <Broadcast.EnabledTrigger ref={enableBtnRef as any} className="rounded-md px-4 py-2 bg-black/60 hover:bg-black/70 gap-2 flex items-center justify-center text-white">
                                                <EnableVideoIcon className="w-6 h-6" />
                                                <span className="text-sm">Start broadcast</span>
                                            </Broadcast.EnabledTrigger>
                                        </Broadcast.EnabledIndicator>

                                        {/* Live Badge */}
                                        <div className="absolute top-4 left-4">
                                            <Broadcast.StatusIndicator matcher="live" className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg animate-pulse flex items-center gap-2">
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                                <span className="text-xs font-semibold">LIVE</span>
                                            </Broadcast.StatusIndicator>
                                            <Broadcast.StatusIndicator matcher="pending" className="bg-yellow-500 text-white px-3 py-1 rounded-lg flex items-center gap-2">
                                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                                <span className="text-xs font-semibold">PENDING</span>
                                            </Broadcast.StatusIndicator>
                                        </div>

                                        {/* Viewer Count */}
                                        <Broadcast.StatusIndicator matcher="live" className="absolute top-4 right-4 glass-card px-3 py-1.5 rounded-lg">
                                            <div className="flex items-center gap-2 text-white text-sm">
                                                <FiEye className="w-4 h-4" />
                                                <span className="font-medium">1,234</span>
                                            </div>
                                        </Broadcast.StatusIndicator>
                                </Broadcast.Container>
                            </Broadcast.Root>
                            ) : (
                                <>
                                    {/* Center content with icon */}
                                    <div className="relative z-10 text-center space-y-4 p-8">
                                        <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                            <FiVideo className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-semibold text-gray-100">No stream active</h3>
                                            <p className="text-gray-400 text-sm max-w-md mx-auto">
                                                Enter a Livepeer stream key below to start broadcasting
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Stream Controls */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-semibold mb-5 text-gray-900">Stream Configuration</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Stream Name</label>
                                <input 
                                    value={streamName}
                                    onChange={(e) => {
                                        setStreamName(e.target.value);
                                        try {
                                            localStorage.setItem('rovify.livepeer.streamName', e.target.value);
                                        } catch {}
                                    }}
                                    placeholder="My awesome livestream"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Stream Thumbnail</label>
                                <div className="space-y-3">
                                    {imagePreview ? (
                                        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-300">
                                            <img 
                                                src={imagePreview} 
                                                alt="Stream thumbnail preview" 
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => {
                                                    setStreamImage('');
                                                    setImagePreview('');
                                                    if (fileInputRef.current) {
                                                        fileInputRef.current.value = '';
                                                    }
                                                }}
                                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                            >
                                                <FiX className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all"
                                        >
                                            <FiVideo className="w-12 h-12 text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-600 font-medium">Click to upload thumbnail</p>
                                            <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF (max 5MB)</p>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    Token Gate (Optional)
                                </label>
                                <input 
                                    value={contractAddress}
                                    onChange={(e) => setContractAddress(e.target.value)}
                                    placeholder="0x..."
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm font-mono"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    ERC721 contract address on Base Sepolia to restrict access
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Livepeer Stream Key</label>
                                <input 
                                    type="password"
                                    value={streamKey}
                                    onChange={(e) => {
                                        setStreamKey(e.target.value);
                                        try {
                                            localStorage.setItem('rovify.livepeer.streamKey', e.target.value);
                                        } catch {}
                                    }}
                                    placeholder="st_live_..."
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all font-mono text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Your unique Livepeer stream key (24 characters)
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2 flex-wrap">
                                <button 
                                    onClick={handleCreateStream}
                                    disabled={creating}
                                    className="flex-1 min-w-[200px] px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-all disabled:opacity-50 font-medium shadow-sm text-sm"
                                >
                                    {creating ? 'Creating...' : 'Create Stream'}
                                </button>
                                <button 
                                    onClick={handleToggleBroadcast}
                                    disabled={!streamKey}
                                    className="flex-1 min-w-[150px] px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 font-medium shadow-sm text-sm"
                                >
                                    Go Live
                                </button>
                                <button 
                                    onClick={handleStopBroadcast}
                                    disabled={!streamKey}
                                    className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 font-medium shadow-sm text-sm"
                                >
                                    Stop
                                </button>
                                <button 
                                    onClick={handleClearStream}
                                    className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium shadow-sm text-sm"
                                >
                                    Clear
                                </button>
                            </div>

                            {createError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                                    <p className="text-sm text-red-600">{createError}</p>
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-200">
                                <label className="flex items-start gap-3 text-sm cursor-pointer group">
                                    <input 
                                        type="checkbox"
                                        checked={shouldAutoEnable}
                                        onChange={(e) => {
                                            setShouldAutoEnable(e.target.checked);
                                            try {
                                                localStorage.setItem('rovify.livepeer.autoStart', e.target.checked ? '1' : '0');
                                            } catch {}
                                        }}
                                        className="mt-0.5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                    />
                                    <div className="flex-1">
                                        <span className="text-gray-700 group-hover:text-gray-900 font-medium">
                                            Auto-start broadcast
                                        </span>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Automatically start broadcasting when you create or refresh a stream
                                        </p>
                                    </div>
                                </label>
                                <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-gray-50 rounded-lg">
                                    <div className={`w-2 h-2 rounded-full ${streamKey ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <span className="text-xs text-gray-600">
                                        {streamKey ? 'Ready to broadcast' : 'Waiting for stream key'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Stream Statistics */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
                            <div className="w-1.5 h-5 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                            Statistics
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-600">Current Viewers</span>
                                <span className="text-xl font-bold text-gray-900">—</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-600">Peak Viewers</span>
                                <span className="text-xl font-bold text-gray-900">—</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-600">Total Views</span>
                                <span className="text-xl font-bold text-gray-900">—</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-600">Duration</span>
                                <span className="text-xl font-bold text-gray-900 font-mono">00:00:00</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                <span>Start streaming to see live stats</span>
                            </div>
                        </div>
                    </div>

                    {/* Information Card */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="p-2 bg-orange-500 rounded-lg shadow-sm">
                                <FiVideo className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">Quick Start</h3>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    Enter your Livepeer stream key above and click "Go Live" to start broadcasting directly from your browser.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Live Chat Preview */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Live Chat</h3>
                            <FiMessageCircle className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="space-y-3 mb-4 h-48 overflow-y-auto">
                            <div className="text-sm p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                <p className="font-medium text-xs text-gray-500 mb-1">System</p>
                                <p className="text-gray-600 text-xs">Chat will appear when your stream goes live</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <input 
                                placeholder="Type a message..." 
                                disabled
                                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm disabled:bg-gray-50 disabled:text-gray-400"
                            />
                            <button 
                                disabled
                                className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl transition-all text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowSettings(false)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50/50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500 rounded-lg shadow-sm">
                                    <FiSettings className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Stream Settings</h2>
                            </div>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <span className="text-gray-500 text-xl">×</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <FiSettings className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings Panel</h3>
                                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                    Advanced stream settings and configuration options will appear here
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LivestreamDashboard;
