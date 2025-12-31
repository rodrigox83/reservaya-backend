import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import grillsRoutes from './routes/grills.js';
import reservationsRoutes from './routes/reservations.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { setupSwagger } from './swagger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Swagger documentation
setupSwagger(app);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/grills', grillsRoutes);
app.use('/api/reservations', reservationsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
