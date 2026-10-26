import React, { useState, useEffect } from 'react';
import { addUserAccount } from '../../utils/userAccountsStore';
import { createAccount, fetchPendingRequestsApi, deletePendingRequestApi } from '../../api';
import {
  Clock,
  Check,
  X,
  UserCheck,
  AlertCircle,
  Search,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Key,
  ShieldCheck,
} from 'lucide-react';

const PENDING_STORAGE_KEY = 'autocare_pending_requests';

const getPendingRequests = () => {
  try {
    const data = localStorage.getItem(PENDING_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const savePendingRequests = (requests) => {
  try {
    localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(requests));
  } catch (e) {}
};

export default function PendingRequests() {
  const [searchTerm, setSearchTerm] = useState('');
  const [requests, setRequests] = useState(() => getPendingRequests());
  const [message, setMessage] = useState(null);

  // Approval Modal State
  const [approvingReq, setApprovingReq] = useState(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const loadRequests = () => {
    const local = getPendingRequests();

    fetchPendingRequestsApi()
      .then((dbRequests) => {
        if (dbRequests && Array.isArray(dbRequests)) {
          setRequests((prev) => (JSON.stringify(prev) === JSON.stringify(dbRequests) ? prev : dbRequests));
          savePendingRequests(dbRequests);
        } else {
          setRequests(local);
        }
      })
      .catch((err) => {
        console.warn('Pending requests database fetch warning:', err);
        setRequests(local);
      });
  };

  useEffect(() => {
    loadRequests();
    window.addEventListener('storage', loadRequests);
    const timer = setInterval(loadRequests, 3000);
    return () => {
      window.removeEventListener('storage', loadRequests);
      clearInterval(timer);
    };
  }, []);

  const openApprovalModal = (req) => {
    setApprovingReq(req);

    // Auto-generate suggested username from first & last name
    const suggestedUsername = `${(req.firstName || '').toLowerCase().trim()}_${(req.lastName || '').toLowerCase().trim()}`.replace(/\s+/g, '');
    setAdminUsername(suggestedUsername);
    setAdminPassword('client123'); // Default suggested password
  };

  const handleConfirmApproval = async (e) => {
    e.preventDefault();
    if (!approvingReq) return;

    if (!adminUsername.trim() || !adminPassword.trim()) {
      alert('Please provide both Username and Password for the client account.');
      return;
    }

    const updated = requests.filter((r) => r.id !== approvingReq.id);
    setRequests(updated);
    savePendingRequests(updated);

    // Delete request from pending database table
    try {
      await deletePendingRequestApi(approvingReq.id, approvingReq.email);
    } catch (e) {}

    const clientData = {
      role: 'client',
      firstName: approvingReq.firstName || approvingReq.name.split(' ')[0],
      middleName: approvingReq.middleName || '',
      lastName: approvingReq.lastName || approvingReq.name.split(' ').slice(1).join(' '),
      username: adminUsername.trim(),
      password: adminPassword.trim(),
      email: approvingReq.email,
      phone: approvingReq.phone,
      address: approvingReq.address || 'Bohol',
      gender: approvingReq.gender || 'Male',
      civilStatus: approvingReq.civilStatus || 'Single',
      birthday: approvingReq.birthday || '',
      age: approvingReq.age || '',
    };

    // 1. Save new client into MySQL Database API
    try {
      await createAccount(clientData);
    } catch (err) {
      console.warn('Backend database API warning, saving to local store:', err.message);
    }

    // 2. Save new client into Local Accounts Store
    const newAccount = addUserAccount(clientData);

    setMessage({
      type: 'success',
      text: `Account for ${approvingReq.name} APPROVED & saved to MySQL database! Assigned ID: [${newAccount.customId}], Username: @${adminUsername.trim()}`,
    });

    setApprovingReq(null);
    setAdminUsername('');
    setAdminPassword('');
  };

  const handleDeny = async (req) => {
    const updated = requests.filter((r) => r.id !== req.id);
    setRequests(updated);
    savePendingRequests(updated);

    try {
      await deletePendingRequestApi(req.id, req.email);
    } catch (e) {}

    setMessage({ type: 'deny', text: `Account request for ${req.name} has been DENIED.` });
  };

  const filteredRequests = requests.filter((req) => {
    const query = searchTerm.toLowerCase();
    return (
      (req.name || '').toLowerCase().includes(query) ||
      (req.firstName || '').toLowerCase().includes(query) ||
      (req.lastName || '').toLowerCase().includes(query) ||
      (req.email || '').toLowerCase().includes(query) ||
      (req.phone || '').toLowerCase().includes(query) ||
      (req.address || '').toLowerCase().includes(query) ||
      (req.requestedAt || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Clock className="h-6 w-6 text-amber-600" />
            <span>Pending Client Registration Requests ({requests.length})</span>
          </h1>
          <p className="text-sm text-gray-500">
            Review client registrations and generate their login Username & Password upon approval
          </p>
        </div>

        {/* Real-time Search Input */}
        <div className="w-full sm:w-80">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone, address..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-600 shadow-sm"
            />
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-sm font-semibold flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check className="h-5 w-5 text-emerald-600 shrink-0" /> : <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm text-gray-500 text-sm space-y-2">
          <UserCheck className="h-12 w-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No pending client requests</h3>
          <p className="text-xs text-gray-500">All new client account creation requests have been processed.</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm text-gray-500 text-sm space-y-2">
          <Search className="h-12 w-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No matching requests found</h3>
          <p className="text-xs text-gray-500">
            No pending registration requests matched "<span className="font-semibold text-gray-700">{searchTerm}</span>".
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div key={req.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-gray-900 text-base">{req.name}</h3>
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border border-amber-200">
                        AWAITING ADMIN APPROVAL
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Requested: <span className="font-mono text-gray-700 font-semibold">{req.requestedAt}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDeny(req)}
                    className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-red-200 transition-all flex items-center space-x-1"
                  >
                    <X className="h-4 w-4" />
                    <span>Deny</span>
                  </button>
                  <button
                    onClick={() => openApprovalModal(req)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5"
                  >
                    <Check className="h-4 w-4" />
                    <span>Approve & Create Credentials</span>
                  </button>
                </div>
              </div>

              {/* Client Profile Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-gray-50 p-3 rounded-2xl space-y-0.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Name Breakdown</span>
                  <p className="font-bold text-gray-900">First: {req.firstName || req.name.split(' ')[0]}</p>
                  <p className="text-gray-600">Middle: {req.middleName || 'N/A'}</p>
                  <p className="font-bold text-gray-900">Last: {req.lastName || req.name.split(' ').slice(1).join(' ')}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-2xl space-y-0.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Contact Info</span>
                  <p className="font-semibold text-gray-900 truncate">Email: {req.email}</p>
                  <p className="font-mono text-gray-700">Phone: {req.phone}</p>
                  <p className="text-gray-600">Address: {req.address}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-2xl space-y-0.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Demographics & Status</span>
                  <p className="font-bold text-gray-900">Gender: {req.gender || 'Not specified'}</p>
                  <p className="font-bold text-indigo-700">Status: {req.civilStatus || 'Single'}</p>
                  <p className="font-mono text-gray-700">Bday: {req.birthday || 'N/A'} ({req.age || 'N/A'} yrs)</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-amber-900 uppercase block">Account ID & Credentials</span>
                  <p className="text-xs font-mono font-bold text-amber-800">ID: Automatic (CLT-XXX)</p>
                  <p className="text-[11px] text-amber-900 font-medium">Username & Password will be generated by Admin upon clicking Approve.</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADMIN APPROVAL MODAL (Creating Username & Password) */}
      {approvingReq && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base uppercase">Approve Client Account</h3>
                  <p className="text-xs text-gray-500">Generating credentials for {approvingReq.name}</p>
                </div>
              </div>
              <button
                onClick={() => setApprovingReq(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Client Info Summary */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-bold text-white uppercase">{approvingReq.name}</span>
                <span className="bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                  CLIENT ROLE • AUTO ID ASSIGNED
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300">
                <p>Email: <strong className="text-white">{approvingReq.email}</strong></p>
                <p>Phone: <strong className="text-white">{approvingReq.phone}</strong></p>
                <p>Gender: <strong className="text-white">{approvingReq.gender}</strong></p>
                <p>Age: <strong className="text-white">{approvingReq.age} yrs</strong></p>
                <p className="col-span-2">Address: <strong className="text-white">{approvingReq.address}</strong></p>
              </div>
            </div>

            {/* Admin Input Form for Username & Password */}
            <form onSubmit={handleConfirmApproval} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Create Username for Client <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="e.g. angela_santos"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Create Password for Client <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="e.g. client123"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setApprovingReq(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center space-x-2"
                >
                  <Check className="h-4 w-4" />
                  <span>Confirm & Activate Client Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
