import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import models from '../models/index.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = decoded.id;
          socket.user = decoded;
        } catch {
          // Token invalid/expired; socket still allowed for guest or manual join
        }
      }
      return next();
    } catch {
      return next();
    }
  });

  io.on('connection', async (socket) => {
    // If authenticated via token, join personal user room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);

      try {
        // Fetch user roles to join role rooms
        const user = await models.User.findByPk(socket.userId, {
          include: [{ model: models.Role, as: 'roles' }],
        });
        if (user?.roles) {
          user.roles.forEach((r) => {
            socket.join(`role:${r.name}`);
          });
        }
      } catch (err) {
        console.warn('Socket role join warning:', err.message);
      }
    }

    // Explicit join room listener
    socket.on('join', ({ userId }) => {
      if (userId) {
        socket.userId = userId;
        socket.join(`user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      // Disconnected cleanly
    });
  });

  return io;
};

export const getIO = () => io;

/**
 * Persists a notification to the database and broadcasts in real time.
 */
export const notifyUser = async ({
  userId,
  title,
  message,
  type = 'INFO',
  entityType = null,
  entityId = null,
  route = null,
}) => {
  if (!userId) return null;

  try {
    const notification = await models.Notification.createNotification(
      userId,
      title,
      message,
      type,
      entityType,
      entityId
    );

    const unreadCount = await models.Notification.count({
      where: { userId, isRead: false },
    });

    if (io) {
      const payload = {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        entityType: notification.entityType,
        entityId: notification.entityId,
        createdAt: notification.createdAt,
        isRead: false,
        route,
      };

      io.to(`user:${userId}`).emit('notification:new', payload);
      io.to(`user:${userId}`).emit('notification:count', { unreadCount });
    }

    return notification;
  } catch (err) {
    console.warn('Failed to persist or emit notification:', err.message);
    return null;
  }
};

/**
 * Notifies all active users holding a specific role.
 */
export const notifyRole = async (
  roleName,
  { title, message, type = 'INFO', entityType = null, entityId = null, route = null }
) => {
  try {
    const users = await models.User.findAll({
      where: { isActive: true },
      include: [
        {
          model: models.Role,
          as: 'roles',
          where: { name: roleName },
        },
      ],
    });

    const results = [];
    for (const user of users) {
      const res = await notifyUser({
        userId: user.id,
        title,
        message,
        type,
        entityType,
        entityId,
        route,
      });
      results.push(res);
    }
    return results;
  } catch (err) {
    console.warn(`Failed to notify role ${roleName}:`, err.message);
    return [];
  }
};

export default {
  initSocket,
  getIO,
  notifyUser,
  notifyRole,
};
