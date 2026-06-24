"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CornerDownLeft, MessageSquare, Search, User } from "lucide-react"
import { Avatar } from "@/components/avatar"
import { useChat } from "@/context/chat-context"
import { formatRelative } from "@/lib/format"

export function SearchOverlay() {
  const {
    searchOpen,
    setSearchOpen,
    conversations,
    messagesByConversation,
    setActiveConversation,
  } = useChat()
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) {
      setQuery("")
      // focus after mount
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [searchOpen])

  const contactResults = useMemo(() => {
    if (!query.trim()) return conversations.slice(0, 5)
    const q = query.toLowerCase()
    return conversations.filter((c) => c.name.toLowerCase().includes(q))
  }, [query, conversations])

  const messageResults = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const results: {
      conversationId: string
      conversationName: string
      color: string
      text: string
      timestamp: string
    }[] = []
    for (const c of conversations) {
      const msgs = messagesByConversation[c.id] ?? []
      for (const m of msgs) {
        if (m.text && m.text.toLowerCase().includes(q)) {
          results.push({
            conversationId: c.id,
            conversationName: c.name,
            color: c.color,
            text: m.text,
            timestamp: m.timestamp,
          })
        }
      }
    }
    return results.slice(0, 8)
  }, [query, conversations, messagesByConversation])

  if (!searchOpen) return null

  const go = (id: string) => {
    setActiveConversation(id)
    setSearchOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-message-in"
        onClick={() => setSearchOpen(false)}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl animate-message-in">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages and people…"
            className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            Esc
          </kbd>
        </div>

        <div className="scrollbar-thin max-h-[55vh] overflow-y-auto p-2">
          {/* People */}
          {contactResults.length > 0 && (
            <div className="mb-1">
              <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                People & Groups
              </p>
              {contactResults.map((c) => (
                <button
                  key={c.id}
                  onClick={() => go(c.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-secondary"
                >
                  <Avatar
                    name={c.name}
                    color={c.color}
                    size="sm"
                    status={c.status}
                    showStatus={!c.isGroup}
                  />
                  <span className="flex-1 truncate text-sm">{c.name}</span>
                  {c.isGroup ? (
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : null}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messageResults.length > 0 && (
            <div>
              <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Messages
              </p>
              {messageResults.map((m, i) => (
                <button
                  key={`${m.conversationId}-${i}`}
                  onClick={() => go(m.conversationId)}
                  className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-secondary"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium">
                        {m.conversationName}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatRelative(m.timestamp)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.text}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {query.trim() &&
            contactResults.length === 0 &&
            messageResults.length === 0 && (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                No results for &ldquo;{query}&rdquo;
              </p>
            )}
        </div>

        <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" /> to open
          </span>
          <span>
            <kbd className="rounded border border-border px-1 py-0.5">⌘K</kbd> to
            toggle
          </span>
        </div>
      </div>
    </div>
  )
}
