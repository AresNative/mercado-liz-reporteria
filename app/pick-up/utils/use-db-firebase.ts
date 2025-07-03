import { database } from "./firebase-config";
import {
  ref,
  set,
  update,
  remove,
  onValue,
  off,
  DataSnapshot,
  serverTimestamp,
  push,
} from "firebase/database";

// Escribir datos (dinámico)
export const writeData = (path: string, data: object) => {
  const dbRef = ref(database, path);
  return set(dbRef, data)
    .then(() => console.log("Datos guardados correctamente"))
    .catch((error) => console.error("Error al guardar:", error));
};

// Actualizar datos (dinámico)
export const updateData = (path: string, updates: object) => {
  const dbRef = ref(database, path);
  return update(dbRef, updates)
    .then(() => console.log("Datos actualizados correctamente"))
    .catch((error) => console.error("Error al actualizar:", error));
};

// Eliminar datos (dinámico)
export const deleteData = (path: string) => {
  const dbRef = ref(database, path);
  return remove(dbRef)
    .then(() => console.log("Datos eliminados correctamente"))
    .catch((error) => console.error("Error al eliminar:", error));
};

// Leer datos en tiempo real (dinámico)
type CallbackFunction = (data: any) => void;

export const listenRealTimeData = (
  path: string,
  callback: CallbackFunction
) => {
  const dbRef = ref(database, path);

  const snapshotHandler = (snapshot: DataSnapshot) => {
    try {
      const data = snapshot.val();
      callback(data);
    } catch (error) {
      console.error("Error al procesar datos:", error);
    }
  };

  // Registrar listener
  onValue(dbRef, snapshotHandler);

  // Devolver función para desregistrar
  return () => off(dbRef, "value", snapshotHandler);
};

// Leer datos una sola vez (dinámico)
/* export const readDataOnce = (path: string): Promise<any> => {
  const dbRef = ref(database, path);
  return new Promise((resolve, reject) => {
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      resolve(data);
    }, {
      onlyOnce: true // Leer solo una vez
    }, (error) => {
      reject(error);
    });
  });
} */

// Añadir datos con ID único (push)
export const pushData = (path: string, data: object) => {
  const dbRef = ref(database, path);
  const newRef = push(dbRef);
  return set(newRef, data)
    .then(() => {
      console.log("Datos guardados con ID único");
      return newRef.key; // Devolver el ID generado
    })
    .catch((error) => {
      console.error("Error al guardar:", error);
      return null;
    });
};

// Funciones específicas para el chat
export const sendMessage = (
  chatId: string,
  userId: string,
  userName: string,
  text: string
) => {
  const messageData = {
    text,
    userId,
    userName,
    timestamp: serverTimestamp(),
  };

  return pushData(`chats/${chatId}/messages`, messageData);
};

export const updateUserStatus = (
  userId: string,
  name: string,
  telefono: string
) => {
  const userData = {
    name,
    telefono,
    lastSeen: serverTimestamp(),
  };

  return writeData(`users/${userId}`, userData);
};
