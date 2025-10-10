// XMTP Service – compile-friendly v4 wrapper
// Keep app-facing types strict; keep SDK-facing bits `any` to avoid fragile typings.

import { Client } from '@xmtp/browser-sdk';

export interface XMTPMessage {
  id: string;
  content: string;
  senderInboxId: string;
  sent: Date;
  contentType: string;
}

export interface XMTPConversation {
  id: string;
  kind: 'dm' | 'group';
  title?: string;
  // DM may expose a function to resolve peer inbox id
  peerInboxId?: string | (() => Promise<string>);
  createdAt: Date;
  updatedAt?: Date;
}

export class XMTPService {
  private client: Client | null = null;

  get isReady() {
    return this.client !== null;
  }

  async initialize(signer: unknown, env: 'production' | 'dev' = 'production'): Promise<void> {
    // Accept whatever signer the app uses; the SDK will validate at runtime.
    this.client = await Client.create(signer as any, { env });
    console.log('XMTP client ready');
  }

  private requireClient(): Client {
    if (!this.client) throw new Error('XMTP client not initialized');
    return this.client;
  }

  // Build identifiers in a shape that v4 `canMessage` accepts without importing SDK internals
  private buildIdentifiers(opts: { walletAddress?: `0x${string}`; inboxId?: string }): any[] {
    const list: any[] = [];
    if (opts.walletAddress) {
      list.push({ walletAddress: opts.walletAddress });
    }
    if (opts.inboxId) {
      list.push({ inboxId: opts.inboxId });
    }
    return list;
  }

  async canMessage(opts: { walletAddress?: `0x${string}`; inboxId?: string }): Promise<boolean> {
    try {
      const client = this.requireClient();
      const ids = this.buildIdentifiers(opts);
      if (!ids.length) return false;

      const res: any = await (client as any).canMessage(ids);

      // v4 can return a boolean OR a Map<string, boolean>
      if (typeof res === 'boolean') return res;
      if (res && typeof res.get === 'function') {
        // try to get by the specific identifier we asked for
        if (opts.walletAddress) return Boolean(res.get(opts.walletAddress));
        if (opts.inboxId) return Boolean(res.get(opts.inboxId));
      }
      return false;
    } catch (e) {
      console.error('XMTP canMessage error', e);
      return false;
    }
  }

  async listConversations(): Promise<XMTPConversation[]> {
    try {
      const client = this.requireClient();
      const items: any[] = await (client as any).conversations.list();

      const mapped: XMTPConversation[] = items.map((c: any) => {
        // Heuristics to classify DM vs Group
        const isDm = 'getPeerInboxId' in c || 'peerInboxId' in c || (!('groupName' in c) && 'conversationId' in c);

        if (isDm) {
          return {
            id: c.conversationId ?? c.id ?? '',
            kind: 'dm',
            peerInboxId: typeof c.getPeerInboxId === 'function' ? () => c.getPeerInboxId() : c.peerInboxId,
            createdAt: c.createdAt ?? new Date(0),
            updatedAt: c.updatedAt ?? c.createdAt ?? new Date(0),
          };
        }

        return {
          id: c.conversationId ?? c.id ?? '',
          kind: 'group',
          title: c.groupName ?? c.title,
          createdAt: c.createdAt ?? new Date(0),
          updatedAt: c.updatedAt ?? c.createdAt ?? new Date(0),
        };
      });

      return mapped.sort(
        (a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0),
      );
    } catch (e) {
      console.error('XMTP listConversations error', e);
      return [];
    }
  }

