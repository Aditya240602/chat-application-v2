"use client"

import { Menu, Phone, PanelRight, Video } from "lucide-react"
import { Avatar } from "@/components/avatar"
import { NotificationBell } from "@/components/notification-bell"
import { useChat } from "@/context/chat-context"

export function ChatHeader() {
  const {
    activeConversation,
    typingConversationId,
    toggleRightPanel,
    rightPanelOpen,
    setMobileSidebarOpen,
  } = useChat()

  if (!activeConversation) return null
  const isTyping = typingConversationId === activeConversation.id

  const statusLabel = isTyping
    ? "typing…"
    : activeConversation.isGroup
      ? `${activeConversation.members?.length ?? 0} members`
      : activeConversation.status === "online"
        ? "Active now"
        : activeConversation.status === "away"
          ? "Away"
          : "Offline"

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 sm:px-4">
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary md:hidden"
        aria-label="Open conversations"
      >
        <Menu className="h-5 w-5" />
      </button>

      <button
        onClick={toggleRightPanel}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <Avatar
          name={activeConversation.name}
          color={activeConversation.color}
          size="md"
          status={activeConversation.status}
          showStatus={!activeConversation.isGroup}
        />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">
            {activeConversation.name}
          </h2>
          <p
            className={
              isTyping
                ? "text-xs text-brand"
                : activeConversation.status === "online" &&
                    !activeConversation.isGroup
                  ? "text-xs text-online"
                  : "text-xs text-muted-foreground"
            }
          >
            {statusLabel}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-1">
        <button
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:flex"
          aria-label="Start voice call"
        >
          <Phone className="h-[18px] w-[18px]" />
        </button>
        <button
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:flex"
          aria-label="Start video call"
        >
          <Video className="h-[18px] w-[18px]" />
        </button>
        <NotificationBell />
        <button
          onClick={toggleRightPanel}
          className={
            rightPanelOpen
              ? "flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors"
              : "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          }
          aria-label="Toggle info panel"
        >
          <PanelRight className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  )
}
