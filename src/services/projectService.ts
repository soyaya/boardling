/**
 * Project Service
 * 
 * Handles all project-related API operations with comprehensive error handling
 * and request/response typing.
 * 
 * Requirements: 4.1, 4.4, 4.5
 */

import { api } from './apiClient';

// Project category types based on backend schema
export type ProjectCategory = 
  | 'defi' 
  | 'social_fi' 
  | 'gamefi' 
  | 'nft' 
  | 'infrastructure' 
  | 'governance' 
  | 'cefi' 
  | 'metaverse' 
  | 'dao' 
  | 'identity' 
  | 'storage' 
  | 'ai_ml' 
  | 'other';

// Project status types based on backend schema
export type ProjectStatus = 
  | 'draft' 
  | 'active' 
  | 'paused' 
  | 'completed' 
  | 'cancelled';

// Complete project interface matching backend model
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: ProjectCategory;
  status: ProjectStatus;
  website_url: string | null;
  github_url: string | null;
  logo_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  launched_at: string | null;
}

// Data required to create a new project
export interface CreateProjectData {
  name: string;
  description?: string;
  category?: ProjectCategory;
  website_url?: string;
  github_url?: string;
  logo_url?: string;
  tags?: string[];
}

// Data that can be updated on an existing project
export interface UpdateProjectData {
  name?: string;
  description?: string;
  category?: ProjectCategory;
  status?: ProjectStatus;
  website_url?: string;
  github_url?: string;
  logo_url?: string;
  tags?: string[];
  launched_at?: string;
}

// Service response types
export interface ProjectServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error class for project-specific errors
export class ProjectServiceError extends Error {
  public code?: string;
  public details?: any;

  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = 'ProjectServiceError';
    this.code = code;
    this.details = details;
  }
}

class ProjectService {
  /**
   * Create a new project
   * Requirement 4.1: Project creation stores all fields
   * 
   * @param data - Project creation data
   * @returns Promise with created project or error
   */
  async createProject(data: CreateProjectData): Promise<ProjectServiceResponse<Project>> {
    try {
      // Validate required fields
      if (!data.name || data.name.trim().length === 0) {
        return {
          success: false,
          error: 'Project name is required',
        };
      }

      // Validate name length
      if (data.name.length > 255) {
        return {
          success: false,
          error: 'Project name must be less than 255 characters',
        };
      }

      // Validate URLs if provided
      if (data.website_url && !this.isValidUrl(data.website_url)) {
        return {
          success: false,
          error: 'Invalid website URL format',
        };
      }

      if (data.github_url && !this.isValidUrl(data.github_url)) {
        return {
          success: false,
          error: 'Invalid GitHub URL format',
        };
      }

      if (data.logo_url && !this.isValidUrl(data.logo_url)) {
        return {
          success: false,
          error: 'Invalid logo URL format',
        };
      }

      const response = await api.projects.create(data);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to create project',
          message: response.message,
        };
      }

