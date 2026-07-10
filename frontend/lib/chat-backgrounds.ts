export interface ChatBackgroundOption {
  id: string
  label: string
  /** CSS `background` value. "none" falls back to the default surface color. */
  value: string
}

export const CHAT_BACKGROUNDS: ChatBackgroundOption[] = [
  { id: "none", label: "Default", value: "none" },
  { id: "midnight", label: "Midnight", value: "linear-gradient(135deg, #0f172a, #1e293b)" },
  { id: "ocean", label: "Ocean", value: "linear-gradient(135deg, #082f49, #0c4a6e)" },
  { id: "forest", label: "Forest", value: "linear-gradient(135deg, #14532d, #166534)" },
  { id: "sunset", label: "Sunset", value: "linear-gradient(135deg, #7c2d12, #9a3412)" },
  { id: "plum", label: "Plum", value: "linear-gradient(135deg, #3b0764, #581c87)" },
  { id: "slate", label: "Slate", value: "#1e1e1e" },
  { id: "charcoal", label: "Charcoal", value: "#18181b" },
]
