import { createProject, getAllProjects, getProjectById, updateProject, deleteProject } from '../models/project.js';
import { ensureDefaultWalletAddress } from '../services/projectWalletService.js';
import { BadRequestError, NotFoundError } from '../errors/index.js';

// CREATE
const createProjectController = async (req, res, next) => {
  try {
    const { name, description, category, website_url, github_url, logo_url, tags, default_wallet_address } = req.body;
    
    if (!name) {
      throw new BadRequestError('Project name is required');
    }

    // Validate wallet address if provided
    if (default_wallet_address) {
      const { validateZcashAddress } = await import('../utils/zcashAddress.js');
      const validation = validateZcashAddress(default_wallet_address, 'mainnet');
      
      if (!validation.valid) {
        throw new BadRequestError(`Invalid Zcash address: ${validation.error}`);
      }
    }

    const project = await createProject({
      user_id: req.user.id,
      name,
      description,
      category: category || 'other',
      website_url,
      github_url,
      logo_url,
      tags: tags || [],
      default_wallet_address
    });

    // If wallet address provided, create wallet and index it
    if (default_wallet_address) {
      try {
        const { createWallet } = await import('../models/wallet.js');
        const { detectAddressType } = await import('../utils/zcashAddress.js');
        
        const walletType = detectAddressType(default_wallet_address, 'mainnet');
        
        const wallet = await createWallet({
          project_id: project.id,
          address: default_wallet_address,
          type: walletType,
          privacy_mode: 'private',
          network: 'mainnet',
          is_active: true
        });
        
        // Index wallet in background (don't wait)
        const { processWalletTransactions } = await import('../services/walletTrackingService.js');
        processWalletTransactions(wallet).catch(err => {
          console.warn(`Failed to index wallet ${wallet.id}:`, err.message);
        });
        
        console.log(`✓ Created and indexing wallet for project ${project.id}`);
      } catch (walletError) {
        console.warn(`Failed to create wallet for project ${project.id}:`, walletError.message);
        // Don't fail project creation if wallet creation fails
      }
    }

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

// READ ALL
const getProjectsController = async (req, res, next) => {
  try {
    const projects = await getAllProjects(req.user.id);
    
    // Ensure default wallet addresses are set for all projects (async, don't wait)
    projects.forEach(project => {
      if (!project.default_wallet_address) {
        ensureDefaultWalletAddress(project.id).catch(err => {
          console.warn(`Could not set default wallet for project ${project.id}:`, err.message);
        });
      }
    });
    
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
};

// READ ONE
const getProjectController = async (req, res, next) => {
  try {
    let project = await getProjectById(req.params.id, req.user.id);
    
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Ensure default wallet address is set and indexed
    if (!project.default_wallet_address) {
      try {
        const result = await ensureDefaultWalletAddress(project.id);
        if (result.success && result.project) {
          project = result.project;
        }
      } catch (walletError) {
        // Log but don't fail the request
        console.warn(`Could not set default wallet for project ${project.id}:`, walletError.message);
      }
    }

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

// UPDATE
const updateProjectController = async (req, res, next) => {
  try {
    const { name, description, category, status, website_url, github_url, logo_url, tags } = req.body;
    
    const project = await updateProject(req.params.id, req.user.id, {
      name,
      description,
      category,
      status,
      website_url,
      github_url,
      logo_url,
      tags
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

// DELETE
const deleteProjectController = async (req, res, next) => {
  try {
    const project = await deleteProject(req.params.id, req.user.id);

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export { 
  createProjectController, 
  getProjectsController, 
  getProjectController, 
  updateProjectController, 
  deleteProjectController 
};
