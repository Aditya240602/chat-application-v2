"use client"

import { useState } from "react"
import { Download, FileText, Reply, SmilePlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatTime } from "@/lib/format"
import { Avatar } from "@/components/avatar"
import { ReadReceipt } from "./read-receipt"
import { useChat } from "@/context/chat-context"
import { QUICK_REACTIONS } from "@/lib/mock-data"
import type { Message } from "@/lib/types"

interface MessageBubbleProps {
  message: Message
  showAvatar: boolean
  isGroup: boolean
}

export function MessageBubble({
  message,
  showAvatar,
  isGroup,
}: MessageBubbleProps) {
  const { users, toggleReaction, setReplyTarget } = useChat()
  const [pickerOpen, setPickerOpen] = useState(false)
  const isMine = message.senderId === "me"
  const sender = users[message.senderId]

  const handleReply = () => {
    setReplyTarget({
      messageId: message.id,
      senderName: isMine ? "You" : (sender?.name ?? "Unknown"),
      text: message.attachment
        ? message.attachment.name
        : message.text || "Attachment",
    })
  }

  const actions = (
    <div
      className={cn(
        "relative flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
        isMine ? "order-first" : "",
      )}
    >
      <button
        onClick={() => setPickerOpen((p) => !p)}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="Add reaction"
      >
        <SmilePlus className="h-4 w-4" />
      </button>
      <button
        onClick={handleReply}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="Reply"
      >
        <Reply className="h-4 w-4" />
      </button>

      {pickerOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setPickerOpen(false)}
            aria-hidden="true"
          />
          <div
            className={cn(
              "absolute bottom-full z-20 mb-1 flex items-center gap-1 rounded-full border border-border bg-popover p-1 shadow-lg animate-message-in",
              isMine ? "right-0" : "left-0",
            )}
          >
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  toggleReaction(message.id, emoji)
                  setPickerOpen(false)
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-base transition-transform hover:scale-125 hover:bg-secondary"
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )

  return (
    <div
      className={cn(
        "group flex w-full items-end gap-2 animate-message-in",
        isMine ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar slot (received only) */}
      {!isMine && (
        <div className="w-8 shrink-0">
          {showAvatar && (
            <Avatar
              name={sender?.name ?? "?"}
              color={sender?.color ?? "#666"}
              size="sm"
            />
          )}
        </div>
      )}

      <div
        className={cn(
          "flex max-w-[78%] flex-col gap-1 sm:max-w-[68%]",
          isMine ? "items-end" : "items-start",
        )}
      >
        {isGroup && !isMine && showAvatar && (
          <span className="px-1 text-[11px] font-medium text-muted-foreground">
            {sender?.name}
          </span>
        )}

        <div
          className={cn(
            "flex items-end gap-1.5",
            isMine ? "flex-row-reverse" : "flex-row",
          )}
        >
          <div className="relative flex flex-col">
            {/* Reply preview */}
            {message.replyTo && (
              <div
                className={cn(
                  "mb-1 flex flex-col gap-0.5 rounded-lg border-l-2 border-brand bg-secondary/60 px-2.5 py-1.5 text-xs",
                  isMine ? "items-end text-right" : "items-start",
                )}
              >
                <span className="font-medium text-brand">
                  {message.replyTo.senderName}
                </span>
                <span className="line-clamp-1 text-muted-foreground">
                  {message.replyTo.text}
                </span>
              </div>
            )}

            <div
              className={cn(
                "relative rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                isMine
                  ? "rounded-br-md bg-brand text-brand-foreground"
                  : "rounded-bl-md bg-bubble-in text-bubble-in-foreground",
                message.attachment?.type === "image" && "overflow-hidden p-1",
              )}
            >
              {/* Image attachment */}
              {message.attachment?.type === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={message.attachment.url || "/placeholder.svg"}
                  alt={message.attachment.name}
                  className="max-h-72 w-full max-w-xs rounded-xl object-cover"
                />
              )}

              {/* File attachment (voice messages get a real audio player) */}
              {message.attachment?.type === "file" &&
                (message.attachment.name.startsWith("voice-message-") ? (
                  <div className="flex min-w-[220px] items-center gap-2 py-1">
                    <audio
                      controls
                      src={message.attachment.url}
                      className="h-9 w-full max-w-[260px]"
                    />
                  </div>
                ) : (
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-1 py-1",
                      isMine ? "" : "",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        isMine ? "bg-white/20" : "bg-brand/15 text-brand",
                      )}
                    >
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {message.attachment.name}
                      </p>
                      <p
                        className={cn(
                          "text-[11px]",
                          isMine ? "text-white/70" : "text-muted-foreground",
                        )}
                      >
                        {message.attachment.size}
                      </p>
                    </div>
                    <a
                      href={message.attachment.url}
                      download={message.attachment.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "ml-1 rounded-md p-1.5 transition-colors",
                        isMine
                          ? "hover:bg-white/20"
                          : "hover:bg-secondary text-muted-foreground",
                      )}
                      aria-label={`Download ${message.attachment.name}`}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                ))}

              {/* Text */}
              {message.text && (
                <p className="whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              )}

              {/* meta row for sender bubbles */}
              {isMine && (
                <span className="float-right ml-2 mt-1 flex translate-y-0.5 items-center gap-1 text-[10px] text-white/70">
                  {formatTime(message.timestamp)}
                  <ReadReceipt status={message.status} />
                </span>
              )}
            </div>

            {/* Reactions */}
            {message.reactions.length > 0 && (
              <div
                className={cn(
                  "z-[1] -mt-1.5 flex flex-wrap gap-1",
                  isMine ? "justify-end pr-1" : "justify-start pl-1",
                )}
              >
                {message.reactions.map((r) => {
                  const mine = r.by.includes("me")
                  return (
                    <button
                      key={r.emoji}
                      onClick={() => toggleReaction(message.id, r.emoji)}
                      className={cn(
                        "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] transition-colors",
                        mine
                          ? "border-brand/50 bg-brand/15 text-foreground"
                          : "border-border bg-popover text-foreground hover:bg-secondary",
                      )}
                    >
                      <span>{r.emoji}</span>
                      <span className="tabular-nums">{r.by.length}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {actions}
        </div>

        {/* timestamp on hover for received */}
        {!isMine && (
          <span className="px-1 text-[10px] text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>
    </div>
  )
}
