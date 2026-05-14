"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/utils/functions/cn"
import { useAppDispatch, useAppSelector } from "@/hooks/selector"
import { useEffect } from "react"
import { closeModalReducer } from "@/hooks/reducers/drop-down"
import { motion, AnimatePresence } from "motion/react"

export interface ModalProps {
    modalName: string
    title: string
    children: React.ReactNode
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full"
}

export function Modal({ modalName, title, children, maxWidth = "2xl" }: ModalProps) {
    const dialogRef = React.useRef<HTMLDialogElement | null>(null);
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector((state: any) => state.dropDownReducer.modals[modalName]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleBackdropClick()
        }

        if (isOpen) {
            document.addEventListener("keydown", handleEscape)
            document.body.style.overflow = "hidden"
        }

        return () => {
            document.removeEventListener("keydown", handleEscape)
            document.body.style.overflow = "unset"
        }
    }, [isOpen])

    const handleBackdropClick = () => {
        dispatch(closeModalReducer({ modalName }));
    };

    const maxWidthClasses = {
        sm: "sm:max-w-sm",
        md: "sm:max-w-md",
        lg: "sm:max-w-lg",
        xl: "sm:max-w-xl",
        "2xl": "sm:max-w-2xl",
        "3xl": "sm:max-w-3xl",
        "4xl": "sm:max-w-4xl",
        "5xl": "sm:max-w-5xl",
        full: "sm:max-w-full",
    }

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
                handleBackdropClick();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <dialog
            id={modalName}
            ref={dialogRef}
            open={isOpen}
            className={cn("inset-0 z-40 bg-transparent max-h-screen w-full")}
            aria-modal="true"
            aria-labelledby={`modal-${modalName}`}
        >
            {/* Fondo oscuro (sin animación para mantener la inmediatez) */}
            <div className="fixed inset-0 bg-black/20 bg-opacity-85 backdrop-blur-xs transition-opacity" onClick={handleBackdropClick} />

            <AnimatePresence>
                {isOpen && (
                    <motion.section
                        key="modal-content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className={cn(
                            "fixed inset-0 h-screen md:h-fit md:max-h-[90dvh] mx-auto overflow-auto md:w-11/12 md:my-4 md:rounded-lg bg-[var(--background)] text-left shadow-xl",
                            maxWidthClasses[maxWidth],
                        )}
                    >
                        {/* Botón de cierre y título */}
                        <form method="dialog" className="sticky top-0 z-40 backdrop-blur-2xl bg-white/80 flex items-center justify-between gap-2 m-2 border-b py-2 border-gray-200">
                            <h3
                                id="modal-title"
                                className="absolute left-0 right-0 text-center text-gray-900 dark:text-white pointer-events-none"
                            >
                                {title}
                            </h3>
                            <button
                                className="cursor-pointer relative z-10 ml-auto bg-[var(--background)] text-green-700 hover:text-green-500 dark:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                onClick={handleBackdropClick}
                            >
                                <span className="sr-only">Close</span>
                                <X className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </form>

                        {/* Contenido */}
                        <main className="p-4 m-auto">{children}</main>
                    </motion.section>
                )}
            </AnimatePresence>
        </dialog>
    )
}