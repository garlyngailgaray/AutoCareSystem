import axios from 'axios';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('autocare_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const storedUserStr = localStorage.getItem('autocare_user');
  if (storedUserStr) {
    try {
      const u = JSON.parse(storedUserStr);
      if (u) {
        if (u.role) config.headers['X-User-Role'] = u.role;
        if (u.id) config.headers['X-User-Id'] = u.id;
        if (u.username) config.headers['X-User-Username'] = u.username;
      }
    } catch (e) {}
  }
  return config;
});

export const loginUser = async (username, password) => {
  const response = await api.post('/auth/login', { username, email: username, password });
  return response.data;
};

export const registerUser = async (name, username, email, password, phone) => {
  const response = await api.post('/auth/register', { name, username, email, password, phone });
  return response.data;
};

export const createAccount = async (accountData) => {
  const response = await api.post('/auth/create-account', accountData);
  return response.data;
};

export const submitPendingRegistration = async (registrationData) => {
  const response = await api.post('/auth/pending-request', registrationData);
  return response.data;
};

export const fetchPendingRequestsApi = async () => {
  const response = await api.get('/auth/pending-requests');
  return response.data;
};

export const deletePendingRequestApi = async (id, email) => {
  const response = await api.delete(`/auth/pending-requests/${id}`, { params: { email } });
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await api.put('/users/profile', profileData);
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/users/change-password', {
    currentPassword,
    newPassword,
  });
  return response.data;
};

export const deleteUserAccountApi = async (id, username) => {
  const response = await api.delete(`/users/${id}`, { params: { username } });
  return response.data;
};

export const fetchAllUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const fetchVehicles = async () => {
  const response = await api.get('/vehicles');
  return response.data;
};

export const addVehicle = async (vehicleData) => {
  const response = await api.post('/vehicles', vehicleData);
  return response.data;
};

export const deleteVehicle = async (id) => {
  const response = await api.delete(`/vehicles/${id}`);
  return response.data;
};

export const fetchServiceRequests = async () => {
  const response = await api.get('/services');
  return response.data;
};

export const createServiceRequest = async (serviceData) => {
  const response = await api.post('/services', serviceData);
  return response.data;
};

export const fetchMaintenanceLogs = async () => {
  const response = await api.get('/maintenance-logs');
  return response.data;
};

export const fetchDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

// Auto Parts API (MySQL Database)
export const fetchPartsApi = async () => {
  const response = await api.get('/parts');
  return response.data;
};

export const addPartApi = async (partData) => {
  const response = await api.post('/parts', partData);
  return response.data;
};

export const updatePartStockApi = async (stockData) => {
  const response = await api.put('/parts/stock', stockData);
  return response.data;
};

export const updatePartPriceApi = async (priceData) => {
  const response = await api.put('/parts/price', priceData);
  return response.data;
};

export const deletePartApi = async (id) => {
  const response = await api.delete(`/parts/${id}`);
  return response.data;
};

export const seedPartsApi = async () => {
  const response = await api.post('/parts/seed');
  return response.data;
};

// Job Orders, Bills & Payment History API (MySQL Database)
export const fetchJobOrdersApi = async () => {
  const response = await api.get('/job-orders');
  return response.data;
};

export const createJobOrderApi = async (orderData) => {
  const response = await api.post('/job-orders', orderData);
  return response.data;
};

export const processPaymentApi = async (id, paymentData) => {
  const response = await api.post(`/job-orders/${id}/payment`, paymentData);
  return response.data;
};

export const fetchPaymentHistoryApi = async () => {
  const response = await api.get('/payment-history');
  return response.data;
};

export const fetchBillingHistoryApi = async () => {
  const response = await api.get('/billing-history');
  return response.data;
};

export const fetchAvailedServicesApi = async (params = {}) => {
  const response = await api.get('/availed-services', { params });
  return response.data;
};

export const updateJobStatusApi = async (id, statusData) => {
  const response = await api.put(`/job-orders/${id}/status`, statusData);
  return response.data;
};

export const notifyCashierApi = async (id) => {
  const response = await api.put(`/job-orders/${id}/notify-cashier`);
  return response.data;
};

export const deleteJobOrderApi = async (id) => {
  const response = await api.delete(`/job-orders/${id}`);
  return response.data;
};

export default api;
