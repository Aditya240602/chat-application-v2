"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowDown } from "lucide-react"
import { MessageBubble } from "./message-bubble"
import { TypingIndicator } from "./typing-indicator"
import { useChat } from "@/context/chat-context"

export function MessageList() {
  const {
    activeMessages,
    activeConversation,
    activeConversationId,
    typingConversationId,
    users,
  } = useChat()
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [showJump, setShowJump] = useState(false)
  const [newCount, setNewCount] = useState(0)
  const prevLen = useRef(activeMessages.length)
  const atBottomRef = useRef(true)

  const isTyping = typingConversationId === activeConversationId
  const typingUser = activeConversation
    ? activeConversation.isGroup
      ? users[activeConversation.members?.find((m) => m !== "me") ?? "sarah"]
      : users[activeConversation.participantId]
    : undefined

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior })
    setShowJump(false)
    setNewCount(0)
  }

  // Jump to bottom instantly when switching conversations
  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" })
    setShowJump(false)
    setNewCount(0)
    prevLen.current = activeMessages.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId])

  // Handle new messages
  useEffect(() => {
    const added = activeMessages.length - prevLen.current
    if (added > 0) {
      const last = activeMessages[activeMessages.length - 1]
      if (atBottomRef.current || last?.senderId === "me") {
        scrollToBottom()
      } else {
        setNewCount((c) => c + added)
        setShowJump(true)
      }
    }
    prevLen.current = activeMessages.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMessages.length])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    atBottomRef.current = distance < 80
    if (atBottomRef.current) {
      setShowJump(false)
      setNewCount(0)
    }
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="scrollbar-thin h-full space-y-2 overflow-y-auto px-3 py-4 sm:px-6"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          {activeMessages.map((message, i) => {
            const prev = activeMessages[i - 1]
            const showAvatar =
              !prev ||
              prev.senderId !== message.senderId ||
              new Date(message.timestamp).getTime() -
                new Date(prev.timestamp).getTime() >
                5 * 60 * 1000
            return (
              <MessageBubble
                key={message.id}
                message={message}
                showAvatar={showAvatar}
                isGroup={!!activeConversation?.isGroup}
              />
            )
          })}
          {isTyping && typingUser && (
            <TypingIndicator name={typingUser.name} color={typingUser.color} />
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Jump to latest / new message toast */}
      {showJump && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-medium text-brand-foreground shadow-lg animate-toast-in"
        >
          {newCount > 0 ? (
            <>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/25 px-1.5 text-[11px]">
                {newCount}
              </span>
              New message{newCount > 1 ? "s" : ""}
            </>
          ) : (
            "Jump to latest"
          )}
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
