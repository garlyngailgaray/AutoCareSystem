import React, { useState, useEffect } from 'react';
import { getJobOrders, updateJobStatus, markJobCannotFix } from '../../utils/jobOrderStore';
import { getPartsForService, updatePartStockQuantity, getAllCatalogParts } from '../../utils/autoPartsCatalog';
import {
  Wrench,
  Search,
  Phone,
  Check,
  FileText,
  Play,
  CheckCircle,
  Package,
  Plus,
  Minus,
  AlertCircle,
  AlertTriangle,
  Clock,
  User,
  Car,
  Calendar,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function AssignedJobs({ user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'in-progress', 'completed', 'cannot-fix'
  const [jobOrders, setJobOrders] = useState([]);
  const [activeNoteJobId, setActiveNoteJobId] = useState(null);
  const [newNote, setNewNote] = useState('');

  // Selected Parts Quantity Map per Job: { [jobId]: { [partName]: quantity } }
  const [partsQuantityMap, setPartsQuantityMap] = useState({});
  const [partCategoryMap, setPartCategoryMap] = useState({}); // { [jobId]: categoryName }
  const [expandedPartsMap, setExpandedPartsMap] = useState({}); // { [jobId]: boolean }

  const loadJobs = () => {
    const orders = getJobOrders();

    // Filter work orders dispatched matching this staff technician
    const myJobs = orders.filter((o) => {
      if (!o || !o.assignedMechanic) return false;

      const assigned = (o.assignedMechanic || '').toLowerCase().trim();
      const currentName = (user?.name || '').toLowerCase().trim();
      const currentUsername = (user?.username || '').toLowerCase().trim();
      const firstName = (user?.first_name || '').toLowerCase().trim();
      const lastName = (user?.last_name || '').toLowerCase().trim();

      if (currentName && (assigned.includes(currentName) || currentName.includes(assigned))) return true;
      if (currentUsername && (assigned.includes(currentUsername) || currentUsername.includes(assigned))) return true;
      if (firstName && firstName.length >= 3 && assigned.includes(firstName)) return true;
      if (lastName && lastName.length >= 3 && assigned.includes(lastName)) return true;

      // Account specific fallbacks
      if (currentUsername.includes('christian') || currentName.includes('christian')) {
        return assigned.includes('christian') || assigned.includes('brina');
      }
      if (currentUsername.includes('dave') || currentName.includes('dave')) {
        return assigned.includes('dave') || assigned.includes('garay');
      }

      if (!user) {
        return assigned.includes('dave') || assigned.includes('garay');
      }

      return false;
    });

    setJobOrders(myJobs);

    const initialMap = {};
    myJobs.forEach((j) => {
      initialMap[j.id] = {};
      if (Array.isArray(j.usedParts)) {
        j.usedParts.forEach((partStr) => {
          if (partStr.includes('x ')) {
            const parts = partStr.split('x ');
            const qty = parseInt(parts[0], 10) || 1;
            const name = parts.slice(1).join('x ');
            initialMap[j.id][name] = qty;
          } else {
            initialMap[j.id][partStr] = 1;
          }
        });
      }
    });
    setPartsQuantityMap((prev) => ({ ...initialMap, ...prev }));
  };

  useEffect(() => {
    loadJobs();
    const timer = setInterval(loadJobs, 2000);
    return () => clearInterval(timer);
  }, [user]);

  const toggleExpandParts = (jobId) => {
    setExpandedPartsMap((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  // Click Plus (+): Increases quantity used & decreases central inventory stock
  const incrementPartQty = (jobId, partName, currentStock) => {
    if (currentStock <= 0) {
      alert(`Out of stock! Cannot add more units of '${partName}'.`);
      return;
    }

    const jobParts = partsQuantityMap[jobId] || {};
    const currentQty = jobParts[partName] || 0;

    setPartsQuantityMap({
      ...partsQuantityMap,
      [jobId]: {
        ...jobParts,
        [partName]: currentQty + 1,
      },
    });

    // Deduct -1 from central shop inventory stock
    updatePartStockQuantity(partName, -1);
  };

  // Click Minus (-): Decreases quantity used & restores/increases central inventory stock
  const decrementPartQty = (jobId, partName) => {
    const jobParts = partsQuantityMap[jobId] || {};
    const currentQty = jobParts[partName] || 0;
    if (currentQty <= 0) return;

    const updatedJobParts = { ...jobParts };
    if (currentQty === 1) {
      delete updatedJobParts[partName];
    } else {
      updatedJobParts[partName] = currentQty - 1;
    }

    setPartsQuantityMap({
      ...partsQuantityMap,
      [jobId]: updatedJobParts,
    });

    // Restore +1 back to central shop inventory stock
    updatePartStockQuantity(partName, +1);
  };

  const getFormattedUsedPartsList = (jobId) => {
    const jobParts = partsQuantityMap[jobId] || {};
    return Object.entries(jobParts)
      .filter(([_, qty]) => qty > 0)
      .map(([name, qty]) => `${qty}x ${name}`);
  };

  const handleStartFix = (jobId) => {
    updateJobStatus(jobId, 'IN-PROGRESS', 'Technician accepted job order from Front Desk & started repairing vehicle...');
    loadJobs();
  };

  const handleCannotFix = (jobId) => {
    const reason = window.prompt(
      `Please enter reason why Job #${jobId} cannot be fixed:`,
      'Engine block severely cracked / unrepairable'
    );
    if (reason === null) return;

    markJobCannotFix(jobId, reason);
    loadJobs();
  };

  const handleSaveNotes = (jobId) => {
    if (!newNote.trim()) return;
    const partsFormatted = getFormattedUsedPartsList(jobId);
    updateJobStatus(jobId, undefined, newNote, partsFormatted);
    loadJobs();
    setActiveNoteJobId(null);
    setNewNote('');
  };

  const handleStatusToggle = (jobId, currentStatus, notes) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'IN-PROGRESS' : 'COMPLETED';
    const partsFormatted = getFormattedUsedPartsList(jobId);
    const notesWithParts = partsFormatted.length > 0
      ? `${notes || ''} (Replaced Parts: ${partsFormatted.join(', ')})`.trim()
      : notes || 'Servicing completed successfully.';

    updateJobStatus(jobId, nextStatus, notesWithParts, partsFormatted);
    loadJobs();
  };

  const pendingCount = jobOrders.filter((j) => j.status === 'PENDING' || j.status === 'DISPATCHED').length;
  const inProgressCount = jobOrders.filter((j) => j.status === 'IN-PROGRESS').length;
  const completedCount = jobOrders.filter((j) => j.status === 'COMPLETED').length;
  const cannotFixCount = jobOrders.filter((j) => j.status === 'CANNOT-FIX').length;

  const filteredJobs = jobOrders.filter((j) => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && (j.status === 'PENDING' || j.status === 'DISPATCHED')) ||
      (statusFilter === 'in-progress' && j.status === 'IN-PROGRESS') ||
      (statusFilter === 'completed' && j.status === 'COMPLETED') ||
      (statusFilter === 'cannot-fix' && j.status === 'CANNOT-FIX');

    const query = searchTerm.toLowerCase();
    const matchesSearch =
      (j.clientName || '').toLowerCase().includes(query) ||
      (j.vehicleName || '').toLowerCase().includes(query) ||
      (j.plateNumber || '').toLowerCase().includes(query) ||
      (j.serviceCategory || '').toLowerCase().includes(query) ||
      (j.problemDescription || '').toLowerCase().includes(query) ||
      j.id.toString().includes(query);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-white/20 text-white text-[10px] sm:text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Technician Workshop Portal
            </span>
            <span className="bg-amber-900/40 text-amber-200 text-[10px] sm:text-xs font-mono font-bold px-3 py-1 rounded-full border border-amber-400/30">
              Live Work Orders
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center space-x-3">
            <Wrench className="h-8 w-8 text-amber-200" />
            <span>Assigned Jobs - {user?.name || user?.username || 'Dave Garay'}</span>
          </h1>
          <p className="text-amber-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Manage dispatched repair tickets, log installed replacement parts, update maintenance notes, and report repair completions.
          </p>
        </div>

        {/* Quick Summary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-100 block">Total Assigned</span>
            <span className="text-xl font-black text-white font-mono">{jobOrders.length}</span>
          </div>
          <div className="bg-purple-900/40 backdrop-blur-md p-3 rounded-2xl border border-purple-400/30 text-center">
            <span className="text-[10px] uppercase font-bold text-purple-200 block">Awaiting</span>
            <span className="text-xl font-black text-purple-300 font-mono">{pendingCount}</span>
          </div>
          <div className="bg-amber-900/40 backdrop-blur-md p-3 rounded-2xl border border-amber-400/30 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-200 block">In Repair</span>
            <span className="text-xl font-black text-amber-300 font-mono">{inProgressCount}</span>
          </div>
          <div className="bg-emerald-900/40 backdrop-blur-md p-3 rounded-2xl border border-emerald-400/30 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-200 block">Completed</span>
            <span className="text-xl font-black text-emerald-300 font-mono">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              statusFilter === 'all'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25 scale-[1.02]'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All ({jobOrders.length})</span>
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              statusFilter === 'pending'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/25 scale-[1.02]'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Awaiting Start ({pendingCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('in-progress')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              statusFilter === 'in-progress'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25 scale-[1.02]'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>In Repair ({inProgressCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02]'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Completed ({completedCount})</span>
          </button>

          {cannotFixCount > 0 && (
            <button
              onClick={() => setStatusFilter('cannot-fix')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                statusFilter === 'cannot-fix'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/25 scale-[1.02]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Cannot Fix ({cannotFixCount})</span>
            </button>
          )}
        </div>

        {/* Live Search Bar */}
        <div className="w-full md:w-80">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by job ID, client, vehicle, plate..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-600 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* WORK ORDER TICKETS LIST */}
      <div className="space-y-6">
        {filteredJobs.map((job) => {
          const currentCategoryFilter = partCategoryMap[job.id] || 'recommended';
          const allShopParts = getAllCatalogParts();
          const availableCatalogParts = currentCategoryFilter === 'recommended'
            ? getPartsForService(job.serviceCategory)
            : currentCategoryFilter === 'all'
            ? allShopParts
            : allShopParts.filter((p) => p.category === currentCategoryFilter);

          const calculatedPartsList = getFormattedUsedPartsList(job.id);
          const formattedPartsList = (job.usedParts && job.usedParts.length > 0)
            ? job.usedParts
            : calculatedPartsList;

          const isCannotFix = job.status === 'CANNOT-FIX';
          const isExpandedParts = expandedPartsMap[job.id] ?? (job.status === 'IN-PROGRESS');

          return (
            <div
              key={job.id}
              className={`bg-white rounded-3xl border shadow-sm hover:shadow-lg transition-all space-y-5 overflow-hidden ${
                isCannotFix
                  ? 'border-red-200 bg-red-50/20'
                  : job.status === 'COMPLETED'
                  ? 'border-emerald-200'
                  : job.status === 'IN-PROGRESS'
                  ? 'border-amber-200 ring-2 ring-amber-500/20'
                  : 'border-purple-200'
              }`}
            >
              {/* CARD TOP STATUS BAR */}
              <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-3 rounded-2xl ${
                      isCannotFix
                        ? 'bg-red-100 text-red-700'
                        : job.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : job.status === 'IN-PROGRESS'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    <Wrench className="h-6 w-6" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded-lg border border-gray-200">
                        Job Ticket #{job.id}
                      </span>
                      <h3 className="font-black text-gray-900 text-base">{job.serviceCategory}</h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Client: <strong className="text-gray-900">{job.clientName}</strong> • Phone: <span className="font-mono text-gray-700">{job.clientPhone}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`text-xs font-extrabold px-3.5 py-1.5 rounded-xl uppercase tracking-wider ${
                      isCannotFix
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : job.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : job.status === 'IN-PROGRESS'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-purple-100 text-purple-900 border border-purple-200'
                    }`}
                  >
                    {isCannotFix
                      ? 'CANNOT FIX (UNFIXABLE)'
                      : job.status === 'PENDING' || job.status === 'DISPATCHED'
                      ? 'AWAITING ACCEPTANCE'
                      : job.status === 'IN-PROGRESS'
                      ? 'IN REPAIR WORK'
                      : 'SERVICING COMPLETED'}
                  </span>
                  <span className="text-xl font-black text-gray-900 font-mono">{job.totalPrice}</span>
                </div>
              </div>

              {/* CARD DETAILS GRID (4-Column Organized Info) */}
              <div className="px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="bg-gray-50 p-3.5 rounded-2xl space-y-1">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                    <User className="h-3.5 w-3.5 text-gray-500" />
                    <span>Customer Details</span>
                  </span>
                  <p className="font-extrabold text-gray-900 text-xs">{job.clientName}</p>
                  <p className="text-gray-600 font-mono text-[11px] flex items-center space-x-1">
                    <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>{job.clientPhone}</span>
                  </p>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-2xl space-y-1">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                    <Car className="h-3.5 w-3.5 text-blue-500" />
                    <span>Vehicle & License</span>
                  </span>
                  <p className="font-extrabold text-gray-900 text-xs">{job.vehicleName}</p>
                  <p className="font-mono text-blue-700 font-bold text-[11px]">
                    Plate: {job.plateNumber}
                  </p>
                </div>

                <div className="bg-red-50/70 border border-red-100 p-3.5 rounded-2xl space-y-1">
                  <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    <span>Reported Problem</span>
                  </span>
                  <p className="font-bold text-red-900 text-xs leading-snug">
                    {job.problemDescription || 'General Inspection & Servicing'}
                  </p>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-2xl space-y-1">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-500" />
                    <span>Dispatched Timestamp</span>
                  </span>
                  <p className="font-mono font-bold text-gray-800 text-xs">{job.dateTime}</p>
                  <p className="text-[10px] text-gray-500 font-semibold">
                    Tech: <strong className="text-gray-800">{job.assignedMechanic || 'Dave Garay'}</strong>
                  </p>
                </div>
              </div>

              {/* REPLACEMENT SPARE PARTS SELECTOR / SUMMARY BOX */}
              <div className="px-6">
                {isCannotFix ? (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-xs space-y-1 text-red-950 font-semibold">
                    <p className="font-extrabold flex items-center space-x-1 text-red-800">
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                      <span>UNFIXABLE VEHICLE: Billed Diagnostic Labor Fee Only ({job.totalPrice})</span>
                    </p>
                    <p className="text-red-700 text-[11px] pl-5">{job.mechanicNotes}</p>
                  </div>
                ) : job.status === 'COMPLETED' ? (
                  <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-emerald-950 uppercase flex items-center space-x-1.5">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <span>Completed Servicing Summary & Add-Ons:</span>
                      </span>
                      <span className="bg-emerald-600 text-white font-mono text-[10px] font-extrabold px-3 py-0.5 rounded-full">
                        READY FOR CASHIER BILLING
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-0.5">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Service Availed</span>
                        <span className="font-extrabold text-purple-900 text-xs">{job.serviceCategory}</span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Installed Add-On Spare Parts</span>
                        {formattedPartsList.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {formattedPartsList.map((p, pIdx) => (
                              <span key={pIdx} className="bg-emerald-100 text-emerald-900 font-bold text-[10px] px-2.5 py-0.5 rounded-lg border border-emerald-200">
                                ✓ {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs block">No specific add-on parts installed</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div
                      onClick={() => toggleExpandParts(job.id)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                          Replacement Spare Parts Catalog
                        </span>
                        <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200 ml-2">
                          {formattedPartsList.length} Item(s) Selected
                        </span>
                      </div>

                      <button
                        type="button"
                        className="text-slate-500 hover:text-slate-800 text-xs font-bold flex items-center space-x-1 bg-white px-3 py-1 rounded-xl border border-slate-200"
                      >
                        <span>{isExpandedParts ? 'Hide Parts List' : 'Select Replacement Parts'}</span>
                        {isExpandedParts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Expandable Parts Selection Panel */}
                    {isExpandedParts && (
                      <div className="space-y-3 pt-2 border-t border-slate-200 animate-fadeIn">
                        {/* Category Selector */}
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            Filter Parts Category:
                          </span>
                          <select
                            value={currentCategoryFilter}
                            onChange={(e) => setPartCategoryMap({ ...partCategoryMap, [job.id]: e.target.value })}
                            className="text-[11px] font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1 focus:outline-none focus:border-amber-600"
                          >
                            <option value="recommended">⭐ Recommended ({job.serviceCategory})</option>
                            <option value="all">📦 All Shop Spare Parts ({allShopParts.length})</option>
                            <option value="Brake & Suspension Overhaul">Brake & Suspension Overhaul</option>
                            <option value="Change Oil & Maintenance">Change Oil & Maintenance</option>
                            <option value="Engine Overhauling">Engine Overhauling</option>
                            <option value="Air Conditioning Services">Air Conditioning Services</option>
                            <option value="Body Paint & Refinishing">Body Paint & Refinishing</option>
                            <option value="Tune Up & Ignition System">Tune Up & Ignition System</option>
                            <option value="Under Chassis & Steering">Under Chassis & Steering</option>
                          </select>
                        </div>

                        {/* Parts Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                          {availableCatalogParts.map((part) => {
                            const currentQty = (partsQuantityMap[job.id] || {})[part.name] || 0;
                            const isSelected = currentQty > 0;

                            return (
                              <div
                                key={part.id}
                                className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                                  isSelected
                                    ? 'bg-amber-100/90 border-amber-400 text-amber-950 font-bold shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/80'
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="font-extrabold text-slate-900 truncate">{part.name}</p>
                                  <div className="flex items-center space-x-2 text-[10px] font-semibold mt-0.5">
                                    <span className="text-amber-800 font-extrabold">{part.price}</span>
                                    <span className="text-slate-400">•</span>
                                    <span
                                      className={`font-bold px-1.5 py-0.5 rounded border ${
                                        part.stockQuantity > 5
                                          ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                                          : 'text-red-800 bg-red-50 border-red-200'
                                      }`}
                                    >
                                      Stock: {part.stockQuantity} {part.unit}s
                                    </span>
                                  </div>
                                </div>

                                {/* Stepper Controls (+ / -) */}
                                <div className="flex items-center space-x-1.5 shrink-0 bg-slate-100 p-1 rounded-xl border border-slate-300 shadow-inner">
                                  <button
                                    type="button"
                                    onClick={() => decrementPartQty(job.id, part.name)}
                                    disabled={currentQty === 0}
                                    className="p-1 bg-white hover:bg-amber-200 disabled:opacity-30 rounded-lg text-slate-800 transition-colors cursor-pointer"
                                    title="Decrease Part Quantity (Restores +1 Stock)"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>

                                  <span className={`w-6 text-center font-mono font-black text-xs ${isSelected ? 'text-amber-900' : 'text-slate-400'}`}>
                                    {currentQty}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => incrementPartQty(job.id, part.name, part.stockQuantity)}
                                    disabled={part.stockQuantity === 0}
                                    className="p-1 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-300 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
                                    title="Increase Part Quantity (Deducts -1 Stock)"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* TECHNICIAN REPAIR NOTES */}
              <div className="px-6 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
                    <FileText className="h-4 w-4 text-amber-600" />
                    <span>Technician Maintenance & Repair Notes</span>
                  </span>
                  <button
                    onClick={() => {
                      setActiveNoteJobId(job.id);
                      setNewNote(job.mechanicNotes || '');
                    }}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
                  >
                    Edit Notes
                  </button>
                </div>

                {activeNoteJobId === job.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows="2"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add diagnostic notes, work done, or repair status..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none focus:border-amber-600 shadow-inner"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setActiveNoteJobId(null)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveNotes(job.id)}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition-all shadow-md"
                      >
                        Save Notes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-3.5 rounded-2xl text-xs text-slate-800 font-medium border border-slate-200">
                    {job.mechanicNotes || 'No specific maintenance notes logged yet.'}
                  </div>
                )}
              </div>

              {/* ACTION FOOTER BAR */}
              <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 font-medium">
                  Status: <strong className="text-slate-800 uppercase">{job.status}</strong>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
                  {job.status !== 'COMPLETED' && !isCannotFix && (
                    <button
                      type="button"
                      onClick={() => handleCannotFix(job.id)}
                      className="bg-white hover:bg-red-50 text-red-700 font-bold text-xs px-4 py-2.5 rounded-2xl transition-all border border-red-200 flex items-center space-x-1.5 shadow-sm cursor-pointer"
                    >
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span>Cannot Fix Vehicle</span>
                    </button>
                  )}

                  {(job.status === 'PENDING' || job.status === 'DISPATCHED') && (
                    <button
                      type="button"
                      onClick={() => handleStartFix(job.id)}
                      className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs px-6 py-2.5 rounded-2xl transition-all shadow-md shadow-purple-700/20 flex items-center space-x-2 cursor-pointer"
                    >
                      <Play className="h-4 w-4 fill-white" />
                      <span>Accept Job & Start Repair</span>
                    </button>
                  )}

                  {job.status === 'IN-PROGRESS' && (
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(job.id, job.status, job.mechanicNotes)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center space-x-2 cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      <span>Mark Repair Completed</span>
                    </button>
                  )}

                  {job.status === 'COMPLETED' && (
                    <span className="text-emerald-800 text-xs font-bold bg-emerald-100 px-4 py-2 rounded-2xl border border-emerald-200 flex items-center space-x-1.5">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span>Servicing Completed</span>
                    </span>
                  )}

                  {isCannotFix && (
                    <span className="text-red-800 text-xs font-bold bg-red-100 px-4 py-2 rounded-2xl border border-red-200 flex items-center space-x-1.5">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span>Notified Front Desk (Labor Fee Billed Only)</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredJobs.length === 0 && (
          <div className="text-center py-16 text-slate-400 text-xs bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
            <Wrench className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No Work Orders Dispatched</p>
            <p className="text-slate-500">
              No assigned repair jobs found for technician{' '}
              <strong className="text-slate-800">{user?.name || user?.username || 'Dave Garay'}</strong> matching the selected filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
