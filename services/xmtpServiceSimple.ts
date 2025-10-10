// Simple XMTP wrapper for @xmtp/browser-sdk v4

import type { Client } from '@xmtp/browser-sdk'

export interface XMTPMessage {
  id: string
  content: string
  senderAddress: string
  sent: Date
  contentType: string
}

export interface XMTPConversation {
  topic: string
  peerAddress: string
  createdAt: Date
  updatedAt: Date
}

export class XMTPService {
  private client: Client | null = null
  private initialized = false

  async initialize(walletClient: any, env: 'production' | 'dev' = 'production'): Promise<void> {
    const { Client: XMTPClient } = await import('@xmtp/browser-sdk')
    this.client = await XMTPClient.create(walletClient, { env })
    this.initialized = true
  }

  isInitialized(): boolean {
    return this.initialized && this.client !== null
  }

  private getClient(): Client {
    if (!this.client) throw new Error('XMTP client not initialized')
    return this.client
  }

  async canMessage(address: string): Promise<boolean> {
    try {
      const c: any = this.getClient()
      // v4 prefers Identifier[]; some builds return Map<string, boolean>
      const res = await c.canMessage([{ walletAddress: address }])
      if (typeof res === 'boolean') return res
      if (res && typeof res.get === 'function') {
        for (const v of res.values()) if (v) return true
        return false
      }
      return !!res
    } catch {
      return false
    }
  }

  private mapConv(x: any): XMTPConversation {
    const topic = (x?.topic ?? x?.id ?? crypto.randomUUID()) as string
    const peerAddress = (x?.peerAddress ?? x?.id ?? '') as string
    const createdAt: Date =
      x?.createdAt instanceof Date ? x.createdAt : new Date()
    const updatedAt: Date =
      x?.updatedAt instanceof Date ? x.updatedAt : new Date()
    return { topic, peerAddress, createdAt, updatedAt }
  }

  async getConversations(): Promise<XMTPConversation[]> {
    try {
      const c: any = this.getClient()

      // Try explicit helpers if present
      const out: XMTPConversation[] = []
      if (c?.conversations?.dms && typeof c.conversations.dms === 'function') {
        const dms = await c.conversations.dms()
        for (const dm of dms) out.push(this.mapConv(dm))
      }
      if (c?.conversations?.groups && typeof c.conversations.groups === 'function') {
        const groups = await c.conversations.groups()
        for (const g of groups) out.push(this.mapConv(g))
      }
      if (out.length) return out

      // Fallback
      const list = await c.conversations.list()
      return (list as any[]).map((it) => this.mapConv(it))
    } catch (e) {
      console.error('getConversations error:', e)
      return []
    }
  }

  async createConversation(address: string): Promise<XMTPConversation> {
    const c: any = this.getClient()

    // Prefer newDm if available
    if (c?.conversations?.newDm && typeof c.conversations.newDm === 'function') {
      const dm = await c.conversations.newDm({ walletAddress: address })
      return this.mapConv(dm)
    }
    // Some builds accept object for newConversation
    if (c?.conversations?.newConversation && typeof c.conversations.newConversation === 'function') {
      try {
        const conv = await c.conversations.newConversation({ walletAddress: address })
        return this.mapConv(conv)
      } catch {
        // fall through to string variant
      }
      const conv = await c.conversations.newConversation(address)
      return this.mapConv(conv)
    }
    throw new Error('No conversation creation method available')
  }

  private mapMsg(m: any): XMTPMessage {
    return {
      id: (m?.id ?? crypto.randomUUID()) as string,
      content: typeof m?.content === 'string' ? m.content : JSON.stringify(m?.content ?? ''),
      senderAddress: (m?.senderAddress ?? '') as string,
      sent: (m?.sent instanceof Date ? m.sent : new Date()) as Date,
      contentType:
        (typeof m?.contentType === 'string'
          ? m.contentType
          : m?.contentType?.toString?.() ?? '') as string,
    }
  }

  async getMessages(conversation: XMTPConversation): Promise<XMTPMessage[]> {
    try {
      const conv: any = await this.findConversationByTopic(conversation.topic)
      if (!conv) throw new Error('Conversation not found')
      const msgs: any[] = typeof conv.messages === 'function' ? await conv.messages() : []
      return msgs.map((m) => this.mapMsg(m))
    } catch (e) {
      console.error('getMessages error:', e)
      return []
    }
  }

  async sendMessage(conversation: XMTPConversation, content: string): Promise<XMTPMessage> {
    const conv: any = await this.findConversationByTopic(conversation.topic)
    if (!conv) throw new Error('Conversation not found')
    const m = await conv.send(content)
    return this.mapMsg(m)
  }

  async streamMessages(
    conversation: XMTPConversation,
    callback: (message: XMTPMessage) => void
  ): Promise<void> {
    try {
      const conv: any = await this.findConversationByTopic(conversation.topic)
      if (!conv) throw new Error('Conversation not found')

      if (typeof conv.streamMessages === 'function') {
        for await (const m of conv.streamMessages()) {
          callback(this.mapMsg(m))
        }
      }
    } catch (e) {
      console.error('streamMessages error:', e)
    }
  }

  private async findConversationByTopic(topic: string): Promise<any | null> {
    try {
      const c: any = this.getClient()

      if (c?.conversations?.dms && typeof c.conversations.dms === 'function') {
        const dms = await c.conversations.dms()
        const dm = dms.find((d: any) => (d?.topic ?? d?.id) === topic)
        if (dm) return dm
      }
      if (c?.conversations?.groups && typeof c.conversations.groups === 'function') {
        const groups = await c.conversations.groups()
        const g = groups.find((x: any) => (x?.topic ?? x?.id) === topic)
        if (g) return g
      }

      const list = await c.conversations.list()
      return (list as any[]).find((it) => (it?.topic ?? it?.id) === topic) ?? null
    } catch (e) {
      console.error('findConversationByTopic error:', e)
      return null
    }
  }

  async getAddress(): Promise<string> {
    const c: any = this.getClient()
    return c?.address ?? (await c?.identity?.address?.()) ?? ''
  }

  async disconnect(): Promise<void> {
    this.client = null
    this.initialized = false
  }
}

// Singleton
export const xmtpService = new XMTPService()
