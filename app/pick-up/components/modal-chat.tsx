"use client";
import { Modal } from "@/components/modal"
import { useEffect, useRef, useState } from "react";
import { listenRealTimeData, updateUserStatus, sendMessage } from "../utils/use-db-firebase";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { Send, UserCircle } from "lucide-react";
// Tipos para nuestro chat
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

export const ModalChat = ({ telefonoClient }: { telefonoClient: any }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [users, setUsers] = useState<Record<string, User>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const userId = getLocalStorageItem('user-id');
    // Cargar mensajes en tiempo real
    useEffect(() => {
        const unsubscribeMessages = listenRealTimeData(
            `chats/${telefonoClient}/messages`,
            (messagesData) => {
                if (!messagesData) {
                    setMessages([]);
                    return;
                }

                const messagesArray = Object.entries(messagesData)
                    .map(([id, message]: any) => ({
                        id,
                        ...message
                    }))
                    .sort((a, b) => a.timestamp - b.timestamp);

                setMessages(messagesArray);
            }
        );

        const unsubscribeUsers = listenRealTimeData('users', (usersData) => {
            if (usersData) setUsers(usersData);
        });

        updateUserStatus(userId, "Soporte", '000-000-0000');

        return () => {
            unsubscribeMessages();
            unsubscribeUsers();
            updateUserStatus(userId, "Soporte", '000-000-0000');
        };
    }, [telefonoClient, userId]);

    // Scroll automático al final
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            await sendMessage(telefonoClient, userId, "Soporte", newMessage.trim());
            setNewMessage('');
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
        }
    };

    const formatTime = (timestamp: number) => {
        if (!timestamp) return 'Ahora';
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Modal modalName={telefonoClient} title={telefonoClient}>
            <>
                <div className="flex flex-col p-4 pb-20">
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
                                const user = users[message.userId] || { name: message.userName };

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
                                                    <div className="text-xs font-medium text-gray-600 dark:text-gray-100 mb-1 ml-1">
                                                        {user.nombre}
                                                    </div>
                                                )}

                                                <div className="flex flex-col">
                                                    <div className={`
                                                        rounded-2xl px-4 py-3
                                                        ${isCurrentUser
                                                            ? 'bg-purple-500 text-white rounded-br-none'
                                                            : 'bg-white text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'}
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

                {/* Área de entrada de mensajes */}
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3">
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
            </>
        </Modal>
    )
}