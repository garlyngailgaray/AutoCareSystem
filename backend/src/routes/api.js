const { Router } = require('express');
const {
  createAccount,
  updateProfile,
  deleteUserAccount,
  getAllUsers,
  register,
  login,
  getProfile,
  submitPendingRequest,
  getPendingRequestsApi,
  deletePendingRequestApiHandler,
} = require('../controllers/authController');
const {
  getVehicles,
  getVehicleById,
  addVehicle,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicleController');
const {
  getServiceRequests,
  createServiceRequest,
  updateServiceStatus,
} = require('../controllers/serviceController');
const {
  getMaintenanceLogs,
  addMaintenanceLog,
} = require('../controllers/maintenanceController');
const { getDashboardStats } = require('../controllers/dashboardController');
const {
  getParts,
  createPart,
  updatePartStock,
  updatePartPrice,
  deletePart,
  seedParts,
} = require('../controllers/partsController');
const {
  getJobOrdersApi,
  createJobOrderApi,
  processPaymentApi,
  getPaymentHistoryApi,
  getBillingHistoryApi,
  getAvailedServicesApi,
  updateJobStatusApi,
  notifyCashierApi,
  deleteJobOrderApi,
} = require('../controllers/billingController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = Router();

// Auth Routes (Public & Account Creation)
router.post('/auth/create-account', createAccount);
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/pending-request', submitPendingRequest);
router.get('/auth/pending-requests', authenticateToken, getPendingRequestsApi);
router.delete('/auth/pending-requests/:id', authenticateToken, deletePendingRequestApiHandler);

// Protected Profile & Users API
router.get('/auth/me', authenticateToken, getProfile);
router.put('/users/profile', authenticateToken, updateProfile);
router.get('/users', authenticateToken, getAllUsers);
router.delete('/users/:id', authenticateToken, deleteUserAccount);

// Vehicles API
router.get('/vehicles', authenticateToken, getVehicles);
router.get('/vehicles/:id', authenticateToken, getVehicleById);
router.post('/vehicles', authenticateToken, addVehicle);
router.put('/vehicles/:id', authenticateToken, updateVehicle);
router.delete('/vehicles/:id', authenticateToken, deleteVehicle);

// Service Requests API
router.get('/services', authenticateToken, getServiceRequests);
router.post('/services', authenticateToken, createServiceRequest);
router.put('/services/:id/status', authenticateToken, updateServiceStatus);

// Maintenance Logs API
router.get('/maintenance-logs', authenticateToken, getMaintenanceLogs);
router.post('/maintenance-logs', authenticateToken, addMaintenanceLog);

// Dashboard API
router.get('/dashboard/stats', authenticateToken, getDashboardStats);

// Auto Parts API (Protected - MySQL Database)
router.get('/parts', authenticateToken, getParts);
router.post('/parts', authenticateToken, createPart);
router.put('/parts/stock', authenticateToken, updatePartStock);
router.put('/parts/price', authenticateToken, updatePartPrice);
router.delete('/parts/:id', authenticateToken, deletePart);
router.post('/parts/seed', authenticateToken, seedParts);

// Job Orders, Billing & Payment History API (Protected - MySQL Database)
router.get('/job-orders', authenticateToken, getJobOrdersApi);
router.post('/job-orders', authenticateToken, createJobOrderApi);
router.post('/job-orders/:id/payment', authenticateToken, processPaymentApi);
router.get('/payment-history', authenticateToken, getPaymentHistoryApi);
router.get('/billing-history', authenticateToken, getBillingHistoryApi);
router.get('/availed-services', authenticateToken, getAvailedServicesApi);
router.put('/job-orders/:id/status', authenticateToken, updateJobStatusApi);
router.put('/job-orders/:id/notify-cashier', authenticateToken, notifyCashierApi);
router.delete('/job-orders/:id', authenticateToken, deleteJobOrderApi);

module.exports = router;
