import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Enhanced interceptor to log more details about requests
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
    console.log('Request method:', request.method);
    console.log('Request headers:', JSON.stringify(sanitizedRequest.headers));
    
    if (request.data) {
      console.log('Request data:', typeof request.data === 'string' ? request.data : JSON.stringify(request.data));
    }
  }
  
  // Note: return the original request, not the cleaned version
  return request;
}, error => {
  return Promise.reject(error);
});

// Add response interceptor
api.interceptors.response.use(response => {
  console.log('Response status:', response.status);
  console.log('Response headers:', JSON.stringify(response.headers));
  return response;
}, error => {
  console.error('API Error:', error.message);
  if (error.response) {
    console.error('Response status:', error.response.status);
    console.error('Response data:', error.response.data);
  }
  return Promise.reject(error);
});

// Date Utils (Assuming these exist or should be defined)
export const dateUtils = {
  formatRelativeTime: (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    // Basic relative time logic (replace with a library like date-fns if needed)
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
        
        if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
        if (diffSeconds < 3600) return `${Math.round(diffSeconds / 60)} minutes ago`;
        if (diffSeconds < 86400) return `${Math.round(diffSeconds / 3600)} hours ago`;
        // Add more complex logic for days, weeks, etc. if desired
        return date.toLocaleDateString(); // Fallback to date string
    } catch (e) {
        return dateString; // Return original if parsing fails
    }
  },
  formatLocaleDate: (dateString: string | null | undefined): string => {
      if (!dateString) return 'N/A';
      try {
          return new Date(dateString).toLocaleString();
      } catch (e) {
          return dateString;
      }
  }
};

// Repositories API
export const repositoriesApi = {
  getAll: () => api.get('/repositories'),
  getById: (id: string) => api.get(`/repositories/${id}`),
  create: (data: any) => api.post('/repositories', data),
  update: (id: string, data: any) => api.put(`/repositories/${id}`, data),
  delete: (id: string) => api.delete(`/repositories/${id}`),
  pull: (id: string) => api.post(`/repositories/${id}/pull`),
  updateAndLog: (id: string) => api.post(`/repositories/update/${id}`),
  bulkUpdate: (data: { repoIds: string[] }) => api.post('/repositories/bulk-update', data),
  getCloneStatus: (cloneId: string) => api.get(`/repositories/clone-status/${cloneId}`),
  getBulkImportStatus: (bulkImportId: string) => api.get(`/repositories/bulk-import-status/${bulkImportId}`),
  bulkImport: (data: any) => api.post('/repositories/bulk-import', data),
  getStats: () => api.get('/repositories/stats'),
};

// Projects API
export const projectsApi = {
  getAll: () => api.get('/projects'),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => {
    console.log('Sending data for project creation:', data);
    return api.post('/projects', data);
  },
  update: (id: string, data: any) => {
    console.log('Sending data for project update:', data);
    return api.put(`/projects/${id}`, data);
  },
  delete: (id: string) => api.delete(`/projects/${id}`),
};

// Render Profiles API
export const renderProfilesApi = {
  getAll: () => api.get('/renderProfiles'),
  getById: (id: string) => api.get(`/renderProfiles/${id}`),
  create: (data: any) => api.post('/renderProfiles', data),
  update: (id: string, data: any) => api.put(`/renderProfiles/${id}`, data),
  delete: (id: string) => api.delete(`/renderProfiles/${id}`),
};

// Renders API
export const rendersApi = {
  getAll: () => api.get('/renders'),
  getById: (id: string) => api.get(`/renders/${id}`),
  startRender: (data: any) => api.post('/renders', data),
  openExportsFolder: () => api.get('/renders/open/exports'),
};

// Settings API
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
  getDefaultProfileId: () => api.get('/settings/default-profile'),
  setDefaultProfileId: (profileId: string) => api.put('/settings/default-profile', { profileId }),
};

// Standalone API functions
export const getRenderProgress = (id: string) => {
  console.log(`Making API call to get progress for render ID: ${id}`);
  return api.get(`/renders/${id}/progress`);
};

// Note: Default export removed as individual exports are generally preferred
// If a default export is needed, recreate the apiExports object