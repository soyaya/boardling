import { 
  createWallet, 
  getAllWalletsByProject, 
  getWalletById, 
  updateWallet, 
  deleteWallet,
  getWalletsByUser,
  getWalletsByType,
  getActiveWallets
} from '../models/wallet.js';
import { getProjectById } from '../models/project.js';
import { BadRequestError, NotFoundError } from '../errors/index.js';
import { validateZcashAddress, detectAddressType, getAddressTypeName } from '../utils/zcashAddress.js';
import pool from '../db/db.js';

// CREATE WALLET
const createWalletController = async (req, res, next) => {
  try {
    // Support both URL param and body for projectId
    const projectId = req.params.projectId || req.body.project_id;
    const { address, type, privacy_mode, description, network, is_active } = req.body;
    
    if (!projectId) {
      throw new BadRequestError('Project ID is required');
    }
    
    if (!address) {
      throw new BadRequestError('Address is required');
    }

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const wallet = await createWallet({
      project_id: projectId,
      address,
      type, // Optional - will be auto-detected if not provided
      privacy_mode,
      description,
      network,
      is_active
    });

    res.status(201).json({ success: true, data: wallet });
  } catch (err) {
    if (err.message.includes('duplicate key value') || err.message.includes('already exists')) {
      return next(new BadRequestError('Wallet address already exists for this network'));
    }
    if (err.message.includes('Invalid') || err.message.includes('Could not detect')) {
      return next(new BadRequestError(err.message));
    }
    next(err);
  }
};

// GET ALL WALLETS FOR A PROJECT
const getProjectWalletsController = async (req, res, next) => {
  try {
    // Support both URL param and query param for projectId
    const projectId = req.params.projectId || req.query.project_id || req.query.projectId;
    
    if (!projectId) {
      throw new BadRequestError('Project ID is required');
    }
    
    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const wallets = await getAllWalletsByProject(projectId);
    res.json({ success: true, data: wallets });
  } catch (err) {
    next(err);
  }
};

// GET SINGLE WALLET
const getWalletController = async (req, res, next) => {
  try {
    const { walletId } = req.params;
    const projectId = req.params.projectId || req.query.project_id || req.query.projectId;
    
    if (!walletId) {
      throw new BadRequestError('Wallet ID is required');
    }
    
    // If projectId is provided, verify project belongs to user
    if (projectId) {
      const project = await getProjectById(projectId, req.user.id);
      if (!project) {
        throw new NotFoundError('Project not found');
      }
      
      const wallet = await getWalletById(walletId, projectId);
      
      if (!wallet) {
        throw new NotFoundError('Wallet not found');
      }
      
      res.json({ success: true, data: wallet });
    } else {
      // If no projectId, get wallet and verify it belongs to user's project
      const result = await pool.query(
        `SELECT w.*, p.user_id 
         FROM wallets w 
         JOIN projects p ON w.project_id = p.id 
         WHERE w.id = $1`,
        [walletId]
      );
      
      if (result.rows.length === 0) {
        throw new NotFoundError('Wallet not found');
      }
      
      const wallet = result.rows[0];
      
      if (wallet.user_id !== req.user.id) {
        throw new NotFoundError('Wallet not found');
      }
      
      res.json({ success: true, data: wallet });
    }
  } catch (err) {
    next(err);
  }
};

// UPDATE WALLET
const updateWalletController = async (req, res, next) => {
  try {
    const { walletId } = req.params;
    const projectId = req.params.projectId || req.body.project_id || req.query.project_id;
    const { address, type, privacy_mode, description, network, is_active } = req.body;
    
    if (!walletId) {
      throw new BadRequestError('Wallet ID is required');
    }
    
    // If projectId is provided, verify project belongs to user
    if (projectId) {
      const project = await getProjectById(projectId, req.user.id);
      if (!project) {
        throw new NotFoundError('Project not found');
      }
      
      const wallet = await updateWallet(walletId, projectId, {
        address,
        type,
        privacy_mode,
        description,
        network,
        is_active
      });

      if (!wallet) {
        throw new NotFoundError('Wallet not found');
      }

      res.json({ success: true, data: wallet });
    } else {
      // If no projectId, verify wallet belongs to user's project
      const result = await pool.query(
        `SELECT w.project_id, p.user_id 
         FROM wallets w 
         JOIN projects p ON w.project_id = p.id 
         WHERE w.id = $1`,
        [walletId]
      );
      
      if (result.rows.length === 0) {
        throw new NotFoundError('Wallet not found');
      }
      
      const walletData = result.rows[0];
      
      if (walletData.user_id !== req.user.id) {
        throw new NotFoundError('Wallet not found');
      }
      
      const wallet = await updateWallet(walletId, walletData.project_id, {
        address,
        type,
        privacy_mode,
        description,
        network,
        is_active
      });

      if (!wallet) {
        throw new NotFoundError('Wallet not found');
      }

      res.json({ success: true, data: wallet });
    }
  } catch (err) {
    if (err.message.includes('duplicate key value') || err.message.includes('already exists')) {
      return next(new BadRequestError('Wallet address already exists for this network'));
    }
    if (err.message.includes('Invalid')) {
      return next(new BadRequestError(err.message));
    }
    next(err);
  }
};

