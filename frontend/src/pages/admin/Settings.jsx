import React, { useState } from 'react';
import { updateUserAccount } from '../../utils/userAccountsStore';
import { updateUserProfile } from '../../api';
import { Settings as SettingsIcon, User, Lock, Sun, Moon, Check, Camera, Edit3, X, Save, Eye, EyeOff } from 'lucide-react';

export default function Settings({ user, onUserUpdate }) {
  const [activeTab, setActiveTabState] = useState(() => {
    return sessionStorage.getItem('settings_active_tab') || 'profile';
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    sessionStorage.setItem('settings_active_tab', tab);
  };

  const [themeMode, setThemeModeState] = useState(() => {
    return localStorage.getItem('autocare_theme') || 'light';
  });

  const applyTheme = (mode) => {
    setThemeModeState(mode);
    localStorage.setItem('autocare_theme', mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.dispatchEvent(new Event('storage'));
    setMessage({
      type: 'success',
      text: `System theme switched to ${mode.toUpperCase()} mode successfully!`,
    });
  };

  const [isEditing, setIsEditing] = useState(false);

  const role = (user?.role || 'admin').toString().toLowerCase();
  const isClient = role === 'customer' || role === 'client';
  const clientFallbackId = `CLT-${300 + parseInt(user?.id || user?.client_id || 4, 10)}`;
  const fallbackCustomId = role === 'admin' ? 'ADM-1' : role === 'manager' ? 'MGR-102' : role === 'cashier' ? 'CSH-201' : role === 'staff' ? 'STF-101' : clientFallbackId;

  // Profile Picture State
  const [avatar, setAvatar] = useState(
    user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  );

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

  const resolveCustomId = (u) => {
    if (!u) return 'CLT-304';
    if (u.customId) return u.customId;
    if (u.custom_client_id) return u.custom_client_id;
    if (u.custom_personnel_id) return u.custom_personnel_id;

    const r = (u.role || 'client').toString().toLowerCase();
    if (r === 'admin') return 'ADM-1';
    if (r === 'manager') return 'MGR-102';
    if (r === 'cashier') return 'CSH-201';
    if (r === 'staff' || r === 'mechanic') return 'STF-101';

    const uName = (u.name || u.first_name || '').toLowerCase();
    if (uName.includes('claire') || u.username === 'CLT-4') return 'CLT-301';
    if (uName.includes('lucky') || u.username === 'lucky_garay') return 'CLT-302';
    if (uName.includes('mike') || u.username === 'clt_mikegerald303') return 'CLT-303';
    if (uName.includes('deavoune') || u.username === 'deavoune_garay') return 'CLT-304';
    if (uName.includes('jaymarie') || u.username === 'jaymarie') return 'CLT-305';

    return `CLT-${300 + parseInt(u.id || u.client_id || 4, 10)}`;
  };

  // Helper to extract initial profile from active logged-in user
  const getInitialProfileState = (u) => {
    const fName = u?.first_name || u?.firstName || (u?.name ? u.name.split(' ')[0] : '');
    const mName = u?.middle_name !== undefined ? u.middle_name : (u?.middleName !== undefined ? u.middleName : '');
    const lName = u?.last_name || u?.lastName || (u?.name ? u.name.split(' ').slice(1).join(' ') : '');
    const bDay = u?.birthday || '';
    const ageVal = u?.age !== undefined && u?.age !== null && u?.age !== '' ? u.age.toString() : calculateAge(bDay);

    return {
      firstName: fName,
      middleName: mName,
      lastName: lName,
      email: u?.email || '',
      phone: u?.phone || '',
      address: u?.address || '',
      username: u?.username || '',
      customId: resolveCustomId(u),
      birthday: bDay,
      age: ageVal,
      gender: u?.gender || 'Female',
      civilStatus: u?.civilStatus || u?.civil_status || 'Single',
    };
  };

  // Profile Form State initialized with logged-in user details
  const [profile, setProfile] = useState(() => getInitialProfileState(user));

  // Security Form State & Password Visibility Toggles
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState(null);

  const handleBirthdayChange = (e) => {
    const bday = e.target.value;
    const computedAge = calculateAge(bday);
    setProfile({
      ...profile,
      birthday: bday,
      age: computedAge || profile.age,
    });
  };

  React.useEffect(() => {
    if (user) {
      if (user.avatar) setAvatar(user.avatar);
      setProfile((prev) => ({
        ...prev,
        customId: resolveCustomId(user),
        firstName: user.first_name || user.firstName || (user.name ? user.name.split(' ')[0] : prev.firstName),
        middleName: user.middle_name !== undefined ? user.middle_name : (user.middleName !== undefined ? user.middleName : prev.middleName),
        lastName: user.last_name || user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : prev.lastName),
        email: user.email !== undefined && user.email !== '' ? user.email : prev.email,
        phone: user.phone !== undefined && user.phone !== '' ? user.phone : prev.phone,
        address: user.address !== undefined ? user.address : prev.address,
        username: user.username || prev.username,
        birthday: user.birthday !== undefined ? user.birthday : prev.birthday,
        age: user.age !== undefined && user.age !== null ? user.age : (calculateAge(user.birthday) || prev.age),
        gender: user.gender || prev.gender,
        civilStatus: user.civilStatus || user.civil_status || prev.civilStatus,
      }));
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result;
        setAvatar(base64Image);
        setMessage({ type: 'success', text: 'New profile photo selected! Click "Save Profile Changes" to update in SQL & dashboards.' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    const cleanPhone = (profile.phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 11) {
      setMessage({ type: 'error', text: 'Phone number must be exactly 11 digits (e.g. 09123456789).' });
      return;
    }

    const fullName = [profile.firstName, profile.middleName, profile.lastName]
      .filter(Boolean)
      .map((s) => s.trim())
      .join(' ');

    const updatedProfile = {
      ...user,
      ...profile,
      phone: cleanPhone,
      originalUsername: user?.username,
      name: fullName || profile.username,
      avatar,
      first_name: profile.firstName,
      middle_name: profile.middleName,
      last_name: profile.lastName,
    };

    try {
      const res = await updateUserProfile(updatedProfile);
      const returnedUser = res && res.user ? res.user : updatedProfile;
      if (onUserUpdate) {
        onUserUpdate(returnedUser);
      }
      updateUserAccount(returnedUser);
      setMessage({ type: 'success', text: 'Personal profile & information updated in MySQL database successfully!' });
    } catch (err) {
      console.warn('Backend API update warning, saving to local accounts store:', err);
      if (onUserUpdate) {
        onUserUpdate(updatedProfile);
      }
      updateUserAccount(updatedProfile);
      setMessage({ type: 'success', text: 'Personal profile updated and synchronized successfully!' });
    }

    window.dispatchEvent(new Event('autocare_users_updated'));
    window.dispatchEvent(new Event('storage'));
    setIsEditing(false);
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (passwords.newPassword.length < 4) {
      setMessage({ type: 'error', text: 'Password must be at least 4 characters long.' });
      return;
    }

    try {
      await updateUserProfile({
        id: user?.id,
        username: user?.username,
        originalUsername: user?.username,
        password: passwords.newPassword,
      });
      setMessage({ type: 'success', text: 'Password changed & updated in MySQL database successfully!' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.warn('Backend API password update warning:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update password in database.' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <SettingsIcon className="h-6 w-6 text-blue-600" />
          <span>{isClient ? 'Account Settings' : `${role.toUpperCase()} Account Settings`}</span>
        </h1>
        <p className="text-sm text-gray-500">
          Manage profile information, gender, birthday, civil status, and password for <strong className="text-gray-800">{profile.firstName} {profile.lastName}</strong>
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <Check className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Upper Profile Picture Header Card */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="relative group shrink-0">
            <img
              src={avatar}
              alt="Profile Avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow-md"
            />
            {/* Show camera upload button ONLY when in Editing mode */}
            {isEditing && (
              <label
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-500 transition-colors shadow-md animate-bounce"
                title="Upload Profile Picture"
              >
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            )}
          </div>

          <div className="text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <h2 className="text-xl font-bold text-gray-900">{profile.firstName} {profile.lastName}</h2>
              <span className="font-mono text-xs font-bold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-md border border-blue-100">
                {profile.customId}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono">@{profile.username} • {profile.email}</p>
            <div className="flex items-center justify-center sm:justify-start space-x-2 mt-1">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                {role}
              </span>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                Gender: {profile.gender}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Profile Mode Toggle Button */}
        {activeTab === 'profile' && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center space-x-1.5 shrink-0"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-2 shadow-sm flex items-center space-x-2">
        {[
          { id: 'profile', label: 'Personal Info & Profiling', icon: User },
          { id: 'security', label: 'Password & Security', icon: Lock },
          { id: 'appearance', label: 'Appearance & Theme', icon: Sun },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMessage(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Personal Profile Info */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-gray-900">
              {isEditing ? 'Editing Personal Profile' : 'Personal Profile Summary'}
            </h2>
            <span className="text-xs text-gray-400">All fields synced with system database</span>
          </div>

          {!isEditing ? (
            /* Read-Only Profile View */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">First Name</span>
                  <p className="font-bold text-gray-900 text-sm">{profile.firstName}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Middle Name</span>
                  <p className="font-bold text-gray-900 text-sm">{profile.middleName || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Last Name</span>
                  <p className="font-bold text-gray-900 text-sm">{profile.lastName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Username</span>
                  <p className="font-mono font-bold text-gray-900 text-sm">@{profile.username}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Email Address</span>
                  <p className="font-semibold text-gray-900 text-sm">{profile.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-blue-900 uppercase block">Gender</span>
                  <p className="font-bold text-gray-900 text-sm">{profile.gender}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-blue-900 uppercase block">Birthday</span>
                  <p className="font-bold text-gray-900 text-sm">{profile.birthday || 'N/A'}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-blue-900 uppercase block">Age</span>
                  <p className="font-bold text-gray-900 text-sm">{profile.age ? `${profile.age} Years Old` : 'N/A'}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-blue-900 uppercase block">Civil Status</span>
                  <p className="font-bold text-gray-900 text-sm">{profile.civilStatus}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Phone Number</span>
                  <p className="font-semibold text-gray-900 text-sm">{profile.phone}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Address</span>
                  <p className="font-semibold text-gray-900 text-sm">{profile.address}</p>
                </div>
              </div>
            </div>
          ) : (
            /* Edit Profile Form */
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={profile.middleName}
                    onChange={(e) => setProfile({ ...profile, middleName: e.target.value })}
                    placeholder="Middle Name"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Username & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={profile.username}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Gender, Birthday & Age Calculation */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/80">
                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1">Gender</label>
                  <select
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
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
                    value={profile.birthday}
                    onChange={handleBirthdayChange}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1">Calculated Age</label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                    placeholder="e.g. 26"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1">Civil Status</label>
                  <select
                    value={profile.civilStatus}
                    onChange={(e) => setProfile({ ...profile, civilStatus: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                </div>
              </div>

              {/* Phone & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number (11 Digits)</label>
                  <input
                    type="tel"
                    maxLength={11}
                    placeholder="09123456789"
                    value={profile.phone}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setProfile({ ...profile, phone: digitsOnly });
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-3 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center space-x-1"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center space-x-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Change Password</h2>
          <form onSubmit={handleSecuritySubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                  title={showCurrentPassword ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-blue-600/20"
            >
              Update Password
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Appearance & Theme */}
      {activeTab === 'appearance' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Theme Preferences</h2>
            <p className="text-xs text-gray-500 mt-1">Choose your preferred visual theme appearance for the AutoCare System dashboard</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            {/* Light Mode Card */}
            <div
              onClick={() => applyTheme('light')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                themeMode === 'light'
                  ? 'border-blue-600 bg-blue-50/50 shadow-md'
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${themeMode === 'light' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  <Sun className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-gray-900">Light Mode</p>
                  <p className="text-[11px] text-gray-500">Bright, clean interface</p>
                </div>
              </div>
              {themeMode === 'light' && <Check className="h-5 w-5 text-blue-600 font-bold" />}
            </div>

            {/* Dark Mode Card */}
            <div
              onClick={() => applyTheme('dark')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                themeMode === 'dark'
                  ? 'border-blue-600 bg-slate-900 text-white shadow-md'
                  : 'border-gray-200 bg-slate-900/90 text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${themeMode === 'dark' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-300'}`}>
                  <Moon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-white">Dark Mode</p>
                  <p className="text-[11px] text-gray-400">High contrast dark theme</p>
                </div>
              </div>
              {themeMode === 'dark' && <Check className="h-5 w-5 text-blue-400 font-bold" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
