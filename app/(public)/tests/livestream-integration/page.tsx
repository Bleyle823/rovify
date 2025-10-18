'use client';

import { useState } from 'react';

export default function LivestreamIntegrationTest() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState<boolean>(false);

  const run = async () => {
    try {
      setRunning(true);
      setError(null);
      setResult(null);
      const token =
        (typeof window !== 'undefined' && (localStorage.getItem('rovify_access_token')
          || sessionStorage.getItem('rovify_access_token')
          || localStorage.getItem('auth_token')
          || sessionStorage.getItem('auth_token'))) || '';
      if (!token) {
        setError('No auth token found. Please login first.');
        setRunning(false);
        return;
      }
      const playbackId = `itest_${Date.now()}`;
      const resp = await fetch('/api/tests/livestream-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: 'E2E Test', playbackId }),
      });
      const text = await resp.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch {}
      if (!resp.ok) {
        setError(json?.error || text || `Failed: ${resp.status}`);
      } else {
        setResult(json);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to run test');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Livestream Integration Test</h1>
      <p style={{ color: '#555' }}>This will create a livestream in the backend, set it LIVE, and fetch it by playbackId.</p>
      <button onClick={run} disabled={running} style={{ padding: '10px 16px', marginTop: 12, borderRadius: 8, background: '#FF5900', color: 'white', border: 'none' }}>
        {running ? 'Running…' : 'Run Test'}
      </button>
      {error && (
        <pre style={{ marginTop: 16, padding: 12, border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c', whiteSpace: 'pre-wrap' }}>{error}</pre>
      )}
      {result && (
        <pre style={{ marginTop: 16, padding: 12, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#111827', whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}


