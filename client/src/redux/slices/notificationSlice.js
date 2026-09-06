import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'peoplepay_read_notifications';

function getReadIdsFromStorage() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReadIdToStorage(id) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getReadIdsFromStorage();
    if (!existing.includes(id)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, id]));
    }
  } catch {
    // Ignore storage errors
  }
}

function saveAllReadIdsToStorage(ids) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getReadIdsFromStorage();
    const merged = Array.from(new Set([...existing, ...ids]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage errors
  }
}

const initialState = {
  items: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications(state, action) {
      const readIds = getReadIdsFromStorage();
      const rawItems = Array.isArray(action.payload) ? action.payload : [];

      state.items = rawItems.map((item) => ({
        ...item,
        read: item.read || readIds.includes(item.id),
      }));

      state.unreadCount = state.items.filter((item) => !item.read).length;
    },

    markAsRead(state, action) {
      const id = action.payload;
      const target = state.items.find((item) => item.id === id);
      if (target && !target.read) {
        target.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        saveReadIdToStorage(id);
      }
    },

    markAllAsRead(state) {
      const allIds = state.items.map((item) => item.id);
      state.items.forEach((item) => {
        item.read = true;
      });
      state.unreadCount = 0;
      saveAllReadIdsToStorage(allIds);
    },

    addNotification(state, action) {
      const newItem = action.payload;
      const readIds = getReadIdsFromStorage();
      const isRead = newItem.read || readIds.includes(newItem.id);

      state.items.unshift({
        ...newItem,
        read: isRead,
      });

      if (!isRead) {
        state.unreadCount += 1;
      }
    },

    setUnreadCount(state, action) {
      if (typeof action.payload === 'number') {
        state.unreadCount = Math.max(0, action.payload);
      }
    },
  },
});

export const {
  setNotifications,
  markAsRead,
  markAllAsRead,
  addNotification,
  setUnreadCount,
} = notificationSlice.actions;

export default notificationSlice.reducer;
