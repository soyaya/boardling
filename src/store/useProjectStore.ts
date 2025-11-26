/**
 * Project Store
 * 
 * Zustand store for managing project state across the application
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { projectService, type Project, type CreateProjectData, type UpdateProjectData } from '../services/projectService';

interface ProjectState {
  // State
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<Project | null>;
  updateProject: (id: string, data: UpdateProjectData) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  setCurrentProject: (project: Project | null) => void;
  getProject: (id: string) => Promise<Project | null>;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set, get) => ({
      // Initial state
      projects: [],
      currentProject: null,
      loading: false,
      error: null,

      // Fetch all projects
      fetchProjects: async () => {
        set({ loading: true, error: null });

        try {
          const response = await projectService.getProjects();

          if (response.success) {
            set({
              projects: response.data || [],
              loading: false,
              error: null,
            });
          } else {
            set({
              projects: [],
              loading: false,
              error: response.error || 'Failed to fetch projects',
            });
          }
        } catch (error) {
          console.error('Fetch projects error:', error);
          set({
            projects: [],
            loading: false,
            error: 'Network error. Please try again.',
          });
        }
      },

      // Create a new project
      createProject: async (data: CreateProjectData): Promise<Project | null> => {
        set({ loading: true, error: null });

        try {
          const response = await projectService.createProject(data);

          if (response.success && response.data) {
            const newProject = response.data;
            
            set(state => ({
              projects: [newProject, ...state.projects],
              currentProject: newProject,
              loading: false,
              error: null,
            }));

            return newProject;
          } else {
            set({
              loading: false,
              error: response.error || 'Failed to create project',
            });
            return null;
          }
        } catch (error) {
          console.error('Create project error:', error);
          set({
            loading: false,
            error: 'Network error. Please try again.',
          });
          return null;
        }
      },

      // Update a project
      updateProject: async (id: string, data: UpdateProjectData): Promise<Project | null> => {
        set({ loading: true, error: null });

        try {
          const response = await projectService.updateProject(id, data);

          if (response.success && response.data) {
            const updatedProject = response.data;
            
            set(state => ({
              projects: state.projects.map(p => 
                p.id === id ? updatedProject : p
              ),
              currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
              loading: false,
              error: null,
            }));

            return updatedProject;
          } else {
            set({
              loading: false,
              error: response.error || 'Failed to update project',
            });
            return null;
          }
        } catch (error) {
          console.error('Update project error:', error);
          set({
            loading: false,
            error: 'Network error. Please try again.',
          });
          return null;
        }
      },

      // Delete a project
      deleteProject: async (id: string): Promise<boolean> => {
        set({ loading: true, error: null });

        try {
          const response = await projectService.deleteProject(id);

          if (response.success) {
            set(state => ({
              projects: state.projects.filter(p => p.id !== id),
              currentProject: state.currentProject?.id === id ? null : state.currentProject,
              loading: false,
              error: null,
            }));

            return true;
          } else {
            set({
              loading: false,
              error: response.error || 'Failed to delete project',
            });
            return false;
          }
        } catch (error) {
          console.error('Delete project error:', error);
          set({
            loading: false,
            error: 'Network error. Please try again.',
          });
          return false;
        }
      },

      // Set current project
      setCurrentProject: (project: Project | null) => {
        set({ currentProject: project });
      },

      // Get a specific project
      getProject: async (id: string): Promise<Project | null> => {
        // First check if we already have it in state
        const existingProject = get().projects.find(p => p.id === id);
        if (existingProject) {
          set({ currentProject: existingProject });
          return existingProject;
        }

        // Otherwise fetch from API
        set({ loading: true, error: null });

        try {
          const response = await projectService.getProject(id);

          if (response.success && response.data) {
            const project = response.data;
            
            set(state => ({
              currentProject: project,
              // Add to projects list if not already there
              projects: state.projects.some(p => p.id === id) 
                ? state.projects 
                : [project, ...state.projects],
              loading: false,
              error: null,
            }));

            return project;
          } else {
            set({
              loading: false,
              error: response.error || 'Project not found',
            });
            return null;
          }
        } catch (error) {
          console.error('Get project error:', error);
          set({
            loading: false,
            error: 'Network error. Please try again.',
          });
          return null;
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'project-store',
    }
  )
);

// Selector hooks for common use cases
export const useProjects = () => {
  const { projects, loading, error } = useProjectStore();
  return { projects, loading, error };
};

export const useCurrentProject = () => {
  const { currentProject, loading, error } = useProjectStore();
  return { currentProject, loading, error };
};

export const useProjectActions = () => {
  const {
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    getProject,
    clearError,
  } = useProjectStore();

  return {
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    getProject,
    clearError,
  };
};