import React, { useState, useEffect } from 'react';
import { getJobOrders } from '../../utils/jobOrderStore';
import { History as HistoryIcon, Search, Wrench, Clock, CheckCircle, AlertCircle, Eye, X, Package, Users, ListFilter, Calendar } from 'lucide-react';

export default function AdminHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [jobOrders, setJobOrders] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [inspectJob, setInspectJob] = useState(null);
  const [viewMode, setViewMode] = useState('clients'); // 'clients' (Single list per client) or 'all' (Individual jobs log)

  // Modal-Specific Search & Month/Year Filters
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalMonthFilter, setModalMonthFilter] = useState('all');

  const loadHistory = () => {
    const orders = getJobOrders();
    setJobOrders((prev) => (JSON.stringify(prev) === JSON.stringify(orders) ? prev : orders));
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

  const handleOpenClientHistory = (client) => {
    setSelectedClient(client);
    setModalSearchTerm('');
    setModalMonthFilter('all');
  };

  // Helper to get Month & Year label for filter tabs (e.g. "September 2026")
  const getMonthYearLabel = (dateStr) => {
    if (!dateStr) return 'Date N/A';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    } catch (e) {}
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const mIdx = parseInt(parts[1], 10) - 1;
        if (mIdx >= 0 && mIdx < 12) return `${months[mIdx]} ${parts[0]}`;
      }
    }
    return dateStr;
  };

  // Helper to format FULL DATE and time (e.g. "September 15, 2026 at 2:30 PM")
  const getFullDateLabel = (dateStr) => {
    if (!dateStr) return 'Date N/A';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const formattedDate = d.toLocaleDateString('en-US', {
          month: 'long',
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
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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

  // Group all job orders by unique client
  const clientMap = {};
  jobOrders.forEach((item) => {
    const key = (item.clientUsername || item.clientName || '').toLowerCase().trim();
    if (!key) return;

    if (!clientMap[key]) {
      clientMap[key] = {
        clientName: item.clientName,
        clientUsername: item.clientUsername,
        clientCustomId: item.clientCustomId || `CLT-${item.id}`,
        clientPhone: item.clientPhone || '09123456789',
        vehicles: new Set(),
        plates: new Set(),
        records: [],
      };
    }

    if (item.vehicleName) clientMap[key].vehicles.add(item.vehicleName);
    if (item.plateNumber) clientMap[key].plates.add(item.plateNumber);
    clientMap[key].records.push(item);
  });

  const uniqueClientsList = Object.values(clientMap).map((c) => ({
    ...c,
    vehicleSummary: Array.from(c.vehicles).join(', ') || 'N/A',
    plateSummary: Array.from(c.plates).join(', ') || 'N/A',
    totalJobsCount: c.records.length,
    latestRecord: c.records[0], // Most recent repair job
  }));

  // Filter Unique Clients by Search Term
  const filteredClients = uniqueClientsList.filter((c) => {
    const query = searchTerm.toLowerCase();
    return (
      (c.clientName || '').toLowerCase().includes(query) ||
      (c.clientCustomId || '').toLowerCase().includes(query) ||
      (c.vehicleSummary || '').toLowerCase().includes(query) ||
      (c.plateSummary || '').toLowerCase().includes(query) ||
      c.records.some(
        (r) =>
          (r.serviceCategory || '').toLowerCase().includes(query) ||
          (r.assignedMechanic || '').toLowerCase().includes(query) ||
          (r.problemDescription || '').toLowerCase().includes(query)
      )
    );
  });

  // Filter All Individual Repair Records by Search Term
  const filteredAllJobs = jobOrders.filter((item) => {
    const query = searchTerm.toLowerCase();
    return (
      (item.clientName || '').toLowerCase().includes(query) ||
      (item.clientCustomId || '').toLowerCase().includes(query) ||
      (item.vehicleName || '').toLowerCase().includes(query) ||
      (item.plateNumber || '').toLowerCase().includes(query) ||
      (item.serviceCategory || '').toLowerCase().includes(query) ||
      (item.problemDescription || '').toLowerCase().includes(query) ||
      (item.assignedMechanic || '').toLowerCase().includes(query) ||
      (item.status || '').toLowerCase().includes(query) ||
      item.id.toString().includes(query)
    );
  });

  // Client Modal Specific Filters
  const clientMonths = selectedClient
    ? Array.from(new Set(selectedClient.records.map((r) => getMonthYearLabel(r.dateTime))))
    : [];

  const modalFilteredRecords = selectedClient
    ? selectedClient.records.filter((r) => {
        const monthLabel = getMonthYearLabel(r.dateTime);
        const fullDateStr = getFullDateLabel(r.dateTime);
        const matchesMonth = modalMonthFilter === 'all' || monthLabel === modalMonthFilter;

        const query = modalSearchTerm.toLowerCase();
        const matchesSearch =
          !modalSearchTerm ||
          (r.dateTime || '').toLowerCase().includes(query) ||
          fullDateStr.toLowerCase().includes(query) ||
          monthLabel.toLowerCase().includes(query) ||
          (r.serviceCategory || '').toLowerCase().includes(query) ||
          (r.vehicleName || '').toLowerCase().includes(query) ||
          (r.plateNumber || '').toLowerCase().includes(query) ||
          (r.problemDescription || '').toLowerCase().includes(query) ||
          (r.assignedMechanic || '').toLowerCase().includes(query) ||
          (r.usedParts && r.usedParts.some((p) => p.toLowerCase().includes(query)));

        return matchesMonth && matchesSearch;
      })
    : [];

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit"><CheckCircle className="h-3 w-3" /> Completed</span>;
      case 'in-progress':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit"><Clock className="h-3 w-3" /> In Progress</span>;
      case 'cancelled':
      case 'cannot-fix':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit"><AlertCircle className="h-3 w-3" /> Cannot Fix / Cancelled</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit"><Clock className="h-3 w-3" /> Dispatched</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <HistoryIcon className="h-6 w-6 text-blue-600" />
            <span>Administrator Real-Time Repair History</span>
          </h1>
          <p className="text-sm text-gray-500">
            Single client list overview ({uniqueClientsList.length} Clients) with instant view button for full repair history, add-on parts, and paid bill details
          </p>
        </div>

        {/* Real-time Search & View Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="bg-gray-100 p-1 rounded-xl flex items-center text-xs font-bold shrink-0">
            <button
              onClick={() => setViewMode('clients')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                viewMode === 'clients'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Unique Clients ({uniqueClientsList.length})</span>
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                viewMode === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>All Jobs Feed ({jobOrders.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search client, plate, service..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: SINGLE LIST BY CLIENT (DEFAULT - NON-REPEATING NAMES) */}
      {viewMode === 'clients' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Client ID</th>
                  <th className="p-3">Client Name</th>
                  <th className="p-3">Vehicle Model(s)</th>
                  <th className="p-3">Plate Number(s)</th>
                  <th className="p-3">Total Repair Records</th>
                  <th className="p-3">Latest Service & Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map((client) => (
                  <tr key={client.clientCustomId || client.clientName} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-600">{client.clientCustomId}</td>
                    <td className="p-3 font-extrabold text-gray-900 text-sm">{client.clientName}</td>
                    <td className="p-3 font-semibold text-gray-800">{client.vehicleSummary}</td>
                    <td className="p-3 font-mono text-gray-700 font-bold">{client.plateSummary}</td>
                    <td className="p-3">
                      <span className="bg-blue-50 text-blue-800 font-bold px-2.5 py-1 rounded-full text-[10px] border border-blue-200">
                        {client.totalJobsCount} {client.totalJobsCount > 1 ? 'Repair Records' : 'Repair Record'}
                      </span>
                    </td>
                    <td className="p-3">
                      {client.latestRecord && (
                        <div>
                          <p className="font-bold text-gray-900">{client.latestRecord.serviceCategory}</p>
                          <div className="mt-0.5">{getStatusBadge(client.latestRecord.status)}</div>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenClientHistory(client)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] px-3.5 py-2 rounded-xl transition-all shadow-md shadow-blue-600/20 inline-flex items-center space-x-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View All Repair History</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-xs">
              No clients found matching "<span className="font-semibold text-gray-700">{searchTerm}</span>".
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ALL INDIVIDUAL JOB ORDERS FEED */}
      {viewMode === 'all' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Job ID</th>
                  <th className="p-3">Client Name & ID</th>
                  <th className="p-3">Vehicle & Plate</th>
                  <th className="p-3">Service Availed</th>
                  <th className="p-3">Assigned Staff</th>
                  <th className="p-3">Repair Status</th>
                  <th className="p-3">Bill Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAllJobs.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-gray-900">#{item.id}</td>
                    <td className="p-3">
                      <p className="font-bold text-gray-900">{item.clientName}</p>
                      <p className="text-[11px] font-mono text-blue-600 font-bold">{item.clientCustomId || `CLT-${item.id}`}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-gray-900">{item.vehicleName}</p>
                      <p className="text-[11px] font-mono text-gray-500 font-bold">{item.plateNumber}</p>
                    </td>
                    <td className="p-3 font-bold text-gray-900">{item.serviceCategory}</td>
                    <td className="p-3 font-bold text-blue-600">{item.assignedMechanic}</td>
                    <td className="p-3">{getStatusBadge(item.status)}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border inline-block ${
                        item.invoiceStatus === 'PAID'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.invoiceStatus === 'PARTIAL'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}>
                        {item.invoiceStatus || 'UNPAID'} ({item.totalPrice})
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setInspectJob(item)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl transition-all shadow-sm inline-flex items-center space-x-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect Record</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: VIEW ALL REPAIR HISTORY FOR A SELECTED CLIENT WITH FULL DATE TIMELINE SEARCH */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                  <HistoryIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg">{selectedClient.clientName}</h3>
                  <p className="text-xs font-mono font-bold text-blue-600">
                    Client ID: {selectedClient.clientCustomId} | Total History: {selectedClient.records.length} Record(s)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedClient(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Search Bar & Month/Year Timeline Filter Bar */}
            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-blue-500" />
                  <input
                    type="text"
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    placeholder="Search by full date (e.g. September 15, 2026), service, plate, parts..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-blue-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>

                <div className="flex items-center space-x-2 text-xs font-bold text-blue-900">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>Timeline Search</span>
                </div>
              </div>

              {/* Month / Year Timeline Filter Chips */}
              {clientMonths.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    onClick={() => setModalMonthFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                      modalMonthFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    All Time ({selectedClient.records.length})
                  </button>

                  {clientMonths.map((mLabel) => {
                    const count = selectedClient.records.filter((r) => getMonthYearLabel(r.dateTime) === mLabel).length;
                    return (
                      <button
                        key={mLabel}
                        onClick={() => setModalMonthFilter(mLabel)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                          modalMonthFilter === mLabel
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {mLabel} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* List of Filtered Repair History Records for this Client */}
            <div className="space-y-4">
              {modalFilteredRecords.map((job) => {
                const fullDate = getFullDateLabel(job.dateTime);
                return (
                  <div key={job.id} className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200/80 space-y-3">
                    {/* Full Date & Time Badge Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-600 text-white font-mono font-black text-[10px] px-3 py-1 rounded-full uppercase shadow-sm flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>FULL DATE: {fullDate}</span>
                        </span>
                        <span className="font-mono text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          Job #{job.id}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {getStatusBadge(job.status)}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                            job.invoiceStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : job.invoiceStatus === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          {job.invoiceStatus || 'UNPAID'}
                        </span>
                      </div>
                    </div>

                    {/* Vehicle Type & Plate Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 text-[10px] font-bold uppercase block">Vehicle Type / Model</span>
                        <p className="font-bold text-gray-900 text-sm">{job.vehicleName}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] font-bold uppercase block">Vehicle Plate Number</span>
                        <p className="font-mono font-bold text-gray-900 text-sm">{job.plateNumber}</p>
                      </div>
                    </div>

                    {/* Service Availed & Reported Problem */}
                    <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100 space-y-0.5 text-xs">
                      <span className="text-[10px] font-bold text-purple-900 uppercase block">Service Availed & Issue</span>
                      <p className="font-extrabold text-purple-900">{job.serviceCategory}</p>
                      <p className="text-gray-600 italic text-[11px]">Reported Problem: "{job.problemDescription}"</p>
                    </div>

                    {/* Add-On Spare Parts Availed */}
                    <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/70 space-y-1.5">
                      <span className="text-[10px] font-bold text-amber-900 uppercase flex items-center space-x-1">
                        <Package className="h-3.5 w-3.5 text-amber-600" />
                        <span>Add-On Spare Parts Availed ({job.usedParts ? job.usedParts.length : 0}):</span>
                      </span>

                      {job.usedParts && job.usedParts.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {job.usedParts.map((p, pIdx) => (
                            <span
                              key={pIdx}
                              className="bg-white text-amber-950 font-bold text-[10px] px-2.5 py-0.5 rounded-lg border border-amber-300 shadow-sm"
                            >
                              ✓ {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic text-[11px]">No extra add-on spare parts installed on this repair.</p>
                      )}
                    </div>

                    {/* Assigned Staff & Paid Bill Details */}
                    <div className="bg-slate-900 text-white p-3.5 rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between items-center text-gray-300">
                        <span>Assigned Staff / Mechanic:</span>
                        <span className="font-bold text-blue-400">{job.assignedMechanic}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Service Package Charge:</span>
                        <span>{job.serviceFee || '₱2,800.00'}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Labor Fee:</span>
                        <span className="text-amber-400">{job.laborFee || '₱700.00'}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 font-extrabold border-t border-slate-800 pt-1.5 mt-1">
                        <span>Total Billed Amount:</span>
                        <span className="text-sm">{job.totalPrice}</span>
                      </div>
                      {job.cashierName && (
                        <p className="text-[10px] text-gray-400 font-mono text-right pt-0.5">Processed by Cashier: {job.cashierName}</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {modalFilteredRecords.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-xs">
                  No repair records found for <strong className="text-gray-700">{selectedClient.clientName}</strong> matching "<span className="font-semibold text-gray-700">{modalSearchTerm || modalMonthFilter}</span>".
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedClient(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20"
              >
                Close Client History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INSPECT SINGLE INDIVIDUAL RECORD */}
      {inspectJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Job Order #{inspectJob.id} Details</h3>
                  <p className="text-xs text-gray-500 font-mono">Timestamp: {getFullDateLabel(inspectJob.dateTime)}</p>
                </div>
              </div>

              <button
                onClick={() => setInspectJob(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-1">
                <span className="text-[10px] font-bold text-blue-900 uppercase block">Client Name & ID</span>
                <p className="font-extrabold text-blue-950 text-base">{inspectJob.clientName}</p>
                <p className="text-xs font-mono font-bold text-blue-600">Client ID: {inspectJob.clientCustomId || `CLT-${inspectJob.id}`}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Vehicle Identification</span>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Type / Model of Vehicle:</span>
                    <strong className="text-gray-900 text-sm">{inspectJob.vehicleName}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Vehicle Plate Number:</span>
                    <span className="font-mono font-bold text-gray-900 text-xs bg-gray-200 px-2 py-0.5 rounded border border-gray-300 inline-block">{inspectJob.plateNumber}</span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-1">
                <span className="text-[10px] font-bold text-purple-900 uppercase block">Repair Service Availed</span>
                <p className="font-extrabold text-purple-900 text-sm">{inspectJob.serviceCategory}</p>
                <p className="text-gray-600 italic">Reported Problem: "{inspectJob.problemDescription}"</p>
              </div>

              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-amber-900 uppercase flex items-center space-x-1">
                    <Package className="h-3.5 w-3.5 text-amber-600" />
                    <span>Add-On Spare Parts Availed:</span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded">
                    {inspectJob.usedParts ? inspectJob.usedParts.length : 0} Item(s)
                  </span>
                </div>

                {inspectJob.usedParts && inspectJob.usedParts.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {inspectJob.usedParts.map((part, pIdx) => (
                      <span key={pIdx} className="bg-white text-amber-950 font-bold text-[11px] px-3 py-1 rounded-xl border border-amber-300 shadow-sm">
                        ✓ {part}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-xs">No extra add-on spare parts installed on this job.</p>
                )}
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1.5">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-1">
                  <span className="text-xs font-bold uppercase text-gray-300">Bill Payment Status:</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    inspectJob.invoiceStatus === 'PAID' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {inspectJob.invoiceStatus || 'UNPAID'}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-400 text-sm font-black pt-1">
                  <span>Total Amount Paid / Billed:</span>
                  <span className="text-base">{inspectJob.totalPrice}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectJob(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
