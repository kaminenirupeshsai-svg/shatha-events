import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../lib/logger.js';

type DbStatus = 'disconnected' | 'connected' | 'connecting' | 'disconnecting';
// Indexed as a plain string[] (not a narrow tuple) because
// mongoose.connection.readyState's type includes states beyond 0-3 (e.g. 99
// for "uninitialized"), which a tuple's literal index check would reject.
const READY_STATES: DbStatus[] = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/**
 * Connects to MongoDB without blocking server startup. A bad or unreachable
 * MONGODB_URI used to make the whole HTTP server hang (mongoose.connect was
 * awaited before server.listen), which on a PaaS looks identical to a dead
 * service from the outside - the port never opens, so even /api/health is
 * unreachable and there's nothing to inspect except platform-level logs.
 * Now the server always starts, and getDbStatus() below lets /api/health
 * report the real connection state so this is diagnosable with one curl.
 */
export async function connectDb(): Promise<void> {
  mongoose.set('strictQuery', true);

  const attempt = async (): Promise<void> => {
    try {
      const conn = await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
      logger.info({ host: conn.connection.host, db: conn.connection.name }, 'MongoDB connected');
    } catch (err) {
      logger.error({ err }, 'Failed to connect to MongoDB - retrying in 5s');
      setTimeout(() => {
        attempt().catch(() => {
          /* attempt() already logs its own failures */
        });
      }, 5_000).unref();
    }
  };

  await attempt();
}

export function getDbStatus(): DbStatus {
  return READY_STATES[mongoose.connection.readyState] ?? 'disconnected';
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
