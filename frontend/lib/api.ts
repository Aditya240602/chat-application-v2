/**
 * Real API client for the Django backend.
 *
 * Replaces all mock-data.ts usage. Every function here corresponds to a real,
 * confirmed endpoint on the backend — nothing here is invented or guessed.
 *
 * Token storage: localStorage for simplicity. For a production app, httpOnly
 * cookies set by the server would be more secure (protects against XSS token
 * theft) but requires backend changes (CSRF handling, cookie-based JWT) that
 * are out of scope here.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

// ---------- Types matching the real backend response shapes ----------

export interface BackendUser {
  id: number
  username: string
  email: string
}

export interface BackendUserListItem extends BackendUser {
  last_message: string
  last_message_time: string | null
}

export interface BackendPresence {
  id: number
  username: string
  online: boolean
  last_seen: string | null
}

export interface BackendMessage {
  id: number
  sender: number
  receiver: number
  sender_username: string
  receiver_username: string
  content: string
  attachment_url: string | null
  attachment_type: "image" | "file" | null
  attachment_name: string | null
  timestamp: string
  is_read: boolean
}

export interface BlockStatus {
  blocked_by_me: boolean
  blocked_me: boolean
}

export interface UnreadCount {
  user_id: number
  count: number
}

// ---------- Token storage ----------

const ACCESS_KEY = "pulse_access_token"
const REFRESH_KEY = "pulse_refresh_token"

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

// ---------- Core fetch wrapper with auto-refresh-on-401 ----------

class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `API error ${status}`)
    this.status = status
    this.body = body
  }
}

let refreshPromise: Promise<boolean> | null = null

/** Attempts to refresh the access token. Returns true on success. */
async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken()
  if (!refresh) return false

  // De-dupe concurrent refresh attempts (e.g. several requests 401 at once).
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        })
        if (!res.ok) return false
        const data = await res.json()
        // ROTATE_REFRESH_TOKENS is on in settings, so a new refresh token
        // is also returned — store it if present, otherwise keep the old one.
        setTokens(data.access, data.refresh ?? refresh)
        return true
      } catch {
        return false
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  _retried = false,
): Promise<T> {
  const access = getAccessToken()
  const headers = new Headers(options.headers)
  const isFormData = options.body instanceof FormData
  if (!isFormData) headers.set("Content-Type", "application/json")
  if (access) headers.set("Authorization", `Bearer ${access}`)

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401 && !_retried) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      return apiFetch<T>(path, options, true)
    }
    clearTokens()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    throw new ApiError(401, null, "Session expired")
  }

  if (!res.ok) {
    let body: unknown = null
    try {
      body = await res.json()
    } catch {
      // no JSON body
    }
    throw new ApiError(res.status, body, `Request to ${path} failed`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ---------- Auth ----------

export async function register(
  username: string,
  password: string,
  secret: string,
  email = "",
): Promise<BackendUser> {
  // /api/register/ requires a registration secret (settings.REGISTRATION_SECRET).
  return apiFetch<BackendUser>("/api/register/", {
    method: "POST",
    body: JSON.stringify({ username, password, email, secret }),
  })
}

export async function login(
  username: string,
  password: string,
): Promise<{ access: string; refresh: string }> {
  const res = await fetch(`${API_BASE}/api/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    let body: unknown = null
    try {
      body = await res.json()
    } catch {
      // ignore
    }
    throw new ApiError(res.status, body, "Login failed")
  }
  const data = await res.json()
  setTokens(data.access, data.refresh)
  return data
}

export function logout() {
  clearTokens()
}

export async function getCurrentUser(): Promise<BackendUser> {
  return apiFetch<BackendUser>("/api/me/")
}

// ---------- Users / presence ----------

export async function getUsers(): Promise<BackendUserListItem[]> {
  return apiFetch<BackendUserListItem[]>("/api/users/")
}

export async function getPresence(): Promise<BackendPresence[]> {
  return apiFetch<BackendPresence[]>("/api/presence/")
}

// ---------- Messages ----------

export async function getMessages(
  userId: number,
  afterId?: number,
): Promise<BackendMessage[]> {
  const params = new URLSearchParams({ user_id: String(userId) })
  if (afterId !== undefined) params.set("after", String(afterId))
  return apiFetch<BackendMessage[]>(`/api/chat/messages/?${params.toString()}`)
}

export async function sendMessage(
  receiverId: number,
  content: string,
  file?: File,
): Promise<BackendMessage> {
  if (file) {
    const formData = new FormData()
    formData.append("receiver", String(receiverId))
    formData.append("content", content)
    formData.append("attachment", file)
    return apiFetch<BackendMessage>("/api/chat/messages/", {
      method: "POST",
      body: formData,
    })
  }
  return apiFetch<BackendMessage>("/api/chat/messages/", {
    method: "POST",
    body: JSON.stringify({ receiver: receiverId, content }),
  })
}

// ---------- Blocking ----------

export async function blockUser(userId: number): Promise<void> {
  await apiFetch("/api/chat/block/", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  })
}

export async function unblockUser(userId: number): Promise<void> {
  await apiFetch(`/api/chat/block/?user_id=${userId}`, { method: "DELETE" })
}

export async function getBlockStatus(userId: number): Promise<BlockStatus> {
  return apiFetch<BlockStatus>(`/api/chat/block/status/?user_id=${userId}`)
}

// ---------- Unread counts ----------

export async function getUnreadCounts(): Promise<UnreadCount[]> {
  return apiFetch<UnreadCount[]>("/api/chat/unread_counts/")
}

// ---------- Shared media ----------

export async function getSharedMedia(userId: number): Promise<BackendMessage[]> {
  return apiFetch<BackendMessage[]>(`/api/chat/shared_media/?user_id=${userId}`)
}

export { ApiError }
