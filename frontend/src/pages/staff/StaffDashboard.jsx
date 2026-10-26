import React, { useState, useEffect } from 'react';
import { getJobOrders, updateJobStatus, markJobCannotFix } from '../../utils/jobOrderStore';
import { getPartsForService, updatePartStockQuantity, getAllCatalogParts } from '../../utils/autoPartsCatalog';
import { Wrench, CheckCircle, Clock, ShieldCheck, Phone, Check, Play, Package, CheckSquare, Plus, Minus, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

function LiveClock({ prefix = '' }) {
  const [time, setTime] = useState(() => new Date().toLocaleString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <span>{prefix}{time}</span>;
}

export default function StaffDashboard({ user }) {
  const [jobOrders, setJobOrders] = useState([]);
  const [actionMessage, setActionMessage] = useState(null);

  // Selected Parts Quantity Map per Job: { [jobId]: { [partName]: quantity } }
  const [partsQuantityMap, setPartsQuantityMap] = useState({});
  const [partCategoryMap, setPartCategoryMap] = useState({}); // { [jobId]: categoryName }

  // Cannot Fix Modal State
  const [cannotFixJob, setCannotFixJob] = useState(null);
  const [cannotFixReason, setCannotFixReason] = useState('');

  const loadJobs = () => {
    const orders = getJobOrders();

    const uName = (user?.name || '').toLowerCase().replace(/_/g, ' ');
    const uFirst = (user?.first_name || '').toLowerCase();
    const uLast = (user?.last_name || '').toLowerCase();
    const uUsername = (user?.username || '').toLowerCase().replace(/_/g, ' ');

    // Filter work orders dispatched/given from Front Desk matching this staff technician
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
      if (currentUsername.includes('john') || currentName.includes('john')) {
        return assigned.includes('john') || assigned.includes('torillo');
      }

      if (!user) {
        return assigned.includes('dave') || assigned.includes('garay');
      }

      return false;
    });

    setJobOrders((prev) => (JSON.stringify(prev) === JSON.stringify(myJobs) ? prev : myJobs));

    // Initialize initial quantities for existing job usedParts
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
    window.addEventListener('autocare_jobs_updated', loadJobs);
    window.addEventListener('storage', loadJobs);
    const timer = setInterval(loadJobs, 3000);
    return () => {
      window.removeEventListener('autocare_jobs_updated', loadJobs);
      window.removeEventListener('storage', loadJobs);
      clearInterval(timer);
    };
  }, [user]);

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

  // Format quantities array e.g. ["2x Ceramic Front Brake Pads (Pair)", "1x DOT4 Brake Fluid"]
  const getFormattedUsedPartsList = (jobId) => {
    const jobParts = partsQuantityMap[jobId] || {};
    return Object.entries(jobParts)
      .filter(([_, qty]) => qty > 0)
      .map(([name, qty]) => `${qty}x ${name}`);
  };

  // Step 1: Staff starts fixing the vehicle
  const handleStartFix = (jobId) => {
    updateJobStatus(jobId, 'IN-PROGRESS', 'Mechanic has started repairing the vehicle.');
    loadJobs();
    setActionMessage(`Repair started for Job #${jobId}! Status updated to IN-PROGRESS.`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Step 2: Staff completes repair with selected parts & quantities
  const handleMarkCompleted = (jobId, currentNotes) => {
    const partsUsedFormatted = getFormattedUsedPartsList(jobId);
    const notesWithParts = partsUsedFormatted.length > 0
      ? `${currentNotes || ''} (Replaced Parts: ${partsUsedFormatted.join(', ')})`.trim()
      : currentNotes || 'Servicing completed successfully.';

    updateJobStatus(jobId, 'COMPLETED', notesWithParts, partsUsedFormatted);
    loadJobs();
    setActionMessage(`Job #${jobId} repair marked completed! Replaced parts recorded and stock inventory updated.`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Step 3: Vehicle cannot be fixed by technician
  const submitCannotFixReport = (e) => {
    e.preventDefault();
    if (!cannotFixJob || !cannotFixReason.trim()) return;

    markJobCannotFix(cannotFixJob.id, cannotFixReason.trim());
    loadJobs();
    setActionMessage(`Job #${cannotFixJob.id} reported UNFIXABLE. Front Desk notified to set and bill diagnostic labor fee.`);

    setCannotFixJob(null);
    setCannotFixReason('');
    setTimeout(() => setActionMessage(null), 4000);
  };

  const pendingStartJobs = jobOrders.filter((j) => j.status === 'PENDING');
  const activeJobs = jobOrders.filter((j) => j.status === 'IN-PROGRESS');
  const completedJobs = jobOrders.filter((j) => j.status === 'COMPLETED');

  const dutyStatus = activeJobs.length > 0 ? 'Occupied (Repairing)' : 'Available';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-700 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start space-x-2">
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase">
              Mechanic Technician Portal
            </span>
            <span className="bg-amber-400/30 text-amber-100 text-xs font-mono font-bold px-3 py-1 rounded-full border border-white/10 flex items-center space-x-1">
              <Clock className="h-3.5 w-3.5" />
              <LiveClock />
            </span>
          </div>
          <h1 className="text-3xl font-extrabold">Technician - {user?.name || user?.username || 'Dave Garay'}</h1>
          <p className="text-amber-100 text-sm max-w-xl">
            Inspect job orders sent from Front Desk, adjust replacement part quantities (+/-), or notify Front Desk if vehicle cannot be fixed.
          </p>
        </div>

        <div className="mt-6 md:mt-0">
          <Link
            to="/staff/assigned-jobs"
            className="bg-white text-amber-800 hover:bg-amber-50 font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center space-x-2"
          >
            <Wrench className="h-4 w-4 text-amber-700" />
            <span>My Assigned Repair Jobs ({jobOrders.length})</span>
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <MetricCard
          title="Dispatched (Waiting Start)"
          value={`${pendingStartJobs.length} Pending`}
          icon={Clock}
          color="bg-purple-600"
        />
        <MetricCard
          title="Repairing In-Progress"
          value={`${activeJobs.length} Repairing`}
          icon={Wrench}
          color="bg-amber-600"
        />
        <MetricCard
          title="Completed Servicing"
          value={`${completedJobs.length} Completed`}
          icon={CheckCircle}
          color="bg-emerald-600"
        />
        <MetricCard
          title="Technician Duty Status"
          value={dutyStatus}
          icon={ShieldCheck}
          color={activeJobs.length > 0 ? 'bg-amber-600' : 'bg-emerald-600'}
        />
      </div>

      {/* Assigned Work Orders Queue */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <Wrench className="h-5 w-5 text-amber-600" />
            <span>My Assigned Repair Job Orders ({jobOrders.length})</span>
          </h2>
          <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
            activeJobs.length > 0 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
          }`}>
            {dutyStatus}
          </span>
        </div>

        <div className="space-y-6">
          {jobOrders.map((job) => {
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

            return (
              <div
                key={job.id}
                className={`p-6 rounded-2xl border space-y-4 transition-all ${
                  isCannotFix
                    ? 'bg-red-50/50 border-red-200'
                    : job.status === 'COMPLETED'
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : job.status === 'IN-PROGRESS'
                    ? 'bg-amber-50/60 border-amber-200'
                    : 'bg-purple-50/60 border-purple-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/60 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-lg uppercase font-mono ${
                      isCannotFix
                        ? 'bg-red-200 text-red-900'
                        : job.status === 'COMPLETED'
                        ? 'bg-emerald-200 text-emerald-900'
                        : job.status === 'IN-PROGRESS'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-purple-200 text-purple-900'
                    }`}>
                      Job #{job.id} • {isCannotFix ? 'CANNOT FIX (UNREPAIRABLE)' : job.status === 'PENDING' || job.status === 'DISPATCHED' ? 'AWAITING ACCEPTANCE / NOT YET FIXED' : job.status === 'IN-PROGRESS' ? 'IN-PROGRESS (ACCEPTED & REPAIRING)' : 'COMPLETED'}
                    </span>
                    <span className="text-xs font-mono text-gray-500">{job.dateTime}</span>
                  </div>

                  <span className="text-base font-extrabold text-gray-900">{job.totalPrice}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-gray-500 font-bold uppercase text-[10px]">Client Name</p>
                    <p className="font-bold text-gray-900">{job.clientName}</p>
                    <p className="text-gray-500 flex items-center space-x-1 mt-0.5">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span>{job.clientPhone}</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 font-bold uppercase text-[10px]">Vehicle & License Plate</p>
                    <p className="font-bold text-gray-900">{job.vehicleName}</p>
                    <p className="text-gray-600 font-mono">Plate: {job.plateNumber}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 font-bold uppercase text-[10px]">Availed Service & Problem</p>
                    <p className="font-bold text-purple-700">{job.serviceCategory}</p>
                    <p className="text-red-600 font-semibold">{job.problemDescription}</p>
                  </div>
                </div>

                {/* Replacement Auto Parts Selection / Unfixable Alert */}
                {isCannotFix ? (
                  <div className="bg-red-100/80 border border-red-300 p-4 rounded-2xl text-xs space-y-1 text-red-950 font-semibold">
                    <p className="font-extrabold flex items-center space-x-1.5 text-red-800">
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                      <span>VEHICLE CANNOT BE FIXED: Reported to Front Desk. Awaiting Front Desk labor fee decision.</span>
                    </p>
                    <p className="text-red-700 text-[11px] pl-5">{job.mechanicNotes}</p>
                  </div>
                ) : (
                  <div className="bg-white/95 p-4 rounded-2xl border border-amber-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                        <Package className="h-4 w-4 text-amber-600" />
                        <span>Replacement Auto Parts & Live Stocks (+ adds / - decreases stocks):</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {formattedPartsList.length} Add-On Item(s) Selected
                      </span>
                    </div>

                    {job.status === 'COMPLETED' ? (
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-emerald-900 uppercase flex items-center space-x-1.5">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            <span>Completed Servicing Summary & Add-Ons:</span>
                          </span>
                          <span className="bg-emerald-600 text-white font-mono text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                            READY FOR BILLING
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                          <div className="bg-white p-3 rounded-xl border border-emerald-100">
                            <span className="text-[10px] text-gray-500 uppercase block font-bold">Service Availed</span>
                            <span className="font-extrabold text-purple-800 text-xs">{job.serviceCategory}</span>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-emerald-100">
                            <span className="text-[10px] text-gray-500 uppercase block font-bold">Installed Add-On Spare Parts</span>
                            {formattedPartsList.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {formattedPartsList.map((p, pIdx) => (
                                  <span key={pIdx} className="bg-emerald-100 text-emerald-900 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-200">
                                    ✓ {p}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-xs">No specific add-on parts installed</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-1">
                        {/* Category Filter for Spare Parts */}
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                          <span className="text-[10px] font-bold text-gray-600 uppercase">Catalog Category:</span>
                          <select
                            value={currentCategoryFilter}
                            onChange={(e) => setPartCategoryMap({ ...partCategoryMap, [job.id]: e.target.value })}
                            className="text-[11px] font-bold text-gray-800 bg-white border border-gray-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-600"
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableCatalogParts.map((part) => {
                          const currentQty = (partsQuantityMap[job.id] || {})[part.name] || 0;
                          const isSelected = currentQty > 0;

                          return (
                            <div
                              key={part.id}
                              className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'bg-amber-100/90 border-amber-400 text-amber-950 font-bold shadow-sm'
                                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <p className="font-bold text-gray-900 truncate">{part.name}</p>
                                <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-semibold mt-0.5">
                                  <span className="text-amber-700 font-extrabold">{part.price}</span>
                                  <span>•</span>
                                  <span className={`font-bold px-1.5 py-0.5 rounded border ${
                                    part.stockQuantity > 5
                                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                      : 'text-red-700 bg-red-50 border-red-200'
                                  }`}>
                                    Available Stock: {part.stockQuantity} {part.unit}s
                                  </span>
                                </div>
                              </div>

                              {/* Live Quantity Stepper Buttons (+ / -) */}
                              <div className="flex items-center space-x-1.5 shrink-0 bg-white p-1 rounded-xl border border-gray-300 shadow-inner">
                                <button
                                  type="button"
                                  onClick={() => decrementPartQty(job.id, part.name)}
                                  disabled={currentQty === 0}
                                  className="p-1 bg-gray-100 hover:bg-amber-200 disabled:opacity-30 rounded-lg text-gray-700 transition-colors"
                                  title="Decrease Part Quantity (Restores +1 Stock)"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>

                                <span className={`w-6 text-center font-mono font-black text-xs ${isSelected ? 'text-amber-900' : 'text-gray-400'}`}>
                                  {currentQty}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => incrementPartQty(job.id, part.name, part.stockQuantity)}
                                  disabled={part.stockQuantity === 0}
                                  className="p-1 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-300 text-white rounded-lg transition-colors shadow-sm"
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

                {/* Work Notes */}
                <div className="bg-white/80 p-3.5 rounded-xl text-xs border border-gray-200 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Technician Maintenance Notes:</span>
                  <p className="font-medium text-gray-800">{job.mechanicNotes}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                  {job.status !== 'COMPLETED' && !isCannotFix && (
                    <button
                      type="button"
                      onClick={() => {
                        setCannotFixJob(job);
                        setCannotFixReason('Engine block severely cracked / unrepairable damage');
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-4 py-2 rounded-xl transition-all border border-red-200 flex items-center space-x-1.5"
                    >
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span>Cannot Fix Vehicle</span>
                    </button>
                  )}

                  <div className="flex justify-end items-center space-x-3 ml-auto">
                    {(job.status === 'PENDING' || job.status === 'DISPATCHED') && (
                      <button
                        onClick={() => handleStartFix(job.id)}
                        className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-purple-700/20 flex items-center space-x-1.5"
                      >
                        <Play className="h-4 w-4 fill-white" />
                        <span>Accept Job & Start Repair</span>
                      </button>
                    )}

                    {job.status === 'IN-PROGRESS' && (
                      <button
                        onClick={() => handleMarkCompleted(job.id, job.mechanicNotes)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center space-x-1.5"
                      >
                        <Check className="h-4 w-4" />
                        <span>Mark Repair Completed ({formattedPartsList.length} Add-Ons)</span>
                      </button>
                    )}

                    {job.status === 'COMPLETED' && (
                      <span className="text-emerald-700 text-xs font-bold bg-emerald-100 px-3 py-1 rounded-lg flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <span>Servicing Completed</span>
                      </span>
                    )}

                    {isCannotFix && (
                      <span className="text-red-700 text-xs font-bold bg-red-100 px-3 py-1 rounded-lg flex items-center space-x-1">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span>Notified Front Desk (Awaiting Labor Fee Decision)</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {jobOrders.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-xs">
              No repair jobs currently assigned to technician {user?.name || user?.username || 'Dave Garay'}. Status: AVAILABLE.
            </div>
          )}
        </div>
      </div>

      {/* CANNOT FIX VEHICLE REASON MODAL */}
      {cannotFixJob && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Vehicle Cannot Be Fixed</h3>
                  <p className="text-xs text-gray-500 font-mono">Job Order #{cannotFixJob.id} • {cannotFixJob.clientName}</p>
                </div>
              </div>

              <button
                onClick={() => setCannotFixJob(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitCannotFixReport} className="space-y-4">
              <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl text-xs text-red-900 space-y-1">
                <p className="font-extrabold flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>Unrepairable Vehicle Notification:</span>
                </p>
                <p className="text-red-800 text-[11px] leading-relaxed">
                  Submitting this report will notify Front Desk that the vehicle is unrepairable. Front Desk will review your reason and decide the diagnostic labor fee for the client.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Reason Why Vehicle Cannot Be Fixed <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  value={cannotFixReason}
                  onChange={(e) => setCannotFixReason(e.target.value)}
                  placeholder="Describe why vehicle cannot be repaired (e.g. Engine block severely cracked, obsolete replacement parts, unrepairable chassis damage)..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-2xl p-3 text-xs text-gray-900 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setCannotFixJob(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-red-600/30 flex items-center space-x-1.5"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Notify Front Desk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-2xl text-white ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}
