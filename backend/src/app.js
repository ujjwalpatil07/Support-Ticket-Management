import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { ApiError } from './utils/ApiError.js';
import { registerEventHandlers } from './events/eventHandlers.js';
import { csrfProtection } from './middleware/csrf.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';
import authRoutes from './routes/auth.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import commentRoutes from './routes/comment.routes.js';
import activityRoutes from './routes/activity.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

export function createApp() {
  registerEventHandlers();

  const app = express();

  if (env.isProduction) {
    app.set('trust proxy', 1);
  }

  app.use(helmet());

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }
        if (env.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new ApiError(403, 'Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    })
  );

  if (!env.isTest) {
    app.use(morgan(env.isProduction ? 'combined' : 'dev'));
  }

  const apiLimiter = rateLimit({
    windowMs: env.apiRateLimitWindowMs,
    max: env.isTest ? 10000 : env.apiRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests. Please slow down.',
    },
  });

  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());

  app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        environment: env.nodeEnv,
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.use('/api/v1', apiLimiter);
  app.use('/api/v1', csrfProtection);

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/tickets', ticketRoutes);
  app.use('/api/v1/tickets', commentRoutes);
  app.use('/api/v1/tickets', activityRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
