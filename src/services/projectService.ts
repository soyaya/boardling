/**
 * Project Service
 * 
 * Handles all project-related API operations
 */

import { api } from './apiClient';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'archived';
  website_url?: string;
  github_url?: string;
  logo_url?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  name: string;
  description: string;
  category: string;
  website_url?: string;
  github_url?: string;
  logo_url?: string;
  tags?: string[];
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  status?: 'active' | 'inactive' | 'archived';
}

class ProjectService {
  /**
   * Create a new project
   */
  async createProject(data: CreateProjectData) {
    return api.projects.create(data);
  }

  /**
   * Get all projects for the current user
   */
  async getProjects() {
    return api.projects.list();
  }

  /**
   * Get a specific project by ID
   */
  async getProject(id: string) {
    return api.projects.getById(id);
  }

  /**
   * Update a project
   */
  async updateProject(id: string, data: UpdateProjectData) {
    return api.projects.update(id, data);
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string) {
    return api.projects.delete(id);
  }

  /**
   * Get project dashboard data
   */
  async getProjectDashboard(id: string) {
    return api.projects.getDashboard(id);
  }

  /**
   * Archive a project (soft delete)
   */
  async archiveProject(id: string) {
    return this.updateProject(id, { status: 'archived' });
  }

  /**
   * Activate a project
   */
  async activateProject(id: string) {
    return this.updateProject(id, { status: 'active' });
  }
}

// Export singleton instance
export const projectService = new ProjectService();
export default projectService;