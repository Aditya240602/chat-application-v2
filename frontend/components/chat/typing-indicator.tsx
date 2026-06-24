"use client"

import { Avatar } from "@/components/avatar"

export function TypingIndicator({
  name,
  color,
}: {
  name: string
  color: string
}) {
  return (
    <div className="flex items-end gap-2 animate-message-in">
      <Avatar name={name} color={color} size="sm" />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-bubble-in px-4 py-3">
        <span
          className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground"
          style={{ animationDelay: "200ms" }}
        />
        <span
          className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground"
          style={{ animationDelay: "400ms" }}
        />
      </div>
    </div>
  )
}
