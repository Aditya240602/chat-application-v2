"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { register as apiRegister, ApiError } from "@/lib/api"

type Mode = "login" | "register"

export default function LoginPage() {
  const { login } = useAuth()
  const [mode, setMode] = useState<Mode>("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === "register") {
        await apiRegister(username, password, email)
        // Registration succeeded — log straight in with the same credentials.
        await login(username, password)
      } else {
        await login(username, password)
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const detail =
          (err.body as { detail?: string } | null)?.detail ??
          JSON.stringify(err.body)
        setError(detail || "Something went wrong.")
      } else {
        setError("Could not reach the server. Is the backend running?")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="dark relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Ambient gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-30 blur-[120px] bg-brand-gradient"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-160px] right-[-120px] h-[360px] w-[360px] rounded-full opacity-20 blur-[100px] bg-brand-gradient"
      />

      <div className="glass relative w-full max-w-sm rounded-2xl p-8 shadow-2xl animate-message-in">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-sm font-bold text-white glow-brand">
            P
          </div>
          <span className="font-heading text-lg font-semibold tracking-tight">
            Pulse
          </span>
        </div>

        <h1 className="mb-1.5 font-heading text-2xl font-bold tracking-tight">
          {mode === "login" ? "Welcome back" : "Create an account"}
        </h1>
        <p className="mb-7 text-sm text-muted-foreground">
          {mode === "login"
            ? "Sign in to continue to Pulse."
            : "Sign up to start chatting."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="rounded-xl border border-border bg-input/60 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-[var(--brand-to)]"
          />
          {mode === "register" && (
            <input
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-border bg-input/60 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-[var(--brand-to)]"
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-xl border border-border bg-input/60 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-[var(--brand-to)]"
          />

          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-3 rounded-xl bg-brand-gradient px-3 py-2.5 text-sm font-semibold text-white transition-transform duration-150 glow-brand hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100"
          >
            {submitting
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setError(null)
            setMode((m) => (m === "login" ? "register" : "login"))
          }}
          className="mt-5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {mode === "login"
            ? "Need an account? "
            : "Already have an account? "}
          <span className="text-brand-gradient font-medium">
            {mode === "login" ? "Register" : "Sign in"}
          </span>
        </button>
      </div>
    </div>
  )
}