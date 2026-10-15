"use client";
import { Modal } from "@/components/modal";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { where } from "firebase/firestore";
import { Send, UserCircle } from "lucide-react";
import { usePutGeneralMutation } from "@/hooks/api/api";
import { getLocalStorageItem } from "@/utils/functions/local-storage";

// ─── Firestore ──────────────────────────────────────
import { FirestoreService } from "@/hooks/use-firestore";

// ─── Tipos ──────────────────────────────────────────
export type Message = {
    id: string;
    text: string;
    userId: string;
    userName: string;
    timestamp: number;
    type?: "normal";
    actions?: {
        label: string;
        action: "replace" | "remove";
        productId: string;
        productName: string;
    }[];
    chatId: string;
};

export type User = {
    id: string;
    nombre: string;
    telefono: string;
    lastSeen?: number;
};

// Una sola instancia por colección
const messagesService = new FirestoreService<Message>("messages");
const usersService = new FirestoreService<User>("users");

interface ModalChatProps {
    telefonoClient: string | null;
    pedido?: any;
}

export const ModalChat = ({ telefonoClient, pedido }: ModalChatProps) => {
    const modalName = pedido
        ? `chat_${pedido?.cliente_telefono}_${pedido?.id}`
        : `chat_${telefonoClient}`;

    // ⚠️ Hooks SIEMPRE antes de cualquier return
    const userId = useMemo(
        () => getLocalStorageItem("user-id") || "unknown",
        []
    );

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [users, setUsers] = useState<Record<string, User>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [putGeneral] = usePutGeneralMutation();

    const chatId = useMemo(() => {
        if (pedido?.cliente_telefono && pedido?.id) {
            return `${pedido.cliente_telefono}_${pedido.id}`;
        }
        if (telefonoClient) return `${telefonoClient}_general`;
        return null;
    }, [pedido?.cliente_telefono, pedido?.id, telefonoClient]);

    const getModalTitle = () => {
        if (pedido?.nombre) {
            return `Chat con ${pedido.nombre} - #${pedido.id} - ${telefonoClient || "Sin teléfono"}`;
        }
        return telefonoClient ? `Chat - ${telefonoClient}` : "Chat General";
    };

    // ─── Suscripción a usuarios ─────────────────────────
    useEffect(() => {
        const unsubscribe = usersService.subscribe([], (data) => {
            const map = data.reduce((acc, user) => {
                acc[user.id] = user;
                return acc;
            }, {} as Record<string, User>);
            setUsers(map);
        });

        // "Upsert" del usuario soporte actual
        const updateCurrentUser = async () => {
            try {
                const existing = await usersService.getById(userId);
                if (existing) {
                    await usersService.update(userId, {
                        nombre: "Soporte",
                        telefono: "000-000-0000",
                        lastSeen: Date.now(),
                    });
                } else {
                    // FirestoreService.create genera ID automático,
                    // así que usamos setDoc-like vía update no aplica.
                    // Para respetar `userId` como ID del doc, escribimos directo.
                    await usersService.create({
                        id: userId, // nota: create ignora `id` y genera uno nuevo
                        nombre: "Soporte",
                        telefono: "000-000-0000",
                        lastSeen: Date.now(),
                    } as Omit<User, "id">);
                }
            } catch (error) {
                console.error("Error actualizando/creando usuario:", error);
            }
        };
        updateCurrentUser();

        return () => unsubscribe();
    }, [userId]);

    // ─── Suscripción a mensajes (tiempo real) ───────────
    useEffect(() => {
        if (!chatId) {
            setMessages([]);
            return;
        }

        const unsubscribe = messagesService.subscribe(
            [where("chatId", "==", chatId)],
            (data) => {
                const sorted = [...data].sort(
                    (a, b) => a.timestamp - b.timestamp
                );
                setMessages(sorted);
            },
            (error) => console.error("Error en suscripción de mensajes:", error)
        );

        return () => unsubscribe();
    }, [chatId]);

    // Scroll automático
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ─── Enviar mensaje ─────────────────────────────────
    const handleSendMessage = useCallback(async () => {
        if (!newMessage.trim() || !chatId) return;
        try {
            await messagesService.create({
                chatId,
                text: newMessage.trim(),
                userId,
                userName: "Soporte",
                timestamp: Date.now(),
            } as Omit<Message, "id">);
            setNewMessage("");
        } catch (error) {
            console.error("Error al enviar mensaje:", error);
        }
    }, [chatId, newMessage, userId]);

    // ─── Acciones (remove / replace) ────────────────────
    const handleAction = async (
        action: string,
        productId: string,
        productName: string
    ) => {
        if (!pedido || !chatId) return;

        if (action === "remove") {
            // TODO: mover a Server Action o Cloud Function para tocar Intelisis
            console.warn("Acción remove pendiente de implementar:", productId);
        } else if (action === "replace") {
            // TODO: mover a Server Action o Cloud Function para tocar Intelisis
            console.warn("Acción replace pendiente de implementar:", productId);
        }
    };

    const formatTime = (timestamp: number) => {
        if (!timestamp) return "Ahora";
        return new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (!modalName || !telefonoClient || !pedido) return null;

    return (
        <Modal modalName={modalName} title={getModalTitle()} maxWidth="md">
            <div className="flex flex-col relative h-[500px]">
                <div className="flex-1 overflow-y-auto p-4 pb-20">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                            <UserCircle className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-500">
                                Chat vacío
                            </h3>
                            <p className="text-gray-400 mt-1">
                                Envía un mensaje para iniciar la conversación
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {messages.map((message) => {
                                const isCurrentUser = message.userId === userId;
                                const isNormal = message.type === "normal";
                                const user = users[message.userId] || {
                                    nombre: message.userName,
                                };

                                return (
                                    <div
                                        key={message.id}
                                        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[85%] flex ${isCurrentUser ? "flex-row-reverse" : ""}`}
                                        >
                                            <div className="mx-2 flex items-end">
                                                <UserCircle
                                                    className={`w-8 h-8 ${isCurrentUser ? "text-purple-500" : "text-gray-400"}`}
                                                />
                                            </div>
                                            <div>
                                                {!isCurrentUser && !isNormal && (
                                                    <div className="text-xs font-medium text-gray-600 mb-1 ml-1">
                                                        {user.nombre}
                                                    </div>
                                                )}
                                                {isNormal && (
                                                    <div className="text-xs font-medium text-gray-500 mb-1 ml-1">
                                                        Soporte
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <div
                                                        className={`
                              rounded-2xl px-4 py-3
                              ${isCurrentUser
                                                                ? "bg-purple-500 text-white rounded-br-none"
                                                                : isNormal
                                                                    ? "bg-gray-100 text-gray-700 rounded-bl-none border border-gray-200"
                                                                    : "bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200"
                                                            }
                            `}
                                                    >
                                                        {message.text}
                                                        {message.actions &&
                                                            message.actions.length > 0 && (
                                                                <div className="flex gap-2 mt-3">
                                                                    {message.actions.map(
                                                                        (action) => (
                                                                            <button
                                                                                key={
                                                                                    action.action
                                                                                }
                                                                                onClick={() =>
                                                                                    handleAction(
                                                                                        action.action,
                                                                                        action.productId,
                                                                                        action.productName
                                                                                    )
                                                                                }
                                                                                className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                                                                            >
                                                                                {action.label}
                                                                            </button>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>
                                                    <div
                                                        className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? "text-right" : "text-left"}`}
                                                    >
                                                        {formatTime(message.timestamp)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                <div className="relative bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center gap-2">
                        <input
                            value={newMessage}
                            placeholder="Escribe un mensaje..."
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 rounded-full bg-gray-100 dark:bg-gray-900 dark:text-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            onKeyDown={(e) =>
                                e.key === "Enter" && handleSendMessage()
                            }
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${newMessage.trim()
                                    ? "bg-purple-600 text-white hover:bg-purple-700"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};