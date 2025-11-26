import { createProject, getAllProjects, getProjectById, updateProject, deleteProject } from '../models/project.js';
import { BadRequestError, NotFoundError } from '../errors/index.js';

// CREATE
const createProjectController = async (req, res, next) => {
  try {
    const { name, description, category, website_url, github_url, logo_url, tags } = req.body;
    
    if (!name) {
      throw new BadRequestError('Project name is required');
    }

    const project = await createProject({
      user_id: req.user.id,
      name,
      description,
      category: category || 'other',
      website_url,
      github_url,
      logo_url,
      tags: tags || []
    });

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

// READ ALL
const getProjectsController = async (req, res, next) => {
  try {
    const projects = await getAllProjects(req.user.id);
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
};

// READ ONE
const getProjectController = async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id, req.user.id);
    
    if (!project) {
      throw new NotFoundError('Project not found');
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
