"use client";
import { Modal } from "@/components/modal";
import { useEffect, useRef, useState } from "react";
import { Send, UserCircle } from "lucide-react";
import { usePutGeneralMutation } from "@/hooks/api/api";
import { getMessages, getUsers, sendMessage, updateUser } from "@/hooks/reducers/chat-actions";

export type Message = {
    id: string;
    text: string;
    userId: string;
    userName: string;
    timestamp: number;
    type?: 'normal';
    actions?: {
        label: string;
        action: 'replace' | 'remove';
        productId: string;
        productName: string;
    }[];
    chatId?: string;
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
    const [putGeneral] = usePutGeneralMutation();

    const getModalTitle = () => {
        if (pedido?.nombre) {
            return `Chat con ${pedido.nombre} - #${pedido.id} - ${telefonoClient || 'Sin teléfono'}`;
        }
        return telefonoClient ? `Chat - ${telefonoClient}` : 'Chat General';
    };

    // Suscripción a usuarios (polling)
    useEffect(() => {
        if (!userId) return;

        const fetchUsers = async () => {
            try {
                const usersArray = await getUsers();
                const usersMap = usersArray.reduce((acc, user) => {
                    acc[user.id] = user;
                    return acc;
                }, {} as Record<string, User>);
                setUsers(usersMap);
            } catch (error) {
                console.error("Error obteniendo usuarios:", error);
            }
        };

        fetchUsers();

        const updateCurrentUser = async () => {
            try {
                await updateUser(userId, {
                    nombre: "Soporte",
                    telefono: '000-000-0000',
                    lastSeen: Date.now()
                });
            } catch (error) {
                console.error("Error actualizando/creando usuario:", error);
            }
        };
        updateCurrentUser();

        const interval = setInterval(fetchUsers, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    // Obtener mensajes (polling)
    useEffect(() => {
        if (!telefonoClient || !pedido) {
            setMessages([]);
            return;
        }

        const chatId = `${pedido.cliente_telefono}_${pedido.id}`;

        const fetchMessages = async () => {
            try {
                const messagesArray = await getMessages(chatId);
                const sorted = [...messagesArray].sort((a, b) => a.timestamp - b.timestamp);
                setMessages(sorted);
            } catch (error) {
                console.error("Error obteniendo mensajes:", error);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 500); // Polling cada 5s
        return () => clearInterval(interval);
    }, [telefonoClient, pedido]);

    // Scroll automático
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !telefonoClient || !pedido) return;
        const chatId = `${pedido.cliente_telefono}_${pedido.id}`;
        try {
            await sendMessage(chatId, newMessage.trim(), 'unknown', 'Soporte');
            setNewMessage('');
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
        }
    };

    // Acciones: para eliminar o reemplazar, usaremos las Server Actions correspondientes
    const handleAction = async (action: string, productId: string, productName: string) => {
        if (!pedido) return;
        const chatId = `${pedido.cliente_telefono}_${pedido.id}`;

        if (action === 'remove') {
            // Llamar a Server Action para eliminar producto
            // (Deberías crear esa acción)
            // Por ahora, replicamos la lógica aquí, pero debería estar en el servidor.
            // ... (lo dejamos igual, pero es mejor moverlo a Server Action)
        } else if (action === 'replace') {
            // Similar
        }
    };

    const formatTime = (timestamp: number) => {
        if (!timestamp) return 'Ahora';
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!telefonoClient || !pedido) return null;

    return (
        <Modal modalName={modalName} title={getModalTitle()} maxWidth="md">
            <div className="flex flex-col relative h-[500px]">
                <div className="flex-1 overflow-y-auto p-4 pb-20">
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
                                const isNormal = message.type === 'normal';
                                const user = users[message.userId] || { nombre: message.userName };

                                return (
                                    <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] flex ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                            <div className="mx-2 flex items-end">
                                                <UserCircle className={`w-8 h-8 ${isCurrentUser ? 'text-purple-500' : isNormal ? 'text-gray-400' : 'text-gray-400'}`} />
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
                                                    <div className={`
                            rounded-2xl px-4 py-3
                            ${isCurrentUser
                                                            ? 'bg-purple-500 text-white rounded-br-none'
                                                            : isNormal
                                                                ? 'bg-gray-100 text-gray-700 rounded-bl-none border border-gray-200'
                                                                : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'}
                          `}>
                                                        {message.text}
                                                        {message.actions && message.actions.length > 0 && (
                                                            <div className="flex gap-2 mt-3">
                                                                {message.actions.map(action => (
                                                                    <button
                                                                        key={action.action}
                                                                        onClick={() => handleAction(action.action, action.productId, action.productName)}
                                                                        className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                                                                    >
                                                                        {action.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
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

                <div className="relative bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center gap-2">
                        <input
                            value={newMessage}
                            placeholder="Escribe un mensaje..."
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 rounded-full bg-gray-100 dark:bg-gray-900 dark:text-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
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