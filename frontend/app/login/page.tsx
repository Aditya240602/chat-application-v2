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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            P
          </div>
          <span className="text-lg font-semibold">Pulse</span>
        </div>

        <h1 className="mb-1 text-xl font-semibold">
          {mode === "login" ? "Welcome back" : "Create an account"}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
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
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          {mode === "register" && (
            <input
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
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
          className="mt-4 text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "login"
            ? "Need an account? Register"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  )
}
