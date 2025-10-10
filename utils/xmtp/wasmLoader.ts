// WASM URL resolver for XMTP
// This ensures WASM files are loaded with absolute URLs

export const resolveWasmUrl = (url: string): string => {
  // If it's already an absolute URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Convert relative URLs to absolute URLs
  if (url.startsWith('/')) {
    return window.location.origin + url;
  } else if (url.startsWith('./') || url.startsWith('../')) {
    return new URL(url, window.location.href).href;
  }
  
  // If it's a relative path without prefix, assume it's from the root
  return window.location.origin + '/' + url;
};

// Specific function to resolve XMTP WASM URLs
export const resolveXmtpWasmUrl = (url: string): string => {
  // Handle XMTP WASM files specifically
  if (url.includes('bindings_wasm_bg') && url.includes('.wasm')) {
    // Extract the filename from the URL
    const filename = url.split('/').pop();
    if (filename) {
      // Construct the correct path for Next.js static files
      return `${window.location.origin}/_next/static/wasm/${filename}`;
    }
  }
  
  // Handle URLs with duplicate static/wasm paths
  if (url.includes('/static/wasm/static/wasm/')) {
    const filename = url.split('/').pop();
    if (filename) {
      return `${window.location.origin}/_next/static/wasm/${filename}`;
    }
  }
  
  // Fallback to regular resolution
  return resolveWasmUrl(url);
};

// Override fetch globally to handle WASM URLs
export const setupWasmUrlResolver = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let url = typeof input === 'string' ? input : input.toString();
    
    // Handle WASM files specifically
    if (url.includes('.wasm')) {
      // Use specific XMTP WASM resolver for XMTP files
      if (url.includes('bindings_wasm_bg') || url.includes('/static/wasm/static/wasm/')) {
        url = resolveXmtpWasmUrl(url);
      } else {
        url = resolveWasmUrl(url);
      }
      console.log('Resolved WASM URL:', url);
    }
    
    return originalFetch(url, init);
  };
  
  return () => {
    window.fetch = originalFetch;
  };
};

// For Web Workers, we need to handle this differently
export const setupWorkerWasmResolver = () => {
  if (typeof self !== 'undefined' && 'importScripts' in self) {
    const originalFetch = self.fetch;
    
    self.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let url = typeof input === 'string' ? input : input.toString();
      
      // Handle WASM files in workers
      if (url.includes('.wasm')) {
        // Handle XMTP WASM files specifically in workers
        if (url.includes('bindings_wasm_bg') || url.includes('/static/wasm/static/wasm/')) {
          const filename = url.split('/').pop();
          if (filename) {
            url = `${self.location.origin}/_next/static/wasm/${filename}`;
          }
        } else if (url.startsWith('/')) {
          url = self.location.origin + url;
        } else if (url.startsWith('./') || url.startsWith('../')) {
          url = new URL(url, self.location.href).href;
        }
        console.log('Resolved WASM URL in worker:', url);
      }
      
      return originalFetch(url, init);
    };
    
    return () => {
      self.fetch = originalFetch;
    };
  }
  
  return () => {};
};

// Setup both main thread and worker WASM resolvers
export const setupGlobalWasmResolver = () => {
  const restoreMain = setupWasmUrlResolver();
  const restoreWorker = setupWorkerWasmResolver();
  
  return () => {
    restoreMain();
    restoreWorker();
  };
};
