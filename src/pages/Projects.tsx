import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ExternalLink, Github, Globe, AlertCircle, Loader2 } from 'lucide-react';
import { useProjects, useProjectActions } from '../store/useProjectStore';
import { useToast } from '../hooks/useToast';
import type { Project, CreateProjectData, UpdateProjectData } from '../services/projectService';

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loading, error } = useProjects();
  const { fetchProjects, createProject, updateProject, deleteProject, setCurrentProject } = useProjectActions();
  const { showToast } = useToast();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setShowEditModal(true);
  };

  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    showToast('Project selected', 'success');
    navigate('/dashboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500">Manage your Zcash analytics projects</p>
        </div>
        <button
          onClick={handleCreateProject}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-900 font-medium text-sm">Error Loading Projects</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading projects...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first project to start tracking wallet analytics and insights.
          </p>
          <button
            onClick={handleCreateProject}
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={handleSelectProject}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <ProjectModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSubmit={async (data) => {
            setIsSubmitting(true);
            const result = await createProject(data);
            setIsSubmitting(false);
            
            if (result) {
              showToast('Project created successfully', 'success');
              setShowCreateModal(false);
            } else {
              showToast('Failed to create project', 'error');
            }
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Edit Project Modal */}
      {showEditModal && selectedProject && (
        <ProjectModal
          mode="edit"
          project={selectedProject}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProject(null);
          }}
          onSubmit={async (data) => {
            setIsSubmitting(true);
            const result = await updateProject(selectedProject.id, data);
            setIsSubmitting(false);
            
            if (result) {
              showToast('Project updated successfully', 'success');
              setShowEditModal(false);
              setSelectedProject(null);
            } else {
              showToast('Failed to update project', 'error');
            }
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProject && (
        <DeleteConfirmModal
          project={selectedProject}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedProject(null);
          }}
          onConfirm={async () => {
            setIsSubmitting(true);
            const result = await deleteProject(selectedProject.id);
            setIsSubmitting(false);
            
            if (result) {
              showToast('Project deleted successfully', 'success');
              setShowDeleteModal(false);
              setSelectedProject(null);
            } else {
              showToast('Failed to delete project', 'error');
            }
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

// Project Card Component
interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect, onEdit, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{project.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{project.category}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>

        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
        )}

        <div className="flex items-center gap-2 mb-4">
          {project.website_url && (
            <a
              href={project.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600"
              title="Website"
            >
              <Globe className="w-4 h-4" />
            </a>
          )}
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600"
              title="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          )}
        </div>

        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
          <button
            onClick={() => onSelect(project)}
            className="flex-1 px-3 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            Select
          </button>
          <button
            onClick={() => onEdit(project)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(project)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Project Modal Component
interface ProjectModalProps {
  mode: 'create' | 'edit';
  project?: Project;
  onClose: () => void;
  onSubmit: (data: CreateProjectData | UpdateProjectData) => void;
  isSubmitting: boolean;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ mode, project, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    category: project?.category || 'defi',
    website_url: project?.website_url || '',
    github_url: project?.github_url || '',
    default_wallet_address: project?.default_wallet_address || '',
    tags: project?.tags?.join(', ') || '',
  });

  const categories = [
    'defi', 'social_fi', 'gamefi', 'nft', 'infrastructure',
    'governance', 'cefi', 'metaverse', 'dao', 'identity',
    'storage', 'ai_ml', 'other'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: any = {
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category as any,
      website_url: formData.website_url || undefined,
      github_url: formData.github_url || undefined,
      default_wallet_address: formData.default_wallet_address || undefined,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    };

    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'create' ? 'Create New Project' : 'Edit Project'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="My Zcash Project"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Brief description of your project"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black capitalize"
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="capitalize">
                  {cat.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <input
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GitHub URL
            </label>
            <input
              type="url"
              value={formData.github_url}
              onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="https://github.com/username/repo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Wallet Address
            </label>
            <input
              type="text"
              value={formData.default_wallet_address}
              onChange={(e) => setFormData({ ...formData, default_wallet_address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-mono text-sm"
              placeholder="zs1... or t1... (Zcash address)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional: Specify a Zcash address to track. Can be added later.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="zcash, defi, privacy"
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </span>
              ) : (
                mode === 'create' ? 'Create Project' : 'Save Changes'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
interface DeleteConfirmModalProps {
  project: Project;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ project, onClose, onConfirm, isSubmitting }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Project?</h2>
          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to delete <strong>{project.name}</strong>? This action cannot be undone and will delete all associated wallets and analytics data.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                'Delete Project'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