// DELETE WALLET
const deleteWalletController = async (req, res, next) => {
  try {
    const { walletId } = req.params;
    const projectId = req.params.projectId || req.query.project_id || req.query.projectId;
    
    if (!walletId) {
      throw new BadRequestError('Wallet ID is required');
    }
    
    // If projectId is provided, verify project belongs to user
    if (projectId) {
      const project = await getProjectById(projectId, req.user.id);
      if (!project) {
        throw new NotFoundError('Project not found');
      }
      
      const wallet = await deleteWallet(walletId, projectId);

      if (!wallet) {
        throw new NotFoundError('Wallet not found');
      }

      res.json({ success: true, message: 'Wallet deleted successfully' });
    } else {
      // If no projectId, verify wallet belongs to user's project
      const result = await pool.query(
        `SELECT w.project_id, p.user_id 
         FROM wallets w 
         JOIN projects p ON w.project_id = p.id 
         WHERE w.id = $1`,
        [walletId]
      );
      
      if (result.rows.length === 0) {
        throw new NotFoundError('Wallet not found');
      }
      
      const walletData = result.rows[0];
      
      if (walletData.user_id !== req.user.id) {
        throw new NotFoundError('Wallet not found');
      }
      
      const wallet = await deleteWallet(walletId, walletData.project_id);

      if (!wallet) {
        throw new NotFoundError('Wallet not found');
      }

      res.json({ success: true, message: 'Wallet deleted successfully' });
    }
  } catch (err) {
    next(err);
  }
};

// GET ALL USER WALLETS (across all projects)
const getUserWalletsController = async (req, res, next) => {
  try {
    const wallets = await getWalletsByUser(req.user.id);
    res.json({ success: true, data: wallets });
  } catch (err) {
    next(err);
  }
};

// GET WALLETS BY TYPE
const getWalletsByTypeController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { type } = req.query;
    
    if (!type) {
      throw new BadRequestError('Wallet type is required');
    }

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const wallets = await getWalletsByType(projectId, type);
    res.json({ success: true, data: wallets });
  } catch (err) {
    next(err);
  }
};

// GET ACTIVE WALLETS
const getActiveWalletsController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    
    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const wallets = await getActiveWallets(projectId);
    res.json({ success: true, data: wallets });
  } catch (err) {
    next(err);
  }
};

// VALIDATE ZCASH ADDRESS
const validateAddressController = async (req, res, next) => {
  try {
    const { address, network } = req.body;
    
    if (!address) {
      throw new BadRequestError('Address is required');
    }

    const walletNetwork = network || 'mainnet';
    const validNetworks = ['mainnet', 'testnet'];
    
    if (!validNetworks.includes(walletNetwork)) {
      throw new BadRequestError('Invalid network. Must be mainnet or testnet');
    }

    // Validate the address
    const validation = validateZcashAddress(address, walletNetwork);
    
    if (!validation.valid) {
      return res.status(200).json({ 
        success: true, 
        data: {
          valid: false,
          address: address,
          network: walletNetwork,
          error: validation.error
        }
      });
    }

    // Address is valid, return details
    const addressType = detectAddressType(address, walletNetwork);
    const typeName = getAddressTypeName(addressType);

    res.status(200).json({ 
      success: true, 
      data: {
        valid: true,
        address: address,
        network: walletNetwork,
        type: addressType,
        typeName: typeName,
        error: null
      }
    });
  } catch (err) {
    next(err);
  }
};

export { 
  createWalletController,
  getProjectWalletsController,
  getWalletController,
  updateWalletController,
  deleteWalletController,
  getUserWalletsController,
  getWalletsByTypeController,
  getActiveWalletsController,
  validateAddressController
};