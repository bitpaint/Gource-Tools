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

// Fonction helper pour normaliser les ID/slugs
// Si l'ID ressemble à un UUID, on le renvoie tel quel
// Sinon on considère que c'est un slug et on le transmet tel quel
// Le backend devra être adapté pour rechercher par ID ou par slug
const normalizeIdOrSlug = (idOrSlug: string): string => {
  return idOrSlug;
};

// Service API pour les projets
export const projectsApi = {
  getAll: () => axiosInstance.get('/api/projects'),
  getById: (idOrSlug: string) => axiosInstance.get(`/api/projects/${normalizeIdOrSlug(idOrSlug)}`),
  create: (data: any) => axiosInstance.post('/api/projects', data),
  update: (idOrSlug: string, data: any) => axiosInstance.put(`/api/projects/${normalizeIdOrSlug(idOrSlug)}`, data),
  delete: (idOrSlug: string) => axiosInstance.delete(`/api/projects/${normalizeIdOrSlug(idOrSlug)}`),
};

// Service API pour les dépôts
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