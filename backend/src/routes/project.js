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

// Sync default wallets endpoint
router.post('/sync-default-wallets', async (req, res, next) => {
  try {
    const { getAllProjects } = await import('../models/project.js');
    const { ensureDefaultWalletAddress } = await import('../services/projectWalletService.js');
    
    // Get user's projects
    const userProjects = await getAllProjects(req.user.id);
    
    if (userProjects.length === 0) {
      return res.json({ success: true, message: 'No projects to sync', synced: 0 });
    }
    
    // Sync each project
    let synced = 0;
    for (const project of userProjects) {
      try {
        const result = await ensureDefaultWalletAddress(project.id);
        if (result.success) synced++;
      } catch (err) {
        console.warn(`Failed to sync project ${project.id}:`, err.message);
      }
    }
    
    res.json({ 
      success: true, 
      message: `Synced ${synced}/${userProjects.length} projects`,
      synced,
      total: userProjects.length
    });
  } catch (err) {
    next(err);
  }
});

// Nested wallet routes (backward compatibility)
router.post('/:projectId/wallets', requireOwnership('project', 'projectId'), createWalletController);           // CREATE wallet for project
router.get('/:projectId/wallets', requireOwnership('project', 'projectId'), getProjectWalletsController);      // GET all wallets for project
router.get('/:projectId/wallets/active', requireOwnership('project', 'projectId'), getActiveWalletsController); // GET active wallets for project
router.get('/:projectId/wallets/type', requireOwnership('project', 'projectId'), getWalletsByTypeController);   // GET wallets by type for project
router.get('/:projectId/wallets/:walletId', requireOwnership('wallet', 'walletId'), getWalletController);     // GET single wallet
router.put('/:projectId/wallets/:walletId', requireOwnership('wallet', 'walletId'), updateWalletController);  // UPDATE wallet
router.delete('/:projectId/wallets/:walletId', requireOwnership('wallet', 'walletId'), deleteWalletController); // DELETE wallet

export default router;
