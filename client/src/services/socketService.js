import { io } from 'socket.io-client';
import store from '../redux/store/store.js';
import {
  addNotification,
  setUnreadCount,
} from '../redux/slices/notificationSlice.js';

class SocketService {
  constructor() {
    this.socket = null;
    this.userId = null;
  }

  getSocketUrl() {
    const apiUrl =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
      'http://localhost:5000/api';
    return apiUrl.replace(/\/api\/?$/, '');
  }

  connect(token = null, user = null) {
    if (this.socket?.connected) {
      return this.socket;
    }

    const currentToken =
      token ||
      (typeof window !== 'undefined' &&
        (localStorage.getItem('token') ||
          localStorage.getItem('peoplepay_token') ||
          sessionStorage.getItem('token') ||
          sessionStorage.getItem('peoplepay_token')));

    this.userId = user?.id || null;

    try {
      this.socket = io(this.getSocketUrl(), {
        auth: { token: currentToken },
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        if (this.userId) {
          this.socket.emit('join', { userId: this.userId });
        }
      });

      this.socket.on('notification:new', (payload) => {
        if (payload) {
          store.dispatch(
            addNotification({
              id: payload.id || `live-${Date.now()}`,
              title: payload.title || 'Notification',
              message: payload.message || '',
              time: 'Just now',
              category: payload.type === 'SUCCESS' ? 'Payroll' : 'System',
              route: payload.route || null,
              read: false,
            })
          );
        }
      });

      this.socket.on('notification:count', (payload) => {
        if (payload && typeof payload.unreadCount === 'number') {
          store.dispatch(setUnreadCount(payload.unreadCount));
        }
      });

      this.socket.on('connect_error', (err) => {
        // Silently handle connection error, polling fallback remains active
      });
    } catch (e) {
      console.warn('Socket initialization failed:', e.message);
    }

    return this.socket;
  }

  join(userId) {
    this.userId = userId;
    if (this.socket?.connected && userId) {
      this.socket.emit('join', { userId });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.userId = null;
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return !!(this.socket && this.socket.connected);
  }
}

export const socketService = new SocketService();
export default socketService;
