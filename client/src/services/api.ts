/**
 * Service API pour communiquer avec le backend
 */

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Type pour les réponses API
export interface ApiResponse<T = any> {
  data?: T;
  loading: boolean;
  error?: string;
}

// Création d'une instance axios avec la configuration de base
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pour traiter les erreurs
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.error || 'Une erreur est survenue';
    console.error('API Error:', errorMessage);
    return Promise.reject(errorMessage);
  }
);

// Service API pour les projets
export const projectsApi = {
  getAll: () => axiosInstance.get('/api/projects'),
  getById: (id: string) => axiosInstance.get(`/api/projects/${id}`),
  create: (data: any) => axiosInstance.post('/api/projects', data),
  update: (id: string, data: any) => axiosInstance.put(`/api/projects/${id}`, data),
  delete: (id: string) => axiosInstance.delete(`/api/projects/${id}`),
};

// Service API pour les dépôts
export const repositoriesApi = {
  getAll: (projectId?: string) => {
    const url = projectId ? `/api/repositories?project_id=${projectId}` : '/api/repositories';
    return axiosInstance.get(url);
  },
  getById: (id: string, projectId?: string) => {
    const url = projectId ? `/api/repositories/${id}?project_id=${projectId}` : `/api/repositories/${id}`;
    return axiosInstance.get(url);
  },
  create: (data: any) => axiosInstance.post('/api/repositories', data),
  update: (id: string, data: any, projectId?: string) => {
    const url = projectId ? `/api/repositories/${id}?project_id=${projectId}` : `/api/repositories/${id}`;
    return axiosInstance.put(url, data);
  },
  delete: (id: string, projectId?: string) => {
    const url = projectId ? `/api/repositories/${id}?project_id=${projectId}` : `/api/repositories/${id}`;
    return axiosInstance.delete(url);
  },
  sync: (id: string) => axiosInstance.post(`/api/repositories/${id}/sync`),
  getBranches: (id: string) => axiosInstance.get(`/api/repositories/${id}/branches`),
  getTopics: (id: string) => axiosInstance.get(`/api/repositories/${id}/topics`),
  forceUpdateTags: () => axiosInstance.post('/api/repositories/force-update-tags'),
  import: (data: any) => axiosInstance.post('/api/repositories/import', data)
};

interface RenderOptions {
  profile_id: string;
  output_format: 'mp4' | 'webm' | 'gif';
  quality: 'low' | 'medium' | 'high';
}

// Service API pour les fonctionnalités Gource (vide après suppression des fonctionnalités)
export const gourceApi = {};

// Service API pour les réglages
export const settingsApi = {
  checkGithubToken: () => axiosInstance.get('/api/settings/github/token'),
  saveGithubToken: (token: string) => axiosInstance.post('/api/settings/github/token', { token }),
  testGithubToken: () => axiosInstance.get('/api/settings/github/token/test'),
  removeGithubToken: () => axiosInstance.delete('/api/settings/github/token')
};

// Méthodes HTTP génériques pour être compatibles avec l'ancien code
const api = {
  get: (url: string, params?: any) => axiosInstance.get(`/api${url}`, { params }),
  post: (url: string, data?: any) => axiosInstance.post(`/api${url}`, data),
  put: (url: string, data?: any) => axiosInstance.put(`/api${url}`, data),
  delete: (url: string) => axiosInstance.delete(`/api${url}`),
  
  // APIs spécifiques
  projects: projectsApi,
  repositories: repositoriesApi,
  gource: gourceApi,
  settings: settingsApi
};

export default api; 