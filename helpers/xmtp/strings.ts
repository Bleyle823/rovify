export const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const isValidInboxId = (inboxId: string): boolean => {
  // XMTP inbox IDs are typically UUIDs or similar format
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      inboxId,
    ) || /^[0-9a-f]{64}$/i.test(inboxId)
  ); // Some inbox IDs might be 64-char hex strings
};

/**
 * Shorten an address or inbox ID for display
 */
export const shortAddress = (address: string, chars: number = 4): string => {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};
