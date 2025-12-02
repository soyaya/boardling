import express from 'express';
import {
  createProjectController,
  getProjectsController,
  getProjectController,
  updateProjectController,
  deleteProjectController
} from '../controllers/project.js';
import {
  createWalletController,
  getProjectWalletsController,
  getWalletController,
  updateWalletController,
  deleteWalletController,
  getWalletsByTypeController,
  getActiveWalletsController
} from '../controllers/wallet.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// All project routes require authentication
router.use(authenticateJWT);

// CRUD Routes
router.post('/', createProjectController);        // CREATE
router.get('/', getProjectsController);           // READ ALL
router.get('/:id', getProjectController);         // READ ONE
router.put('/:id', updateProjectController);      // UPDATE
router.delete('/:id', deleteProjectController);   // DELETE

// Nested wallet routes (backward compatibility)
router.post('/:projectId/wallets', createWalletController);           // CREATE wallet for project
router.get('/:projectId/wallets', getProjectWalletsController);      // GET all wallets for project
router.get('/:projectId/wallets/active', getActiveWalletsController); // GET active wallets for project
router.get('/:projectId/wallets/type', getWalletsByTypeController);   // GET wallets by type for project
router.get('/:projectId/wallets/:walletId', getWalletController);     // GET single wallet
router.put('/:projectId/wallets/:walletId', updateWalletController);  // UPDATE wallet
router.delete('/:projectId/wallets/:walletId', deleteWalletController); // DELETE wallet

export default router;
