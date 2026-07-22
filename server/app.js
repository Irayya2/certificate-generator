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

const staticAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:5180',
  'http://localhost:4173',  // Vite preview
  process.env.FRONTEND_URL,
].filter(Boolean).map(url => url.trim().replace(/\/$/, ''));

// Add logging before every middleware
app.use((req, res, next) => {
  console.log(req.method, req.originalUrl);
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    console.log(`[CORS Request] Incoming Origin: ${origin}`);
    
    // Allow requests with no origin (e.g., curl, Postman)
    if (!origin) {
      console.log(`[CORS Decision] ALLOWED (No origin provided) -> returning true`);
      return callback(null, true);
    }
    
    const normalizedOrigin = origin.trim().replace(/\/$/, '');
    
    // 1. Allow if origin equals FRONTEND_URL or localhost
    if (staticAllowedOrigins.includes(normalizedOrigin)) {
      console.log(`[CORS Decision] ALLOWED (Matches staticAllowedOrigins) -> returning true`);
      return callback(null, true); // Sets Access-Control-Allow-Origin header
    }
    
    // 2. Allow if origin endsWith(".vercel.app") for preview deployments
    if (normalizedOrigin.endsWith('.vercel.app')) {
      console.log(`[CORS Decision] ALLOWED (Matches .vercel.app suffix) -> returning true`);
      return callback(null, true);
    }
    
    // 3. Otherwise reject and log
    console.warn(`[CORS Decision] REJECTED (Origin not whitelisted) -> returning Error`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 204, // Return HTTP 204 for OPTIONS preflight
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
