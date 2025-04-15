import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to hide API tokens in logs
api.interceptors.request.use(request => {
  // Create a copy for logs that masks tokens
  const sanitizedRequest = { ...request };
  
  // If the URL contains a GitHub token (for clones)
  if (sanitizedRequest.url && typeof sanitizedRequest.url === 'string') {
    // Mask the token in the URL for logs
    sanitizedRequest.url = sanitizedRequest.url.replace(
      /(https?:\/\/)[^:@]+:[^@]+@/gi, 
      '$1[CREDENTIALS_HIDDEN]@'
    );
    
    // Log the cleaned request instead of the original
    console.log('Making request to:', sanitizedRequest.url);
  }
  
  // Note: return the original request, not the cleaned version
  return request;
}, error => {
  return Promise.reject(error);
});

// Utilities for date formatting
export const dateUtils = {
  /**
   * Format a date as a relative time (e.g. "5 minutes ago", "3 days ago")
   * @param {string|Date} dateString - The date to format
   * @returns {string} The formatted relative date
   */
  formatRelativeTime: (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Difference in milliseconds
    const diffMs = now - date;
    
    // Convert to seconds, minutes, hours, days
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHours = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHours / 24);
    const diffWeeks = Math.round(diffDays / 7);
    const diffMonths = Math.round(diffDays / 30);
    const diffYears = Math.round(diffDays / 365);
    
    // Format based on difference
    if (diffSec < 60) {
      return 'Just now';
    } else if (diffMin < 60) {
      return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffWeeks < 4) {
      return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
    } else if (diffMonths < 12) {
      return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
    } else {
      return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
    }
  },
  
  /**
   * Format a date in localized format
   * @param {string|Date} dateString - The date to format
   * @returns {string} The formatted date
   */
  formatLocaleDate: (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }
};

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
  getStats: () => api.get('/repositories/stats'),
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
  getCompletedRenders: () => api.get('/renders/completed'),
  uploadMusicFile: (formData) => {
    return api.post('/renders/upload-music', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  generateFFmpegPreview: (renderId, filters) => api.post(`/renders/${renderId}/ffmpeg-preview`, filters),
  applyFFmpegFilters: (renderId, filters) => api.post(`/renders/${renderId}/ffmpeg-process`, filters),
};

// Settings API
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  getDefaultProfileId: () => api.get('/settings/default-profile'),
  setDefaultProfileId: (profileId) => api.put('/settings/default-profile', { profileId }),
};

// Create an object for default export
const apiExports = {
  repositories: repositoriesApi,
  projects: projectsApi,
  renderProfiles: renderProfilesApi,
  renders: rendersApi,
  settings: settingsApi,
};

export default apiExports; 