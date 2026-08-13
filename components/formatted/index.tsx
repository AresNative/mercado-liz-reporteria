"use client";

import React from "react";

interface FormattedTextProps {
    text?: string | null;
    className?: string;
}

/**
 * Renderiza el markdown ligero que genera la barra de herramientas de
 * TextAreaComponent: **negrita**, *itálica*, `código`, ```bloques de código```,
 * listas (- / 1.), citas (>) y enlaces [texto](url).
 *
 * Se implementa a mano (sin librerías externas tipo react-markdown) porque
 * solo necesitamos soportar exactamente la sintaxis que el editor produce.
 */
export function FormattedText({ text, className = "" }: FormattedTextProps) {
    if (!text) return null;

    return <div className={className}>{parseBlocks(text)}</div>;
}

// --- Bloques (código, cita, listas, párrafos) ---
function parseBlocks(text: string): React.ReactNode[] {
    const lines = text.split("\n");
    const nodes: React.ReactNode[] = [];
    let i = 0;
    let key = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Línea vacía: separador entre bloques
        if (line.trim() === "") {
            i++;
            continue;
        }

        // Bloque de código ```...```
        if (line.trim().startsWith("```")) {
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // saltar la línea de cierre ```
            nodes.push(
                <pre
                    key={key++}
                    className="bg-gray-100 dark:bg-zinc-900 rounded-md p-3 overflow-x-auto text-sm my-2"
                >
                    <code>{codeLines.join("\n")}</code>
                </pre>
            );
            continue;
        }

        // Cita >
        if (line.trim().startsWith(">")) {
            const quoteLines: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith(">")) {
                quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
                i++;
            }
            nodes.push(
                <blockquote
                    key={key++}
                    className="border-l-4 border-gray-300 dark:border-zinc-600 pl-3 italic text-gray-600 dark:text-gray-300 my-2"
                >
                    {quoteLines.map((q, idx) => (
                        <p key={idx}>{parseInline(q)}</p>
                    ))}
                </blockquote>
            );
            continue;
        }

        // Lista no ordenada
        if (/^\s*-\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
                items.push(lines[i].replace(/^\s*-\s+/, ""));
                i++;
            }
            nodes.push(
                <ul key={key++} className="list-disc list-inside my-2 space-y-1">
                    {items.map((it, idx) => (
                        <li key={idx}>{parseInline(it)}</li>
                    ))}
                </ul>
            );
            continue;
        }

        // Lista ordenada
        if (/^\s*\d+\.\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
                items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
                i++;
            }
            nodes.push(
                <ol key={key++} className="list-decimal list-inside my-2 space-y-1">
                    {items.map((it, idx) => (
                        <li key={idx}>{parseInline(it)}</li>
                    ))}
                </ol>
            );
            continue;
        }

        // Párrafo normal: agrupa líneas seguidas hasta la próxima línea en blanco
        // o el inicio de otro tipo de bloque
        const paragraphLines: string[] = [line];
        i++;
        while (
            i < lines.length &&
            lines[i].trim() !== "" &&
            !lines[i].trim().startsWith("```") &&
            !lines[i].trim().startsWith(">") &&
            !/^\s*-\s+/.test(lines[i]) &&
            !/^\s*\d+\.\s+/.test(lines[i])
        ) {
            paragraphLines.push(lines[i]);
            i++;
        }
        nodes.push(
            <p key={key++} className="my-1">
                {paragraphLines.map((l, idx) => (
                    <React.Fragment key={idx}>
                        {idx > 0 && <br />}
                        {parseInline(l)}
                    </React.Fragment>
                ))}
            </p>
        );
    }

    return nodes;
}

// --- Inline (negrita, itálica, código, enlaces) ---
function parseInline(text: string): React.ReactNode[] {
    // Orden de prioridad dentro de la misma alternancia: código `..`, negrita **..**,
    // itálica *..*, enlace [..](..). El orden importa para que ** no se interprete como *.
    const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        const token = match[0];

        if (token.startsWith("`")) {
            parts.push(
                <code key={key++} className="bg-gray-100 dark:bg-zinc-900 rounded px-1 py-0.5 text-sm">
                    {token.slice(1, -1)}
                </code>
            );
        } else if (token.startsWith("**")) {
            parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
        } else if (token.startsWith("[")) {
            const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
                parts.push(
                    <a
                        key={key++}
                        href={linkMatch[2]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
                    >
                        {linkMatch[1]}
                    </a>
                );
            } else {
                parts.push(token);
            }
        } else if (token.startsWith("*")) {
            parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
        }

        lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts;
}