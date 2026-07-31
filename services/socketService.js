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

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    if (userId) socket.emit('join', String(userId));
  });

  socket.on('disconnect', () => {});

  socket.on('connect_error', () => {});

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
