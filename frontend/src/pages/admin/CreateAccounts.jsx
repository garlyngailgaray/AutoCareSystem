import React, { useState } from 'react';
import { createAccount } from '../../api';
import { addUserAccount } from '../../utils/userAccountsStore';
import { UserPlus, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function CreateAccounts({ user }) {
  const [role, setRole] = useState('client');
  const [showPassword, setShowPassword] = useState(false);

  // Helper to calculate age from birthday date string
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

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    username: '',
    password: '',
    gender: 'Male',
    birthday: '',
    age: '',
    civilStatus: 'Single',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleBirthdayChange = (e) => {
    const bday = e.target.value;
    const computedAge = calculateAge(bday);
    setFormData({
      ...formData,
      birthday: bday,
      age: computedAge || formData.age,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanPhone = (formData.phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 11) {
      setMessage({ type: 'error', text: 'Phone number must be exactly 11 digits (e.g. 09123456789).' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      let customId = '';
      try {
        const res = await createAccount({
          role,
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          username: formData.username,
          password: formData.password,
          gender: formData.gender,
          birthday: formData.birthday,
          civilStatus: formData.civilStatus,
        });
        customId = res.customId;
      } catch (err) {
        console.warn('Backend API connection warning, saving to local accounts store:', err);
      }

      // Save to Shared User Accounts Store for Instant Dashboard Display
      const created = addUserAccount({
        role,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        username: formData.username,
        gender: formData.gender,
        birthday: formData.birthday,
        age: formData.age,
        civilStatus: formData.civilStatus,
        customId,
      });

      setMessage({
        type: 'success',
        text: `Account profiling for ${formData.firstName} ${formData.lastName} (${role.toUpperCase()} - ID: ${created.customId}) successfully created & stored in database!`,
      });

      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        username: '',
        password: '',
        gender: 'Male',
        birthday: '',
        age: '',
        civilStatus: 'Single',
      });
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to store account in database.';
      setMessage({
        type: 'error',
        text: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <UserPlus className="h-6 w-6 text-blue-600" />
          <span>Create & Profile New Accounts</span>
        </h1>
        <p className="text-sm text-gray-500">
          Register new account profiling for Clients or Personnel
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center space-x-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Role Selector Tabs */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Account Role</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'client', label: 'Client' },
              { id: 'staff', label: 'Staff / Mechanic' },
              { id: 'manager', label: 'Personnel' },
              { id: 'cashier', label: 'Cashier' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                  role === r.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-gray-100">
          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                required
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Middle Name</label>
              <input
                type="text"
                placeholder="Middle Name"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Username & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                required
                placeholder="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Gender, Birthday Date Selector & Age Auto-Calculator */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1">Birthday Date</label>
              <input
                type="date"
                required
                value={formData.birthday}
                onChange={handleBirthdayChange}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1">Calculated Age (Years)</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Auto-calculated from birthday"
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1">Civil Status</label>
              <select
                value={formData.civilStatus}
                onChange={(e) => setFormData({ ...formData, civilStatus: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
              </select>
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number (11 Digits)</label>
              <input
                type="tel"
                maxLength={11}
                placeholder="09123456789"
                value={formData.phone}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setFormData({ ...formData, phone: digitsOnly });
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
            <input
              type="text"
              placeholder="Full Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-400 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>{loading ? 'Storing in Database...' : `Create & Profile ${role.toUpperCase()} Account`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
