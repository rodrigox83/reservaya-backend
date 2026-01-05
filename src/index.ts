import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import grillsRoutes from './routes/grills.js';
import reservationsRoutes from './routes/reservations.js';
import adminRoutes from './routes/admin.js';
import poolRoutes from './routes/pool.js';
import guestsRoutes from './routes/guests.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { setupSwagger } from './swagger.js';
import { cleanupExpiredAccesses } from './controllers/pool.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://reservaya-frontend-stg.azurewebsites.net',
  'https://reservaya-frontend-prod.azurewebsites.net',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now in development
    }
  },
  credentials: true,
}));
app.use(express.json());

// Swagger documentation
setupSwagger(app);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/grills', grillsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pool', poolRoutes);
app.use('/api/guests', guestsRoutes);

// Health check (both endpoints for compatibility)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Job periódico para limpiar accesos vencidos de la piscina (cada minuto)
  const CLEANUP_INTERVAL = 60 * 1000; // 1 minuto
  setInterval(async () => {
    try {
      await cleanupExpiredAccesses();
    } catch (error) {
      console.error('[Pool Cleanup] Error:', error);
    }
  }, CLEANUP_INTERVAL);

  // Ejecutar limpieza inicial al arrancar
  cleanupExpiredAccesses().catch(err => console.error('[Pool Cleanup] Error inicial:', err));
});
