import type { Conversation, DecodedMessage } from '@xmtp/browser-sdk';
import { ContentTypeReadReceipt } from '@xmtp/content-type-read-receipt';
import type { ContentTypes } from '@/contexts/XMTPContext';

/**
 * 发送已读回执
 */
export const sendReadReceipt = async (
  conversation: Conversation<ContentTypes>,
): Promise<void> => {
  try {
    await conversation.send({}, ContentTypeReadReceipt);
  } catch (error) {
    console.error('Failed to send read receipt:', error);
  }
};

/**
 * 检查消息是否为已读回执
 */
export const isReadReceiptMessage = (
  message: DecodedMessage<ContentTypes>,
): boolean => {
  return message.contentType.sameAs(ContentTypeReadReceipt);
};

/**
 * 过滤掉已读回执消息
 */
export const filterReadReceipts = (
  messages: DecodedMessage<ContentTypes>[],
): DecodedMessage<ContentTypes>[] => {
  return messages.filter((message) => !isReadReceiptMessage(message));
};

/**
 * 获取对话中的已读回执消息
 */
export const getReadReceipts = (
  messages: DecodedMessage<ContentTypes>[],
): DecodedMessage<ContentTypes>[] => {
  return messages.filter((message) => isReadReceiptMessage(message));
};

/**
 * 检查消息是否已被读取（基于已读回执的时间戳）
 */
export const isMessageRead = (
  message: DecodedMessage<ContentTypes>,
  readReceipts: DecodedMessage<ContentTypes>[],
  peerInboxId: string,
): boolean => {
  // 只检查来自对方的已读回执
  const peerReadReceipts = readReceipts.filter(
    (receipt) => receipt.senderInboxId === peerInboxId,
  );

  // 如果没有已读回执，则未读
  if (peerReadReceipts.length === 0) {
    return false;
  }

  // 找到最新的已读回执
  const latestReadReceipt = peerReadReceipts.reduce((latest, current) => {
    return current.sentAtNs > latest.sentAtNs ? current : latest;
  });

  // 如果消息发送时间早于或等于最新已读回执时间，则已读
  return message.sentAtNs <= latestReadReceipt.sentAtNs;
};
