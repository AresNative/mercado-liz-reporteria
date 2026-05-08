"use client";
import { Modal } from "@/components/modal";
import { useEffect, useRef, useState } from "react";
import { FirestoreService } from "@/hooks/use-firebase"; // Ruta al archivo donde definiste la clase
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { Send, UserCircle } from "lucide-react";

// Tipos (se mantienen igual)
export type Message = {
    id: string;
    text: string;
    userId: string;
    userName: string;
    timestamp: number;
};

export type User = {
    id: string;
    nombre: string;
    telefono: string;
    lastSeen?: number;
};

interface ModalChatProps {
    telefonoClient: string | null;
    pedido?: any;
}

export const ModalChat = ({ telefonoClient, pedido }: ModalChatProps) => {
    const modalName = pedido ? `chat_${pedido?.cliente_telefono}_${pedido?.id}` : `chat_${telefonoClient}`;
    if (!modalName) return null;

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [users, setUsers] = useState<Record<string, User>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const userId = 'unknown';

    // Servicios
    const usersService = new FirestoreService<User>('users');
    // El servicio de mensajes se creará dinámicamente cuando tengamos telefonoClient
    const [messagesService, setMessagesService] = useState<FirestoreService<Message> | null>(null);

    const getModalTitle = () => {
        if (pedido?.nombre) {
            return `Chat con ${pedido.nombre} - #${pedido.id} - ${telefonoClient || 'Sin teléfono'}`;
        }
        return telefonoClient ? `Chat - ${telefonoClient}` : 'Chat General';
    };

    // Suscripción a usuarios (colección raíz)
    useEffect(() => {
        if (!userId) return;

        const unsubscribeUsers = usersService.subscribe(
            [], // sin filtros por ahora
            (usersArray: User[]) => {
                // Convertir array a objeto con id como clave para facilitar búsqueda
                const usersMap = usersArray.reduce((acc, user) => {
                    acc[user.id] = user;
                    return acc;
                }, {} as Record<string, User>);
                setUsers(usersMap);
            },
            (error: any) => console.error("Error en suscripción de usuarios:", error)
        );

        // Actualizar estado del usuario actual (soporte)
        const updateCurrentUser = async () => {
            try {
                await usersService.update(userId, {
                    nombre: "Soporte",
                    telefono: '000-000-0000',
                    lastSeen: Date.now()
                });
            } catch (error) {
                console.error("Error actualizando usuario:", error);
            }
        };
        updateCurrentUser();

        return () => {
            unsubscribeUsers();
            // Al salir, marcar como desconectado o simplemente no hacer nada
            // Se podría volver a actualizar el usuario, pero no es obligatorio
        };
    }, [userId]);

    // Suscripción a mensajes (subcolección dinámica)
    useEffect(() => {
        if (!telefonoClient) {
            setMessagesService(null);
            setMessages([]);
            return;
        }

        // Crear servicio para la subcolección messages del chat específico
        const path = pedido ? `chats/${pedido.cliente_telefono}/${pedido?.id}/` : `chats/${telefonoClient}/messages/`;
        const msgService = new FirestoreService<Message>(path);
        setMessagesService(msgService);

        const unsubscribeMessages = msgService.subscribe(
            [],
            (messagesArray:any) => {
                // Ordenar por timestamp ascendente (más antiguo primero)
                const sorted = [...messagesArray].sort((a, b) => a.timestamp - b.timestamp);
                setMessages(sorted);
            },
            (error: any) => console.error("Error en suscripción de mensajes:", error)
        );

        return () => {
            unsubscribeMessages();
        };
    }, [telefonoClient]);

    // Scroll automático
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !telefonoClient || !messagesService) return;

        try {
            await messagesService.create({
                text: newMessage.trim(),
                userId: 'unknown',
                userName:  'Soporte',
                timestamp: Date.now()
            });
            setNewMessage('');
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
        }
    };

    const formatTime = (timestamp: number) => {
        if (!timestamp) return 'Ahora';
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!telefonoClient) return null;

    return (
        <Modal modalName={modalName} title={getModalTitle()} maxWidth="md">
            <div className="flex flex-col relative">
                <div className="flex-1 h-full overflow-y-auto p-4 pb-20">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                            <UserCircle className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-500">Chat vacío</h3>
                            <p className="text-gray-400 mt-1">
                                Envía un mensaje para iniciar la conversación
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {messages.map((message) => {
                                const isCurrentUser = message.userId === userId;
                                const user = users[message.userId] || { nombre: message.userName };

                                return (
                                    <div
                                        key={message.id}
                                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] flex ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                            <div className="mx-2 flex items-end">
                                                <UserCircle className={`w-8 h-8 ${isCurrentUser ? 'text-purple-500' : 'text-gray-400'}`} />
                                            </div>

                                            <div>
                                                {!isCurrentUser && (
                                                    <div className="text-xs font-medium text-gray-600 mb-1 ml-1">
                                                        {user.nombre}
                                                    </div>
                                                )}

                                                <div className="flex flex-col">
                                                    <div className={`
                                                        rounded-2xl px-4 py-3
                                                        ${isCurrentUser
                                                            ? 'bg-purple-500 text-white rounded-br-none'
                                                            : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'}
                                                    `}>
                                                        {message.text}
                                                    </div>

                                                    <div className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
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

                <div className="relative bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3">
                    <div className="flex items-center gap-2">
                        <input
                            value={newMessage}
                            placeholder="Escribe un mensaje..."
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 rounded-full bg-gray-100 px-4 py-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${newMessage.trim()
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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