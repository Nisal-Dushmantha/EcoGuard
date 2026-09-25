import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import healthRoutes from './modules/common/health.routes.js';
import { webAppRoutes } from './modules/webapp/index.js';
import { mobileRoutes } from './modules/mobile/index.js';

// Load environment variables (.env in current dir or root fallback)
dotenv.config();
if (!process.env.MONGODB_URI) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const app: Application = express();
const PORT = Number(process.env.PORT) || 5000;

// Global Middleware - allow all dev origins & credentials
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Modules ---
// 1. Common / Health Check
app.use('/api/health', healthRoutes);

// 2. Web Application Backend APIs
app.use('/api/webapp', webAppRoutes);

// 3. Mobile Application Backend APIs
app.use('/api/mobile', mobileRoutes);

// Root informational endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    app: 'EcoGuard API Gateway',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      webapp: '/api/webapp/status',
      mobile: '/api/mobile/status',
    },
  });
});

// Centralized error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server listening on 0.0.0.0 to accept IPv4, IPv6 localhost, and LAN connections
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 EcoGuard backend server running on http://localhost:${PORT}`);
  console.log(`💻 WebApp API:   http://localhost:${PORT}/api/webapp/status`);
  console.log(`📱 Mobile API:   http://localhost:${PORT}/api/mobile/status`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);

  await connectDB();
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another process. Please terminate it or set a different PORT in .env.`);
  } else {
    console.error('❌ Server startup error:', err);
  }
});
