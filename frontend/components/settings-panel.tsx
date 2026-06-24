"use client"

import { useState } from "react"
import { Moon, Sun, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/avatar"
import { useChat } from "@/context/chat-context"

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150",
        checked ? "bg-brand" : "bg-secondary",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-150",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  )
}

export function SettingsPanel() {
  const {
    settingsOpen,
    setSettingsOpen,
    theme,
    toggleTheme,
    settings,
    updateSettings,
    currentUser,
  } = useChat()
  const [name, setName] = useState(currentUser.name)
  const [role, setRole] = useState(currentUser.role ?? "")

  if (!settingsOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-message-in"
        onClick={() => setSettingsOpen(false)}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl animate-message-in">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Settings</h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="scrollbar-thin max-h-[70vh] space-y-6 overflow-y-auto p-5">
          {/* Profile editing */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Profile
            </h3>
            <div className="flex items-center gap-4">
              <Avatar
                name={name || currentUser.name}
                color={currentUser.color}
                size="lg"
              />
              <div className="flex-1 space-y-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Display name"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-brand/50"
                />
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Status / role"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-brand/50"
                />
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Appearance
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => theme !== "light" && toggleTheme()}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border py-3 text-sm transition-colors",
                  theme === "light"
                    ? "border-brand bg-brand/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-brand/40",
                )}
              >
                <Sun className="h-4 w-4" /> Light
              </button>
              <button
                onClick={() => theme !== "dark" && toggleTheme()}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border py-3 text-sm transition-colors",
                  theme === "dark"
                    ? "border-brand bg-brand/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-brand/40",
                )}
              >
                <Moon className="h-4 w-4" /> Dark
              </button>
            </div>
          </section>

          {/* Notifications */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notifications
            </h3>
            <div className="space-y-1">
              {[
                {
                  key: "notifications" as const,
                  label: "Push notifications",
                  desc: "Get notified about new messages",
                },
                {
                  key: "sounds" as const,
                  label: "Message sounds",
                  desc: "Play a sound on new messages",
                },
                {
                  key: "readReceipts" as const,
                  label: "Read receipts",
                  desc: "Let others know when you've read",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4 rounded-lg px-1 py-2.5"
                >
                  <div>
                    <p className="text-sm">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                  <Toggle
                    label={item.label}
                    checked={settings[item.key]}
                    onChange={(v) => updateSettings({ [item.key]: v })}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button
            onClick={() => setSettingsOpen(false)}
            className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => setSettingsOpen(false)}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}
