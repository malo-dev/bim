import { io } from 'socket.io-client';
import Constants from 'expo-constants';

// const API_URL = 'http://192.168.1.39/api/v1';
const API_URL = 'https://serverbimnext.masmara-dimajelo.org/api/v1';
// Retire /api/v1 pour obtenir l'URL racine du serveur Socket.io
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
    console.log('Socket connecté:', socket.id);
    if (userId) socket.emit('join', String(userId));
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket déconnecté:', reason);
  });

  socket.on('connect_error', (err) => {
    console.log('Socket erreur connexion:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
