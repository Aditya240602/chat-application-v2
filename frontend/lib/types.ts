export type PresenceStatus = "online" | "away" | "offline"

export type MessageStatus = "sent" | "delivered" | "read"

export interface User {
  id: string
  name: string
  /** Tailwind-friendly hex used for the avatar fallback background */
  color: string
  avatarUrl?: string
  status: PresenceStatus
  bio?: string
  /** e.g. "Product Designer" */
  role?: string
}

export interface Reaction {
  emoji: string
  /** user ids who reacted */
  by: string[]
}

export type AttachmentType = "image" | "file"

export interface Attachment {
  type: AttachmentType
  name: string
  /** image src for image attachments */
  url?: string
  /** human readable size, e.g. "2.4 MB" */
  size?: string
}

export interface ReplyPreview {
  messageId: string
  senderName: string
  text: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  text: string
  /** ISO string */
  timestamp: string
  status: MessageStatus
  reactions: Reaction[]
  replyTo?: ReplyPreview
  attachment?: Attachment
}

export interface Conversation {
  id: string
  /** id of the other participant (for DMs) */
  participantId: string
  isGroup: boolean
  name: string
  color: string
  avatarUrl?: string
  status: PresenceStatus
  unread: number
  /** member ids for groups */
  members?: string[]
}

export interface NotificationItem {
  id: string
  type: "message" | "reaction" | "mention"
  text: string
  conversationId: string
  timestamp: string
  read: boolean
}

export interface SharedMediaItem {
  id: string
  url: string
  alt: string
}

export interface MutualGroup {
  id: string
  name: string
  color: string
  members: number
}
