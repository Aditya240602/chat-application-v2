"use client"

import { ChatHeader } from "./chat-header"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"

export function ChatPanel() {
  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-background">
      <ChatHeader />
      <MessageList />
      <MessageInput />
    </section>
  )
}
