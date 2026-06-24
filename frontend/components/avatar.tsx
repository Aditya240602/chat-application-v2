"use client"

import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/format"
import type { PresenceStatus } from "@/lib/types"

interface AvatarProps {
  name: string
  color: string
  imageUrl?: string
  size?: "sm" | "md" | "lg" | "xl"
  status?: PresenceStatus
  showStatus?: boolean
  className?: string
}

const sizeMap = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-20 w-20 text-xl",
}

const dotSize = {
  sm: "h-2.5 w-2.5 ring-2",
  md: "h-3 w-3 ring-2",
  lg: "h-3.5 w-3.5 ring-2",
  xl: "h-5 w-5 ring-4",
}

export function Avatar({
  name,
  color,
  imageUrl,
  size = "md",
  status,
  showStatus = false,
  className,
}: AvatarProps) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-semibold text-white overflow-hidden select-none",
          sizeMap[size],
        )}
        style={imageUrl ? undefined : { backgroundColor: color }}
        aria-hidden={!!imageUrl}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          getInitials(name)
        )}
      </div>
      {showStatus && status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-[var(--surface)]",
            dotSize[size],
            status === "online"
              ? "bg-online"
              : status === "away"
                ? "bg-[#f59e0b]"
                : "bg-muted-foreground",
          )}
          aria-label={status}
        />
      )}
    </div>
  )
}