  async createDmByWallet(walletAddress: `0x${string}`): Promise<XMTPConversation> {
    const client = this.requireClient();

    // Prefer dedicated DM create if present, otherwise fall back to a generic method
    const dm: any =
      (client as any).conversations?.dms?.new
        ? await (client as any).conversations.dms.new({ peer: this.buildIdentifiers({ walletAddress }) })
        : await (client as any).conversations?.newConversation?.({ peer: this.buildIdentifiers({ walletAddress }) });

    if (!dm) throw new Error('Unable to create DM');

    return {
      id: dm.conversationId ?? dm.id ?? '',
      kind: 'dm',
      peerInboxId: typeof dm.getPeerInboxId === 'function' ? () => dm.getPeerInboxId() : dm.peerInboxId,
      createdAt: dm.createdAt ?? new Date(),
      updatedAt: dm.updatedAt ?? dm.createdAt ?? new Date(),
    };
  }

  async getMessages(conv: XMTPConversation): Promise<XMTPMessage[]> {
    const client = this.requireClient();

    // Try specific getters first; otherwise locate from list()
    let raw: any = null;
    if (conv.kind === 'dm') {
      raw =
        (client as any).conversations?.dms?.get
          ? await (client as any).conversations.dms.get(conv.id)
          : null;
    } else {
      raw =
        (client as any).conversations?.groups?.get
          ? await (client as any).conversations.groups.get(conv.id)
          : null;
    }

    if (!raw) {
      const items: any[] = await (client as any).conversations.list();
      raw = items.find((x: any) => (x.conversationId ?? x.id) === conv.id);
    }
    if (!raw) return [];

    const msgs: any[] = typeof raw.messages === 'function' ? await raw.messages() : [];
    return msgs.map((m: any) => this.toXMTPMessage(m));
  }

  async sendMessage(conv: XMTPConversation, content: string): Promise<XMTPMessage> {
    const client = this.requireClient();

    let raw: any = null;
    if (conv.kind === 'dm' && (client as any).conversations?.dms?.get) {
      raw = await (client as any).conversations.dms.get(conv.id);
    } else if (conv.kind === 'group' && (client as any).conversations?.groups?.get) {
      raw = await (client as any).conversations.groups.get(conv.id);
    } else {
      const items: any[] = await (client as any).conversations.list();
      raw = items.find((x: any) => (x.conversationId ?? x.id) === conv.id);
    }
    if (!raw) throw new Error('Conversation not found');

    const m: any = await raw.send(content);
    return this.toXMTPMessage(m);
  }

  async streamMessages(conv: XMTPConversation, onMessage: (m: XMTPMessage) => void): Promise<void> {
    const client = this.requireClient();

    let raw: any = null;
    if (conv.kind === 'dm' && (client as any).conversations?.dms?.get) {
      raw = await (client as any).conversations.dms.get(conv.id);
    } else if (conv.kind === 'group' && (client as any).conversations?.groups?.get) {
      raw = await (client as any).conversations.groups.get(conv.id);
    } else {
      const items: any[] = await (client as any).conversations.list();
      raw = items.find((x: any) => (x.conversationId ?? x.id) === conv.id);
    }
    if (!raw) throw new Error('Conversation not found');

    if (typeof raw.streamMessages === 'function') {
      for await (const m of raw.streamMessages()) {
        onMessage(this.toXMTPMessage(m));
      }
    } else {
      const once: any[] = typeof raw.messages === 'function' ? await raw.messages() : [];
      once.forEach((m: any) => onMessage(this.toXMTPMessage(m)));
    }
  }

  private toXMTPMessage(m: any): XMTPMessage {
    if (typeof m === 'string') {
      return {
        id: '',
        content: m,
        senderInboxId: '',
        sent: new Date(),
        contentType: 'text/plain',
      };
    }

    const content = typeof m?.content === 'string' ? m.content : JSON.stringify(m?.content ?? '');
    const ct =
      m?.contentType?.typeId ??
      m?.contentType?.toString?.() ??
      'unknown';

    return {
      id: m?.id ?? '',
      content,
      senderInboxId: m?.senderInboxId ?? '',
      sent: m?.sent ?? new Date(),
      contentType: String(ct),
    };
  }

  async disconnect(): Promise<void> {
    this.client = null;
  }
}

export const xmtpService = new XMTPService();