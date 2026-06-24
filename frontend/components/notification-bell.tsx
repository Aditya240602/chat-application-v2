"use client"

import { useState } from "react"
import { AtSign, Bell, Heart, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatRelative } from "@/lib/format"
import { useChat } from "@/context/chat-context"
import type { NotificationItem } from "@/lib/types"

const iconFor = (type: NotificationItem["type"]) => {
  switch (type) {
    case "reaction":
      return <Heart className="h-4 w-4 text-[#ec4899]" />
    case "mention":
      return <AtSign className="h-4 w-4 text-brand" />
    default:
      return <MessageSquare className="h-4 w-4 text-online" />
  }
}

export function NotificationBell() {
  const {
    notifications,
    unreadNotifications,
    markNotificationsRead,
    setActiveConversation,
  } = useChat()
  const [open, setOpen] = useState(false)

  const toggle = () => {
    setOpen((o) => {
      const next = !o
      if (next && unreadNotifications > 0) markNotificationsRead()
      return next
    })
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadNotifications > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-semibold text-brand-foreground animate-badge-pulse">
            {unreadNotifications}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-xl animate-message-in">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold">Notifications</span>
              <span className="text-[11px] text-muted-foreground">
                {notifications.length} recent
              </span>
            </div>
            <div className="scrollbar-thin max-h-80 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                  You&apos;re all caught up
                </p>
              )}
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setActiveConversation(n.conversationId)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60",
                    !n.read && "bg-brand/5",
                  )}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    {iconFor(n.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-snug">{n.text}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatRelative(n.timestamp)}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
