/**
 * Service API pour communiquer avec le backend
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

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
  getAll: () => axiosInstance.get('/projects'),
  getById: (id: string) => axiosInstance.get(`/projects/${id}`),
  create: (data: any) => axiosInstance.post('/projects', data),
  update: (id: string, data: any) => axiosInstance.put(`/projects/${id}`, data),
  delete: (id: string) => axiosInstance.delete(`/projects/${id}`),
};

// Service API pour les dépôts
export const repositoriesApi = {
  getAll: (projectId?: string) => {
    const url = projectId ? `/repositories?project_id=${projectId}` : '/repositories';
    return axiosInstance.get(url);
  },
  getById: (id: string, projectId?: string) => {
    const url = projectId ? `/repositories/${id}?project_id=${projectId}` : `/repositories/${id}`;
    return axiosInstance.get(url);
  },
  create: (data: any) => axiosInstance.post('/repositories', data),
  update: (id: string, data: any, projectId?: string) => {
    const url = projectId ? `/repositories/${id}?project_id=${projectId}` : `/repositories/${id}`;
    return axiosInstance.put(url, data);
  },
  delete: (id: string, projectId?: string) => {
    const url = projectId ? `/repositories/${id}?project_id=${projectId}` : `/repositories/${id}`;
    return axiosInstance.delete(url);
  },
  sync: (id: string) => axiosInstance.post(`/repositories/${id}/sync`),
  getBranches: (id: string) => axiosInstance.get(`/repositories/${id}/branches`),
};

// Service API pour les configurations Gource
export const gourceApi = {
  getConfigs: (projectId?: string) => {
    const url = projectId ? `/gource/configs?project_id=${projectId}` : '/gource/configs';
    return axiosInstance.get(url);
  },
  getConfigById: (id: string) => axiosInstance.get(`/gource/configs/${id}`),
  createConfig: (data: any) => axiosInstance.post('/gource/configs', data),
  updateConfig: (id: string, data: any) => axiosInstance.put(`/gource/configs/${id}`, data),
  createRender: (data: any) => axiosInstance.post('/gource/renders', data),
  getRenderStatus: (id: string) => axiosInstance.get(`/gource/renders/${id}/status`),
  getConfigsByProject: (projectId: string) => axiosInstance.get(`/gource/configs?project_id=${projectId}`),
};

// Méthodes HTTP génériques pour être compatibles avec l'ancien code
const api = {
  get: (url: string, params?: any) => axiosInstance.get(url, { params }),
  post: (url: string, data?: any) => axiosInstance.post(url, data),
  put: (url: string, data?: any) => axiosInstance.put(url, data),
  delete: (url: string) => axiosInstance.delete(url),
  
  // APIs spécifiques
  projects: projectsApi,
  repositories: repositoriesApi,
  gource: gourceApi,
};

export default api; 