import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Repositories API
export const repositoriesApi = {
  getAll: () => api.get('/repositories'),
  getById: (id) => api.get(`/repositories/${id}`),
  create: (data) => api.post('/repositories', data),
  getCloneStatus: (cloneId) => api.get(`/repositories/clone-status/${cloneId}`),
  bulkImport: (data) => api.post('/repositories/bulk-import', data),
  getBulkImportStatus: (bulkImportId) => api.get(`/repositories/bulk-import-status/${bulkImportId}`),
  update: (id) => api.put(`/repositories/${id}/update`),
  delete: (id) => api.delete(`/repositories/${id}`),
};

// Projects API
export const projectsApi = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => {
    console.log('Envoi de données pour création de projet:', data);
    return api.post('/projects', data);
  },
  update: (id, data) => {
    console.log('Envoi de données pour mise à jour de projet:', data);
    return api.put(`/projects/${id}`, data);
  },
  delete: (id) => api.delete(`/projects/${id}`),
};

// Gource Config Files API
export const renderProfilesApi = {
  getAll: () => api.get('/renderProfiles'),
  getById: (id) => api.get(`/renderProfiles/${id}`),
  create: (data) => api.post('/renderProfiles', data),
  update: (id, data) => api.put(`/renderProfiles/${id}`, data),
  delete: (id) => api.delete(`/renderProfiles/${id}`),
};

// Renders API
export const rendersApi = {
  getAll: () => api.get('/renders'),
  getById: (id) => api.get(`/renders/${id}`),
  startRender: (data) => api.post('/renders/start', data),
  openExportsFolder: () => api.post('/renders/open-exports'),
};

// Settings API
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.post('/settings', data),
};

// Créez un objet pour l'exportation par défaut
const apiExports = {
  repositories: repositoriesApi,
  projects: projectsApi,
  renderProfiles: renderProfilesApi,
  renders: rendersApi,
  settings: settingsApi,
};

export default apiExports; 