import express from 'express';
import {
  createWalletController,
  getProjectWalletsController,
  getWalletController,
  updateWalletController,
  deleteWalletController,
  getUserWalletsController,
  getWalletsByTypeController,
  getActiveWalletsController
} from '../controllers/wallet.js';
import { authenticateToken } from '../middleware/users.js';

const router = express.Router();

// All wallet routes require authentication
router.use(authenticateToken);

// User-level wallet routes
router.get('/user/wallets', getUserWalletsController); // Get all wallets for authenticated user

// Project-specific wallet routes
router.post('/projects/:projectId/wallets', createWalletController);           // CREATE wallet for project
router.get('/projects/:projectId/wallets', getProjectWalletsController);      // GET all wallets for project
router.get('/projects/:projectId/wallets/active', getActiveWalletsController); // GET active wallets for project
router.get('/projects/:projectId/wallets/type', getWalletsByTypeController);   // GET wallets by type for project
router.get('/projects/:projectId/wallets/:walletId', getWalletController);     // GET single wallet
router.put('/projects/:projectId/wallets/:walletId', updateWalletController);  // UPDATE wallet
router.delete('/projects/:projectId/wallets/:walletId', deleteWalletController); // DELETE wallet

export default router;