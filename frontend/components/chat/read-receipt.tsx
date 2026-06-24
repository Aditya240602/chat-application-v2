import { Check, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MessageStatus } from "@/lib/types"

export function ReadReceipt({ status }: { status: MessageStatus }) {
  if (status === "sent") {
    return <Check className="h-3.5 w-3.5 text-white/70" aria-label="Sent" />
  }
  return (
    <CheckCheck
      className={cn(
        "h-3.5 w-3.5",
        status === "read" ? "text-[#bcd6ff]" : "text-white/70",
      )}
      aria-label={status === "read" ? "Read" : "Delivered"}
    />
  )
}
