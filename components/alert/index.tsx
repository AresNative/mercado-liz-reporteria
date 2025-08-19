'use client';

import { useAppSelector, useAppDispatch } from "@/hooks/selector";
import { alertClasses } from "@/utils/constants/colors";
import { ArchiveRestore, CircleAlert } from "lucide-react";
import { useEffect } from "react";
import { clearAlert } from "@/hooks/reducers/drop-down";
import { cn } from "@/utils/functions/cn";

export default function Alert() {
    const dispatch = useAppDispatch();
    const alert = useAppSelector((state) => state.dropDownReducer.alert);
    const { type, icon, title, message, buttonText, action, duration } = alert;
    const styles = alertClasses[type];

    const iconsMap = {
        archivo: <ArchiveRestore className={`${styles.text}`} />,
        alert: <CircleAlert className={`${styles.text}`} />
    };

    useEffect(() => {
        if (message && duration) {
            const timer = setTimeout(() => {
                dispatch(clearAlert());
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [message, duration, dispatch]);

    const closeDialog = () => {
        dispatch(clearAlert());
    };

    const handleAction = () => {
        action?.();
        dispatch(clearAlert());
    };

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeDialog();
        }

        if (message) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        }
    }, [message]);

    if (!message) return null;

    return (
        <dialog
            open={!!message}
            className={cn("inset-0 z-50 bg-transparent max-h-screen w-full")}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 bg-opacity-75 transition-opacity"
                onClick={closeDialog}
            />

            {/* Centered container */}
            <section className="fixed inset-0 h-fit w-fit mx-auto overflow-auto md:my-4 rounded-lg bg-white dark:bg-zinc-800 text-left shadow-xl transition-all">
                {/* Alert card */}
                <article
                    className="relative transform w-full bg-white overflow-hidden rounded-lg dark:bg-zinc-800 text-left shadow-xl transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    <label className="p-4 flex items-start gap-4">
                        <span className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full ${styles.bg}`}>
                            {iconsMap[icon] ?? null}
                        </span>

                        <div className="flex-1 text-gray-500 dark:text-gray-200">
                            <h3 className={`text-lg font-semibold ${styles.text}`}>{title}</h3>
                            <p className="mt-2 text-sm">{message}</p>
                        </div>
                    </label>

                    {buttonText && (
                        <div className="px-4 py-3 bg-gray-50 dark:bg-zinc-700 flex flex-row-reverse gap-3">
                            <button
                                onClick={handleAction}
                                className={`px-4 py-2 text-sm cursor-pointer font-semibold ${styles.text} ${styles.bg} ring-1 ring-inset ${styles.ring} rounded-md ${styles.hover} transition-all`}
                            >
                                {buttonText}
                            </button>
                            <button
                                onClick={closeDialog}
                                className="px-4 py-2 text-sm cursor-pointer font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </article>
            </section>
        </dialog>
    );
}