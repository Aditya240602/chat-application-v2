"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { ChatProvider } from "@/context/chat-context"
import { AppShell } from "@/components/app-shell"

export default function Page() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!user) {
    // Redirect is in flight; render nothing to avoid a flash of the chat UI.
    return null
  }

  return (
    <ChatProvider>
      <AppShell />
    </ChatProvider>
  )
}
