import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wrench,
  UserPlus,
  History,
  Clock,
  BarChart3,
  Settings,
  DollarSign,
  FileText,
  ShieldCheck,
  Home,
  LogOut,
  UserCheck,
  Menu,
  X,
  ChevronRight,
  Package,
  MessageSquare,
} from 'lucide-react';

export default function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarNavRef = React.useRef(null);

  // Restore sidebar scroll position on refresh
  React.useEffect(() => {
    const saved = sessionStorage.getItem('sidebar_scroll_position');
    const el = sidebarNavRef.current;

    const handleScroll = () => {
      if (el) {
        sessionStorage.setItem('sidebar_scroll_position', el.scrollTop.toString());
      }
    };

    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
      if (saved !== null) {
        el.scrollTop = parseInt(saved, 10);
      }
    }

    return () => {
      if (el) el.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!user) return null;

  const isActive = (path) => location.pathname === path;
  const role = (user.role || 'customer').toString().toLowerCase();

  // Role-based Navigation Links
  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'User Management', path: '/user-management', icon: Users },
          { name: 'Auto Parts Stocks', path: '/staff/parts-inventory', icon: Package },
          { name: 'Services Catalog', path: '/services-catalog', icon: Wrench },
          { name: 'Create Accounts', path: '/create-accounts', icon: UserPlus },
          { name: 'Repair History', path: '/admin-history', icon: History },
          { name: 'Pending Requests', path: '/pending-requests', icon: Clock },
          { name: 'Analytics', path: '/analytics', icon: BarChart3 },
          { name: 'Client Feedback', path: '/feedback', icon: MessageSquare },
          { name: 'Settings', path: '/settings', icon: Settings },
        ];
      case 'manager':
      case 'front desk':
      case 'frontdesk':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'User Management', path: '/user-management', icon: Users },
          { name: 'Report Job Order', path: '/manager/job-order', icon: Wrench },
          { name: 'Auto Parts Stocks', path: '/staff/parts-inventory', icon: Package },
          { name: 'Services Catalog', path: '/services-catalog', icon: ShieldCheck },
          { name: 'All Repair History', path: '/manager/history', icon: History },
          { name: 'Mechanic Availability', path: '/manager/mechanics', icon: Users },
          { name: 'Client Feedback', path: '/feedback', icon: MessageSquare },
          { name: 'Settings', path: '/settings', icon: Settings },
        ];
      case 'staff':
      case 'mechanic':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'My Assigned Jobs', path: '/staff/assigned-jobs', icon: Wrench },
          { name: 'Repair History', path: '/history', icon: History },
          { name: 'Auto Parts Stocks', path: '/staff/parts-inventory', icon: Package },
          { name: 'Services Catalog', path: '/services-catalog', icon: ShieldCheck },
          { name: 'Client Feedback', path: '/feedback', icon: MessageSquare },
          { name: 'Settings', path: '/settings', icon: Settings },
        ];
      case 'cashier':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Billing', path: '/cashier/bills', icon: DollarSign },
          { name: 'Payments', path: '/cashier/history', icon: FileText },
          { name: 'Auto Parts Stocks', path: '/staff/parts-inventory', icon: Package },
          { name: 'Services Catalog', path: '/services-catalog', icon: ShieldCheck },
          { name: 'Client Feedback', path: '/feedback', icon: MessageSquare },
          { name: 'Settings', path: '/settings', icon: Settings },
        ];
      default:
        // Client / Customer Menu
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Repair History', path: '/history', icon: History },
          { name: 'Bills & Payments', path: '/client-bills', icon: DollarSign },
          { name: 'Services', path: '/services-catalog', icon: Wrench },
          { name: 'Feedback', path: '/feedback', icon: MessageSquare },
          { name: 'Settings', path: '/settings', icon: Settings },
        ];
    }
  };

  const navItems = getNavItems();
  const displayRoleLabel = role === 'manager' || role === 'front desk' || role === 'frontdesk' ? 'FRONT DESK' : role.toUpperCase();

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <img src="/AutoCareLogo.png" alt="AutoCare Logo" className="h-8 w-auto object-contain" />
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-gray-300 hover:text-white rounded-lg focus:outline-none"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Overlay Backdrop for Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-auto h-screen w-64 bg-slate-900 text-white border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div ref={sidebarNavRef} className="p-5 space-y-6 flex-1 overflow-y-auto">
          {/* Logo Section */}
          <div
            className="flex items-center space-x-3 cursor-pointer border-b border-slate-800/80 pb-5"
            onClick={() => {
              navigate('/dashboard');
              setMobileOpen(false);
            }}
          >
            <img src="/AutoCareLogo.png" alt="AutoCare Logo" className="h-10 w-auto object-contain" />
          </div>

          {/* User Profile Card */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center space-x-3">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="Profile Avatar"
                className="w-10 h-10 rounded-full object-cover border border-blue-400/40 shrink-0 shadow-sm"
              />
            ) : (
              <div className="bg-blue-600/20 text-blue-400 p-2.5 rounded-lg shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user.name || user.username}</p>
              <p className="text-[11px] text-gray-400 truncate">@{user.username || 'client'}</p>
              <span className="inline-block bg-blue-500/10 text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-500/20 mt-1 uppercase">
                {displayRoleLabel}
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5 pt-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">
              {displayRoleLabel} MENU
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-gray-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {active && <ChevronRight className="h-3.5 w-3.5 text-white/80" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Logout Button */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <button
            onClick={() => {
              setMobileOpen(false);
              onLogout();
            }}
            className="w-full flex items-center justify-center space-x-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white py-2.5 rounded-xl text-xs font-bold transition-all border border-red-500/20"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
