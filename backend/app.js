import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from './src/routes/auth.js';
import projectRoutes from './src/routes/project.js';
import walletRoutes from './src/routes/wallet.js';
import analyticsRoutes from './src/routes/analytics.js';
import adminRoutes from './src/routes/admin.js';
import walletTrackingRoutes from './src/routes/walletTracking.js';
import { errorHandlerMiddleware } from './src/middleware/errorHandler.js';
import { startWalletTracking } from './src/services/walletTrackingService.js';
import pool from './src/db/db.js';

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Make pool available to routes
app.locals.pool = pool;

// Routes
app.use('/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', walletRoutes);
app.use('/api', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wallet-tracking', walletTrackingRoutes);

// Error handling middleware (must be last)
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start wallet tracking service
  // Sync every 5 minutes (300000ms) - adjust as needed
  const syncInterval = parseInt(process.env.WALLET_SYNC_INTERVAL_MS || '300000');
  console.log(`Starting wallet tracking service (sync interval: ${syncInterval}ms)`);
  
  startWalletTracking(syncInterval)
    .then(() => console.log('Wallet tracking service started'))
    .catch(err => console.error('Failed to start wallet tracking service:', err.message));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end();
  });
});
