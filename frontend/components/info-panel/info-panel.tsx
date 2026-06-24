"use client"

import { Bell, Image as ImageIcon, Star, Users, X } from "lucide-react"
import { Avatar } from "@/components/avatar"
import { useChat } from "@/context/chat-context"
import { MUTUAL_GROUPS, SHARED_MEDIA } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export function InfoPanelContent({ onClose }: { onClose?: () => void }) {
  const { activeConversation, users } = useChat()
  if (!activeConversation) return null

  const user = activeConversation.isGroup
    ? undefined
    : users[activeConversation.participantId]
  const media = SHARED_MEDIA.default
  const subtitle = activeConversation.isGroup
    ? `${activeConversation.members?.length ?? 0} members`
    : (user?.role ?? "")

  return (
    <div className="scrollbar-thin flex h-full flex-col overflow-y-auto">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold">Details</span>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close details"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Profile */}
      <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
        <Avatar
          name={activeConversation.name}
          color={activeConversation.color}
          size="xl"
          status={activeConversation.status}
          showStatus={!activeConversation.isGroup}
        />
        <div>
          <h3 className="text-base font-semibold">{activeConversation.name}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {user?.bio && (
          <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
            {user.bio}
          </p>
        )}
        {!activeConversation.isGroup && (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
              activeConversation.status === "online"
                ? "bg-online/10 text-online"
                : "bg-secondary text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                activeConversation.status === "online"
                  ? "bg-online"
                  : "bg-muted-foreground",
              )}
            />
            {activeConversation.status === "online"
              ? "Online"
              : activeConversation.status === "away"
                ? "Away"
                : "Offline"}
          </span>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        {[
          { icon: Bell, label: "Mute" },
          { icon: Star, label: "Star" },
          { icon: Users, label: "Invite" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-surface py-3 text-[11px] text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground"
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Shared media */}
      <div className="px-4 pb-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold">
            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
            Shared Media
          </h4>
          <button className="text-[11px] text-brand transition-opacity hover:opacity-80">
            See all
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {media.map((m) => (
            <button
              key={m.id}
              className="group relative aspect-square overflow-hidden rounded-lg bg-secondary"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url || "/placeholder.svg"}
                alt={m.alt}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Mutual groups */}
      <div className="px-4 pb-6">
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          Mutual Groups
        </h4>
        <div className="space-y-1">
          {MUTUAL_GROUPS.map((g) => (
            <button
              key={g.id}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-secondary/60"
            >
              <Avatar name={g.name} color={g.color} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{g.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {g.members} members
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function InfoPanel() {
  const { rightPanelOpen } = useChat()
  return (
    <aside
      className={cn(
        "hidden shrink-0 border-l border-border bg-surface transition-[width] duration-200 ease-in-out lg:block",
        rightPanelOpen ? "w-[280px]" : "w-0 overflow-hidden border-l-0",
      )}
    >
      {rightPanelOpen && (
        <div className="h-full w-[280px]">
          <InfoPanelContent />
        </div>
      )}
    </aside>
  )
}