      return {
        success: true,
        data: response.data,
        message: response.message || 'Project created successfully',
      };
    } catch (error) {
      console.error('Create project error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create project',
      };
    }
  }

  /**
   * Get all projects for the current user
   * Requirement 4.4: Project list returns all user projects
   * 
   * @returns Promise with array of projects or error
   */
  async getProjects(): Promise<ProjectServiceResponse<Project[]>> {
    try {
      const response = await api.projects.list();

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to fetch projects',
          message: response.message,
        };
      }

      // Ensure we return an array even if backend returns null/undefined
      const projects = Array.isArray(response.data) ? response.data : [];

      return {
        success: true,
        data: projects,
        message: response.message,
      };
    } catch (error) {
      console.error('Get projects error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch projects',
        data: [], // Return empty array on error for easier handling
      };
    }
  }

  /**
   * Get a specific project by ID
   * Requirement 4.4: Retrieve individual project details
   * 
   * @param id - Project ID
   * @returns Promise with project or error
   */
  async getProject(id: string): Promise<ProjectServiceResponse<Project>> {
    try {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error: 'Project ID is required',
        };
      }

      const response = await api.projects.getById(id);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to fetch project',
          message: response.message,
        };
      }

      return {
        success: true,
        data: response.data,
        message: response.message,
      };
    } catch (error) {
      console.error('Get project error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch project',
      };
    }
  }

  /**
   * Update a project
   * Requirement 4.5: Project updates persist changes
   * 
   * @param id - Project ID
   * @param data - Fields to update
   * @returns Promise with updated project or error
   */
  async updateProject(id: string, data: UpdateProjectData): Promise<ProjectServiceResponse<Project>> {
    try {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error: 'Project ID is required',
        };
      }

      // Validate at least one field is being updated
      if (Object.keys(data).length === 0) {
        return {
          success: false,
          error: 'At least one field must be provided for update',
        };
      }

      // Validate name if provided
      if (data.name !== undefined) {
        if (data.name.trim().length === 0) {
          return {
            success: false,
            error: 'Project name cannot be empty',
          };
        }
        if (data.name.length > 255) {
          return {
            success: false,
            error: 'Project name must be less than 255 characters',
          };
        }
      }

      // Validate URLs if provided
      if (data.website_url !== undefined && data.website_url !== null && !this.isValidUrl(data.website_url)) {
        return {
          success: false,
          error: 'Invalid website URL format',
        };
      }

      if (data.github_url !== undefined && data.github_url !== null && !this.isValidUrl(data.github_url)) {
        return {
          success: false,
          error: 'Invalid GitHub URL format',
        };
      }

      if (data.logo_url !== undefined && data.logo_url !== null && !this.isValidUrl(data.logo_url)) {
        return {
          success: false,
          error: 'Invalid logo URL format',
        };
      }

      const response = await api.projects.update(id, data);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to update project',
          message: response.message,
        };
      }

      return {
        success: true,
        data: response.data,
        message: response.message || 'Project updated successfully',
      };
    } catch (error) {
      console.error('Update project error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update project',
      };
    }
  }

  /**
   * Delete a project
   * Requirement 4.5: Project deletion
   * 
   * @param id - Project ID
   * @returns Promise with success status or error
   */
  async deleteProject(id: string): Promise<ProjectServiceResponse<void>> {
    try {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error: 'Project ID is required',
        };
      }

      const response = await api.projects.delete(id);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to delete project',
          message: response.message,
        };
      }

      return {
        success: true,
        message: response.message || 'Project deleted successfully',
      };
    } catch (error) {
      console.error('Delete project error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete project',
      };
    }
  }

  /**
   * Get project dashboard data
   * 
   * @param id - Project ID
   * @returns Promise with dashboard data or error
   */
  async getProjectDashboard(id: string): Promise<ProjectServiceResponse<any>> {
    try {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error: 'Project ID is required',
        };
      }

      const response = await api.projects.getDashboard(id);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to fetch project dashboard',
          message: response.message,
        };
      }

      return {
        success: true,
        data: response.data,
        message: response.message,
      };
    } catch (error) {
      console.error('Get project dashboard error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch project dashboard',
      };
    }
  }

  /**
   * Update project status
   * 
   * @param id - Project ID
   * @param status - New status
   * @returns Promise with updated project or error
   */
  async updateProjectStatus(id: string, status: ProjectStatus): Promise<ProjectServiceResponse<Project>> {
    return this.updateProject(id, { status });
  }

  /**
   * Archive a project (set status to cancelled)
   * 
   * @param id - Project ID
   * @returns Promise with updated project or error
   */
  async archiveProject(id: string): Promise<ProjectServiceResponse<Project>> {
    return this.updateProject(id, { status: 'cancelled' });
  }

  /**
   * Activate a project (set status to active)
   * 
   * @param id - Project ID
   * @returns Promise with updated project or error
   */
  async activateProject(id: string): Promise<ProjectServiceResponse<Project>> {
    return this.updateProject(id, { status: 'active' });
  }

  /**
   * Pause a project (set status to paused)
   * 
   * @param id - Project ID
   * @returns Promise with updated project or error
   */
  async pauseProject(id: string): Promise<ProjectServiceResponse<Project>> {
    return this.updateProject(id, { status: 'paused' });
  }

  /**
   * Mark project as completed
   * 
   * @param id - Project ID
   * @returns Promise with updated project or error
   */
  async completeProject(id: string): Promise<ProjectServiceResponse<Project>> {
    return this.updateProject(id, { status: 'completed' });
  }

  /**
   * Validate URL format
   * 
   * @param url - URL string to validate
   * @returns true if valid URL, false otherwise
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get project categories
   * 
   * @returns Array of valid project categories
   */
  getProjectCategories(): ProjectCategory[] {
    return [
      'defi',
      'social_fi',
      'gamefi',
      'nft',
      'infrastructure',
      'governance',
      'cefi',
      'metaverse',
      'dao',
      'identity',
      'storage',
      'ai_ml',
      'other',
    ];
  }

  /**
   * Get project statuses
   * 
   * @returns Array of valid project statuses
   */
  getProjectStatuses(): ProjectStatus[] {
    return ['draft', 'active', 'paused', 'completed', 'cancelled'];
  }

  /**
   * Format project category for display
   * 
   * @param category - Project category
   * @returns Formatted category string
   */
  formatCategory(category: ProjectCategory): string {
    const categoryMap: Record<ProjectCategory, string> = {
      defi: 'DeFi',
      social_fi: 'Social Fi',
      gamefi: 'GameFi',
      nft: 'NFT',
      infrastructure: 'Infrastructure',
      governance: 'Governance',
      cefi: 'CeFi',
      metaverse: 'Metaverse',
      dao: 'DAO',
      identity: 'Identity',
      storage: 'Storage',
      ai_ml: 'AI/ML',
      other: 'Other',
    };
    return categoryMap[category] || category;
  }

  /**
   * Format project status for display
   * 
   * @param status - Project status
   * @returns Formatted status string
   */
  formatStatus(status: ProjectStatus): string {
    const statusMap: Record<ProjectStatus, string> = {
      draft: 'Draft',
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return statusMap[status] || status;
  }
}

// Export singleton instance
export const projectService = new ProjectService();
export default projectService;