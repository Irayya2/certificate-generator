import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import certificateRoutes from './routes/certificateRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const app = express();
const generatedDir = fileURLToPath(new URL('./generated/', import.meta.url));

// ─── Trust proxy (for rate limiting behind Nginx/Heroku) ─────────────────────
app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:5180',
  'http://localhost:4173',  // Vite preview
  'https://certificate-two-sigma.vercel.app',
  'https://certificate-generator-lyart-mu.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean).map(url => url.trim().replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl, Postman)
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = origin.trim().replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true); // Sets Access-Control-Allow-Origin header
    }
    
    console.warn(`[CORS Blocked] Origin: ${origin} is not whitelisted.`);
    // Returning false blocks the origin without throwing an error that crashes the server
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200, // For legacy browser support
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── HTTP Request Logging ─────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Global Rate Limiting ─────────────────────────────────────────────────────
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

// Cross-origin downloads need a server-sent Content-Disposition header. Using
// this endpoint keeps downloads reliable when Vercel and Render use different
// origins, while /generated remains available for the in-page preview.
app.get('/downloads/:filename', (req, res, next) => {
  const { filename } = req.params;
  const isCertificateFile = /^Certificate_[A-Za-z0-9_]+\.(png|pdf)$/.test(filename);
  if (!isCertificateFile || filename !== path.basename(filename)) {
    return res.status(404).json({ success: false, message: 'File not found.' });
  }

  return res.download(path.join(generatedDir, filename), filename, (error) => {
    if (!error) return;
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, message: 'File not found or has expired.' });
    }
    return next(error);
  });
});

app.use('/generated', express.static(generatedDir, { maxAge: '1h' }));

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

export default app;
