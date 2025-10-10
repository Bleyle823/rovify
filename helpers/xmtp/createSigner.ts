import type { Signer } from '@xmtp/browser-sdk';
import { toBytes, type WalletClient } from 'viem';

export const createSigner = (walletClient: WalletClient): Signer => {
  return {
    type: 'EOA',
    getIdentifier: async () => {
      const addresses = await walletClient.getAddresses();
      return {
        identifier: addresses[0].toLowerCase(),
        identifierKind: 'Ethereum',
      };
    },
    signMessage: async (message: string) => {
      const addresses = await walletClient.getAddresses();
      const address = addresses[0];
      const signature = await walletClient.signMessage({
        account: address,
        message,
      });
      return toBytes(signature);
    },
  };
};
