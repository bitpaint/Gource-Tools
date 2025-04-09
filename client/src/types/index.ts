/**
 * Centralized type definitions for the application
 */

/**
 * Project entity interface
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  last_modified: string;
  repository_count?: number;
  tags?: string;
  slug?: string;
}

/**
 * Repository entity interface
 */
export interface Repository {
  id: string;
  name: string;
  url: string | null;
  username?: string | null;
  local_path?: string | null;
  branch?: string;
  branch_default?: string;
  tags?: string | null;
  last_updated?: string;
  last_commit?: string;
  slug?: string;
}

/**
 * Project-Repository relationship interface
 */
export interface ProjectRepository {
  id: string;
  project_id: string;
  repository_id: string;
  branch_override?: string;
  display_name?: string;
}

/**
 * API Response interface
 */
export interface ApiResponse<T = any> {
  data?: T;
  loading: boolean;
  error?: string;
}

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

/**
 * GitHub Token interface
 */
export interface GitHubToken {
  token: string;
  username?: string;
  scopes?: string[];
}

/**
 * Settings interface
 */
export interface AppSettings {
  githubToken?: GitHubToken;
  theme?: 'light' | 'dark';
  language?: 'en' | 'fr';
} 