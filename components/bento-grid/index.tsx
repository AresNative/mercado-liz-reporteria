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
    loading?: boolean
}

export function BentoGrid({ className, cols = 6, rows, children, loading = false }: BentoGridProps) {
    // Si está cargando, mostramos skeleton grid
    if (loading) {
        return (
            <div className={cn(
                "grid gap-4 p-4",
                "grid-cols-1",
                colClasses[cols] ?? colClasses[6],
                rows ? rowClasses[rows] : "auto-rows-[minmax(120px,auto)]",
                className
            )}>
                {/* Mostramos 4 items de skeleton por defecto */}
                {Array.from({ length: 4 }).map((_, index) => (
                    <BentoItemSkeleton key={index} colSpan={1} rowSpan={1} />
                ))}
            </div>
        )
    }

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
    iconRight?: boolean
    children?: React.ReactNode
    colSpan?: number
    rowSpan?: number
    loading?: boolean
}

export function BentoItem({
    className,
    title,
    description,
    header,
    icon,
    iconRight,
    children,
    colSpan = 1,
    rowSpan = 1,
    loading = false,
}: BentoItemProps) {
    // Si está cargando, mostramos el skeleton
    if (loading) {
        return <BentoItemSkeleton className={className} colSpan={colSpan} rowSpan={rowSpan} />
    }

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

            {iconRight ? (
                // Layout cuando iconRight es true: icono a la derecha sin fondo
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                        {title && <h3 className="font-semibold">{title}</h3>}
                        {description && <p className="text-sm text-muted-foreground">{description}</p>}
                    </div>
                    {icon && <div className="shrink-0">{icon}</div>}
                </div>
            ) : (
                // Layout original cuando iconRight es false o undefined
                <div className="flex items-start gap-3">
                    {icon && <div className="shrink-0">{icon}</div>}
                    <div className="space-y-2">
                        {title && <h3 className="font-semibold">{title}</h3>}
                        {description && <p className="text-sm text-muted-foreground">{description}</p>}
                    </div>
                </div>
            )}

            {children && <div className="mt-4">{children}</div>}
        </div>
    )
}

// Componente Skeleton para BentoItem
interface BentoItemSkeletonProps {
    className?: string
    colSpan?: number
    rowSpan?: number
}

function BentoItemSkeleton({ className, colSpan = 1, rowSpan = 1 }: BentoItemSkeletonProps) {
    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-xl border border-gray-200 bg-[var(--background)] p-4 animate-pulse",
                colSpanClasses[colSpan] ?? "sm:col-span-1",
                rowSpanClasses[rowSpan] ?? "row-span-1",
                className
            )}
        >
            {/* Skeleton para el header (si existe) */}
            <div className="mb-2 h-4 w-20 bg-gray-300 dark:bg-zinc-700 rounded"></div>

            {/* Layout del contenido skeleton */}
            <div className="flex items-start gap-3">
                {/* Icon skeleton */}
                <div className="shrink-0">
                    <div className="h-8 w-8 bg-gray-300 dark:bg-zinc-700 rounded-full"></div>
                </div>

                {/* Texto skeleton */}
                <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-gray-300 dark:bg-zinc-700 rounded"></div>
                    <div className="h-3 w-full bg-gray-300 dark:bg-zinc-700 rounded"></div>
                    <div className="h-3 w-2/3 bg-gray-300 dark:bg-zinc-700 rounded"></div>
                </div>
            </div>

            {/* Children skeleton */}
            <div className="mt-4 space-y-2">
                <div className="h-3 w-full bg-gray-300 dark:bg-zinc-700 rounded"></div>
                <div className="h-3 w-5/6 bg-gray-300 dark:bg-zinc-700 rounded"></div>
                <div className="h-3 w-4/6 bg-gray-300 dark:bg-zinc-700 rounded"></div>
            </div>
        </div>
    )
}

// Componente BentoGridSkeleton si necesitas usarlo separadamente
interface BentoGridSkeletonProps {
    className?: string
    cols?: number
    rows?: number
    itemCount?: number
}

export function BentoGridSkeleton({
    className,
    cols = 6,
    rows,
    itemCount = 4
}: BentoGridSkeletonProps) {
    return (
        <div className={cn(
            "grid gap-4 p-4",
            "grid-cols-1",
            colClasses[cols] ?? colClasses[6],
            rows ? rowClasses[rows] : "auto-rows-[minmax(120px,auto)]",
            className
        )}>
            {Array.from({ length: itemCount }).map((_, index) => (
                <BentoItemSkeleton key={index} colSpan={1} rowSpan={1} />
            ))}
        </div>
    )
}