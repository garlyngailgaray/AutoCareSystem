import React, { useState, useEffect } from 'react';
import { getJobOrders } from '../utils/jobOrderStore';
import { History as HistoryIcon, Search, Wrench, CheckCircle, Clock, AlertCircle, Eye, Printer, X, Package, Calendar, UserCheck } from 'lucide-react';

export default function History({ user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [historyOrders, setHistoryOrders] = useState([]);
  const [selectedClientHistory, setSelectedClientHistory] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const defaultHistory = [
    // Lucky Garay's Repair History
    {
      id: 19,
      clientUsername: 'lucky_garay',
      clientName: 'Lucky Garay',
      clientCustomId: 'CLT-302',
      vehicleName: 'Van',
      plateNumber: 'GRY-633',
      serviceCategory: 'Body Paint & Refinishing',
      problemDescription: 'body paint fade',
      assignedMechanic: 'Christian Brina',
      status: 'COMPLETED',
      invoiceStatus: 'PAID',
      serviceFee: '₱1,000.00',
      laborFee: '₱18,000.00',
      totalPrice: '₱19,000.00',
      amountPaid: '₱19,000.00',
      balance: '₱0.00',
      dateTime: '2026-09-15 16:14:38',
      cashierName: 'Lovielle Garay',
      usedParts: ['1x Oven-Baked Automotive Primer Paint', '1x High-Gloss Ceramic Clear Coat Glaze'],
    },
    {
      id: 14,
      clientUsername: 'lucky_garay',
      clientName: 'Lucky Garay',
      clientCustomId: 'CLT-302',
      vehicleName: 'Royce',
      plateNumber: 'CSS-742',
      serviceCategory: 'Brake & Suspension Overhaul',
      problemDescription: 'brake squeal noise',
      assignedMechanic: 'Christian Brina',
      status: 'CANCELLED',
      invoiceStatus: 'PAID',
      serviceFee: '₱800.00',
      laborFee: '₱0.00',
      totalPrice: '₱800.00',
      amountPaid: '₱800.00',
      balance: '₱0.00',
      dateTime: '2026-09-05 23:07:01',
      cashierName: 'Lovielle Garay',
      usedParts: ['1x Ceramic Front Brake Pads (Pair)'],
    },
    {
      id: 10,
      clientUsername: 'lucky_garay',
      clientName: 'Lucky Garay',
      clientCustomId: 'CLT-302',
      vehicleName: 'Royce',
      plateNumber: 'CSS-742',
      serviceCategory: 'Air Conditioning Services',
      problemDescription: 'aircon not cooling',
      assignedMechanic: 'Christian Brina',
      status: 'COMPLETED',
      invoiceStatus: 'PAID',
      serviceFee: '₱1,000.00',
      laborFee: '₱5,000.00',
      totalPrice: '₱6,000.00',
      amountPaid: '₱6,000.00',
      balance: '₱0.00',
      dateTime: '2026-08-28 11:21:23',
      cashierName: 'Lovielle Garay',
      usedParts: ['1x R134a Refrigerant Gas Refill'],
    },

    // Mike Gerald Bacasmas's Repair History
    {
      id: 20,
      clientUsername: 'clt_mikegerald303',
      clientName: 'Mike Gerald Bacasmas',
      clientCustomId: 'CLT-303',
      vehicleName: 'Toyota Vios',
      plateNumber: 'BCS-303',
      serviceCategory: 'Brake & Suspension Overhaul',
      problemDescription: 'no brake response',
      assignedMechanic: 'Dave Garay',
      status: 'IN-PROGRESS',
      invoiceStatus: 'UNPAID',
      serviceFee: '₱500.00',
      laborFee: '₱3,000.00',
      totalPrice: '₱3,500.00',
      amountPaid: '₱0.00',
      balance: '₱3,500.00',
      dateTime: '2026-09-15 14:30:12',
      usedParts: ['2x Ceramic Front Brake Pads (Pair)', '1x DOT4 Hydraulic Brake Fluid (500ml)'],
    },

    // Claire Deliman's Repair History
    {
      id: 15,
      clientUsername: 'CLT-4',
      clientName: 'Claire Deliman',
      clientCustomId: 'CLT-301',
      vehicleName: 'Ford Ranger',
      plateNumber: 'GRY-768',
      serviceCategory: 'Engine Overhauling',
      problemDescription: 'engine knocking noise',
      assignedMechanic: 'Dave Garay',
      status: 'COMPLETED',
      invoiceStatus: 'PAID',
      serviceFee: '₱2,500.00',
      laborFee: '₱10,000.00',
      totalPrice: '₱12,500.00',
      amountPaid: '₱12,500.00',
      balance: '₱0.00',
      dateTime: '2026-09-05 09:37:56',
      cashierName: 'Claire Deliman',
      usedParts: ['1x Precision Piston Ring Set', '1x Multi-Layer Steel Head Gasket'],
    },
    {
      id: 8,
      clientUsername: 'CLT-4',
      clientName: 'Claire Deliman',
      clientCustomId: 'CLT-301',
      vehicleName: 'Ford Ranger',
      plateNumber: 'GRY-768',
      serviceCategory: 'Air Conditioning Services',
      problemDescription: 'aircon refrigerant leak',
      assignedMechanic: 'Christian Brina',
      status: 'COMPLETED',
      invoiceStatus: 'PAID',
      serviceFee: '₱1,000.00',
      laborFee: '₱5,000.00',
      totalPrice: '₱6,000.00',
      amountPaid: '₱6,000.00',
      balance: '₱0.00',
      dateTime: '2026-08-27 18:45:10',
      cashierName: 'Claire Deliman',
      usedParts: ['1x R134a Refrigerant Gas Refill'],
    },
    {
      id: 7,
      clientUsername: 'CLT-4',
      clientName: 'Claire Deliman',
      clientCustomId: 'CLT-301',
      vehicleName: 'Ford Ranger',
      plateNumber: 'GRY-768',
      serviceCategory: 'Change Oil & Maintenance',
      problemDescription: 'routine oil change maintenance',
      assignedMechanic: 'Dave Garay',
      status: 'COMPLETED',
      invoiceStatus: 'PAID',
      serviceFee: '₱0.00',
      laborFee: '₱300.00',
      totalPrice: '₱300.00',
      amountPaid: '₱300.00',
      balance: '₱0.00',
      dateTime: '2026-08-27 22:21:29',
      cashierName: 'Cashier',
      usedParts: ['1x Fully Synthetic Engine Oil 5W-30 (4L)'],
    },
  ];

  const loadHistory = () => {
    const storeJobs = getJobOrders();
    const storeIds = new Set(storeJobs.map((j) => j.id));
    const merged = [...storeJobs, ...defaultHistory.filter((d) => !storeIds.has(d.id))];
    setHistoryOrders((prev) => (JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged));
  };

  useEffect(() => {
    loadHistory();
    window.addEventListener('storage', loadHistory);
    window.addEventListener('autocare_jobs_updated', loadHistory);
    const timer = setInterval(loadHistory, 2000);
    return () => {
      window.removeEventListener('storage', loadHistory);
      window.removeEventListener('autocare_jobs_updated', loadHistory);
      clearInterval(timer);
    };
  }, []);

  const getFullDateLabel = (dateStr) => {
    if (!dateStr) return 'Date N/A';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const formattedDate = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const formattedTime = d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        return `${formattedDate} at ${formattedTime}`;
      }
    } catch (e) {}

    if (dateStr.includes('-')) {
      const parts = dateStr.split(' ');
      const dateParts = parts[0].split('-');
      if (dateParts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mIdx = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);
        const year = dateParts[0];
        const timePart = parts[1] ? ` at ${parts[1]}` : '';
        if (mIdx >= 0 && mIdx < 12) {
          return `${months[mIdx]} ${day}, ${year}${timePart}`;
        }
      }
    }
    return dateStr;
  };

  // Role Based Filter
  const role = (user?.role || '').toLowerCase();
  const isTechnicianStaff = role === 'staff' || role === 'mechanic' || role === 'technician';
  const isAdminOrManager = role === 'admin' || role === 'manager';
  const username = (user?.username || '').toLowerCase();
  const name = (user?.name || '').toLowerCase();

  const myHistory = historyOrders.filter((item) => {
    if (isAdminOrManager) return true;

    if (isTechnicianStaff) {
      const assigned = (item.assignedMechanic || '').toLowerCase().trim();
      const currentName = (user?.name || '').toLowerCase().trim();
      const currentUsername = (user?.username || '').toLowerCase().trim();
      const firstName = (user?.first_name || '').toLowerCase().trim();
      const lastName = (user?.last_name || '').toLowerCase().trim();

      if (currentName && (assigned.includes(currentName) || currentName.includes(assigned))) return true;
      if (currentUsername && (assigned.includes(currentUsername) || currentUsername.includes(assigned))) return true;
      if (firstName && firstName.length >= 3 && assigned.includes(firstName)) return true;
      if (lastName && lastName.length >= 3 && assigned.includes(lastName)) return true;

      if (currentUsername.includes('christian') || currentName.includes('christian')) {
        return assigned.includes('christian') || assigned.includes('brina');
      }
      if (currentUsername.includes('dave') || currentName.includes('dave')) {
        return assigned.includes('dave') || assigned.includes('garay');
      }
      if (currentUsername.includes('john') || currentName.includes('john')) {
        return assigned.includes('john') || assigned.includes('torillo');
      }

      return false;
    }

    // Client / Customer filter
    const itemUser = (item.clientUsername || '').toLowerCase();
    const itemName = (item.clientName || '').toLowerCase();

    if (username === 'clt-4' || name.includes('claire')) {
      return itemUser === 'clt-4' || itemName.includes('claire');
    }
    if (username === 'lucky_garay' || name.includes('lucky')) {
      return itemUser === 'lucky_garay' || itemName.includes('lucky');
    }
    if (username === 'clt_mikegerald303' || name.includes('mike')) {
      return itemUser === 'clt_mikegerald303' || itemName.includes('mike');
    }

    if (username && itemUser === username) return true;
    if (name && name !== 'client' && (itemName.includes(name) || name.includes(itemName))) return true;

    return false;
  });

  // Group history records by unique client so names are NOT repeated
  const groupedClientsMap = {};
  myHistory.forEach((item) => {
    const key = (item.clientUsername || item.clientName || 'unknown').toLowerCase().trim();
    if (!groupedClientsMap[key]) {
      groupedClientsMap[key] = {
        key,
        clientName: item.clientName,
        clientCustomId: item.clientCustomId || `CLT-${item.id}`,
        clientPhone: item.clientPhone || '09123456789',
        vehiclesSet: new Set(),
        records: [],
      };
    }
    groupedClientsMap[key].vehiclesSet.add(`${item.vehicleName} (${item.plateNumber})`);
    groupedClientsMap[key].records.push(item);
  });

  const groupedClientsList = Object.values(groupedClientsMap);

  const filteredClients = groupedClientsList.filter((client) => {
    const query = searchTerm.toLowerCase();
    const matchesName = client.clientName.toLowerCase().includes(query);
    const matchesId = client.clientCustomId.toLowerCase().includes(query);
    const matchesVehicle = Array.from(client.vehiclesSet).some((v) => v.toLowerCase().includes(query));
    const matchesRecord = client.records.some(
      (r) =>
        r.serviceCategory.toLowerCase().includes(query) ||
        r.problemDescription.toLowerCase().includes(query) ||
        r.dateTime.toLowerCase().includes(query) ||
        getFullDateLabel(r.dateTime).toLowerCase().includes(query) ||
        (r.usedParts && r.usedParts.some((p) => p.toLowerCase().includes(query)))
    );
    return matchesName || matchesId || matchesVehicle || matchesRecord;
  });

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</span>;
      case 'in-progress':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><Clock className="h-3 w-3" /> In Progress</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Cancelled</span>;
      default:
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Dispatched</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Search Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <HistoryIcon className="h-6 w-6 text-blue-600" />
            <span>Clients Repair History ({filteredClients.length} Clients)</span>
          </h1>
          <p className="text-sm text-gray-500">
            Deduplicated client list overview. Click <strong className="text-gray-800">"View History"</strong> to inspect complete repair logs for <strong className="text-gray-800">{user?.name || user?.username || 'User'}</strong>
          </p>
        </div>

        {/* Real-time Search Bar */}
        <div className="w-full sm:w-80">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by client name, vehicle, plate, date..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Unique Client List Table */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Client ID</th>
                <th className="p-3">Client Name</th>
                <th className="p-3">Associated Vehicles</th>
                <th className="p-3">Total Serviced Jobs</th>
                <th className="p-3">Latest Service Date</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClients.map((client) => {
                const latestRecord = client.records[0] || {};
                const vehiclesArray = Array.from(client.vehiclesSet);

                return (
                  <tr key={client.key} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-600">{client.clientCustomId}</td>
                    <td className="p-3 font-extrabold text-gray-900 text-sm">{client.clientName}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {vehiclesArray.map((v, vIdx) => (
                          <span key={vIdx} className="bg-gray-100 text-gray-800 font-semibold px-2 py-0.5 rounded border border-gray-200 text-[11px]">
                            {v}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="bg-purple-100 text-purple-900 font-extrabold px-2.5 py-0.5 rounded-full text-[11px]">
                        {client.records.length} Repair Job(s)
                      </span>
                    </td>
                    <td className="p-3 font-mono text-gray-700 font-medium">
                      {getFullDateLabel(latestRecord.dateTime)}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedClientHistory(client);
                          setModalSearchTerm('');
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-600/20 inline-flex items-center space-x-1.5"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View History</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-xs">
            No client repair records found matching "<span className="font-semibold text-gray-700">{searchTerm}</span>".
          </div>
        )}
      </div>

      {/* MODAL: VIEW ALL REPAIR HISTORY RECORDS FOR SELECTED CLIENT */}
      {selectedClientHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{selectedClientHistory.clientName}</h3>
                  <p className="text-xs text-gray-500 font-mono">
                    Client ID: {selectedClientHistory.clientCustomId} • {selectedClientHistory.records.length} Serviced Repair Record(s)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedClientHistory(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Input Bar Inside Modal */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={modalSearchTerm}
                onChange={(e) => setModalSearchTerm(e.target.value)}
                placeholder="Search within this client's repair records..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 shadow-sm"
              />
            </div>

            {/* List of Repair Records for this Client */}
            <div className="space-y-4 text-xs">
              {selectedClientHistory.records
                .filter((job) => {
                  const query = modalSearchTerm.toLowerCase();
                  const fullDateStr = getFullDateLabel(job.dateTime).toLowerCase();
                  return (
                    (job.serviceCategory || '').toLowerCase().includes(query) ||
                    (job.vehicleName || '').toLowerCase().includes(query) ||
                    (job.plateNumber || '').toLowerCase().includes(query) ||
                    (job.problemDescription || '').toLowerCase().includes(query) ||
                    (job.assignedMechanic || '').toLowerCase().includes(query) ||
                    (job.status || '').toLowerCase().includes(query) ||
                    (job.dateTime || '').toLowerCase().includes(query) ||
                    fullDateStr.includes(query) ||
                    (job.usedParts && job.usedParts.some((p) => p.toLowerCase().includes(query))) ||
                    job.id.toString().includes(query)
                  );
                })
                .map((job) => (
                  <div key={job.id} className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-blue-600 text-xs bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                        Job Order #{job.id}
                      </span>
                      <h4 className="font-extrabold text-gray-900 text-sm">{job.serviceCategory}</h4>
                    </div>

                    <div className="flex items-center space-x-2">
                      {getStatusBadge(job.status)}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                        job.invoiceStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : job.invoiceStatus === 'PARTIAL'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-red-100 text-red-900 border-red-300'
                      }`}>
                        {job.invoiceStatus || 'UNPAID'} ({job.totalPrice})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Vehicle Details</span>
                      <p className="font-bold text-gray-900">{job.vehicleName} (Plate: {job.plateNumber})</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Date & Timestamp</span>
                      <p className="font-mono font-semibold text-gray-800">{getFullDateLabel(job.dateTime)}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Reported Problem</span>
                    <p className="font-semibold text-red-600">{job.problemDescription}</p>
                  </div>

                  {job.usedParts && job.usedParts.length > 0 && (
                    <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1">
                      <span className="text-[10px] font-bold text-amber-900 uppercase flex items-center space-x-1">
                        <Package className="h-3.5 w-3.5 text-amber-600" />
                        <span>Add-On Spare Parts Installed:</span>
                      </span>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {job.usedParts.map((part, pIdx) => (
                          <span key={pIdx} className="bg-amber-50 text-amber-950 font-bold text-[10px] px-2.5 py-0.5 rounded-lg border border-amber-200">
                            ✓ {part}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-gray-600">
                    <span>Assigned Technician: <strong className="text-gray-900">{job.assignedMechanic}</strong></span>
                    {job.invoiceStatus === 'PAID' && (
                      <button
                        onClick={() => {
                          setSelectedReceipt(job);
                          setSelectedClientHistory(null);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 shadow-sm"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Official Receipt</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedClientHistory(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connected Mall Thermal Cash Register Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="relative">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute -top-10 -right-2 text-white/80 hover:text-white p-1 rounded-full bg-slate-800/80 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="w-80 bg-[#fffdf0] text-gray-900 font-mono text-[11px] p-6 shadow-2xl rounded-sm border border-gray-300 relative select-none leading-relaxed">
              <div className="text-center space-y-1 mb-3">
                <img src="/AutoCareLogo.png" alt="AutoCare Logo" className="h-9 w-auto mx-auto object-contain mb-1 filter grayscale" />
                <h2 className="font-bold text-sm tracking-wider uppercase text-black">AUTOCARE SYSTEM</h2>
                <p className="text-[10px] text-gray-700">Purok Sta. Cruz, Villalimpia</p>
                <p className="text-[10px] text-gray-700">Loay, Bohol - Tel: 09093671998</p>
                <p className="text-[10px] text-gray-600">VAT REG TIN: 123-456-789-000</p>
              </div>

              <div className="border-b border-dashed border-gray-400 my-2" />

              <div className="space-y-0.5 text-[10px] text-gray-800">
                <div className="flex justify-between">
                  <span>OFFICIAL RECEIPT:</span>
                  <span className="font-bold">#RCT-00{selectedReceipt.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE/TIME:</span>
                  <span>{getFullDateLabel(selectedReceipt.dateTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CLIENT:</span>
                  <span className="font-bold">{(selectedReceipt.clientName || '').toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>VEHICLE:</span>
                  <span>{(selectedReceipt.vehicleName || '').toUpperCase()} ({selectedReceipt.plateNumber})</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span className="font-bold">{(selectedReceipt.cashierName || 'LOVIELLE GARAY').toUpperCase()}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-gray-400 my-2" />

              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-[10px] text-gray-900 border-b border-gray-300 pb-1">
                  <span>ITEM / DESCRIPTION</span>
                  <span>AMOUNT</span>
                </div>

                <div className="flex justify-between text-gray-800">
                  <span className="truncate pr-2">1x {(selectedReceipt.serviceCategory || '').toUpperCase()}</span>
                  <span>{selectedReceipt.serviceFee || '₱500.00'}</span>
                </div>

                <div className="flex justify-between text-gray-800">
                  <span className="truncate pr-2">1x LABOR CHARGE</span>
                  <span>{selectedReceipt.laborFee || '₱3,000.00'}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-gray-400 my-2" />

              <div className="space-y-1 text-[11px] font-bold">
                <div className="flex justify-between text-gray-700">
                  <span>SUBTOTAL:</span>
                  <span>{selectedReceipt.totalPrice}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>VAT (12% INCLUDED):</span>
                  <span>INCLUDED</span>
                </div>
                <div className="flex justify-between text-gray-900 text-xs font-black border-t border-b border-gray-800 py-1 my-1">
                  <span>TOTAL PAID:</span>
                  <span>{selectedReceipt.amountPaid || selectedReceipt.totalPrice}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>PAYMENT METHOD:</span>
                  <span>{selectedReceipt.paymentMethod || 'CASH'}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-gray-400 my-3" />

              <div className="text-center space-y-1 text-[10px] text-gray-700">
                <p className="font-bold uppercase tracking-widest">*** THANK YOU! PLEASE COME AGAIN ***</p>
                <p className="text-[9px] text-gray-500">KEEP THIS RECEIPT FOR WARRANTY CLAIMS</p>
              </div>

              <div className="mt-4 pt-2 border-t border-dashed border-gray-300 flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs py-2 rounded shadow transition-all flex items-center justify-center space-x-1"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>PRINT RECEIPT</span>
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="flex-1 bg-gray-900 hover:bg-black text-white font-mono font-bold text-xs py-2 rounded shadow transition-all"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
