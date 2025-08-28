"use client"

import React from "react"
import { cn } from "@/utils/functions/cn"

// 🔹 Generar clases de columnas válidas por breakpoint
const colClasses: Record<number, string> = {
    1: "sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1",
    2: "sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2",
    3: "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3",
    4: "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4",
    5: "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
    6: "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
    12: "sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12",
}

// 🔹 Generar clases de filas válidas
const rowClasses: Record<number, string> = {
    1: "grid-rows-1",
    2: "grid-rows-2",
    3: "grid-rows-3",
    4: "grid-rows-4",
    5: "grid-rows-5",
    6: "grid-rows-6",
    7: "grid-rows-7",
    8: "grid-rows-8",
    9: "grid-rows-9",
    10: "grid-rows-10",
}

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
                "grid-cols-1", // fallback mobile
                colClasses[cols] ?? colClasses[6],
                rows ? rowClasses[rows] : "auto-rows-[minmax(120px,auto)]",
                className
            )}
        >
            {children}
        </div>
    )
}

// 🔹 Span por columnas (ahora también responsivo)
const colSpanClasses: Record<number, string> = {
    1: "sm:col-span-1 md:col-span-1",
    2: "sm:col-span-2 md:col-span-2",
    3: "sm:col-span-2 md:col-span-3",
    4: "sm:col-span-2 md:col-span-4",
    6: "sm:col-span-2 md:col-span-6",
    12: "sm:col-span-2 md:col-span-12",
}

// 🔹 Span por filas
const rowSpanClasses: Record<number, string> = {
    1: "row-span-1",
    2: "row-span-2",
    3: "row-span-3",
    4: "row-span-4",
    5: "row-span-5",
    6: "row-span-6",
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
                colSpanClasses[colSpan] ?? "sm:col-span-1",
                rowSpanClasses[rowSpan] ?? "row-span-1",
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
