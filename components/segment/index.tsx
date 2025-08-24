"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
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

const sizeStyles: Record<Size, { button: string; label: string; groupPadding: string }> = {
    sm: { button: "h-8 px-2.5 rounded-md", label: "text-xs", groupPadding: "p-1" },
    md: { button: "h-10 px-3 rounded-md", label: "text-sm", groupPadding: "p-1" },
    lg: { button: "h-12 px-4 rounded-md", label: "text-base", groupPadding: "p-1.5" },
}

const indicatorByAccent: Record<Accent, string> = {
    emerald: "bg-green-500/12 ring-1 ring-green-500/30",
    violet: "bg-violet-500/12 ring-1 ring-violet-500/30",
    rose: "bg-rose-500/12 ring-1 ring-rose-500/30",
    amber: "bg-amber-500/14 ring-1 ring-amber-500/30",
    slate: "bg-slate-500/14 ring-1 ring-slate-500/30",
}

const focusRingByAccent: Record<Accent, string> = {
    emerald: "focus-visible:ring-emerald-500",
    violet: "focus-visible:ring-violet-500",
    rose: "focus-visible:ring-rose-500",
    amber: "focus-visible:ring-amber-500",
    slate: "focus-visible:ring-slate-500",
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
            // select focused (current selectedIndex)
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
                "inline-flex items-center rounded-md bg-zinc-100 inset-shadow-sm backdrop-blur supports-[backdrop-filter]:bg-zinc-100/40 dark:border-zinc-700 dark:bg-zinc-900/40",
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
                            "relative isolate whitespace-nowrap outline-none transition-colors",
                            "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50",
                            "focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-zinc-950",
                            focusRingByAccent[accent],
                            sizeConf.button,
                            fullWidth ? "flex-1" : "",
                        )}
                    >
                        <AnimatePresence>
                            {isSelected && (
                                <motion.span
                                    layoutId="segmented-indicator"
                                    className={cn("absolute inset-0 z-0", "rounded-md shadow-sm", indicatorByAccent[accent])}
                                    transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 35,
                                        mass: 0.6,
                                    }}
                                />
                            )}
                        </AnimatePresence>
                        <span className={cn("relative z-10 flex items-center justify-center gap-2", sizeConf.label)}>
                            {Icon ? <Icon className={cn("size-4", isSelected ? "opacity-100" : "opacity-80")} /> : null}
                            <span>{item.label}</span>
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

export default Segment
