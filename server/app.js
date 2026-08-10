import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import certificateRoutes from './routes/certificateRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { convertPngToPdf } from './services/certificateService.js';
import logger from './utils/logger.js';
import requestIdMiddleware from './middleware/requestIdMiddleware.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const app = express();
const generatedDir = fileURLToPath(new URL('./generated/', import.meta.url));

// ─── Trust proxy (for rate limiting behind Nginx/Heroku/Render) ───────────────
app.set('trust proxy', 1);

// ─── Request ID Tracking & Structured Logging ──────────────────────────────
app.use(requestIdMiddleware);

app.use((req, _res, next) => {
  req.logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// ─── Allowed Origins Configuration ────────────────────────────────────
const staticAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5180',
  'http://localhost:4173', // Vite preview
  'https://certificate-generator-lyart-mu.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean).map(url => url.trim().replace(/\/$/, ''));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.trim().replace(/\/$/, '');

    // Allow static allowed origins or any vercel.app deployment
    if (
      staticAllowedOrigins.includes(normalizedOrigin) ||
      normalizedOrigin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }

    logger.warn(`[CORS REJECTED] Origin not whitelisted: ${origin}`);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 204,
};

// ─── CORS Middleware FIRST ───────────────────────────────────────────────────
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── HTTP Request Logging (Morgan -> Winston Stream) ──────────────────────────
if (process.env.NODE_ENV !== 'test') {
  const morganStream = {
    write: (message) => logger.http(message.trim()),
  };
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: morganStream }));
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many certificate requests. Please wait before trying again.' },
});

app.use(globalLimiter);
app.use('/api/generate', generateLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Certificate Generator API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', certificateRoutes);

// Cross-origin downloads endpoint
app.get('/downloads/:filename', async (req, res, next) => {
  const { filename } = req.params;
  const isCertificateFile = /^Certificate_[A-Za-z0-9_]+\.(png|pdf)$/.test(filename);
  if (!isCertificateFile || filename !== path.basename(filename)) {
    return res.status(404).json({ success: false, message: 'File not found.' });
  }

  const filePath = path.join(generatedDir, filename);

  if (filename.endsWith('.pdf')) {
    try {
      await fs.promises.access(filePath);
    } catch {
      const pngFilename = filename.replace(/\.pdf$/, '.png');
      const pngPath = path.join(generatedDir, pngFilename);
      try {
        await fs.promises.access(pngPath);
        console.log(`[downloads] On-demand PDF generation requested for ${filename}`);
        await convertPngToPdf(pngPath, filePath);
      } catch (err) {
        console.error('[downloads] On-demand PDF conversion error:', err);
      }
    }
  }

  return res.download(filePath, filename, (error) => {
    if (!error) return;
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, message: 'File not found or has expired.' });
    }
    return next(error);
  });
});

app.use('/generated', express.static(generatedDir, { maxAge: '1h' }));

// ─── Task 6: 404 Handler (Does NOT intercept OPTIONS requests) ────────────────
app.use((req, res) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Task 5: Global Error Handler (MUST BE LAST) ─────────────────────────────
app.use(errorHandler);

export default app;

