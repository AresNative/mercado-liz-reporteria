import { cn } from "@/utils/functions/cn"
import type React from "react"

interface BentoGridProps {
    className?: string
    cols?: number
    rows?: number
    children: React.ReactNode
}

export function BentoGrid({ className, cols = 6, rows, children }: BentoGridProps) {
    return (
        <div
            className={cn(
                "grid gap-4 p-4",
                // columnas dinámicas
                `grid-cols-1 md:grid-cols-${cols}`,
                // filas dinámicas si se definen
                rows ? `grid-rows-${rows}` : "auto-rows-[minmax(100px,auto)]",
                className
            )}
        >
            {children}
        </div>
    )
}

interface BentoItemProps {
    className?: string
    title?: string
    description?: string
    header?: React.ReactNode
    icon?: React.ReactNode
    children?: React.ReactNode
    colSpan?: number
    rowSpan?: number
}

export function BentoItem({
    className,
    title,
    description,
    header,
    icon,
    children,
    colSpan = 1,
    rowSpan = 1,
}: BentoItemProps) {
    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-xl border border-gray-200 bg-[var(--background)] p-4 transition-all hover:shadow-md",
                `md:col-span-${colSpan}`,
                `row-span-${rowSpan}`,
                className
            )}
        >
            {header && <div className="mb-2">{header}</div>}
            <div className="flex items-start gap-3">
                {icon && <div className="shrink-0 bg-gray-100 p-2 rounded-lg">{icon}</div>}
                <div className="space-y-2">
                    {title && <h3 className="font-semibold">{title}</h3>}
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
            </div>
            {children && <div className="mt-4">{children}</div>}
        </div>
    )
}
