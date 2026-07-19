"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type {
  Attachment,
  Conversation,
  Message,
  NotificationItem,
  ReplyPreview,
  User,
} from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import {
  getMessages,
  getPresence,
  getSharedMedia,
  getUnreadCounts,
  getUsers,
  sendMessage as apiSendMessage,
  type BackendMessage,
} from "@/lib/api"

type Theme = "dark" | "light"

interface Settings {
  notifications: boolean
  sounds: boolean
  readReceipts: boolean
  /** CSS background value (color or gradient), local to this device only. */
  chatBackground: string
}
interface ChatContextValue {
  theme: Theme
  toggleTheme: () => void

  currentUser: User
  users: Record<string, User>
  conversations: Conversation[]

  activeConversationId: string
  setActiveConversation: (id: string) => void
  activeConversation: Conversation | undefined

  messagesByConversation: Record<string, Message[]>
  activeMessages: Message[]

  sendMessage: (
    text: string,
    options?: { attachment?: Attachment; replyTo?: ReplyPreview },
  ) => void
  /**
   * Reactions are kept client-side only and reset on refresh — the backend
   * has no concept of reactions, so nothing here is persisted server-side.
   */
  toggleReaction: (messageId: string, emoji: string) => void

  typingConversationId: string | null

  replyTarget: ReplyPreview | null
  setReplyTarget: (reply: ReplyPreview | null) => void

  rightPanelOpen: boolean
  toggleRightPanel: () => void
  setRightPanelOpen: (open: boolean) => void

  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void

  searchOpen: boolean
  setSearchOpen: (open: boolean) => void

  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void

  notifications: NotificationItem[]
  unreadNotifications: number
  markNotificationsRead: () => void

  settings: Settings
  updateSettings: (partial: Partial<Settings>) => void

  lastMessageFor: (conversationId: string) => Message | undefined
  /** Fetches real attachments exchanged with the given user from the backend. */
  getSharedMediaFor: (conversationId: string) => Promise<Attachment[]>

  loading: boolean
  error: string | null
}

const ChatContext = createContext<ChatContextValue | null>(null)

const PALETTE = [
  "#f472b6",
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#a78bfa",
  "#fb7185",
  "#22d3ee",
]

function colorForId(id: string | number): string {
  const n =
    typeof id === "number" ? id : id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return PALETTE[n % PALETTE.length]
}

/** Maps a backend message to the UI's Message shape. conversationId is the
 * *other* user's id (string), matching how conversations are keyed below. */
