import { cn } from "@/utils/functions/cn"
import type React from "react"

interface BentoGridProps {
    className?: string
    children: React.ReactNode
}

export function BentoGrid({ className, children }: BentoGridProps) {
    return <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 p-4", className)}>{children}</div>
}

interface BentoItemProps {
    className?: string
    title?: string
    description?: string
    header?: React.ReactNode
    icon?: React.ReactNode
    children?: React.ReactNode
    colSpan?: 1 | 2 | 3
    rowSpan?: 1 | 2 | 3
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
                "group relative overflow-hidden rounded-xl border bg-white p-4 transition-all hover:shadow-md",
                colSpan === 1 ? "md:col-span-1" : colSpan === 2 ? "md:col-span-2" : "md:col-span-3",
                rowSpan === 1 ? "row-span-1" : rowSpan === 2 ? "row-span-2" : "row-span-3",
                className,
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

