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
  getTopics: (id: string) => axiosInstance.get(`/repositories/${id}/topics`),
  forceUpdateTags: () => axiosInstance.post('/repositories/force-update-tags'),
  import: (data: any) => axiosInstance.post('/repositories/import', data)
};

// Service API pour les configurations Gource
export const gourceApi = {
  // Configuration Gource (ancienne structure)
  getConfigs: (projectId?: string) => {
    const url = projectId ? `/gource/configs?project_id=${projectId}` : '/gource/configs';
    return axiosInstance.get(url);
  },
  getConfigById: (id: string) => axiosInstance.get(`/gource/configs/${id}`),
  createConfig: (data: any) => axiosInstance.post('/gource/configs', data),
  updateConfig: (id: string, data: any) => axiosInstance.put(`/gource/configs/${id}`, data),
  getConfigsByProject: (projectId: string) => axiosInstance.get(`/gource/configs?project_id=${projectId}`),
  
  // Profils Gource (nouvelle structure)
  getProfiles: () => axiosInstance.get('/gource/profiles'),
  getProfileById: (id: string) => axiosInstance.get(`/gource/profiles/${id}`),
  createProfile: (data: any) => axiosInstance.post('/gource/profiles', data),
  updateProfile: (id: string, data: any) => axiosInstance.put(`/gource/profiles/${id}`, data),
  deleteProfile: (id: string) => axiosInstance.delete(`/gource/profiles/${id}`),
  
  // Associations entre profils et projets
  getProfileProjects: (profileId: string) => axiosInstance.get(`/gource/profiles/${profileId}/projects`),
  getProjectProfiles: (projectId: string) => axiosInstance.get(`/gource/projects/${projectId}/profiles`),
  linkProfileToProject: (profileId: string, projectId: string) => 
    axiosInstance.post(`/gource/profiles/${profileId}/projects/${projectId}`),
  setProfileAsDefault: (profileId: string, projectId: string) => 
    axiosInstance.put(`/gource/profiles/${profileId}/projects/${projectId}/default`),
  unlinkProfileFromProject: (profileId: string, projectId: string) => 
    axiosInstance.delete(`/gource/profiles/${profileId}/projects/${projectId}`),
  
  // Rendering
  createRender: (data: any) => axiosInstance.post('/gource/renders', data),
  getRenderStatus: (id: string) => axiosInstance.get(`/gource/renders/${id}/status`),
  getProjectDefaultProfile: (projectId: string) => axiosInstance.get(`/gource/projects/${projectId}/default-profile`),
};

// Service API pour les réglages
export const settingsApi = {
  checkGithubToken: () => axiosInstance.get('/settings/github/token'),
  saveGithubToken: (token: string) => axiosInstance.post('/settings/github/token', { token }),
  testGithubToken: () => axiosInstance.get('/settings/github/token/test'),
  removeGithubToken: () => axiosInstance.delete('/settings/github/token')
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
  settings: settingsApi,
};

export default api; 