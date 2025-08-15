import { cn } from "@/utils/functions/cn"
import type React from "react"

interface BentoGridProps {
    className?: string
    children: React.ReactNode
    maxCols?: number // Máximo de columnas base (opcional)
}

export function BentoGrid({ className, children, maxCols = 6 }: BentoGridProps) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 gap-4 p-4",
                `sm:grid-cols-2`,
                `md:grid-cols-3`,
                `lg:grid-cols-${maxCols}`,
                className
            )}
        >
            {children}
        </div>
    )
}

interface BentoItemProps {
    className?: string
    title?: string | React.ReactNode
    description?: string | React.ReactNode
    header?: React.ReactNode
    icon?: React.ReactNode
    children?: React.ReactNode
    colSpan?: number // Ahora acepta cualquier número
    rowSpan?: number // Ahora acepta cualquier número
    minWidth?: string // Ancho mínimo personalizable (ej: "300px")
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
    minWidth = "250px"
}: BentoItemProps) {
    return (
        <div
            className={cn(
                "group relative h-full z-10 overflow-hidden text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-800 bg-[var(--background)] p-4 transition-all hover:shadow-md",
                className
            )}
            style={{
                gridColumn: `span ${colSpan}`,
                gridRow: `span ${rowSpan}`,
                minWidth: minWidth
            }}
        >
            {header && <div className="mb-2">{header}</div>}
            <div className="flex items-start gap-3">
                {icon && <div className="shrink-0 bg-gray-100 p-2 rounded-lg">{icon}</div>}
                <div className="space-y-2">
                    {title && <h3 className="font-semibold">{title}</h3>}
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
            </div>
            {children && <div className="mt-4 h-full z-20 overflow-auto">{children}</div>}
        </div>
    )
}