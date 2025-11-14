import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { env } from './env.js';
import { httpLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import mediaRoutes from './routes/media.js';
import aiRoutes from './routes/ai.js';
import entriesRoutes from './routes/entries.js';
import memoriesRoutes from './routes/memories.js';
import buddyRoutes from './routes/buddy.js';
import exportRoutes from './routes/export.js';
import sharesRoutes from './routes/shares.js';
import { requireAuth } from './middleware/auth.js';

export function createApp() {
  const app = express();
  const upload = multer();

  const allowedOrigins = new Set([
    env.APP_BASE_URL,
    'http://localhost:5173',
    'http://localhost:4173',
  ]);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
          return callback(null, origin);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(express.json({ limit: '6mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(httpLogger);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', ts: Date.now() });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/me', requireAuth, meRoutes);
  app.use('/api/v1/media', requireAuth, mediaRoutes(upload));
  app.use('/api/v1/ai', requireAuth, aiRoutes);
  app.use('/api/v1/entries', requireAuth, entriesRoutes);
  app.use('/api/v1/memories', requireAuth, memoriesRoutes);
  app.use('/api/v1/buddy', requireAuth, buddyRoutes);
  app.use('/api/v1/export', requireAuth, exportRoutes);
  app.use('/api/v1/shares', requireAuth, sharesRoutes);

  const webCandidates = [
    path.resolve(process.cwd(), '../web/dist'),
    path.resolve(process.cwd(), 'apps/web/dist'),
  ];
  const webDist = webCandidates.find((candidate) => existsSync(candidate));
  if (webDist) {
    app.use(express.static(webDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(webDist, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
