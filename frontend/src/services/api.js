import axios from 'axios';

// Helper to normalize backend API baseURL
const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) return '/api';
  const clean = envUrl.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

// Create Axios instance
const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ams_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.includes('/login');
      if (!isAuthPage) {
        localStorage.removeItem('ams_token');
        localStorage.removeItem('ams_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Health check API
export const checkHealth = () => api.get('/health');

// Authentication APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.patch('/auth/change-password', passwordData)
};

// User Management APIs (Admin only)
export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  changePassword: (id, passwordData) => api.patch(`/users/${id}/password`, passwordData),
  toggleStatus: (id) => api.patch(`/users/${id}/status`),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

// Asset Management APIs
export const assetAPI = {
  getAssets: (params) => api.get('/assets', { params }),
  getAssetById: (id) => api.get(`/assets/${id}`),
  createAsset: (assetData) => api.post('/assets', assetData),
  updateAsset: (id, assetData) => api.put(`/assets/${id}`, assetData),
  retireAsset: (id, reason) => api.patch(`/assets/${id}/retire`, { reason }),
  deleteAsset: (id) => api.delete(`/assets/${id}`),
  getFilterMetadata: () => api.get('/assets/metadata/filters')
};

// Asset Request APIs
export const requestAPI = {
  createRequest: (data) => api.post('/requests', data),
  getAllRequests: (params) => api.get('/requests', { params }),
  getMyRequests: () => api.get('/requests/my-requests'),
  reviewRequest: (id, data) => api.patch(`/requests/${id}/review`, data),
  getSupportQueue: (params) => api.get('/requests/support-queue', { params }),
  handoverRequest: (id, data) => api.post(`/requests/${id}/handover`, data),
  sendSupportMessage: (id, data) => api.post(`/requests/${id}/messages`, data)
};

// Assignment APIs
export const assignmentAPI = {
  assignAsset: (data) => api.post('/assignments', data),
  returnAsset: (id, data) => api.post(`/assignments/${id}/return`, data),
  transferAsset: (id, data) => api.post(`/assignments/${id}/transfer`, data),
  getAssignments: (params) => api.get('/assignments', { params }),
  getMyAssignedAssets: () => api.get('/assignments/my-assets'),
  getMyAssetHistory: () => api.get('/assignments/my-history')
};

// Maintenance & Repair APIs
export const repairAPI = {
  createWorkOrder: (data) => api.post('/repairs', data),
  getAllRepairs: (params) => api.get('/repairs', { params }),
  getMyWorkOrders: (params) => api.get('/repairs/my-work-orders', { params }),
  updateRepairProgress: (id, data) => api.put(`/repairs/${id}/progress`, data)
};

// Lifecycle APIs
export const lifecycleAPI = {
  getLifecycleHistory: (params) => api.get('/lifecycle', { params }),
  getAssetTimeline: (assetId) => api.get(`/lifecycle/asset/${assetId}`)
};

// Dashboard Stats APIs
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats')
};

// Audit Log APIs (Admin only)
export const auditLogAPI = {
  getLogs: (params) => api.get('/audit-logs', { params })
};

// Notification APIs
export const notificationAPI = {
  getMyNotifications: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/mark-all-read')
};

export default api;
