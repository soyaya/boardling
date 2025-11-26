import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import modularized routes
import routes from './routes/index.js';

// Import authentication routes from the simple server
import authRoutes from './routes/auth.js';

// Import additional routes from simple server
import projectRoutes from './routes/project.js';
import walletRoutes from './routes/wallet.js';
import analyticsRoutes from './routes/analytics.js';

// Import error handling middleware
import { errorHandlerMiddleware } from './middleware/errorHandler.js';

// Import config
import { pool, config } from './config/appConfig.js';

// Test database connection on startup
pool.query('SELECT 1')
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.log('⚠️  Database connection failed:', err.message));

// Export SDK for npm package usage
export { ZcashPaywall } from './sdk/index.js';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.apiRateLimit, // limit each IP to configured requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration (updated for frontend integration)
app.use(cors({
  origin: config.corsOrigin || 'http://localhost:5173', // Default to Vite dev server
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Authentication routes (from simple server)
app.use('/auth', authRoutes);

// Additional routes from simple server
app.use('/api/projects', projectRoutes);
app.use('/api', walletRoutes);
app.use('/api', analyticsRoutes);

// Use modularized routes (Zcash Paywall SDK routes)
app.use('/', routes);

// Error handling middleware (from simple server and global handler)
app.use(errorHandlerMiddleware);

// Global error handler (fallback)
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? error.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

// Start unified server
const PORT = config.port || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Unified Boardling Backend running on http://localhost:${PORT}`);
  console.log(`🔐 Authentication: http://localhost:${PORT}/auth/*`);
  console.log(`📊 Analytics: http://localhost:${PORT}/api/analytics/*`);
  console.log(`💼 Projects: http://localhost:${PORT}/api/projects/*`);
  console.log(`💰 Payments: http://localhost:${PORT}/api/invoice/*`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API docs: http://localhost:${PORT}/api`);
  console.log(`🔧 Environment: ${config.nodeEnv}`);
  console.log(`💰 Treasury address: ${config.platformTreasuryAddress || 'Not configured'}`);
});
