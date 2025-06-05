// Alert.tsx (componente actualizado)
'use client';

import { useAppSelector, useAppDispatch } from "@/hooks/selector";
import { alertClasses } from "@/utils/constants/colors";
import { ArchiveRestore, CircleAlert } from "lucide-react";
import { useEffect, useRef } from "react";
import { clearAlert } from "@/hooks/reducers/drop-down";

export default function Alert() {
    const dispatch = useAppDispatch();
    const alert = useAppSelector((state) => state.dropDownReducer.alert);
    const { type, icon, title, message, buttonText, action, duration } = alert;
    const dialogRef = useRef<HTMLDialogElement | null>(null);

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

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
                dispatch(clearAlert());
            }
        };

        if (message) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [message, dispatch]);

    if (!message) return null;

    return (
        <section className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg bg-black bg-opacity-20">
            <dialog
                ref={dialogRef}
                open={!!message}
                className="max-w-lg w-full rounded-lg bg-white dark:bg-zinc-800 shadow-xl p-6 z-20"
            >
                <div className="flex items-start space-x-4">
                    <span className={`flex items-center justify-center w-12 h-12 rounded-full ${styles.bg}`}>
                        {iconsMap[icon] ?? null}
                    </span>
                    <section>
                        <h3 className={`text-lg font-semibold ${styles.text}`}>{title}</h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-200">{message}</p>
                    </section>
                </div>
                {buttonText && (
                    <form method="dialog" className="mt-6 flex justify-end space-x-4">
                        <button
                            onClick={closeDialog}
                            className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAction}
                            className={`px-4 py-2 text-sm font-semibold ${styles.text} ${styles.bg} ring-1 ring-inset ${styles.ring} rounded-md ${styles.hover} transition-all`}
                        >
                            {buttonText}
                        </button>
                    </form>
                )}
            </dialog>
        </section>
    );
}