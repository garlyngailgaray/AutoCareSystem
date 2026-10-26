import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import api from './api';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import History from './pages/History';
import ServicesCatalog from './pages/ServicesCatalog';
import ClientBills from './pages/ClientBills';
import ClientFeedback from './pages/ClientFeedback';

// Admin Pages
import UserManagement from './pages/admin/UserManagement';
import CreateAccounts from './pages/admin/CreateAccounts';
import AdminHistory from './pages/admin/AdminHistory';
import PendingRequests from './pages/admin/PendingRequests';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';

// Manager Pages
import CreateJobOrder from './pages/manager/CreateJobOrder';
import ManagerHistory from './pages/manager/ManagerHistory';
import MechanicAvailability from './pages/manager/MechanicAvailability';

// Staff / Mechanic Pages
import AssignedJobs from './pages/staff/AssignedJobs';
import PartsInventory from './pages/staff/PartsInventory';

// Cashier Pages
import PendingBills from './pages/cashier/PendingBills';
import PaymentHistory from './pages/cashier/PaymentHistory';

function DashboardLayout({ user, onLogout, children }) {
  const location = useLocation();
  const mainRef = React.useRef(null);

  // Restore and persist main content scroll position on refresh/load
  React.useEffect(() => {
    const key = `scroll_main_${location.pathname}`;
    const saved = sessionStorage.getItem(key);
    const el = mainRef.current;

    const handleScroll = () => {
      if (el) {
        sessionStorage.setItem(key, el.scrollTop.toString());
      }
      sessionStorage.setItem(`scroll_win_${location.pathname}`, window.scrollY.toString());
    };

    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    if (saved !== null && el) {
      const targetScroll = parseInt(saved, 10);
      el.scrollTop = targetScroll;

      // Re-apply scroll position to handle layout/data load latency
      const t1 = setTimeout(() => { if (el) el.scrollTop = targetScroll; }, 50);
      const t2 = setTimeout(() => { if (el) el.scrollTop = targetScroll; }, 200);
      const t3 = setTimeout(() => { if (el) el.scrollTop = targetScroll; }, 500);

      return () => {
        if (el) el.removeEventListener('scroll', handleScroll);
        window.removeEventListener('scroll', handleScroll);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    return () => {
      if (el) el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Sidebar user={user} onLogout={onLogout} />
      <main ref={mainRef} className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('autocare_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Initialize and synchronize global color theme (Light / Dark mode)
  useEffect(() => {
    const applyGlobalTheme = () => {
      const savedTheme = localStorage.getItem('autocare_theme') || 'light';
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyGlobalTheme();
    window.addEventListener('storage', applyGlobalTheme);
    return () => window.removeEventListener('storage', applyGlobalTheme);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('autocare_token');
    const savedUserStr = localStorage.getItem('autocare_user');

    if (token && token !== 'local_fallback_token') {
      api
        .get('/auth/me')
        .then((res) => {
          if (res.data) {
            setUser(res.data);
            localStorage.setItem('autocare_user', JSON.stringify(res.data));
          }
        })
        .catch((err) => {
          console.warn('Backend session re-validation warning, retaining active local user session:', err.message);
          if (savedUserStr) {
            try {
              setUser(JSON.parse(savedUserStr));
            } catch (e) {}
          }
        })
        .finally(() => setLoading(false));
    } else if (savedUserStr) {
      try {
        setUser(JSON.parse(savedUserStr));
      } catch (e) {}
      setLoading(false);
    } else {
      setUser(null);
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('autocare_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem('autocare_token');
    localStorage.removeItem('autocare_user');
    setUser(null);
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('autocare_user', JSON.stringify(updatedUser));
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-gray-400">Loading AutoCare System...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage user={user} />} />
        <Route
          path="/login"
          element={!user ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" replace />}
        />

        {/* Dashboard Routes with Side Navigation */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <Dashboard user={user} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/vehicles"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <Vehicles />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/history"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <History user={user} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/client-bills"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <ClientBills user={user} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/services-catalog"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <ServicesCatalog />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/feedback"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <ClientFeedback user={user} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Manager / Front Desk Specific Routes */}
        <Route
          path="/manager/job-order"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <CreateJobOrder user={user} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/manager/history"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <ManagerHistory />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/manager/mechanics"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <MechanicAvailability />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Staff / Mechanic Specific Routes */}
        <Route
          path="/staff/assigned-jobs"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <AssignedJobs user={user} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/staff/parts-inventory"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <PartsInventory user={user} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Cashier Specific Routes */}
        <Route
          path="/cashier/bills"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <PendingBills user={user} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/cashier/history"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <PaymentHistory user={user} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/cashier/payments-history"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <PaymentHistory user={user} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Admin Specific Routes */}
        <Route
          path="/user-management"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <UserManagement />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/create-accounts"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <CreateAccounts user={user} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin-history"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <AdminHistory />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/pending-requests"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <PendingRequests />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/analytics"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <Analytics />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <Settings user={user} onUserUpdate={handleUserUpdate} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
