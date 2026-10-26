import React, { useState, useEffect } from 'react';
import { getJobOrders } from '../../utils/jobOrderStore';
import { History as HistoryIcon, Search, CheckCircle, Clock, AlertCircle, Eye, X, Wrench, Package } from 'lucide-react';

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

export default function ManagerHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [jobOrders, setJobOrders] = useState([]);
  const [inspectJob, setInspectJob] = useState(null);

  const loadJobs = () => {
    const orders = getJobOrders();
    setJobOrders((prev) => (JSON.stringify(prev) === JSON.stringify(orders) ? prev : orders));
  };

  useEffect(() => {
    loadJobs();
    window.addEventListener('storage', loadJobs);
    window.addEventListener('autocare_jobs_updated', loadJobs);
    const timer = setInterval(loadJobs, 2000);
    return () => {
      window.removeEventListener('storage', loadJobs);
      window.removeEventListener('autocare_jobs_updated', loadJobs);
      clearInterval(timer);
    };
  }, []);

  const filteredHistory = jobOrders.filter((item) => {
    const query = searchTerm.toLowerCase();
    return (
      (item.clientName || '').toLowerCase().includes(query) ||
      (item.vehicleName || '').toLowerCase().includes(query) ||
      (item.plateNumber || '').toLowerCase().includes(query) ||
      (item.serviceCategory || '').toLowerCase().includes(query) ||
      (item.problemDescription || '').toLowerCase().includes(query) ||
      (item.assignedMechanic || '').toLowerCase().includes(query) ||
      (item.status || '').toLowerCase().includes(query) ||
      (item.dateTime || '').toLowerCase().includes(query) ||
      item.id.toString().includes(query)
    );
  });

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit"><CheckCircle className="h-3 w-3" /> Completed</span>;
      case 'in-progress':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit"><Clock className="h-3 w-3" /> In Progress</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit"><AlertCircle className="h-3 w-3" /> Cancelled</span>;
      default:
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit"><Clock className="h-3 w-3" /> Dispatched</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <HistoryIcon className="h-6 w-6 text-purple-600" />
              <span>All Clients Repair History ({jobOrders.length})</span>
            </h1>
            <span className="text-xs font-mono font-bold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-100 flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <LiveClock prefix="Live: " />
            </span>
          </div>
          <p className="text-sm text-gray-500">Front Desk overview of all real-time and past client vehicle repair records and installed add-on parts</p>
        </div>

        {/* Real-time Search Bar */}
        <div className="w-full sm:w-80">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by client, plate, service, staff, date..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-600 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Job ID</th>
                <th className="p-3">Client Name</th>
                <th className="p-3">Vehicle & Plate</th>
                <th className="p-3">Service Availed & Add-Ons</th>
                <th className="p-3">Assigned Staff</th>
                <th className="p-3">Real-Time Timestamp</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Inspect / Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-gray-900">#{item.id}</td>
                  <td className="p-3 font-bold text-gray-900">{item.clientName}</td>
                  <td className="p-3">
                    <p className="font-semibold text-gray-900">{item.vehicleName}</p>
                    <p className="text-[11px] font-mono text-gray-500">{item.plateNumber}</p>
                  </td>
                  <td className="p-3">
                    <p className="font-semibold text-gray-900">{item.serviceCategory}</p>
                    {item.usedParts && item.usedParts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.usedParts.map((p, pIdx) => (
                          <span key={pIdx} className="bg-amber-50 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-200">
                            + {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-bold text-blue-600">{item.assignedMechanic}</td>
                  <td className="p-3 font-mono text-[11px] text-gray-500">{item.dateTime}</td>
                  <td className="p-3">{getStatusBadge(item.status)}</td>
                  <td className="p-3 text-right">
                    <p className="font-extrabold text-emerald-600">{item.totalPrice}</p>
                    <button
                      onClick={() => setInspectJob(item)}
                      className="mt-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[10px] px-2.5 py-1 rounded-lg transition-all inline-flex items-center space-x-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Inspect Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredHistory.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-xs">
            No repair records found matching "<span className="font-semibold text-gray-700">{searchTerm}</span>".
          </div>
        )}
      </div>

      {/* Front Desk History Inspection Modal */}
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
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                    {inspectJob.status}
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

              {/* Add-On Spare Parts Installed Box */}
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-amber-900 uppercase flex items-center space-x-1">
                    <Package className="h-3.5 w-3.5 text-amber-600" />
                    <span>Installed Add-On Spare Parts:</span>
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
                  <p className="text-gray-500 italic text-xs">No specific add-on parts installed by technician.</p>
                )}
              </div>

              {/* Assigned Technician & Notes */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Assigned Technician & Notes</span>
                <p className="font-bold text-blue-600">{inspectJob.assignedMechanic}</p>
                <p className="text-gray-700 italic">{inspectJob.mechanicNotes}</p>
              </div>

              {/* Price Breakdown */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1.5">
                <div className="flex justify-between text-gray-300">
                  <span>Service Fee (Parts/Package):</span>
                  <span className="font-bold text-white">{inspectJob.serviceFee || '₱2,800.00'}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Labor Charge (Work Fee):</span>
                  <span className="font-bold text-amber-400">{inspectJob.laborFee || '₱700.00'}</span>
                </div>
                <div className="flex justify-between text-emerald-400 text-sm font-black border-t border-slate-800 pt-2 my-1">
                  <span>Overall Total Amount:</span>
                  <span className="text-base">{inspectJob.totalPrice}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectJob(null)}
                className="bg-gray-900 hover:bg-black text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all"
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
