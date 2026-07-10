"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import {
  clearTokens,
  getCurrentUser,
  isAuthenticated,
  login as apiLogin,
  type BackendUser,
} from "@/lib/api"

interface AuthContextValue {
  user: BackendUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BackendUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function init() {
      if (!isAuthenticated()) {
        setLoading(false)
        return
      }
      try {
        const me = await getCurrentUser()
        setUser(me)
      } catch {
        // token invalid/expired and refresh failed — apiFetch already
        // cleared tokens and will redirect, but guard here too.
        clearTokens()
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const login = useCallback(
    async (username: string, password: string) => {
      await apiLogin(username, password)
      const me = await getCurrentUser()
      setUser(me)
      router.push("/")
    },
    [router],
  )

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    router.push("/login")
  }, [router])

  const refreshUser = useCallback(async () => {
    try {
      const me = await getCurrentUser()
      setUser(me)
    } catch {
      // If this fails the token is likely invalid; apiFetch's 401 handling
      // will already have redirected to /login.
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}