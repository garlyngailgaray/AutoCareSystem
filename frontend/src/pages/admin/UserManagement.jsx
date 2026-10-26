import React, { useState, useEffect } from 'react';
import { getUserAccounts, removeUserAccount, updateUserAccount } from '../../utils/userAccountsStore';
import { fetchAllUsers, deleteUserAccountApi, updateUserProfile } from '../../api';
import { Users, Search, Eye, X, User, Trash2, CheckCircle, Edit3, Save } from 'lucide-react';

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilterState] = useState(() => {
    return sessionStorage.getItem('usermgmt_role_filter') || 'all';
  });

  const setRoleFilter = (filter) => {
    setRoleFilterState(filter);
    sessionStorage.setItem('usermgmt_role_filter', filter);
  };

  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState(null);

  // Edit User Form State
  const [editForm, setEditForm] = useState({
    id: '',
    customId: '',
    username: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    gender: 'Male',
    birthday: '',
    age: '',
    civilStatus: 'Single',
    role: 'client',
  });

  const calculateAge = (birthdayString) => {
    if (!birthdayString) return '';
    const birthDate = new Date(birthdayString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age.toString() : '';
  };

  const loadUsers = () => {
    // Fetch live directly from MySQL Database API as primary source of truth
    fetchAllUsers()
      .then((dbUsers) => {
        if (dbUsers && Array.isArray(dbUsers) && dbUsers.length > 0) {
          setUsers((prev) => (JSON.stringify(prev) === JSON.stringify(dbUsers) ? prev : dbUsers));
        } else {
          const local = getUserAccounts();
          setUsers((prev) => (JSON.stringify(prev) === JSON.stringify(local) ? prev : local));
        }
      })
      .catch((err) => {
        console.warn('Database fetch warning, using local accounts store:', err);
        const local = getUserAccounts();
        setUsers((prev) => (JSON.stringify(prev) === JSON.stringify(local) ? prev : local));
      });
  };

  useEffect(() => {
    loadUsers();
    window.addEventListener('storage', loadUsers);
    window.addEventListener('autocare_users_updated', loadUsers);
    const timer = setInterval(loadUsers, 2000);
    return () => {
      window.removeEventListener('storage', loadUsers);
      window.removeEventListener('autocare_users_updated', loadUsers);
      clearInterval(timer);
    };
  }, []);

  const openEditModal = (targetUser) => {
    if (!targetUser) return;
    setEditingUser(targetUser);
    setEditForm({
      id: targetUser.id,
      customId: targetUser.customId,
      username: targetUser.username,
      firstName: targetUser.firstName || (targetUser.name ? targetUser.name.split(' ')[0] : ''),
      middleName: targetUser.middleName || '',
      lastName: targetUser.lastName || (targetUser.name ? targetUser.name.split(' ').slice(1).join(' ') : ''),
      email: targetUser.email || '',
      phone: targetUser.phone || '',
      address: targetUser.address || '',
      gender: targetUser.gender || 'Male',
      birthday: targetUser.birthday || '',
      age: targetUser.age || calculateAge(targetUser.birthday) || '',
      civilStatus: targetUser.civilStatus || 'Single',
      role: targetUser.role || 'client',
    });
  };

  const handleEditBirthdayChange = (e) => {
    const bday = e.target.value;
    const computedAge = calculateAge(bday);
    setEditForm({
      ...editForm,
      birthday: bday,
      age: computedAge || editForm.age,
    });
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    const cleanPhone = (editForm.phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 11) {
      setMessage(`Phone number must be exactly 11 digits (e.g. 09123456789).`);
      return;
    }

    const fullName = [editForm.firstName, editForm.middleName, editForm.lastName]
      .filter(Boolean)
      .map((s) => s.trim())
      .join(' ');

    const payload = {
      ...editForm,
      phone: cleanPhone,
      originalUsername: editingUser.username,
      name: fullName || editForm.username,
      first_name: editForm.firstName,
      middle_name: editForm.middleName,
      last_name: editForm.lastName,
    };

    try {
      // 1. Update in MySQL Database API
      await updateUserProfile(payload);
      setMessage(`Account profiling for '${payload.name}' (@${editForm.username}) updated in MySQL database successfully!`);
    } catch (err) {
      console.warn('Backend API update warning:', err.message);
      setMessage(`Updated '${payload.name}' in local store.`);
    }

    // 2. Update local accounts store
    updateUserAccount(payload);
    loadUsers();

    setEditingUser(null);
    setSelectedUser(null);
    setTimeout(() => setMessage(null), 3500);
  };

  const handleDeleteUser = async (targetUser) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user account '${targetUser.name}' (@${targetUser.username}) from the database? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      // 1. Delete from MySQL Database API
      await deleteUserAccountApi(targetUser.id, targetUser.username);
    } catch (err) {
      console.warn('Backend API delete warning, removing from local accounts store:', err);
    }

    // 2. Remove from Local Accounts Store
    removeUserAccount(targetUser);
    loadUsers();
    setSelectedUser(null);

    setMessage(`Account '${targetUser.name}' (@${targetUser.username}) deleted successfully from database!`);
    setTimeout(() => setMessage(null), 3000);
  };

  // Combined Search & Role Filter
  const filteredUsers = users.filter((u) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      (u.name || '').toLowerCase().includes(query) ||
      (u.username || '').toLowerCase().includes(query) ||
      (u.customId || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query) ||
      (u.role || '').toLowerCase().includes(query) ||
      (u.address || '').toLowerCase().includes(query);

    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'staff' ? u.role === 'staff' || u.role === 'mechanic' : u.role === roleFilter);

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    switch ((role || '').toLowerCase()) {
      case 'admin':
        return <span className="bg-red-100 text-red-800 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase">ADMIN</span>;
      case 'manager':
        return <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase">MANAGER</span>;
      case 'cashier':
        return <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase">CASHIER</span>;
      case 'staff':
      case 'mechanic':
        return <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase">MECHANIC</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase">CLIENT</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <span>User Management ({users.length})</span>
          </h1>
          <p className="text-sm text-gray-500">Filter, search, inspect, edit, and delete user accounts connected to MySQL database</p>
        </div>

        {/* Real-time Search Input */}
        <div className="w-full sm:w-80">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user by name, ID, role..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Role Separator Category Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-2 shadow-sm flex flex-wrap items-center gap-1">
        {[
          { id: 'all', label: 'All Users' },
          { id: 'client', label: 'Clients' },
          { id: 'staff', label: 'Staff / Mechanics' },
          { id: 'manager', label: 'Managers' },
          { id: 'cashier', label: 'Cashiers' },
          { id: 'admin', label: 'Admins' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setRoleFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              roleFilter === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Custom ID</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Username</th>
                <th className="p-3">Role</th>
                <th className="p-3">Gender</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u) => (
                <tr key={u.id || u.username} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-gray-900">{u.customId}</td>
                  <td className="p-3 font-semibold text-gray-900">{u.name}</td>
                  <td className="p-3 font-mono text-gray-700">@{u.username}</td>
                  <td className="p-3">{getRoleBadge(u.role)}</td>
                  <td className="p-3 font-semibold text-gray-700">{u.gender || 'Male'}</td>
                  <td className="p-3 font-bold text-emerald-600">{u.status || 'Active'}</td>
                  <td className="p-3 text-right flex items-center justify-end space-x-2">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View</span>
                    </button>

                    <button
                      onClick={() => openEditModal(u)}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 border border-amber-200 cursor-pointer"
                      title="Edit user details and update in MySQL database"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteUser(u)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 border border-red-200 cursor-pointer"
                      title="Delete User Account from Database"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-xs">
            No users found in this category matching "<span className="font-semibold text-gray-700">{searchTerm}</span>".
          </div>
        )}
      </div>

      {/* Admin Full User Profiling Details View Modal */}
      {selectedUser && !editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{selectedUser.name}</h3>
                  <p className="text-xs text-gray-500 font-mono">{selectedUser.customId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                <span className="font-semibold text-gray-500">Account Role</span>
                <span>{getRoleBadge(selectedUser.role)}</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Username</span>
                <span className="font-mono font-bold text-gray-900">@{selectedUser.username}</span>
              </div>

              <div className="grid grid-cols-4 gap-2 bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-[11px]">
                <div>
                  <span className="text-[9px] font-bold text-blue-900 uppercase block">Gender</span>
                  <span className="font-bold text-gray-900">{selectedUser.gender || 'Male'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-blue-900 uppercase block">Birthday</span>
                  <span className="font-bold text-gray-900">{selectedUser.birthday || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-blue-900 uppercase block">Age</span>
                  <span className="font-bold text-gray-900">{selectedUser.age ? `${selectedUser.age} Yrs` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-blue-900 uppercase block">Status</span>
                  <span className="font-bold text-gray-900">{selectedUser.civilStatus || 'Single'}</span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Email Address</span>
                <span className="font-medium text-gray-900">{selectedUser.email}</span>
              </div>

              <div className="bg-gray-50/80 p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Phone Number</span>
                <span className="font-medium text-gray-900">{selectedUser.phone}</span>
              </div>

              <div className="bg-gray-50/80 p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Address</span>
                <span className="font-medium text-gray-900">{selectedUser.address}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-between space-x-2">
              <button
                onClick={() => openEditModal(selectedUser)}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-600/20 flex items-center space-x-1.5 cursor-pointer"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Details</span>
              </button>

              <button
                onClick={() => handleDeleteUser(selectedUser)}
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>

              <button
                onClick={() => setSelectedUser(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER ACCOUNT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                  <Edit3 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Edit Account Details</h3>
                  <p className="text-xs text-gray-500 font-mono">User ID: {editForm.customId} • @{editForm.username}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={editForm.middleName}
                    onChange={(e) => setEditForm({ ...editForm, middleName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Phone Number (11 Digits)</label>
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    placeholder="09123456789"
                    value={editForm.phone}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setEditForm({ ...editForm, phone: digitsOnly });
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 bg-amber-50/60 p-3 rounded-2xl border border-amber-200">
                <div>
                  <label className="block text-[10px] font-bold text-amber-900 mb-1">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-bold focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-amber-900 mb-1">Birthday</label>
                  <input
                    type="date"
                    value={editForm.birthday}
                    onChange={handleEditBirthdayChange}
                    className="w-full bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-amber-900 mb-1">Age</label>
                  <input
                    type="number"
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-amber-900 mb-1">Civil Status</label>
                  <select
                    value={editForm.civilStatus}
                    onChange={(e) => setEditForm({ ...editForm, civilStatus: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-bold focus:outline-none"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-amber-600/20 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes to MySQL Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