function toUiMessage(m: BackendMessage, currentUserId: number): Message {
  const otherId = m.sender === currentUserId ? m.receiver : m.sender
  let attachment: Attachment | undefined
  if (m.attachment_url) {
    attachment = {
      type: m.attachment_type === "image" ? "image" : "file",
      name: m.attachment_name ?? "attachment",
      url: m.attachment_url,
    }
  }
  return {
    id: String(m.id),
    conversationId: String(otherId),
    senderId: m.sender === currentUserId ? "me" : String(m.sender),
    text: m.content,
    timestamp: m.timestamp,
    // We only know "read" vs "sent" from the backend (is_read). There's no
    // separate "delivered" concept, so anything unread shows as "sent".
    status: m.is_read ? "read" : "sent",
    reactions: [],
    attachment,
  }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth()
  const [theme, setTheme] = useState<Theme>("dark")

  const [users, setUsers] = useState<Record<string, User>>({})
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, Message[]>>({})
  const [activeConversationId, setActiveConversationId] = useState<string>("")
  const [typingConversationId] = useState<string | null>(null)
  const [replyTarget, setReplyTarget] = useState<ReplyPreview | null>(null)

  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === "undefined") {
      return {
        notifications: true,
        sounds: true,
        readReceipts: true,
        chatBackground: "none",
      }
    }
    try {
      const stored = localStorage.getItem("pulse_settings")
      if (stored) {
        return {
          notifications: true,
          sounds: true,
          readReceipts: true,
          chatBackground: "none",
          ...JSON.parse(stored),
        }
      }
    } catch {
      // ignore parse errors
    }
    return {
      notifications: true,
      sounds: true,
      readReceipts: true,
      chatBackground: "none",
    }
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Track the highest message id seen per conversation, used as the `after`
  // cursor for polling so we only fetch new messages.
  const lastIdRef = useRef<Record<string, number>>({})
  const activeRef = useRef(activeConversationId)
  activeRef.current = activeConversationId
  // Mirrors messagesByConversation for reading current state inside interval
  // callbacks without creating a stale closure over an old value.
  const messagesByConvRef = useRef<Record<string, Message[]>>({})
  messagesByConvRef.current = messagesByConversation
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const usersRef = useRef(users)
  usersRef.current = users

  const currentUser: User = authUser
    ? {
        id: "me",
        name: authUser.username,
        color: colorForId(authUser.id),
        status: "online",
      }
    : { id: "me", name: "", color: "#999", status: "offline" }

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
      root.classList.remove("light")
    } else {
      root.classList.add("light")
      root.classList.remove("dark")
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  }, [])

  // ---- Initial load: users + presence + unread counts ----
  useEffect(() => {
    if (!authUser) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [userList, presence, unread] = await Promise.all([
          getUsers(),
          getPresence(),
          getUnreadCounts(),
        ])
        if (cancelled) return

        const presenceMap = new Map(presence.map((p) => [p.id, p.online]))
        const unreadMap = new Map(unread.map((u) => [u.user_id, u.count]))

        const nextUsers: Record<string, User> = {}
        const nextConversations: Conversation[] = []

        for (const u of userList) {
          const idStr = String(u.id)
          nextUsers[idStr] = {
            id: idStr,
            name: u.username,
            color: colorForId(u.id),
            status: presenceMap.get(u.id) ? "online" : "offline",
          }
          nextConversations.push({
            id: idStr,
            participantId: idStr,
            isGroup: false,
            name: u.username,
            color: colorForId(u.id),
            status: presenceMap.get(u.id) ? "online" : "offline",
            unread: unreadMap.get(u.id) ?? 0,
          })
        }

        // Sort by most recent activity (users with a last_message first).
        nextConversations.sort((a, b) => {
          const ua = userList.find((u) => String(u.id) === a.id)
          const ub = userList.find((u) => String(u.id) === b.id)
          const ta = ua?.last_message_time
            ? new Date(ua.last_message_time).getTime()
            : 0
          const tb = ub?.last_message_time
            ? new Date(ub.last_message_time).getTime()
            : 0
          return tb - ta
        })

        setUsers(nextUsers)
        setConversations(nextConversations)
        if (nextConversations.length > 0 && !activeRef.current) {
          setActiveConversationId(nextConversations[0].id)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load chat data",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [authUser])

  // ---- Load full history when switching conversations ----
  useEffect(() => {
    if (!authUser || !activeConversationId) return
    const currentUserId = authUser.id
    let cancelled = false

    async function loadHistory() {
      try {
        const msgs = await getMessages(Number(activeConversationId))
        if (cancelled) return
        const uiMsgs = msgs.map((m) => toUiMessage(m, currentUserId))
        setMessagesByConversation((prev) => ({
          ...prev,
          [activeConversationId]: uiMsgs,
        }))
        if (msgs.length > 0) {
          lastIdRef.current[activeConversationId] = msgs[msgs.length - 1].id
        }
      } catch {
        // Leave existing state as-is; the polling loop below will retry.
      }
    }

    loadHistory()
    return () => {
      cancelled = true
    }
  }, [authUser, activeConversationId])

  // ---- Polling loop: every 3s, fetch new messages for the active conversation ----
  useEffect(() => {
    if (!authUser || !activeConversationId) return
    const currentUserId = authUser.id

    const interval = setInterval(async () => {
      const convId = activeRef.current
      if (!convId) return
      try {
        const after = lastIdRef.current[convId]
        const msgs = await getMessages(Number(convId), after)
        if (msgs.length === 0) return
        const uiMsgs = msgs.map((m) => toUiMessage(m, currentUserId))
        setMessagesByConversation((prev) => {
          const existing = prev[convId] ?? []
          const existingIds = new Set(existing.map((m) => m.id))
          const fresh = uiMsgs.filter((m) => !existingIds.has(m.id))
          if (fresh.length === 0) return prev
          return { ...prev, [convId]: [...existing, ...fresh] }
        })
        lastIdRef.current[convId] = msgs[msgs.length - 1].id

        // Browser notifications for incoming messages (not from me)
        const settingsSnap = settingsRef.current
        if (settingsSnap.notifications && typeof window !== "undefined") {
          const incoming = uiMsgs.filter((m) => m.senderId !== "me")
          if (incoming.length > 0 && Notification.permission === "granted") {
            const senderName = usersRef.current[incoming[0].senderId]?.name ?? "Someone"
            new Notification(`New message from ${senderName}`, {
              body: incoming[0].text || "Sent an attachment",
              icon: "/icon-dark-32x32.png",
            })
          }
        }
      } catch {
        // Silent fail on a single poll tick — next tick will retry.
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [authUser, activeConversationId])

  // ---- Read-receipt sync: every 5s, re-fetch the full thread for the active
  // conversation so is_read flips on already-displayed messages (set by the
  // backend when the *other* user views them) are reflected here too. The
  // 3s "new messages" poll above only catches brand-new messages, not status
  // changes on ones already shown, so this covers that gap separately. ----
  useEffect(() => {
    if (!authUser || !activeConversationId) return
    const currentUserId = authUser.id

    const interval = setInterval(async () => {
      const convId = activeRef.current
      if (!convId) return
      // Only bother re-syncing if I have sent messages still marked unread —
      // avoids a wasted full-thread fetch once everything is already read.
      const hasUnreadSent = (messagesByConvRef.current[convId] ?? []).some(
        (m) => m.senderId === "me" && m.status !== "read",
      )
      if (!hasUnreadSent) return
      try {
        const msgs = await getMessages(Number(convId))
        const uiMsgs = msgs.map((m) => toUiMessage(m, currentUserId))
        setMessagesByConversation((prev) => {
          const existing = prev[convId] ?? []
          const stillPending = existing.filter((m) => m.id.startsWith("pending-"))
          return { ...prev, [convId]: [...uiMsgs, ...stillPending] }
        })
        if (msgs.length > 0) {
          lastIdRef.current[convId] = Math.max(
            lastIdRef.current[convId] ?? 0,
            msgs[msgs.length - 1].id,
          )
        }
      } catch {
        // Silent fail — next tick retries.
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [authUser, activeConversationId])

  // ---- Lightweight polling for unread counts + presence across all conversations ----
  useEffect(() => {
    if (!authUser) return
    const interval = setInterval(async () => {
      try {
        const [presence, unread] = await Promise.all([
          getPresence(),
          getUnreadCounts(),
        ])
        const presenceMap = new Map(presence.map((p) => [p.id, p.online]))
        const unreadMap = new Map(unread.map((u) => [u.user_id, u.count]))
        setConversations((prev) =>
          prev.map((c) => ({
            ...c,
            status: presenceMap.get(Number(c.id))
              ? "online"
              : ("offline" as const),
            unread:
              c.id === activeRef.current
                ? 0
                : unreadMap.get(Number(c.id)) ?? 0,
          })),
        )
      } catch {
        // Silent fail — next tick retries.
      }
    }, 8000)
    return () => clearInterval(interval)
  }, [authUser])

  const setActiveConversation = useCallback((id: string) => {
    setActiveConversationId(id)
    setReplyTarget(null)
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
    )
  }, [])

  const sendMessage = useCallback<ChatContextValue["sendMessage"]>(
    (text, options) => {
      const trimmed = text.trim()
      const attachment = options?.attachment
      // A message needs either text or an attachment — not neither.
      if (!trimmed && !attachment) return
      const conversationId = activeConversationId
      if (!conversationId) return

      const receiverId = Number(conversationId)

      // Optimistic UI: show the message immediately with a temporary id
      // (using the attachment's local blob URL for instant preview), then
      // reconcile once the real response (or the next poll) arrives.
      const tempId = `pending-${Date.now()}`
      const optimisticMessage: Message = {
        id: tempId,
        conversationId,
        senderId: "me",
        text: trimmed,
        timestamp: new Date().toISOString(),
        status: "sent",
        reactions: [],
        attachment: attachment
          ? { type: attachment.type, name: attachment.name, url: attachment.url, size: attachment.size }
          : undefined,
      }
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] ?? []), optimisticMessage],
      }))
      setReplyTarget(null)

      apiSendMessage(receiverId, trimmed, attachment?.file)
        .then((real) => {
          setMessagesByConversation((prev) => ({
            ...prev,
            [conversationId]: (prev[conversationId] ?? []).map((m) =>
              m.id === tempId
                ? {
                    ...m,
                    id: String(real.id),
                    timestamp: real.timestamp,
                    // Swap the local blob URL for the real, durable server URL.
                    attachment: real.attachment_url
                      ? {
                          type: real.attachment_type === "image" ? "image" : "file",
                          name: real.attachment_name ?? attachment?.name ?? "attachment",
                          url: real.attachment_url,
                          size: attachment?.size,
                        }
                      : m.attachment,
                  }
                : m,
            ),
          }))
          lastIdRef.current[conversationId] = Math.max(
            lastIdRef.current[conversationId] ?? 0,
            real.id,
          )
        })
        .catch(() => {
          // Mark the optimistic message as failed by removing it; a real
          // app would show a retry affordance here.
          setMessagesByConversation((prev) => ({
            ...prev,
            [conversationId]: (prev[conversationId] ?? []).filter(
              (m) => m.id !== tempId,
            ),
          }))
        })
    },
    [activeConversationId],
  )

  const toggleReaction = useCallback<ChatContextValue["toggleReaction"]>(
    (messageId, emoji) => {
      setMessagesByConversation((prev) => {
        const next = { ...prev }
        for (const convId of Object.keys(next)) {
          next[convId] = next[convId].map((m) => {
            if (m.id !== messageId) return m
            const existing = m.reactions.find((r) => r.emoji === emoji)
            let reactions
            if (existing) {
              const mine = existing.by.includes("me")
              const by = mine
                ? existing.by.filter((id) => id !== "me")
                : [...existing.by, "me"]
              reactions =
                by.length === 0
                  ? m.reactions.filter((r) => r.emoji !== emoji)
                  : m.reactions.map((r) =>
                      r.emoji === emoji ? { ...r, by } : r,
                    )
            } else {
              reactions = [...m.reactions, { emoji, by: ["me"] }]
            }
            return { ...m, reactions }
          })
        }
        return next
      })
    },
    [],
  )

  const toggleRightPanel = useCallback(() => {
    setRightPanelOpen((prev) => !prev)
  }, [])

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    // If enabling notifications, request browser permission first
    if (partial.notifications === true && typeof window !== "undefined") {
      if (Notification.permission === "default") {
        Notification.requestPermission()
      }
    }
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      try {
        localStorage.setItem("pulse_settings", JSON.stringify(next))
      } catch {
        // localStorage unavailable (e.g. private browsing) — setting still
        // applies for this session, it just won't persist across reloads.
      }
      return next
    })
  }, [])

  const lastMessageFor = useCallback(
    (conversationId: string) => {
      const list = messagesByConversation[conversationId]
      return list && list.length ? list[list.length - 1] : undefined
    },
    [messagesByConversation],
  )

  const getSharedMediaFor = useCallback(
    async (conversationId: string): Promise<Attachment[]> => {
      const userId = Number(conversationId)
      if (!Number.isFinite(userId)) return []
      try {
        const msgs = await getSharedMedia(userId)
        return msgs
          .filter((m) => m.attachment_url)
          .map((m) => ({
            type: m.attachment_type === "image" ? ("image" as const) : ("file" as const),
            name: m.attachment_name ?? "attachment",
            url: m.attachment_url ?? undefined,
          }))
      } catch {
        return []
      }
    },
    [],
  )

  // Global CMD+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
      if (e.key === "Escape") {
        setSearchOpen(false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId],
  )
  const activeMessages = useMemo(
    () => messagesByConversation[activeConversationId] ?? [],
    [messagesByConversation, activeConversationId],
  )
  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  const value: ChatContextValue = {
    theme,
    toggleTheme,
    currentUser,
    users,
    conversations,
    activeConversationId,
    setActiveConversation,
    activeConversation,
    messagesByConversation,
    activeMessages,
    sendMessage,
    toggleReaction,
    typingConversationId,
    replyTarget,
    setReplyTarget,
    rightPanelOpen,
    toggleRightPanel,
    setRightPanelOpen,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    searchOpen,
    setSearchOpen,
    settingsOpen,
    setSettingsOpen,
    notifications,
    unreadNotifications,
    markNotificationsRead,
    settings,
    updateSettings,
    lastMessageFor,
    getSharedMediaFor,
    loading,
    error,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChat must be used within ChatProvider")
  return ctx
}