"use client"

import { useEffect, useRef, useState } from "react"
import { Mic, Paperclip, Send, Smile, Square, X } from "lucide-react"
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

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

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

  const MAX_FILE_BYTES = 5 * 1024 * 1024 // matches backend DATA_UPLOAD_MAX_MEMORY_SIZE

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      alert("File is too large. Maximum size is 5 MB.")
      e.target.value = ""
      return
    }
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
        file,
      },
      replyTo: replyTarget ?? undefined,
    })
    e.target.value = ""
  }

  // Stop and clean up any active recording (mic + timer), without sending.
  const cleanupRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current)
      recordTimerRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    mediaRecorderRef.current = null
    audioChunksRef.current = []
    setIsRecording(false)
    setRecordSeconds(0)
  }

  // Always release the mic if the component unmounts mid-recording.
  useEffect(() => cleanupRecording, [])

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Voice recording isn't supported in this browser.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.start()
      setIsRecording(true)
      setRecordSeconds(0)
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1)
      }, 1000)
    } catch {
      alert("Couldn't access the microphone. Check your browser permissions.")
    }
  }

  const stopAndSendRecording = () => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      })
      const file = new File([blob], `voice-message-${Date.now()}.webm`, {
        type: blob.type,
      })
      const url = URL.createObjectURL(blob)
      const sizeKb = file.size / 1024
      const size =
        sizeKb > 1024
          ? `${(sizeKb / 1024).toFixed(1)} MB`
          : `${Math.max(1, Math.round(sizeKb))} KB`

      sendMessage("", {
        attachment: { type: "file", name: file.name, url, size, file },
        replyTo: replyTarget ?? undefined,
      })
      cleanupRecording()
    }
    recorder.stop()
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
    }
    cleanupRecording()
  }

  const formatRecordTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m}:${String(s).padStart(2, "0")}`
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

      {isRecording ? (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
          </span>
          <span className="text-sm font-medium text-destructive">
            Recording {formatRecordTime(recordSeconds)}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={cancelRecording}
              className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              onClick={stopAndSendRecording}
              className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              Send
            </button>
          </div>
        </div>
      ) : (
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

          {/* Mic or Send, depending on whether there's text */}
          {text.trim() ? (
            <button
              onClick={submit}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground transition-all duration-150 hover:opacity-90"
              aria-label="Send message"
            >
              <Send className="h-[18px] w-[18px]" />
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Record voice message"
            >
              <Mic className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
