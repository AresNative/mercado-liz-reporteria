import { cn } from "@/utils/functions/cn";
import React from "react";

// Tipos mejorados para valores responsivos
type Breakpoint = "sm" | "md" | "lg" | "xl";
type SpanValue = number | "auto" | "full";
interface ResponsiveValue {
    sm?: SpanValue;
    md?: SpanValue;
    lg?: SpanValue;
    xl?: SpanValue;
}

// 🔹 Utilidad mejorada para generar clases responsivas
function generateResponsiveClasses(
    base: string,
    values?: ResponsiveValue
): string {
    if (!values) return "";

    const breakpoints: Breakpoint[] = ["sm", "md", "lg", "xl"];

    const value = breakpoints
        .map((bp) => {
            const value = values[bp];
            if (!value) return "";

            const prefix = bp === "sm" ? "" : `${bp}:`;
            return `${prefix}${base}-${value}`;
        })
        .filter(Boolean)
        .join(" ");

    return value;
}

interface BentoGridProps {
    children: React.ReactNode;
    cols?: ResponsiveValue;
    rows?: ResponsiveValue;
}

export function BentoGrid({
    children,
    cols = { sm: 1, md: 3, lg: 6 },
    rows,
}: BentoGridProps) {

    const colSpanClasses = generateResponsiveClasses("grid-cols", cols);
    const rowSpanClasses = generateResponsiveClasses("grid-rows", rows);

    return (
        <div className={cn(
            "grid gap-4 p-4 grid-cols-1",
            colSpanClasses,
            rowSpanClasses
        )}>
            {children}
        </div>
    );
}

interface BentoItemProps {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
    children?: React.ReactNode;
    colSpan?: ResponsiveValue;
    rowSpan?: ResponsiveValue;
    minWidth?: string;
    as?: React.ElementType;
    href?: string;
    onClick?: () => void;
}

export function BentoItem({
    className,
    title,
    description,
    header,
    icon,
    children,
    colSpan = { sm: 1, md: 1, lg: 1 },
    rowSpan = { sm: 1, md: 1, lg: 1 },
    as: Tag = "div",
    href,
    onClick,
}: BentoItemProps) {
    const colSpanClasses = generateResponsiveClasses("col-span", colSpan);
    const rowSpanClasses = generateResponsiveClasses("row-span", rowSpan);

    const isInteractive = Tag !== "div" || !!onClick;
    const isLink = Tag === "a";
    const Element = isLink ? "a" : Tag;

    return (
        <Element
            href={href}
            onClick={onClick}
            className={cn(
                "relative flex flex-col gap-2 group",
                "text-gray-900 dark:text-white",
                "rounded-xl border border-gray-200 dark:border-gray-800",
                "bg-white dark:bg-gray-900 p-4",
                "transition-all duration-300 ease-in-out hover:-translate-y-0.5",
                "hover:shadow-md dark:hover:shadow-lg",
                "focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer",
                colSpanClasses,
                rowSpanClasses,
                className
            )}
            /* style={{ minWidth }} */
            role={isInteractive ? "button" : "gridcell"}
        /* {...(isLink ? { "aria-label": typeof title === 'string' ? title : undefined } : {})} */
        >
            {/* Efecto de iluminación */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"
                aria-hidden="true"
            />

            {/* Cabecera */}
            {header && (
                <div className="relative mb-2 overflow-hidden rounded-lg">
                    {header}d
                    <div
                        className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-70 group-hover:opacity-80 transition-opacity"
                        aria-hidden="true"
                    />
                </div>
            )}

            <div className="z-10 flex flex-col">
                <div className="flex items-start gap-2">
                    {icon && (
                        <div
                            className={cn(
                                "shrink-0 p-2 rounded-lg transition-all",
                                "bg-gray-100 dark:bg-gray-800",
                                {
                                    "group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105":
                                        isInteractive
                                }
                            )}
                            aria-hidden="true"
                        >
                            {icon}
                        </div>
                    )}

                    <div className="flex-1">
                        {title && (
                            <h3 className="font-semibold text-lg transition-colors group-hover:text-primary">
                                {title}
                            </h3>
                        )}
                        {description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 transition-opacity group-hover:opacity-90">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {children && (
                    <div className="mt-4 text-sm">
                        {children}
                    </div>
                )}
            </div>

            {/* Borde animado */}
            <div
                className="absolute inset-0 rounded-xl border border-transparent group-hover:border-primary/30 transition-all duration-700"
                aria-hidden="true"
            />
        </Element>
    );
}