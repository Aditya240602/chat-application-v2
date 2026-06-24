"use client"

import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/sidebar/sidebar"
import { ChatPanel } from "@/components/chat/chat-panel"
import { InfoPanel, InfoPanelContent } from "@/components/info-panel/info-panel"
import { SearchOverlay } from "@/components/search-overlay"
import { SettingsPanel } from "@/components/settings-panel"
import { useChat } from "@/context/chat-context"

export function AppShell() {
  const {
    mobileSidebarOpen,
    setMobileSidebarOpen,
    rightPanelOpen,
    setRightPanelOpen,
  } = useChat()

  // Collapse the info panel on small screens at first load
  useEffect(() => {
    if (window.innerWidth < 1024) setRightPanelOpen(false)
  }, [setRightPanelOpen])

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          mobileSidebarOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileSidebarOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
            mobileSidebarOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileSidebarOpen(false)}
        />
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-[82%] max-w-[320px] shadow-2xl transition-transform duration-200 ease-out",
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar />
        </div>
      </div>

      {/* Main chat */}
      <ChatPanel />

      {/* Desktop info panel */}
      <InfoPanel />

      {/* Mobile / tablet info panel modal */}
      {rightPanelOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-message-in"
            onClick={() => setRightPanelOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 h-full w-[88%] max-w-[340px] border-l border-border bg-surface shadow-2xl animate-message-in">
            <InfoPanelContent onClose={() => setRightPanelOpen(false)} />
          </div>
        </div>
      )}

      {/* Global overlays */}
      <SearchOverlay />
      <SettingsPanel />
    </div>
  )
}
