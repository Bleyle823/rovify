declare module 'pino-pretty';
declare module '@react-native-async-storage/async-storage';
declare module '@livepeer/react/broadcast';
declare module '@livepeer/react/external';
declare module '@livepeer/react' {
  export const Player: any;
}
// Lit stubs to allow compile until packages are installed
declare module 'lit-js-sdk' {
  export const checkAndSignAuthMessage: (opts: any) => Promise<any>;
}
declare module '@lit-protocol/lit-node-client' {
  export class LitNodeClient {
    constructor(opts?: any);
    connect(): Promise<void>;
    getSignedToken?: (args: any) => Promise<string>;
  }
}
declare module '@lit-protocol/constants' {
  export const LitNetwork: any;
}