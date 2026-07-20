"use server";

import { Message, User } from "@/app/pick-up/components/modal-chat";
import { MongoDBService, QueryConstraint } from "../use-mongodb";

const usersService = new MongoDBService<User>("users");
const messagesService = new MongoDBService<Message>("messages");

export async function getUsers() {
  return await usersService.getAll([]);
}

export async function updateUser(userId: string, data: Partial<User>) {
  const existing = await usersService.getById(userId);
  if (existing) {
    await usersService.update(userId, data);
  } else {
    console.warn("Usuario no existe, no se crea automáticamente.");
  }
}

export async function getMessages(chatId: string) {
  const constraints: QueryConstraint[] = [
    { field: "chatId", operator: "==", value: chatId },
  ];
  return await messagesService.getAll(constraints);
}

export async function sendMessage(
  chatId: string,
  text: string,
  userId: string,
  userName: string,
) {
  await messagesService.create({
    chatId,
    text,
    userId,
    userName,
    timestamp: Date.now(),
    type: "normal",
  });
}

export async function sendReplacementRequest(
  chatId: string,
  productName: string,
) {
  await messagesService.create({
    chatId,
    text: `🔄 Por favor, escribe el nombre del producto que deseas en lugar de "${productName}" o por su defecto su código de barras.`,
    userId: "unknown",
    userName: "Soporte",
    timestamp: Date.now(),
    type: "normal",
  });
}
// Nueva acción para notificaciones con acciones (usada en modal-list)
export async function sendNotificationMessage(
  chatId: string,
  text: string,
  userId: string,
  userName: string,
  actions?: Array<{
    label: string;
    action: "replace" | "remove";
    productId: string;
    productName: string;
  }>
) {
  await messagesService.create({
    chatId,
    text,
    userId,
    userName,
    timestamp: Date.now(),
    type: "normal",
    actions: actions || [],
  });
}
