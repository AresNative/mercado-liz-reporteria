"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, X, QrCode, Facebook, Twitter, Linkedin, MessageCircle } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { cn } from "@/utils/functions/cn";

interface ShareButtonProps {
    url: string;
    title: string;
    className?: string;
}

export default function ShareButton({ url, title, className }: ShareButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowQR(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const shareOptions = [
        {
            name: "WhatsApp",
            icon: MessageCircle,
            action: () => window.open(`https://wa.me/?text=${encodeURIComponent(title + " " + url)}`, "_blank"),
            color: "text-green-600 hover:text-green-700",
        },
        {
            name: "Facebook",
            icon: Facebook,
            action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank"),
            color: "text-blue-600 hover:text-blue-700",
        },
        {
            name: "Twitter",
            icon: Twitter,
            action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, "_blank"),
            color: "text-sky-500 hover:text-sky-600",
        },
        {
            name: "LinkedIn",
            icon: Linkedin,
            action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank"),
            color: "text-blue-700 hover:text-blue-800",
        },
    ];

    // Intentar usar Web Share API si está disponible
    const handleNativeShare = () => {
        if (navigator.share) {
            navigator.share({
                title: title,
                url: url,
            }).catch(() => {
                // Si falla o se cancela, abrimos menú manual
                setIsOpen(true);
            });
        } else {
            setIsOpen(true);
        }
    };

    return (
        <div className="relative z-50" ref={menuRef}>
            <button
                onClick={handleNativeShare}
                className={cn("flex items-center gap-1 text-green-600 hover:text-green-700", className)}
            >
                <Share2 className="size-4" />
                Compartir
            </button>

            {isOpen && (
                <div className="absolute z-50 right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Compartir</span>
                        <button onClick={() => { setIsOpen(false); setShowQR(false); }} className="text-gray-500 hover:text-gray-700">
                            <X className="size-4" />
                        </button>
                    </div>

                    {!showQR ? (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                {shareOptions.map((option) => (
                                    <button
                                        key={option.name}
                                        onClick={() => {
                                            option.action();
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                                            option.color
                                        )}
                                    >
                                        <option.icon className="size-6 mb-1" />
                                        <span className="text-xs">{option.name}</span>
                                    </button>
                                ))}
                            </div>
                            <hr className="my-2 border-gray-200 dark:border-gray-700" />
                            <button
                                onClick={() => setShowQR(true)}
                                className="flex items-center gap-2 w-full p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <QrCode className="size-5" />
                                Generar código QR
                            </button>
                        </>
                    ) : (
                        <div className="text-center">
                            <QRCodeCanvas value={url} size={160} className="mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Escanea para ver el artículo</p>
                            <button
                                onClick={() => setShowQR(false)}
                                className="mt-2 text-sm text-green-600 hover:underline"
                            >
                                Volver
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}