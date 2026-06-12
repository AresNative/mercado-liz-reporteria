"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/utils/functions/cn"

type SegmentItem = {
    value: string
    label: string
    icon?: LucideIcon
    disabled?: boolean
}

type Size = "sm" | "md" | "lg"
type Accent = "emerald" | "violet" | "rose" | "amber" | "slate"

export interface SegmentProps {
    items?: SegmentItem[]
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    className?: string
    size?: Size
    accent?: Accent
    fullWidth?: boolean
    "aria-label"?: string
    disabled?: boolean
}

const sizeStyles: Record<Size, { button: string; groupPadding: string }> = {
    sm: { button: "px-3 py-1.5 text-xs rounded-full", groupPadding: "p-1" },
    md: { button: "px-4 py-2 text-sm rounded-full", groupPadding: "p-1" },
    lg: { button: "px-5 py-2.5 text-base rounded-full", groupPadding: "p-1.5" },
}

const selectedBgByAccent: Record<Accent, string> = {
    emerald: "bg-emerald-600 text-white",
    violet: "bg-violet-600 text-white",
    rose: "bg-rose-600 text-white",
    amber: "bg-amber-600 text-white",
    slate: "bg-slate-600 text-white",
}

const focusRingByAccent: Record<Accent, string> = {
    emerald: "focus-visible:ring-emerald-600",
    violet: "focus-visible:ring-violet-600",
    rose: "focus-visible:ring-rose-600",
    amber: "focus-visible:ring-amber-600",
    slate: "focus-visible:ring-slate-600",
}

export function Segment({
    items = [
        { value: "general", label: "General" },
        { value: "analytics", label: "Analytics" },
        { value: "billing", label: "Billing" },
    ],
    value,
    defaultValue,
    onValueChange,
    className,
    size = "md",
    accent = "emerald",
    fullWidth = false,
    "aria-label": ariaLabel = "Segmented control",
    disabled = false,
}: SegmentProps) {
    const isControlled = value !== undefined
    const initial = defaultValue ?? items[0]?.value
    const [internalValue, setInternalValue] = React.useState<string | undefined>(initial)
    const selectedValue = isControlled ? value : internalValue

    const buttonsRef = React.useRef<(HTMLButtonElement | null)[]>([])

    const setSelected = (next: string) => {
        if (!isControlled) setInternalValue(next)
        onValueChange?.(next)
    }

    const selectedIndex = Math.max(
        0,
        items.findIndex((i) => i.value === selectedValue),
    )

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (disabled || items.length === 0) return
        let nextIndex = selectedIndex
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault()
            for (let step = 1; step <= items.length; step++) {
                const candidate = (selectedIndex + step) % items.length
                if (!items[candidate]?.disabled) {
                    nextIndex = candidate
                    break
                }
            }
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault()
            for (let step = 1; step <= items.length; step++) {
                const candidate = (selectedIndex - step + items.length) % items.length
                if (!items[candidate]?.disabled) {
                    nextIndex = candidate
                    break
                }
            }
        } else if (e.key === "Home") {
            e.preventDefault()
            for (let i = 0; i < items.length; i++) {
                if (!items[i]?.disabled) {
                    nextIndex = i
                    break
                }
            }
        } else if (e.key === "End") {
            e.preventDefault()
            for (let i = items.length - 1; i >= 0; i--) {
                if (!items[i]?.disabled) {
                    nextIndex = i
                    break
                }
            }
        } else if (e.key === " " || e.key === "Enter") {
            e.preventDefault()
            const current = items[selectedIndex]
            if (current && !current.disabled) setSelected(current.value)
            return
        } else {
            return
        }

        const nextItem = items[nextIndex]
        if (nextItem && !nextItem.disabled) {
            setSelected(nextItem.value)
            requestAnimationFrame(() => {
                buttonsRef.current[nextIndex]?.focus()
            })
        }
    }

    if (!items || items.length === 0) return null

    const sizeConf = sizeStyles[size]

    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            aria-disabled={disabled ? "true" : "false"}
            onKeyDown={handleKeyDown}
            className={cn(
                "inline-flex items-center gap-1",
                sizeConf.groupPadding,
                fullWidth && "w-full",
                className,
            )}
        >
            {items.map((item, idx) => {
                const isSelected = item.value === selectedValue
                const Icon = item.icon
                return (
                    <button
                        key={item.value}
                        role="radio"
                        aria-checked={isSelected ? "true" : "false"}
                        aria-label={item.label}
                        disabled={disabled || item.disabled}
                        tabIndex={isSelected ? 0 : -1}
                        onClick={() => !disabled && !item.disabled && setSelected(item.value)}
                        className={cn(
                            "cursor-pointer whitespace-nowrap font-medium outline-none transition-colors",
                            "focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-gray-200 dark:ring-offset-zinc-950",
                            focusRingByAccent[accent],
                            sizeConf.button,
                            fullWidth ? "flex-1" : "",
                            isSelected
                                ? selectedBgByAccent[accent]
                                : "bg-zinc-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
                            (disabled || item.disabled) && "opacity-50 cursor-not-allowed",
                        )}
                    >
                        <span className="flex items-center justify-center gap-2">
                            {Icon ? <Icon className="size-4" /> : null}
                            <span>{item.label}</span>
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

export default Segment