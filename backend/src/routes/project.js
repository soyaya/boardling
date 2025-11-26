import express from 'express';
import {
  createProjectController,
  getProjectsController,
  getProjectController,
  updateProjectController,
  deleteProjectController
} from '../controllers/project.js';
import { authenticateToken } from '../middleware/users.js';

const router = express.Router();

// All project routes require authentication
router.use(authenticateToken);

// CRUD Routes
router.post('/', createProjectController);        // CREATE
router.get('/', getProjectsController);           // READ ALL
router.get('/:id', getProjectController);         // READ ONE
router.put('/:id', updateProjectController);      // UPDATE
router.delete('/:id', deleteProjectController);   // DELETE

export default router;
