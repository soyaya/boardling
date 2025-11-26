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

// CREATE WALLET
const createWalletController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { address, type, privacy_mode, description, network, is_active } = req.body;
    
    if (!address || !type) {
      throw new BadRequestError('Address and type are required');
    }

    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const wallet = await createWallet({
      project_id: projectId,
      address,
      type,
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
    if (err.message.includes('Invalid')) {
      return next(new BadRequestError(err.message));
    }
    next(err);
  }
};

// GET ALL WALLETS FOR A PROJECT
const getProjectWalletsController = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    
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
    const { projectId, walletId } = req.params;
    
    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const wallet = await getWalletById(walletId, projectId);
    
    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    res.json({ success: true, data: wallet });
  } catch (err) {
    next(err);
  }
};

// UPDATE WALLET
const updateWalletController = async (req, res, next) => {
  try {
    const { projectId, walletId } = req.params;
    const { address, type, privacy_mode, description, network, is_active } = req.body;
    
    // Verify project exists and belongs to user
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
    const { projectId, walletId } = req.params;
    
    // Verify project exists and belongs to user
    const project = await getProjectById(projectId, req.user.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const wallet = await deleteWallet(walletId, projectId);

    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    res.json({ success: true, message: 'Wallet deleted successfully' });
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

export { 
  createWalletController,
  getProjectWalletsController,
  getWalletController,
  updateWalletController,
  deleteWalletController,
  getUserWalletsController,
  getWalletsByTypeController,
  getActiveWalletsController
};