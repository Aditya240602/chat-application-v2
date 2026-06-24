"use client"

import { useEffect, useRef, useState } from "react"
import { Paperclip, Send, Smile, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useChat } from "@/context/chat-context"

const EMOJIS = [
  "😀","😂","😅","😍","🥰","😎","🤔","😴","😭","😡",
  "👍","👎","👏","🙏","🔥","🎉","❤️","💙","✅","❌",
  "🚀","✨","💡","📌","📎","☕","🐛","💯","👀","🤯",
]

export function MessageInput() {
  const { sendMessage, replyTarget, setReplyTarget, activeConversationId } =
    useChat()
  const [text, setText] = useState("")
  const [emojiOpen, setEmojiOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // reset on conversation switch
  useEffect(() => {
    setText("")
    setEmojiOpen(false)
  }, [activeConversationId])

  // auto-grow up to ~5 lines
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    const max = 24 * 5 + 16
    el.style.height = `${Math.min(el.scrollHeight, max)}px`
  }, [text])

  const submit = () => {
    if (!text.trim()) return
    sendMessage(text, { replyTo: replyTarget ?? undefined })
    setText("")
    setEmojiOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isImage = file.type.startsWith("image/")
    const url = isImage ? URL.createObjectURL(file) : undefined
    const sizeKb = file.size / 1024
    const size =
      sizeKb > 1024
        ? `${(sizeKb / 1024).toFixed(1)} MB`
        : `${Math.max(1, Math.round(sizeKb))} KB`
    sendMessage("", {
      attachment: {
        type: isImage ? "image" : "file",
        name: file.name,
        url,
        size,
      },
      replyTo: replyTarget ?? undefined,
    })
    e.target.value = ""
  }

  return (
    <div className="border-t border-border bg-surface px-3 py-3 sm:px-4">
      {/* Reply preview */}
      {replyTarget && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-brand bg-secondary/50 px-3 py-2 animate-message-in">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-brand">
              Replying to {replyTarget.senderName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {replyTarget.text}
            </p>
          </div>
          <button
            onClick={() => setReplyTarget(null)}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Cancel reply"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="relative flex items-end gap-2">
        {/* Attach */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFile}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* Emoji */}
        <div className="relative">
          <button
            onClick={() => setEmojiOpen((o) => !o)}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-secondary hover:text-foreground",
              emojiOpen ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
            aria-label="Insert emoji"
          >
            <Smile className="h-5 w-5" />
          </button>
          {emojiOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setEmojiOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute bottom-full left-0 z-20 mb-2 grid w-64 grid-cols-8 gap-1 rounded-xl border border-border bg-popover p-2 shadow-xl animate-message-in">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setText((t) => t + emoji)
                      textareaRef.current?.focus()
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-lg transition-transform hover:scale-125 hover:bg-secondary"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Textarea */}
        <div className="flex flex-1 items-end rounded-2xl border border-border bg-background px-3 py-1.5 transition-colors focus-within:border-brand/50">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message…"
            className="scrollbar-thin max-h-32 w-full resize-none bg-transparent py-1 text-sm leading-6 outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Send */}
        <button
          onClick={submit}
          disabled={!text.trim()}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-150",
            text.trim()
              ? "bg-brand text-brand-foreground hover:opacity-90"
              : "bg-secondary text-muted-foreground",
          )}
          aria-label="Send message"
        >
          <Send className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  )
}
