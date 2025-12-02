import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from './src/routes/auth.js';
import projectRoutes from './src/routes/project.js';
import walletRoutes from './src/routes/wallet.js';
import analyticsRoutes from './src/routes/analytics.js';
import { errorHandlerMiddleware } from './src/middleware/errorHandler.js';

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

// Routes
app.use('/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', walletRoutes);
app.use('/api', analyticsRoutes);

// Error handling middleware (must be last)
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
