import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { UPLOADS_DIR } from './lib/storage.js';
import { apiRateLimiter } from './middleware/rate-limit.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { servicesRouter } from './modules/services/services.routes.js';
import { bookingsRouter } from './modules/bookings/bookings.routes.js';
import { tasksRouter } from './modules/tasks/tasks.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { uploadsRouter } from './modules/uploads/uploads.routes.js';

export const app = express();

app.disable('x-powered-by');
// Needed for req.protocol / req.ip to reflect X-Forwarded-* when the API
// eventually sits behind a reverse proxy/load balancer.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(mongoSanitize());

if (env.NODE_ENV !== 'test') {
  app.use((req, _res, next) => {
    logger.info({ method: req.method, url: req.originalUrl }, 'request');
    next();
  });
}

// Only meaningfully used when STORAGE_DRIVER=local; harmless dead weight otherwise.
app.use('/uploads', express.static(UPLOADS_DIR));

// Unauthenticated, unrate-limited liveness probe.
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api', apiRateLimiter);

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/services', servicesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/uploads', uploadsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
