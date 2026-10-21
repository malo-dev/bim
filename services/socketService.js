import { io } from 'socket.io-client';
import Constants from 'expo-constants';

const API_URL   = Constants.expoConfig?.extra?.API_URL ?? 'https://serverbimnext.masmara-dimajelo.org/api/v1';
const SOCKET_URL = API_URL.replace('/api/v1', '');

let socket = null;

/**
 * Connecte le socket et rejoint la room de l'utilisateur.
 * Réutilise la connexion existante si déjà connecté.
 */
export const connectSocket = (userId) => {
  if (socket?.connected) {
    socket.emit('join', String(userId));
    return socket;
  }

  // Capturé dans une constante locale (pas la variable de module `socket`) :
  // si disconnectSocket() remet `socket` à null pendant que la connexion est
  // encore en cours, le callback 'connect' tardif ne doit pas planter sur
  // `null.emit(...)` — il garde sa propre référence valide vers CETTE instance.
  const sock = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10,
  });

  sock.on('connect', () => {
    if (userId) sock.emit('join', String(userId));
  });

  sock.on('disconnect', () => {});

  sock.on('connect_error', () => {});

  socket = sock;
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
