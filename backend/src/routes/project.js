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
import { requireOwnership } from '../middleware/authorization.js';

const router = express.Router();

// All project routes require authentication
router.use(authenticateJWT);

// CRUD Routes
router.post('/', createProjectController);        // CREATE
router.get('/', getProjectsController);           // READ ALL
router.get('/:id', requireOwnership('project'), getProjectController);         // READ ONE
router.put('/:id', requireOwnership('project'), updateProjectController);      // UPDATE
router.delete('/:id', requireOwnership('project'), deleteProjectController);   // DELETE

// Nested wallet routes (backward compatibility)
router.post('/:projectId/wallets', requireOwnership('project', 'projectId'), createWalletController);           // CREATE wallet for project
router.get('/:projectId/wallets', requireOwnership('project', 'projectId'), getProjectWalletsController);      // GET all wallets for project
router.get('/:projectId/wallets/active', requireOwnership('project', 'projectId'), getActiveWalletsController); // GET active wallets for project
router.get('/:projectId/wallets/type', requireOwnership('project', 'projectId'), getWalletsByTypeController);   // GET wallets by type for project
router.get('/:projectId/wallets/:walletId', requireOwnership('wallet', 'walletId'), getWalletController);     // GET single wallet
router.put('/:projectId/wallets/:walletId', requireOwnership('wallet', 'walletId'), updateWalletController);  // UPDATE wallet
router.delete('/:projectId/wallets/:walletId', requireOwnership('wallet', 'walletId'), deleteWalletController); // DELETE wallet

export default router;
