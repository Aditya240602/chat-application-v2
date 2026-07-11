"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Phone, PhoneOff, Video, X } from "lucide-react"

interface CallModalProps {
  conversationName: string
  conversationId: string
  mode: "audio" | "video"
  onClose: () => void
}

/**
 * Creates or retrieves a Daily.co room for this conversation,
 * then embeds their prebuilt iframe UI.
 *
 * Requires NEXT_PUBLIC_DAILY_API_KEY in your .env.local
 * Get a free key at https://dashboard.daily.co/signup → Developers
 */
export function CallModal({ conversationName, conversationId, mode, onClose }: CallModalProps) {
  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting")
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>("")
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const createOrGetRoom = useCallback(async () => {
    setStatus("connecting")
    setErrorMsg("")

    const apiKey = process.env.NEXT_PUBLIC_DAILY_API_KEY
    if (!apiKey) {
      setErrorMsg(
        "Daily.co API key not configured.\n\n" +
        "Add NEXT_PUBLIC_DAILY_API_KEY=<your-key> to frontend/.env.local\n" +
        "Get a free key at dashboard.daily.co/signup → Developers"
      )
      setStatus("error")
      return
    }

    const roomName = `pulse-${conversationId}`
    const exp = Math.floor(Date.now() / 1000) + 3600 // 1 hour

    // Try to create the room first
    let res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          exp,
          start_video_off: mode === "audio",
          start_audio_off: false,
          enable_screenshare: false,
        },
      }),
    })

    // 409 = room already exists — GET it instead
    if (res.status === 409) {
      res = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
    }

    if (!res.ok) {
      let msg = `Daily.co error ${res.status}`
      try {
        const body = await res.json()
        if (body.info) msg = body.info
      } catch { /* ignore */ }
      setErrorMsg(msg)
      setStatus("error")
      return
    }

    const data = await res.json()
    setRoomUrl(data.url)
    setStatus("connected")
  }, [conversationId, mode])

  useEffect(() => {
    createOrGetRoom()
  }, [createOrGetRoom])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const w = mode === "video" ? 720 : 420
  const h = mode === "video" ? 540 : 360

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 flex flex-col overflow-hidden rounded-2xl shadow-2xl"
        style={{ width: w, height: h }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between bg-zinc-900 px-4 py-3">
          <div className="flex items-center gap-2">
            {mode === "video"
              ? <Video className="h-4 w-4 text-blue-400" />
              : <Phone className="h-4 w-4 text-green-400" />
            }
            <span className="text-sm font-medium text-white">
              {mode === "video" ? "Video" : "Voice"} call · {conversationName}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
            aria-label="End call"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="relative flex-1 bg-zinc-950">
          {status === "connecting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              <p className="text-sm text-zinc-400">Starting call…</p>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
              <PhoneOff className="h-10 w-10 text-red-500" />
              <p className="whitespace-pre-line text-sm text-zinc-400">{errorMsg}</p>
              <button
                onClick={createOrGetRoom}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}

          {status === "connected" && roomUrl && (
            <iframe
              ref={iframeRef}
              src={roomUrl}
              allow="camera; microphone; autoplay; display-capture"
              className="h-full w-full border-0"
            />
          )}
        </div>

        {/* Footer only shown while not yet connected */}
        {status !== "connected" && (
          <div className="flex shrink-0 items-center justify-center gap-3 bg-zinc-900 py-3">
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
              aria-label="End call"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
