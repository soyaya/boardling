import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import authRoutes from './src/routes/auth.js';
import projectRoutes from './src/routes/project.js';
import walletRoutes from './src/routes/wallet.js';
import analyticsRoutes from './src/routes/analytics.js';
import { errorHandlerMiddleware } from './src/middleware/errorHandler.js';

const app = express();
app.use(bodyParser.json());

// Routes
app.use('/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', walletRoutes);
app.use('/api', analyticsRoutes);

// Error handling middleware (must be last)
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
