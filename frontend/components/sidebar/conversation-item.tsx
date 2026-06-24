"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { formatRelative } from "@/lib/format"
import { Avatar } from "@/components/avatar"
import { useChat } from "@/context/chat-context"
import type { Conversation } from "@/lib/types"

interface ConversationItemProps {
  conversation: Conversation
  active: boolean
  onSelect: () => void
}

export function ConversationItem({
  conversation,
  active,
  onSelect,
}: ConversationItemProps) {
  const { lastMessageFor, users, typingConversationId } = useChat()
  const last = lastMessageFor(conversation.id)
  const isTyping = typingConversationId === conversation.id

  // pulse the unread badge when it increases
  const [pulse, setPulse] = useState(false)
  const prevUnread = useRef(conversation.unread)
  useEffect(() => {
    if (conversation.unread > prevUnread.current) {
      setPulse(true)
      const tmo = setTimeout(() => setPulse(false), 400)
      return () => clearTimeout(tmo)
    }
    prevUnread.current = conversation.unread
  }, [conversation.unread])

  let preview = "No messages yet"
  if (last) {
    if (last.attachment) {
      preview =
        last.attachment.type === "image" ? "Photo" : last.attachment.name
    } else {
      preview = last.text
    }
    if (last.senderId === "me") preview = `You: ${preview}`
    else if (conversation.isGroup) {
      const sender = users[last.senderId]
      if (sender) preview = `${sender.name.split(" ")[0]}: ${preview}`
    }
  }

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors duration-150",
        active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60",
      )}
    >
      {/* active highlight slider */}
      <span
        className={cn(
          "absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-full bg-brand transition-all duration-200",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <Avatar
        name={conversation.name}
        color={conversation.color}
        size="md"
        status={conversation.status}
        showStatus={!conversation.isGroup}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">
            {conversation.name}
          </span>
          {last && (
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {formatRelative(last.timestamp)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-xs",
              isTyping
                ? "text-brand"
                : conversation.unread > 0
                  ? "text-foreground/80 font-medium"
                  : "text-muted-foreground",
            )}
          >
            {isTyping ? "typing…" : preview}
          </span>
          {conversation.unread > 0 && (
            <span
              className={cn(
                "flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-semibold text-brand-foreground",
                pulse && "animate-badge-pulse",
              )}
            >
              {conversation.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
