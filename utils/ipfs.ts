/**
 * Utility functions for IPFS URL handling
 */

/**
 * Converts a Pinata gateway URL to ipfs.io URL to avoid rate limits
 * @param url - The original IPFS URL (could be Pinata, ipfs.io, etc.)
 * @returns The ipfs.io URL
 */
export function convertToIpfsIoUrl(url: string): string {
  if (!url) return url;
  
  // Extract CID from various IPFS gateway URLs
  const cidMatch = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
  if (cidMatch) {
    const cid = cidMatch[1];
    return `https://ipfs.io/ipfs/${cid}`;
  }
  
  return url;
}

/**
 * Gets the best IPFS gateway URL, preferring ipfs.io over Pinata to avoid rate limits
 * @param url - The original IPFS URL
 * @returns The best available IPFS URL
 */
export function getBestIpfsUrl(url: string): string {
  if (!url) return '/images/placeholder-event.jpg';
  
  // If it's already ipfs.io, return as is
  if (url.includes('ipfs.io')) {
    return url;
  }
  
  // Convert Pinata or other gateways to ipfs.io
  return convertToIpfsIoUrl(url);
}
