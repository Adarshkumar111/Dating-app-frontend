import { io } from 'socket.io-client';

let socket = null;
const listeners = new Map();

export const connectSocket = (userId) => {
  if (socket?.connected) return socket;
  
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('🔴 Socket disconnected');
  });

  // Listen for user-specific events
  if (userId) {
    socket.on(`user:${userId}`, (payload) => {
      console.log('📨 User event:', payload);
      notifyListeners('userEvent', payload);
    });

    socket.on(`user:${userId}:newMessage`, (payload) => {
      console.log('💬 New message:', payload);
      notifyListeners('newMessage', payload);
    });
  }

  // Listen for admin events
  socket.on('admin:pendingEdit', (payload) => {
    console.log('📝 Admin: Pending edit', payload);
    notifyListeners('adminPendingEdit', payload);
  });

  socket.on('adminRequest', (payload) => {
    console.log('👥 Admin: Request event', payload);
    notifyListeners('adminRequest', payload);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    listeners.clear();
  }
};

export const onSocketEvent = (eventType, callback) => {
  if (!listeners.has(eventType)) {
    listeners.set(eventType, new Set());
  }
  listeners.get(eventType).add(callback);
  
  // Return unsubscribe function
  return () => {
    const eventListeners = listeners.get(eventType);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  };
};

const notifyListeners = (eventType, payload) => {
  const eventListeners = listeners.get(eventType);
  if (eventListeners) {
    eventListeners.forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        console.error('Error in socket listener:', error);
      }
    });
  }
};

export const getSocket = () => socket;
