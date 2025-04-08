/**
 * Service API pour communiquer avec le backend
 */

import axios from 'axios';
import { GourceProfileFormData } from '../components/ProfileForm';

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

interface GourceProfile {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
  // autres paramètres selon la structure définie dans ProfileForm.tsx
}

interface RenderOptions {
  profile_id: string;
  output_format: 'mp4' | 'webm' | 'gif';
  quality: 'low' | 'medium' | 'high';
}

// Service API pour les configurations Gource
export const gourceApi = {
  // Configuration Gource (ancienne structure)
  getConfigs: (projectId?: string) => {
    const url = projectId ? `/api/gource/configs?project_id=${projectId}` : '/api/gource/configs';
    return axiosInstance.get(url);
  },
  getConfigById: (id: string) => axiosInstance.get(`/api/gource/configs/${id}`),
  createConfig: (data: any) => axiosInstance.post('/api/gource/configs', data),
  updateConfig: (id: string, data: any) => axiosInstance.put(`/api/gource/configs/${id}`, data),
  getConfigsByProject: (projectId: string) => axiosInstance.get(`/api/gource/configs?project_id=${projectId}`),
  
  // Profils Gource (nouvelle structure)
  getProfiles: async () => {
    const response = await axiosInstance.get('/api/gource/profiles');
    return response.data;
  },
  getProfileById: (id: string) => axiosInstance.get(`/api/gource/profiles/${id}`),
  createProfile: async (data: any) => axiosInstance.post('/api/gource/profiles', data),
  updateProfile: async (id: string, data: any) => axiosInstance.put(`/api/gource/profiles/${id}`, data),
  deleteProfile: async (id: string) => axiosInstance.delete(`/api/gource/profiles/${id}`),
  
  // Associations entre profils et projets
  getProfileProjects: (profileId: string) => axiosInstance.get(`/api/gource/profiles/${profileId}/projects`),
  getProjectProfiles: async (projectId: string) => {
    const response = await axiosInstance.get(`/api/gource/projects/${projectId}/profiles`);
    return response.data;
  },
  linkProfileToProject: async (projectId: string, profileId: string) => {
    const response = await axiosInstance.post(`/api/gource/projects/${projectId}/profiles/${profileId}`);
    return response.data;
  },
  unlinkProfileFromProject: async (projectId: string, profileId: string) => {
    const response = await axiosInstance.delete(`/api/gource/projects/${projectId}/profiles/${profileId}`);
    return response.data;
  },
  setProfileAsDefault: async (projectId: string, profileId: string) => {
    const response = await axiosInstance.put(`/api/gource/projects/${projectId}/profiles/${profileId}/default`);
    return response.data;
  },
  
  // Rendering
  createRender: (data: any) => axiosInstance.post('/api/gource/renders', data),
  getRenderStatus: (id: string) => axiosInstance.get(`/api/gource/renders/${id}/status`),
  getProjectDefaultProfile: (projectId: string) => axiosInstance.get(`/api/gource/projects/${projectId}/default-profile`),
};

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
  settings: settingsApi,
  
  // Profils Gource
  getProfiles: async () => {
    const response = await axiosInstance.get('/api/gource/profiles');
    return response.data;
  },
  
  getProfile: async (profileId: string) => {
    const response = await axiosInstance.get(`/api/gource/profiles/${profileId}`);
    return response.data;
  },
  
  createProfile: async (profileData: GourceProfileFormData) => {
    const response = await axiosInstance.post('/api/gource/profiles', profileData);
    return response.data;
  },
  
  updateProfile: async (profileId: string, profileData: GourceProfileFormData) => {
    const response = await axiosInstance.put(`/api/gource/profiles/${profileId}`, profileData);
    return response.data;
  },
  
  deleteProfile: async (profileId: string) => {
    const response = await axiosInstance.delete(`/api/gource/profiles/${profileId}`);
    return response.data;
  },
  
  // Gestion des profils liés aux projets
  getProjectProfiles: async (projectId: string) => {
    const response = await axiosInstance.get(`/api/gource/projects/${projectId}/profiles`);
    return response.data;
  },
  
  linkProfileToProject: async (projectId: string, profileId: string) => {
    const response = await axiosInstance.post(`/api/gource/projects/${projectId}/profiles/${profileId}`);
    return response.data;
  },
  
  unlinkProfileFromProject: async (projectId: string, profileId: string) => {
    const response = await axiosInstance.delete(`/api/gource/projects/${projectId}/profiles/${profileId}`);
    return response.data;
  },
  
  setProfileAsDefault: async (projectId: string, profileId: string) => {
    const response = await axiosInstance.put(`/api/gource/projects/${projectId}/profiles/${profileId}/default`);
    return response.data;
  },
};

export default api; 