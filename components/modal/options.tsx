"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/utils/functions/cn"
import { useAppDispatch, useAppSelector } from "@/hooks/selector"
import { useEffect } from "react"
import { closeModalReducer } from "@/hooks/reducers/drop-down"
import { motion, AnimatePresence } from "motion/react"
import { ModalProps } from "."


export function options({ modalName, children }: ModalProps) {
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
            aria-labelledby={`modal-${modalName}`}
        >
            {/* Fondo oscuro (sin animación para mantener la inmediatez) */}
            <div className="fixed inset-0 bg-black/5 bg-opacity-85 backdrop-blur-xs transition-opacity" onClick={handleBackdropClick} />

            <AnimatePresence>
                {isOpen && (
                    <motion.section
                        key="modal-content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className={cn(
                            "fixed inset-0 h-screen md:h-fit md:max-h-[90dvh] mx-auto overflow-auto md:w-11/12 md:my-4 md:rounded-lg bg-[var(--background)] text-left shadow-xl"
                        )}
                    >
                        {/* Contenido */}
                        <main className="p-4 m-auto">{children}</main>
                    </motion.section>
                )}
            </AnimatePresence>
        </dialog>
    )
}