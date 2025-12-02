import express from 'express';
import {
  createWalletController,
  getProjectWalletsController,
  getWalletController,
  updateWalletController,
  deleteWalletController,
  getUserWalletsController,
  getWalletsByTypeController,
  getActiveWalletsController,
  validateAddressController
} from '../controllers/wallet.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// All wallet routes require JWT authentication
router.use(authenticateJWT);

// Wallet validation endpoint (no project required)
// POST /api/wallets/validate - Validate Zcash address
router.post('/validate', validateAddressController);

// Simplified wallet routes (as per task requirements)
// POST /api/wallets - Add wallet to project (requires project_id in body)
router.post('/', createWalletController);

// GET /api/wallets - List project wallets (requires project_id query param)
router.get('/', getProjectWalletsController);

// GET /api/wallets/:id - Get wallet details
router.get('/:walletId', getWalletController);

// PUT /api/wallets/:id - Update wallet privacy mode
router.put('/:walletId', updateWalletController);

// DELETE /api/wallets/:id - Remove wallet
router.delete('/:walletId', deleteWalletController);

export default router;