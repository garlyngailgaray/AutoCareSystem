import React, { useState, useEffect } from 'react';
import { createJobOrder, getMechanicsList } from '../../utils/jobOrderStore';
import { getUserAccounts } from '../../utils/userAccountsStore';
import { fetchAllUsers } from '../../api';
import { FilePlus, Wrench, User, Check, ShieldCheck, AlertCircle, Clock, CheckCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreateJobOrder({ user }) {
  const navigate = useNavigate();
  const [mechanics, setMechanics] = useState([]);

  // Client Search State
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [allClientsList, setAllClientsList] = useState([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  useEffect(() => {
    const loadMechanics = async () => {
      try {
        const dbUsers = await fetchAllUsers();
        const mechList = getMechanicsList(Array.isArray(dbUsers) ? dbUsers : null);
        setMechanics(Array.isArray(mechList) ? mechList : []);
      } catch (e) {
        console.warn('Database mechanics fetch warning, using local mechanics:', e.message);
        setMechanics(getMechanicsList());
      }
    };

    loadMechanics();

    const defaultClients = [
      { id: 1, name: 'Claire Deliman', username: 'CLT-4', customId: 'CLT-301', phone: '09090909090' },
      { id: 2, name: 'Lucky Garay', username: 'lucky_garay', customId: 'CLT-302', phone: '09966009233' },
      { id: 3, name: 'Mike Gerald Bacasmas', username: 'clt_mikegerald303', customId: 'CLT-303', phone: '09631371882' },
      { id: 4, name: 'Christian Brina', username: 'christian_brina', customId: 'STF-101', phone: '09957751462' },
    ];

    let localAccs = [];
    try {
      localAccs = getUserAccounts();
      if (!Array.isArray(localAccs)) localAccs = [];
    } catch (e) {
      localAccs = [];
    }

    const merged = [...defaultClients];
    localAccs.forEach((c) => {
      if (!c || !c.name) return;
      const cName = c.name || '';
      const cCustomId = c.customId || c.custom_client_id || c.custom_personnel_id || `ID-${c.id}`;
      if (!merged.some((m) => m.customId === cCustomId || (m.name && cName && m.name.toLowerCase() === cName.toLowerCase()))) {
        merged.push({
          id: c.id || cCustomId,
          name: cName,
          username: c.username || '',
          customId: cCustomId,
          phone: c.phone || '09123456789',
        });
      }
    });

    setAllClientsList(merged);

    // Fetch live users directly from MySQL API safely so all users are searchable as clients
    fetchAllUsers()
      .then((dbUsers) => {
        if (dbUsers && Array.isArray(dbUsers)) {
          const updatedList = [...merged];
          dbUsers.forEach((c) => {
            if (!c) return;
            const cName = c.name || (c.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : 'User');
            const cCustomId = c.customId || c.custom_client_id || c.custom_personnel_id || `ID-${c.id}`;
            if (!updatedList.some((m) => m.customId === cCustomId || (m.name && cName && m.name.toLowerCase() === cName.toLowerCase()))) {
              updatedList.push({
                id: c.id || cCustomId,
                name: cName,
                username: c.username || '',
                customId: cCustomId,
                phone: c.phone || '09123456789',
              });
            }
          });
          setAllClientsList(updatedList);
        }
      })
      .catch((e) => console.warn('Database client fetch warning:', e.message));
  }, []);

  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    clientUsername: '',
    clientCustomId: '',
    clientPhone: '',
    vehicleName: '',
    plateNumber: '',
    serviceCategory: 'Change Oil & Maintenance',
    problemDescription: '',
    assignedMechanic: 'Dave Garay',
    serviceFee: '₱1,200.00',
    laborFee: '₱300.00',
    totalPrice: '₱1,500.00',
  });

  const [message, setMessage] = useState(null);

  const servicesList = [
    { name: 'Change Oil & Maintenance', serviceFee: '₱1,200.00', laborFee: '₱300.00', total: '₱1,500.00' },
    { name: 'Tune Up & Ignition System', serviceFee: '₱2,000.00', laborFee: '₱500.00', total: '₱2,500.00' },
    { name: 'Engine Overhauling', serviceFee: '₱9,500.00', laborFee: '₱3,000.00', total: '₱12,500.00' },
    { name: 'Brake & Suspension Overhaul', serviceFee: '₱2,800.00', laborFee: '₱700.00', total: '₱3,500.00' },
    { name: 'Under Chassis & Steering', serviceFee: '₱2,500.00', laborFee: '₱500.00', total: '₱3,000.00' },
    { name: 'Wiring & Electrical Diagnostics', serviceFee: '₱1,500.00', laborFee: '₱500.00', total: '₱2,000.00' },
    { name: 'Air Conditioning Services', serviceFee: '₱2,500.00', laborFee: '₱1,000.00', total: '₱3,500.00' },
    { name: 'Wheel Alignment & Balancing', serviceFee: '₱1,000.00', laborFee: '₱200.00', total: '₱1,200.00' },
    { name: 'Vulcanize & Tire Care', serviceFee: '₱200.00', laborFee: '₱100.00', total: '₱300.00' },
    { name: 'Body Repair & Panel Restoration', serviceFee: '₱4,000.00', laborFee: '₱1,000.00', total: '₱5,000.00' },
    { name: 'Body Paint & Refinishing', serviceFee: '₱15,000.00', laborFee: '₱4,000.00', total: '₱19,000.00' },
    { name: 'Drive Train & Transmission', serviceFee: '₱6,500.00', laborFee: '₱1,500.00', total: '₱8,000.00' },
  ];

  const safeClients = Array.isArray(allClientsList) ? allClientsList : [];
  const filteredClients = safeClients.filter((c) => {
    if (!c) return false;
    let rawQuery = (clientSearchTerm || '').toLowerCase().trim();

    // If search term matches the currently selected client string "Name (CustomID)",
    // strip parentheses for clean word matching
    if (formData.clientName && formData.clientCustomId && rawQuery.includes(formData.clientCustomId.toLowerCase())) {
      rawQuery = (formData.clientName || '').toLowerCase().trim();
    }

    if (!rawQuery) return true;

    // Tokenize search query into words
    const queryWords = rawQuery
      .replace(/[()]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    if (queryWords.length === 0) return true;

    const cName = (c.name || '').toLowerCase();
    const cCustomId = (c.customId || '').toLowerCase();
    const cUsername = (c.username || '').toLowerCase();
    const cPhone = (c.phone || '').toLowerCase();

    // Require all query words to match at least one client field
    return queryWords.every(
      (word) =>
        cName.includes(word) ||
        cCustomId.includes(word) ||
        cUsername.includes(word) ||
        cPhone.includes(word)
    );
  });

  const safeMechanics = Array.isArray(mechanics) ? mechanics : [];
  const selectedMechanicInfo = safeMechanics.find((m) => {
    if (!m || !m.name) return false;
    const mName = m.name.toLowerCase();
    const assignedName = (formData.assignedMechanic || '').toLowerCase();
    return mName.includes(assignedName) || assignedName.includes(mName);
  });

  const handleServiceChange = (serviceName) => {
    const selected = servicesList.find((s) => s.name === serviceName);
    if (selected) {
      setFormData({
        ...formData,
        serviceCategory: serviceName,
        serviceFee: selected.serviceFee,
        laborFee: selected.laborFee,
        totalPrice: selected.total,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientName) {
      setMessage({ type: 'error', text: 'Please search and select a client.' });
      return;
    }

    const cleanPhone = (formData.clientPhone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 11) {
      setMessage({ type: 'error', text: 'Client contact phone number must be exactly 11 digits (e.g. 09123456789).' });
      return;
    }

    if (!formData.problemDescription.trim()) {
      setMessage({ type: 'error', text: 'Please enter a description of the reported vehicle problem.' });
      return;
    }

    try {
      // Save directly to MySQL Database & Local Store
      const created = await createJobOrder({
        clientName: formData.clientName,
        clientUsername: formData.clientUsername,
        clientCustomId: formData.clientCustomId,
        clientPhone: formData.clientPhone,
        vehicleName: formData.vehicleName,
        plateNumber: formData.plateNumber,
        serviceCategory: formData.serviceCategory,
        problemDescription: formData.problemDescription,
        assignedMechanic: formData.assignedMechanic,
        serviceFee: formData.serviceFee,
        laborFee: formData.laborFee,
        totalPrice: formData.totalPrice,
      });

      setMessage({
        type: 'success',
        text: `Job Order #${created.id} reported & saved into MySQL database for client ${formData.clientName} successfully!`,
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1800);
    } catch (err) {
      console.error('Job Order Submit Error:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to store job order in database.',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <FilePlus className="h-6 w-6 text-purple-600" />
          <span>Report & Create Job Order (Front Desk)</span>
        </h1>
        <p className="text-sm text-gray-500">
          Search client, record vehicle problem, select repair service, and inspect real-time mechanic availability
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center space-x-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
            <User className="h-5 w-5 text-purple-600" />
            <span>1. Client & Vehicle Details</span>
          </h2>
          <span className="text-xs font-mono font-bold bg-purple-50 text-purple-700 px-3 py-1 rounded-lg">
            Front Desk Job Order Form
          </span>
        </div>

        {/* 1. Search Client (Name or ID) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Search Client (Name or ID) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={clientSearchTerm}
                onChange={(e) => {
                  setClientSearchTerm(e.target.value);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Search name or ID (e.g. Mike, CLT-301)..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-purple-600 shadow-sm"
              />
            </div>

            {/* Selected Client Badge */}
            {formData.clientName && (
              <div className="mt-1.5 p-2 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-purple-600 shrink-0" />
                  <span className="font-extrabold text-purple-950">
                    {formData.clientName} ({formData.clientCustomId})
                  </span>
                </div>
                <span className="text-[10px] text-purple-700 font-bold uppercase">Selected</span>
              </div>
            )}

            {/* Client Search Dropdown */}
            {showClientDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 max-h-52 overflow-y-auto divide-y divide-gray-100">
                {filteredClients.map((c) => (
                  <div
                    key={c.id || c.customId}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        clientId: c.id,
                        clientName: c.name,
                        clientUsername: c.username,
                        clientCustomId: c.customId,
                        clientPhone: c.phone,
                      });
                      setClientSearchTerm(`${c.name} (${c.customId})`);
                      setShowClientDropdown(false);
                    }}
                    className="p-3 hover:bg-purple-50/80 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-extrabold text-gray-900 text-xs">{c.name}</p>
                      <p className="text-[10px] text-gray-500">Phone: {c.phone}</p>
                    </div>
                    <span className="font-mono text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                      {c.customId}
                    </span>
                  </div>
                ))}
                {filteredClients.length === 0 && (
                  <div className="p-3 text-center text-xs text-gray-400">
                    No client found matching "{clientSearchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Vehicle Make / Model</label>
            <input
              type="text"
              required
              value={formData.vehicleName}
              onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
              placeholder="e.g. Toyota Vios, Ford Ranger, Van"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-purple-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">License Plate Number</label>
            <input
              type="text"
              required
              value={formData.plateNumber}
              onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
              placeholder="e.g. BCS-303, GRY-768"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-mono font-bold focus:outline-none focus:border-purple-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Client Contact Phone (11 Digits)</label>
            <input
              type="tel"
              required
              maxLength={11}
              placeholder="09123456789"
              value={formData.clientPhone}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 11);
                setFormData({ ...formData, clientPhone: digitsOnly });
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-mono font-bold focus:outline-none focus:border-purple-600"
            />
          </div>
        </div>

        {/* 2. Service Package & Problem Description */}
        <div className="border-t border-gray-100 pt-5 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
            <Wrench className="h-5 w-5 text-purple-600" />
            <span>2. Repair Service Package & Reported Problem</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Availed Repair Service Package <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.serviceCategory}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-purple-600"
            >
              {servicesList.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} - Package Total: {s.total} (Base Fee: {s.serviceFee} + Labor: {s.laborFee})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Vehicle Problem Reported <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows="2"
              value={formData.problemDescription}
              onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
              placeholder="Describe the vehicle problem reported by the client (e.g. no brake response, engine knocking noise, aircon refrigerant leak)..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs text-gray-900 focus:outline-none focus:border-purple-600"
            />
          </div>
        </div>

        {/* 3. Assign Mechanic Technician */}
        <div className="border-t border-gray-100 pt-5 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-purple-600" />
            <span>3. Assign Certified Mechanic Technician</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Assign Mechanic <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.assignedMechanic}
                onChange={(e) => setFormData({ ...formData, assignedMechanic: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-purple-600"
              >
                {safeMechanics.map((m) => (
                  <option key={m.id || m.name} value={m.name}>
                    {m.name} ({m.isAvailable ? '🟢 Available' : `🔴 Busy: Repairing Job #${m.currentAssignment?.jobId}`})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Selected Mechanic Duty Status</span>
              {selectedMechanicInfo ? (
                <div>
                  <p className="font-bold text-gray-900 text-xs">{selectedMechanicInfo.name}</p>
                  <p className={`text-[11px] font-bold ${selectedMechanicInfo.isAvailable ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedMechanicInfo.isAvailable ? '🟢 Available for Duty' : `🔴 Busy with Job #${selectedMechanicInfo.currentAssignment?.jobId}`}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Mechanic details ready</p>
              )}
            </div>
          </div>

          {selectedMechanicInfo && !selectedMechanicInfo.isAvailable && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <Clock className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                Notice: Currently repairing {selectedMechanicInfo.currentAssignment?.jobId} for {selectedMechanicInfo.currentAssignment?.clientName}. Dispatched job order will queue for repair.
              </span>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end space-x-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-5 py-3 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs px-8 py-3 rounded-xl transition-all shadow-md shadow-purple-700/20 flex items-center space-x-2"
          >
            <Check className="h-4 w-4" />
            <span>Dispatch & Submit Job Order</span>
          </button>
        </div>
      </form>
    </div>
  );
}
