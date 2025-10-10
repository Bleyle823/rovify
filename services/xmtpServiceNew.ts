// XMTP service using the browser SDK (v4-friendly). Minimal comments, practical checks.

import type { Client } from '@xmtp/browser-sdk'

export interface XMTPMessage {
  id: string
  content: string
  senderAddress?: string
  sent?: Date
  contentType?: string
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
    // only pass supported options
    this.client = await XMTPClient.create(walletClient, { env })
    this.initialized = true
  }

  async isInitialized(): Promise<boolean> {
    return this.initialized && this.client !== null
  }

  private getClient(): Client {
    if (!this.client) throw new Error('XMTP client not initialized')
    return this.client
  }

  // accepts a wallet address; normalizes to identifiers array
  async canMessage(address: string): Promise<boolean> {
    try {
      const c: any = this.getClient()
      const ids = [{ walletAddress: address }]
      const res = await c.canMessage(ids)
      if (typeof res === 'boolean') return res
      if (res && typeof res.get === 'function') {
        // Map<string, boolean> — return true if any identifier is true
        for (const v of res.values()) if (v) return true
        return false
      }
      return !!res
    } catch {
      return false
    }
  }

  // map any DM/group item into our app shape
  private mapConv(item: any): XMTPConversation {
    const topic: string = item?.topic ?? item?.id ?? crypto.randomUUID()
    const peerAddress: string = (item?.peerAddress ?? item?.id ?? '') as string
    const createdAt: Date = item?.createdAt instanceof Date ? item.createdAt : new Date()
    const updatedAt: Date = item?.updatedAt instanceof Date ? item.updatedAt : new Date()
    return { topic, peerAddress, createdAt, updatedAt }
  }

  async getConversations(): Promise<XMTPConversation[]> {
    try {
      const c: any = this.getClient()

      // Prefer explicit helpers if present
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

      // Fallback to generic list()
      const list = await c.conversations.list()
      return (list as any[]).map((x) => this.mapConv(x))
    } catch (err) {
      console.error('Error getting conversations:', err)
      return []
    }
  }

  async createConversation(address: string): Promise<XMTPConversation> {
    try {
      const c: any = this.getClient()

      // newDm preferred in newer builds
      if (c?.conversations?.newDm && typeof c.conversations.newDm === 'function') {
        const dm = await c.conversations.newDm({ walletAddress: address })
        return this.mapConv(dm)
      }

      // some builds accept newConversation({ walletAddress })
      if (c?.conversations?.newConversation && typeof c.conversations.newConversation === 'function') {
        const conv = await c.conversations.newConversation({ walletAddress: address })
        return this.mapConv(conv)
      }

      // last resort: direct string call (older style)
      const conv = await c.conversations.newConversation?.(address)
      return this.mapConv(conv)
    } catch (err) {
      console.error('Error creating conversation:', err)
      throw err
    }
  }

  private mapMsg(m: any): XMTPMessage {
    const id: string = m?.id ?? crypto.randomUUID()
    const content =
      typeof m?.content === 'string' ? m.content : JSON.stringify(m?.content ?? '')
    const senderAddress: string | undefined = m?.senderAddress
    const sent: Date | undefined = m?.sent instanceof Date ? m.sent : undefined
    const contentType: string | undefined =
      typeof m?.contentType === 'string' ? m.contentType : m?.contentType?.toString?.()
    return { id, content, senderAddress, sent, contentType }
  }

  async getMessages(conversation: XMTPConversation): Promise<XMTPMessage[]> {
    try {
      const conv: any = await this.findConversationByTopic(conversation.topic)
      if (!conv) throw new Error('Conversation not found')
      const msgs: any[] = typeof conv.messages === 'function' ? await conv.messages() : []
      return msgs.map((m) => this.mapMsg(m))
    } catch (err) {
      console.error('Error getting messages:', err)
      return []
    }
  }

  async sendMessage(conversation: XMTPConversation, content: string): Promise<XMTPMessage> {
    try {
      const conv: any = await this.findConversationByTopic(conversation.topic)
      if (!conv) throw new Error('Conversation not found')
      const m = await conv.send(content)
      return this.mapMsg(m)
    } catch (err) {
      console.error('Error sending message:', err)
      throw err
    }
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
      // if stream not available, no-op (or add polling here)
    } catch (err) {
      console.error('Error streaming messages:', err)
    }
  }

  private async findConversationByTopic(topic: string): Promise<any | null> {
    try {
      const c: any = this.getClient()

      // Try dms/groups helpers first
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

      // Fallback list()
      const list = await c.conversations.list()
      return (list as any[]).find((x: any) => (x?.topic ?? x?.id) === topic) ?? null
    } catch (err) {
      console.error('Error finding conversation:', err)
      return null
    }
  }

  async getAddress(): Promise<string> {
    const c: any = this.getClient()
    // some builds expose address directly, others via identity
    return c?.address ?? (await c?.identity?.address?.()) ?? ''
  }

  async disconnect(): Promise<void> {
    this.client = null
    this.initialized = false
  }
}

// Singleton
export const xmtpService = new XMTPService()