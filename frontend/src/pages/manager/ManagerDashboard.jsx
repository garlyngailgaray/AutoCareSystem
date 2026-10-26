import React, { useState, useEffect } from 'react';
import { getJobOrders, notifyCashierForBilling, setFrontDeskLaborFeeAndNotify, deleteJobOrder } from '../../utils/jobOrderStore';
import { calculatePartsTotal, getItemizedPartsWithPrices } from '../../utils/autoPartsCatalog';
import { getUserAccounts } from '../../utils/userAccountsStore';
import { Wrench, Clock, CheckCircle, AlertCircle, Users, FilePlus, History, ShieldCheck, Search, Send, Check, Eye, X, Package, DollarSign, UserCheck, Trash2 } from 'lucide-react';
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

export default function ManagerDashboard({ user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [jobOrders, setJobOrders] = useState([]);
  const [registeredClients, setRegisteredClients] = useState([]);
  const [notifiedMessage, setNotifiedMessage] = useState(null);
  const [inspectJob, setInspectJob] = useState(null);

  // Front Desk Unfixable Labor Fee Input State
  const [unfixableLaborFee, setUnfixableLaborFee] = useState(500);

  const loadJobs = () => {
    const orders = getJobOrders();
    setJobOrders((prev) => (JSON.stringify(prev) === JSON.stringify(orders) ? prev : orders));
  };

  const loadClients = () => {
    const users = getUserAccounts();
    const clients = users.filter((u) => u.role === 'client' || u.role === 'customer');
    setRegisteredClients((prev) => (JSON.stringify(prev) === JSON.stringify(clients) ? prev : clients));
  };

  useEffect(() => {
    loadJobs();
    loadClients();
    window.addEventListener('storage', loadClients);
    window.addEventListener('storage', loadJobs);
    window.addEventListener('autocare_users_updated', loadClients);
    window.addEventListener('autocare_jobs_updated', loadJobs);
    const timer = setInterval(() => {
      loadJobs();
      loadClients();
    }, 2000);
    return () => {
      window.removeEventListener('storage', loadClients);
      window.removeEventListener('storage', loadJobs);
      window.removeEventListener('autocare_users_updated', loadClients);
      window.removeEventListener('autocare_jobs_updated', loadJobs);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (inspectJob) {
      const fresh = jobOrders.find((j) => j.id === inspectJob.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(inspectJob)) {
        setInspectJob(fresh);
      }
    }
  }, [jobOrders]);

  const handleNotifyCashier = (jobId, clientName) => {
    notifyCashierForBilling(jobId);
    loadJobs();
    if (inspectJob && inspectJob.id === jobId) {
      setInspectJob({ ...inspectJob, managerNotifiedCashier: true });
    }
    setNotifiedMessage(`Bill for Job #${jobId} (${clientName}) sent to Cashier Counter!`);
    setTimeout(() => setNotifiedMessage(null), 3000);
  };

  const handleSetUnfixableLaborFee = (jobId, clientName) => {
    const feeNum = parseFloat(unfixableLaborFee || 0);
    setFrontDeskLaborFeeAndNotify(jobId, feeNum);
    loadJobs();
    if (inspectJob && inspectJob.id === jobId) {
      setInspectJob({
        ...inspectJob,
        serviceFee: '₱0.00',
        laborFee: `₱${feeNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        totalPrice: `₱${feeNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        managerNotifiedCashier: true,
      });
    }
    setNotifiedMessage(`Diagnostic Labor Fee of ₱${feeNum} set for Job #${jobId} (${clientName}) & sent to Cashier Counter!`);
    setTimeout(() => setNotifiedMessage(null), 3000);
  };

  const handleDeleteJob = (jobId, clientName) => {
    if (!window.confirm(`Are you sure you want to delete Job Order #${jobId} for ${clientName}? This action cannot be undone.`)) {
      return;
    }
    deleteJobOrder(jobId);
    loadJobs();
    if (inspectJob && inspectJob.id === jobId) {
      setInspectJob(null);
    }
    setNotifiedMessage(`Job Order #${jobId} (${clientName}) deleted successfully!`);
    setTimeout(() => setNotifiedMessage(null), 3000);
  };

  const filteredJobs = jobOrders.filter((job) => {
    const query = searchTerm.toLowerCase();
    return (
      (job.clientName || '').toLowerCase().includes(query) ||
      (job.vehicleName || '').toLowerCase().includes(query) ||
      (job.plateNumber || '').toLowerCase().includes(query) ||
      (job.serviceCategory || '').toLowerCase().includes(query) ||
      (job.assignedMechanic || '').toLowerCase().includes(query) ||
      job.id.toString().includes(query)
    );
  });

  const activeCount = jobOrders.filter((j) => j.status === 'IN-PROGRESS').length;
  const completedCount = jobOrders.filter((j) => j.status === 'COMPLETED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start space-x-2">
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase">
              Front Desk Portal
            </span>
            <span className="bg-purple-400/30 text-purple-100 text-xs font-mono font-bold px-3 py-1 rounded-full border border-white/10 flex items-center space-x-1">
              <Clock className="h-3.5 w-3.5" />
              <LiveClock />
            </span>
          </div>
          <h1 className="text-3xl font-extrabold">Welcome, {user?.name || 'Front Desk Manager'}</h1>
          <p className="text-purple-100 text-sm max-w-xl">
            Process job orders, assign certified mechanics, set diagnostic labor fees for unfixable vehicles, and notify Cashier for completed billing.
          </p>
        </div>

        <div className="mt-6 md:mt-0 flex flex-wrap gap-3">
          <Link
            to="/user-management"
            className="bg-purple-900/40 hover:bg-purple-900/60 text-white border border-purple-400/30 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center space-x-2"
          >
            <UserCheck className="h-4 w-4 text-purple-200" />
            <span>User Management</span>
          </Link>
          <Link
            to="/manager/job-order"
            className="bg-white text-purple-800 hover:bg-purple-50 font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center space-x-2"
          >
            <FilePlus className="h-4 w-4 text-purple-700" />
            <span>+ Report Job Order</span>
          </Link>
        </div>
      </div>

      {notifiedMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{notifiedMessage}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Registered Clients" value={`${registeredClients.length} Clients`} icon={UserCheck} color="bg-indigo-600" />
        <MetricCard title="Total Repair Requests" value={`${jobOrders.length} Total`} icon={Wrench} color="bg-blue-600" />
        <MetricCard title="Active In-Progress" value={`${activeCount} Repairing`} icon={Clock} color="bg-amber-600" />
        <MetricCard title="Completed Servicing" value={`${completedCount} Jobs`} icon={CheckCircle} color="bg-emerald-600" />
        <MetricCard title="Active Mechanics" value="2 Mechanics" icon={Users} color="bg-purple-600" />
      </div>

      {/* Quick Action Cards for Front Desk */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <ManagerActionCard
          title="User Management"
          description="View and inspect registered client profiles, account IDs, and demographics"
          icon={UserCheck}
          to="/user-management"
          color="text-indigo-600"
          badge="User Mgmt"
        />
        <ManagerActionCard
          title="Report & Process Job Order"
          description="Select client, describe vehicle problem, choose service, and assign mechanic"
          icon={FilePlus}
          to="/manager/job-order"
          color="text-purple-600"
          badge="Create Order"
        />
        <ManagerActionCard
          title="Mechanic Availability"
          description="View on-duty mechanics, current repair assignments, and workload"
          icon={Users}
          to="/manager/mechanics"
          color="text-blue-600"
          badge="Live Status"
        />
        <ManagerActionCard
          title="All Client Repair History"
          description="Full searchable repair records across all shop clients"
          icon={History}
          to="/manager/history"
          color="text-emerald-600"
          badge="Full History"
        />
      </div>

      {/* Active Shop Repair Requests with Real-Time Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-purple-600" />
              <span>Real-Time Job Orders & Availed Services / Add-Ons</span>
            </h2>
            <p className="text-xs text-gray-500">Inspect availed services, unfixable vehicle reports, diagnostic labor fees, and billing dispatch status</p>
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-80">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search active jobs..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Job ID</th>
                <th className="p-3">Client Name</th>
                <th className="p-3">Vehicle & Plate</th>
                <th className="p-3">Service Availed & Add-Ons</th>
                <th className="p-3">Assigned Mechanic</th>
                <th className="p-3">Updated Total Bill</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">View / Billing Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredJobs.map((job) => {
                const isUnfixable = job.status === 'CANNOT-FIX';

                return (
                  <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-gray-900">#{job.id}</td>
                    <td className="p-3 font-semibold text-gray-900">{job.clientName}</td>
                    <td className="p-3">
                      {job.vehicleName} (<span className="font-mono font-semibold">{job.plateNumber}</span>)
                    </td>

                    {/* Availed Service & Add-Ons Badge */}
                    <td className="p-3">
                      <p className="font-bold text-gray-900">{job.serviceCategory}</p>
                      {isUnfixable ? (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 inline-block mt-0.5">
                          Unfixable Vehicle
                        </span>
                      ) : (
                        job.usedParts && job.usedParts.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {job.usedParts.map((p, pIdx) => (
                              <span key={pIdx} className="bg-amber-50 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-200">
                                + {p}
                              </span>
                            ))}
                          </div>
                        )
                      )}
                    </td>

                    <td className="p-3 text-blue-600 font-bold">{job.assignedMechanic}</td>

                    {/* Updated Total Bill (Service + Labor + Add-Ons Parts) */}
                    <td className="p-3 font-extrabold text-emerald-600">{job.totalPrice}</td>

                    <td className="p-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          isUnfixable
                            ? 'bg-red-100 text-red-800'
                            : job.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isUnfixable ? 'CANNOT FIX' : job.status}
                      </span>
                    </td>

                    <td className="p-3 text-right flex items-center justify-end space-x-2">
                      {/* View Service & Add-Ons Button */}
                      <button
                        onClick={() => {
                          setInspectJob(job);
                          if (isUnfixable) {
                            setUnfixableLaborFee(parseFloat((job.laborFee || '500').replace(/[^0-9.-]+/g, '') || 500));
                          }
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition-all inline-flex items-center space-x-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect Details</span>
                      </button>

                      {/* Delete Job Order Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job.id, job.clientName)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition-all border border-red-200 inline-flex items-center space-x-1 cursor-pointer"
                        title="Delete Job Order"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        <span>Delete</span>
                      </button>

                      {isUnfixable ? (
                        job.managerNotifiedCashier ? (
                          <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg inline-flex items-center space-x-1">
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span>Notified Cashier</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              const currentFee = parseFloat((job.laborFee || '500').replace(/[^0-9.-]+/g, '') || 500);
                              handleSetUnfixableLaborFee(job.id, job.clientName, currentFee);
                            }}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg shadow-sm transition-all inline-flex items-center space-x-1 cursor-pointer"
                            title="Notify Cashier to bill client for diagnostic labor fee"
                          >
                            <Send className="h-3 w-3" />
                            <span>Notify Cashier</span>
                          </button>
                        )
                      ) : job.status === 'COMPLETED' ? (
                        job.managerNotifiedCashier ? (
                          <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg inline-flex items-center space-x-1">
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span>Notified</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleNotifyCashier(job.id, job.clientName)}
                            className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg shadow-sm transition-all inline-flex items-center space-x-1"
                          >
                            <Send className="h-3 w-3" />
                            <span>Notify Cashier</span>
                          </button>
                        )
                      ) : (
                        <span className="text-amber-700 font-semibold text-[10px] italic">Repairing</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-xs">
            No active jobs found matching "<span className="font-semibold text-gray-700">{searchTerm}</span>".
          </div>
        )}
      </div>

      {/* Front Desk Service, Add-Ons & Updated Bill Inspection Modal */}
      {inspectJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Job Order #{inspectJob.id} Details</h3>
                  <p className="text-xs text-gray-500 font-mono">Timestamp: {inspectJob.dateTime}</p>
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
              {/* Client & Vehicle Card */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-gray-900 text-sm">{inspectJob.clientName}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    inspectJob.status === 'CANNOT-FIX' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {inspectJob.status === 'CANNOT-FIX' ? 'CANNOT FIX (UNREPAIRABLE)' : inspectJob.status}
                  </span>
                </div>
                <p className="text-gray-600">Vehicle: <strong className="text-gray-800">{inspectJob.vehicleName}</strong> (Plate: <span className="font-mono font-bold">{inspectJob.plateNumber}</span>)</p>
                <p className="text-gray-500 font-mono">Phone: {inspectJob.clientPhone}</p>
              </div>

              {/* Service Availed Box */}
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-1">
                <span className="text-[10px] font-bold text-purple-900 uppercase block">Primary Service Availed</span>
                <p className="font-extrabold text-purple-900 text-sm">{inspectJob.serviceCategory}</p>
                <p className="text-gray-600 italic">Reported Problem: "{inspectJob.problemDescription}"</p>
              </div>

              {/* Assigned Technician & Notes (Mechanic Unfixable Reason) */}
              <div className={`p-4 rounded-2xl border space-y-1 ${
                inspectJob.status === 'CANNOT-FIX' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'
              }`}>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Assigned Technician Report</span>
                <p className="font-bold text-blue-600">{inspectJob.assignedMechanic}</p>
                <p className="text-gray-800 font-semibold italic">{inspectJob.mechanicNotes}</p>
              </div>

              {/* Unfixable Vehicle Front Desk Labor Fee Decision Section */}
              {inspectJob.status === 'CANNOT-FIX' ? (
                <div className="bg-red-50/80 border border-red-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 text-red-900 font-bold">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>Front Desk Labor Fee Decision (Unrepairable Vehicle)</span>
                  </div>
                  <p className="text-[11px] text-gray-600">
                    Mechanic reported vehicle cannot be fixed. Service Fee is set to <strong>₱0.00</strong>. Front Desk decides the diagnostic/inspection labor fee below:
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[10px] font-extrabold text-gray-700 uppercase">Set Diagnostic Labor Fee (₱)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="any"
                        value={unfixableLaborFee}
                        onChange={(e) => setUnfixableLaborFee(e.target.value)}
                        placeholder="Enter labor fee (e.g. 500)"
                        className="flex-1 bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-purple-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleSetUnfixableLaborFee(inspectJob.id, inspectJob.clientName)}
                        className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center space-x-1"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Set & Notify Cashier</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Add-On Spare Parts Installed Box */
                <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex justify-between items-center border-b border-amber-200/80 pb-1.5">
                    <span className="text-[10px] font-bold text-amber-900 uppercase flex items-center space-x-1">
                      <Package className="h-3.5 w-3.5 text-amber-600" />
                      <span>Installed Add-On Spare Parts:</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded">
                      {inspectJob.usedParts ? inspectJob.usedParts.length : 0} Item(s)
                    </span>
                  </div>

                  {inspectJob.usedParts && inspectJob.usedParts.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {getItemizedPartsWithPrices(inspectJob.usedParts).map((partItem, pIdx) => (
                        <div key={pIdx} className="bg-white p-3 rounded-xl border border-amber-200 space-y-0.5">
                          <div className="flex justify-between items-center text-xs font-bold text-gray-900">
                            <span>✓ {partItem.name}</span>
                            <span className="text-amber-800 font-mono text-[11px] font-semibold">{partItem.origPriceFormatted}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-emerald-800 font-bold border-t border-amber-100 pt-1">
                            <span>Quantity Purchased: {partItem.quantity}</span>
                            <span className="font-extrabold text-emerald-700">{partItem.subtotalFormatted}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-xs">No specific add-on parts installed by technician.</p>
                  )}
                </div>
              )}

              {/* Itemized Price Breakdown */}
              {(() => {
                const isUnfixable = inspectJob.status === 'CANNOT-FIX';
                const sNum = isUnfixable ? 0 : parseFloat((inspectJob.serviceFee || '2800').replace(/[^0-9.-]+/g, '') || 2800);
                const lNum = isUnfixable ? parseFloat(unfixableLaborFee || 0) : parseFloat((inspectJob.laborFee || '700').replace(/[^0-9.-]+/g, '') || 700);
                const pNum = isUnfixable ? 0 : calculatePartsTotal(inspectJob.usedParts || []);
                const overallNum = sNum + lNum + pNum;

                return (
                  <div className="bg-slate-900 text-white p-4.5 rounded-2xl space-y-2 shadow-inner">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block border-b border-slate-800 pb-1">
                      Billing Summary & Total Breakdown:
                    </span>

                    <div className="flex justify-between text-gray-300 text-xs">
                      <span>Service Fee (Base Package):</span>
                      <span className="font-bold text-white">₱{sNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between text-gray-300 text-xs">
                      <span>Labor Charge (Front Desk Decision):</span>
                      <span className="font-bold text-amber-400">₱{lNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>

                    {!isUnfixable && pNum > 0 && (
                      <div className="flex justify-between text-amber-400 font-bold text-xs pt-1 border-t border-slate-800">
                        <span>Installed Add-On Spare Parts Sum:</span>
                        <span>+ ₱{pNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-emerald-400 text-sm font-black border-t border-slate-800 pt-2 my-1">
                      <span>Overall Calculated Bill Total:</span>
                      <span className="text-base">₱{overallNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="pt-2 flex justify-between items-center space-x-3">
              {inspectJob.status === 'COMPLETED' && !inspectJob.managerNotifiedCashier && (
                <button
                  onClick={() => handleNotifyCashier(inspectJob.id, inspectJob.clientName)}
                  className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-purple-700/20 flex items-center space-x-1.5"
                >
                  <Send className="h-4 w-4" />
                  <span>Notify Cashier Counter</span>
                </button>
              )}

              <button
                onClick={() => setInspectJob(null)}
                className="bg-gray-900 hover:bg-black text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all ml-auto"
              >
                Close Inspection
              </button>
            </div>
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

function ManagerActionCard({ title, description, icon: Icon, to, color, badge }) {
  return (
    <Link
      to={to}
      className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all group block space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-xl bg-purple-50 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full uppercase">
          {badge}
        </span>
      </div>
      <div>
        <h3 className="font-bold text-gray-900 text-base group-hover:text-purple-600 transition-colors">{title}</h3>
        <p className="text-gray-500 text-xs mt-1 leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}
