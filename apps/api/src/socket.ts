import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { verifyAccessToken } from './lib/jwt.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

let io: Server | undefined;

function roomFor(userId: string): string {
  return `user:${userId}`;
}

/**
 * Auth handshake mirrors the REST API: the client sends the same short-lived
 * access token it uses as a Bearer header (see apps/web's socket-client.ts),
 * passed via `auth.token` instead. Each socket joins a room named after its
 * user id so notifications/bookings services can target a single user
 * without tracking socket ids themselves.
 */
export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error('Unauthorized'));
      return;
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(roomFor(userId));
    logger.debug({ userId, socketId: socket.id }, 'socket connected');

    socket.on('disconnect', () => {
      logger.debug({ userId, socketId: socket.id }, 'socket disconnected');
    });
  });

  return io;
}

export function getIO(): Server | undefined {
  return io;
}

/** No-op (and safe to call) if socket.io hasn't been initialized, e.g. in tests. */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(roomFor(userId)).emit(event, payload);
}
