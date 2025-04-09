/**
 * API Service for communication with the backend
 */

import axios from 'axios';
import { ApiResponse } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Creation of an axios instance with basic configuration
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.error || 'An error occurred';
    console.error('API Error:', errorMessage);
    return Promise.reject(errorMessage);
  }
);

// Helper function to normalize IDs/slugs
// If the ID looks like a UUID, return it as is
// Otherwise consider it a slug and pass it as is
// The backend must be adapted to search by ID or slug
const normalizeIdOrSlug = (idOrSlug: string): string => {
  return idOrSlug;
};

// API Service for projects
export const projectsApi = {
  getAll: () => axiosInstance.get('/api/projects'),
  getById: (idOrSlug: string) => axiosInstance.get(`/api/projects/${normalizeIdOrSlug(idOrSlug)}`),
  create: (data: any) => axiosInstance.post('/api/projects', data),
  update: (idOrSlug: string, data: any) => axiosInstance.put(`/api/projects/${normalizeIdOrSlug(idOrSlug)}`, data),
  delete: (idOrSlug: string) => axiosInstance.delete(`/api/projects/${normalizeIdOrSlug(idOrSlug)}`),
};

// API Service for repositories
export const repositoriesApi = {
  getAll: (projectId?: string) => {
    const url = projectId 
      ? `/api/repositories?project_id=${normalizeIdOrSlug(projectId)}` 
      : '/api/repositories';
    return axiosInstance.get(url);
  },
  getById: (idOrSlug: string, projectId?: string) => {
    const url = projectId 
      ? `/api/repositories/${normalizeIdOrSlug(idOrSlug)}?project_id=${normalizeIdOrSlug(projectId)}` 
      : `/api/repositories/${normalizeIdOrSlug(idOrSlug)}`;
    return axiosInstance.get(url);
  },
  create: (data: any) => axiosInstance.post('/api/repositories', data),
  update: (idOrSlug: string, data: any, projectId?: string) => {
    const url = projectId 
      ? `/api/repositories/${normalizeIdOrSlug(idOrSlug)}?project_id=${normalizeIdOrSlug(projectId)}` 
      : `/api/repositories/${normalizeIdOrSlug(idOrSlug)}`;
    return axiosInstance.put(url, data);
  },
  delete: (idOrSlug: string, projectId?: string) => {
    const url = projectId 
      ? `/api/repositories/${normalizeIdOrSlug(idOrSlug)}?project_id=${normalizeIdOrSlug(projectId)}` 
      : `/api/repositories/${normalizeIdOrSlug(idOrSlug)}`;
    return axiosInstance.delete(url);
  },
  sync: (idOrSlug: string) => axiosInstance.post(`/api/repositories/${normalizeIdOrSlug(idOrSlug)}/sync`),
  getBranches: (idOrSlug: string) => axiosInstance.get(`/api/repositories/${normalizeIdOrSlug(idOrSlug)}/branches`),
  getTopics: (idOrSlug: string) => axiosInstance.get(`/api/repositories/${normalizeIdOrSlug(idOrSlug)}/topics`),
  forceUpdateTags: () => axiosInstance.post('/api/repositories/force-update-tags'),
  import: (data: any) => axiosInstance.post('/api/repositories/import', data)
};

interface RenderOptions {
  profile_id: string;
  output_format: 'mp4' | 'webm' | 'gif';
  quality: 'low' | 'medium' | 'high';
}

// API Service for settings
export const settingsApi = {
  checkGithubToken: () => axiosInstance.get('/api/settings/github/token'),
  saveGithubToken: (token: string) => axiosInstance.post('/api/settings/github/token', { token }),
  testGithubToken: () => axiosInstance.get('/api/settings/github/token/test'),
  removeGithubToken: () => axiosInstance.delete('/api/settings/github/token')
};

// Generic HTTP methods for compatibility with older code
const api = {
  get: (url: string, params?: any) => axiosInstance.get(`/api${url}`, { params }),
  post: (url: string, data?: any) => axiosInstance.post(`/api${url}`, data),
  put: (url: string, data?: any) => axiosInstance.put(`/api${url}`, data),
  delete: (url: string) => axiosInstance.delete(`/api${url}`),
  
  // Specific APIs
  projects: projectsApi,
  repositories: repositoriesApi,
  settings: settingsApi
};

export default api; 