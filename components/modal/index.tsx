"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/utils/functions/cn"
import { useAppDispatch, useAppSelector } from "@/hooks/selector"
import { useEffect } from "react"
import { closeModalReducer } from "@/hooks/reducers/drop-down"

interface ModalProps {
    modalName: string
    title: string
    children: React.ReactNode
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full"
}

export function Modal({ modalName, title, children, maxWidth = "2xl" }: ModalProps) {
    // Handle escape key
    const dialogRef = React.useRef<HTMLDialogElement | null>(null);
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector((state: any) => state.dropDownReducer.modals[modalName]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleBackdropClick()
        }

        if (isOpen) {
            document.addEventListener("keydown", handleEscape)
            // Prevent scrolling when modal is open
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

    //if (!isOpen) return null
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
            className={cn("inset-0 z-50 bg-transparent max-h-screen w-full")}
            aria-modal="true"
            aria-labelledby={`modal-${modalName}`}>

            <div className="fixed inset-0 bg-black/20 bg-opacity-85 transition-opacity" onClick={handleBackdropClick} />

            <section
                className={cn(
                    "fixed inset-0 h-screen md:h-fit md:max-h-[90dvh] mx-auto overflow-auto md:w-11/12 md:my-4 md:rounded-lg bg-[var(--background)] text-left shadow-xl transition-all",
                    maxWidthClasses[maxWidth],
                )}
            >
                {/* Close button */}
                <form method="dialog" className="relative flex items-center justify-between gap-2 m-2 border-b py-2 border-gray-200">
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

                {/* Content */}
                <main className="p-4 m-auto">{children}</main>
            </section>
        </dialog>
    )
}

