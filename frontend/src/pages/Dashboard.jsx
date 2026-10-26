import React, { useState, useEffect } from 'react';
import { getUserAccounts, deduplicateUsers } from '../utils/userAccountsStore';
import { fetchAllUsers } from '../api';
import {
  Wrench,
  Users,
  UserCheck,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Role Dashboard Component Imports
import ClientDashboard from './client/ClientDashboard';
import ManagerDashboard from './manager/ManagerDashboard';
import StaffDashboard from './staff/StaffDashboard';
import CashierDashboard from './cashier/CashierDashboard';

export default function Dashboard({ user }) {
  const role = (user?.role || 'customer').toString().trim().toLowerCase();

  switch (role) {
    case 'admin':
      return <AdminDashboard user={user} />;
    case 'manager':
      return <ManagerDashboard user={user} />;
    case 'staff':
    case 'mechanic':
    case 'technician':
      return <StaffDashboard user={user} />;
    case 'cashier':
      return <CashierDashboard user={user} />;
    default:
      return <ClientDashboard user={user} />;
  }
}

/* ==========================================================================
   1. ADMIN DASHBOARD
   ========================================================================== */
function AdminDashboard({ user }) {
  const [users, setUsers] = useState([]);

  const loadData = () => {
    const local = getUserAccounts();

    // Fetch live directly from MySQL Database API as primary source of truth
    fetchAllUsers()
      .then((dbUsers) => {
        if (dbUsers && Array.isArray(dbUsers) && dbUsers.length > 0) {
          const cleaned = deduplicateUsers(dbUsers);
          setUsers((prev) => (JSON.stringify(prev) === JSON.stringify(cleaned) ? prev : cleaned));
        } else {
          const deduplicatedLocal = deduplicateUsers(local);
          setUsers((prev) => (JSON.stringify(prev) === JSON.stringify(deduplicatedLocal) ? prev : deduplicatedLocal));
        }
      })
      .catch((err) => {
        console.warn('Database fetch warning, using local accounts store:', err);
        const deduplicatedLocal = deduplicateUsers(local);
        setUsers((prev) => (JSON.stringify(prev) === JSON.stringify(deduplicatedLocal) ? prev : deduplicatedLocal));
      });
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    window.addEventListener('autocare_users_updated', loadData);
    const timer = setInterval(loadData, 2000);
    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('autocare_users_updated', loadData);
      clearInterval(timer);
    };
  }, []);

  const personnelUsers = users.filter((u) => u.role !== 'client' && u.role !== 'customer');
  const clientUsers = users.filter((u) => u.role === 'client' || u.role === 'customer');

  const getRoleBadge = (role) => {
    switch ((role || '').toString().trim().toLowerCase()) {
      case 'admin':
        return <span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">ADMIN</span>;
      case 'manager':
        return <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">MANAGER</span>;
      case 'cashier':
        return <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">CASHIER</span>;
      case 'staff':
      case 'mechanic':
        return <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">MECHANIC</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">CLIENT</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between border border-slate-700">
        <div className="space-y-2 text-center md:text-left">
          <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase">
            Administrator Mode
          </span>
          <h1 className="text-3xl font-extrabold">System Overview - {user?.name}</h1>
          <p className="text-gray-300 text-sm max-w-xl">
            Full administrative control over personnel, client accounts, system logs, and shop performance metrics.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <MetricCard title="System Personnel" value={`${personnelUsers.length} Active`} icon={Users} color="bg-blue-600" />
        <MetricCard title="Registered Clients" value={`${clientUsers.length} Clients`} icon={UserCheck} color="bg-emerald-600" />
        <MetricCard title="Active Repair Requests" value="1 In Progress" icon={Wrench} color="bg-amber-600" />
      </div>

      {/* Admin Personnel & System Accounts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Registered System Accounts ({users.length})</span>
          </h2>
          <Link
            to="/create-accounts"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add User Account</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-slate-800/80 text-gray-700 dark:text-gray-300 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Custom ID</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Username</th>
                <th className="p-3">Role</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id || u.username} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-gray-900 dark:text-white">{u.customId}</td>
                  <td className="p-3 font-semibold text-gray-900 dark:text-white">{u.name}</td>
                  <td className="p-3 font-mono text-gray-700 dark:text-gray-300">@{u.username}</td>
                  <td className="p-3">{getRoleBadge(u.role)}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">{u.status || 'Active'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   SHARED UI HELPER COMPONENTS
   ========================================================================== */
function MetricCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-between transition-colors">
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-2xl text-white ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}
