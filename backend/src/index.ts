import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import apiRouter from './routes/api.js';

// Load environment variables (.env in current dir or root fallback)
dotenv.config();
if (!process.env.MONGODB_URI) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const app: Application = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRouter);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to EcoGuard Backend API Server',
    status: 'online',
    health: '/api/health',
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server and connect to database
app.listen(PORT, async () => {
  console.log(`🚀 EcoGuard backend server running on http://localhost:${PORT}`);
  console.log(`📡 Healthcheck available at: http://localhost:${PORT}/api/health`);
  console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);

  await connectDB();
});
