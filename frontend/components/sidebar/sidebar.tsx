"use client"

import { useMemo, useState } from "react"
import { Search, Settings, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/avatar"
import { ConversationItem } from "./conversation-item"
import { useChat } from "@/context/chat-context"

export function Sidebar() {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    currentUser,
    setSearchOpen,
    setSettingsOpen,
    setMobileSidebarOpen,
  } = useChat()
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations
    const q = query.toLowerCase()
    return conversations.filter((c) => c.name.toLowerCase().includes(q))
  }, [conversations, query])

  const handleSelect = (id: string) => {
    setActiveConversation(id)
    setMobileSidebarOpen(false)
  }

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground md:w-60 md:border-r md:border-sidebar-border">
      {/* Logo / header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 12h4l2 5 4-12 2 7h6" />
            </svg>
          </div>
          <span className="text-[15px] font-semibold tracking-tight">
            Pulse
          </span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent md:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-background/40 px-3 py-2 text-left text-muted-foreground transition-colors hover:border-brand/40"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-xs">Search messages…</span>
          <kbd className="hidden rounded border border-sidebar-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
            ⌘K
          </kbd>
        </button>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter conversations"
            className="w-full rounded-lg border border-transparent bg-sidebar-accent/50 py-2 pl-8 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-brand/40"
          />
        </div>
      </div>

      {/* Conversation list */}
      <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
        <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Messages
        </p>
        {filtered.map((c) => (
          <ConversationItem
            key={c.id}
            conversation={c}
            active={c.id === activeConversationId}
            onSelect={() => handleSelect(c.id)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="px-2.5 py-6 text-center text-xs text-muted-foreground">
            No conversations found
          </p>
        )}
      </nav>

      {/* User footer */}
      <div className="flex items-center gap-3 border-t border-sidebar-border px-3 py-3">
        <Avatar
          name={currentUser.name}
          color={currentUser.color}
          size="md"
          status={currentUser.status}
          showStatus
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{currentUser.name}</p>
          <p className="truncate text-[11px] text-online">Active</p>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className={cn(
            "rounded-md p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
          )}
          aria-label="Open settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </aside>
  )
}
