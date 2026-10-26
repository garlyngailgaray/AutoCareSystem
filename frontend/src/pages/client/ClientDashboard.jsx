import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJobOrders } from '../../utils/jobOrderStore';
import { getFeedback, addFeedback, deleteFeedback } from '../../utils/feedbackStore';
import {
  Car,
  Wrench,
  CheckCircle,
  Clock,
  ShieldCheck,
  FileText,
  History,
  Eye,
  X,
  Package,
  Printer,
  DollarSign,
  AlertCircle,
  MessageSquare,
  Star,
  Send,
  Plus,
  Trash2,
} from 'lucide-react';

export default function ClientDashboard({ user }) {
  const [jobOrders, setJobOrders] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Feedback Modal Form State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [fbRating, setFbRating] = useState(5);
  const [fbHoverRating, setFbHoverRating] = useState(0);
  const [fbComment, setFbComment] = useState('');
  const [fbVehicle, setFbVehicle] = useState('');
  const [fbServiceCategory, setFbServiceCategory] = useState('');

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

  const loadJobs = () => {
    const storeJobs = getJobOrders();
    const storeIds = new Set(storeJobs.map((j) => j.id));
    const merged = [...storeJobs, ...defaultHistory.filter((d) => !storeIds.has(d.id))];
    setJobOrders((prev) => (JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged));
  };

  const loadFeedbacks = () => {
    const list = getFeedback();
    setFeedbacks(list);
  };

  useEffect(() => {
    loadJobs();
    loadFeedbacks();
    window.addEventListener('autocare_jobs_updated', loadJobs);
    window.addEventListener('autocare_feedback_updated', loadFeedbacks);
    window.addEventListener('storage', () => {
      loadJobs();
      loadFeedbacks();
    });
    const timer = setInterval(() => {
      loadJobs();
      loadFeedbacks();
    }, 3000);
    return () => {
      window.removeEventListener('autocare_jobs_updated', loadJobs);
      window.removeEventListener('autocare_feedback_updated', loadFeedbacks);
      window.removeEventListener('storage', loadJobs);
      clearInterval(timer);
    };
  }, []);

  const username = (user?.username || '').toLowerCase();
  const name = (user?.name || '').toLowerCase();

  // Filter Job Orders belonging strictly to this logged-in client
  const myJobOrders = jobOrders.filter((o) => {
    const oUser = o.clientUsername ? o.clientUsername.toLowerCase() : '';
    const oName = o.clientName ? o.clientName.toLowerCase() : '';

    if (username === 'clt-4' || name.includes('claire')) {
      return oUser === 'clt-4' || oName.includes('claire');
    }
    if (username === 'lucky_garay' || name.includes('lucky')) {
      return oUser === 'lucky_garay' || oName.includes('lucky');
    }
    if (username === 'clt_mikegerald303' || name.includes('mike')) {
      return oUser === 'clt_mikegerald303' || oName.includes('mike');
    }

    if (username && oUser === username) return true;
    if (name && name !== 'client' && (oName.includes(name) || name.includes(oName))) return true;

    return false;
  });

  // Filter Feedbacks belonging to this logged-in client
  const myFeedbacks = feedbacks.filter((f) => {
    const fUser = (f.clientUsername || '').toLowerCase();
    const fName = (f.clientName || f.name || '').toLowerCase();

    if (username === 'clt-4' || name.includes('claire')) return fUser === 'clt-4' || fName.includes('claire');
    if (username === 'lucky_garay' || name.includes('lucky')) return fUser === 'lucky_garay' || fName.includes('lucky');
    if (username === 'clt_mikegerald303' || name.includes('mike')) return fUser === 'clt_mikegerald303' || fName.includes('mike');
    if (username && fUser === username) return true;
    if (name && name !== 'client' && (fName.includes(name) || name.includes(fName))) return true;

    return false;
  });

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!fbComment.trim()) return;

    const clientDisplayName = user?.name || user?.username || 'Client';

    addFeedback({
      clientUsername: user?.username || 'client',
      clientName: clientDisplayName,
      name: clientDisplayName,
      vehicle: fbVehicle || (myJobOrders.length > 0 ? `${myJobOrders[0].vehicleName} (${myJobOrders[0].plateNumber})` : 'Vehicle Owner'),
      serviceCategory: fbServiceCategory || (myJobOrders.length > 0 ? myJobOrders[0].serviceCategory : 'General Maintenance'),
      rating: fbRating,
      comment: fbComment.trim(),
    });

    setFbComment('');
    setFbRating(5);
    setShowFeedbackModal(false);
  };

  const latestJob = myJobOrders.length > 0 ? myJobOrders[0] : null;
  const activeServices = myJobOrders.filter((j) => j.status === 'IN-PROGRESS').length;
  const completedServices = myJobOrders.filter((j) => j.status === 'COMPLETED').length;

  const getFullDateLabel = (dateStr) => {
    if (!dateStr) return 'Date N/A';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
      }
    } catch (e) {}
    return dateStr;
  };

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

  const totalPaidAmount = myJobOrders
    .filter((j) => j && j.invoiceStatus === 'PAID')
    .reduce((sum, job) => {
      const priceNum = parseFloat((job.totalPrice || '0').replace(/[^0-9.-]+/g, '')) || 0;
      return sum + priceNum;
    }, 0);
  const formattedTotalPaid = `₱${totalPaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start space-x-2">
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase">
              Client Portal
            </span>
            <span className="bg-blue-400/30 text-blue-100 text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border border-white/10">
              {user?.customId || latestJob?.clientCustomId || `CLT-${300 + parseInt(user?.id || 4, 10)}`}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold">Welcome back, {user?.name || user?.username || 'Client'}!</h1>
          <p className="text-blue-100 text-sm max-w-xl">
            Track your real-time vehicle repair status, monitor maintenance history, and view active invoices all in one place.
          </p>
        </div>

        <button
          onClick={() => setShowFeedbackModal(true)}
          className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-5 py-3 rounded-xl text-xs transition-all shadow-lg flex items-center space-x-2 shrink-0 border border-blue-100"
        >
          <MessageSquare className="h-4 w-4 text-blue-600" />
          <span>Leave Service Feedback</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <span>Vehicle Care Overview</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title="Registered Vehicles"
            value={`${myJobOrders.length > 0 ? 1 : 0} Vehicle(s)`}
            icon={Car}
            color="bg-blue-600"
          />
          <MetricCard
            title="Active Service Requests"
            value={`${activeServices} In-Progress`}
            icon={Wrench}
            color="bg-amber-600"
          />
          <MetricCard
            title="Completed Maintenance"
            value={`${completedServices} Completed`}
            icon={CheckCircle}
            color="bg-indigo-600"
          />
          <MetricCard
            title="Total Payments Settled"
            value={formattedTotalPaid}
            icon={DollarSign}
            color="bg-emerald-600"
          />
        </div>
      </div>

      {/* Active Repair Requests & Live Status */}
      {latestJob ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <span>Real-Time Repair Job Status</span>
              </h2>
              <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded">
                Job #{latestJob.id}
              </span>
            </div>

            <div
              className={`p-5 rounded-2xl space-y-3 border ${
                latestJob.status === 'COMPLETED'
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-amber-50/60 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase ${
                    latestJob.status === 'COMPLETED'
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  Job #{latestJob.id} • {latestJob.status}
                </span>
                <span className="text-xs font-bold text-gray-700">Estimated Price: {latestJob.totalPrice}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-gray-500">Vehicle Info</p>
                  <p className="font-bold text-gray-900">{latestJob.vehicleName} (Plate: {latestJob.plateNumber})</p>
                </div>
                <div>
                  <p className="text-gray-500">Availed Service</p>
                  <p className="font-bold text-gray-900">{latestJob.serviceCategory}</p>
                </div>
                <div>
                  <p className="text-gray-500">Assigned Technician</p>
                  <p className="font-bold text-blue-600">{latestJob.assignedMechanic}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200/60 text-xs font-semibold text-gray-700 flex items-center space-x-2">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  {latestJob.status === 'COMPLETED'
                    ? 'Your vehicle servicing has been completed by your technician! Ready for cashier billing.'
                    : `Your vehicle is currently being repaired by ${latestJob.assignedMechanic}. Please wait for completion.`}
                </span>
              </div>
            </div>
          </div>

          {/* Unpaid Bills / Invoices Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <span>Billing Invoice Status</span>
                </h2>
                <span
                  className={`font-bold text-[10px] px-2 py-0.5 rounded uppercase ${
                    latestJob.invoiceStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : latestJob.invoiceStatus === 'PARTIAL'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {latestJob.invoiceStatus || 'UNPAID'}
                </span>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice Number:</span>
                  <span className="font-mono font-bold text-gray-900">#RCT-00{latestJob.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Price:</span>
                  <span className="font-semibold text-gray-900">{latestJob.totalPrice}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-sm">
                  <span className="text-gray-800">Remaining Balance:</span>
                  <span className={latestJob.invoiceStatus === 'PAID' ? 'text-emerald-600' : 'text-red-600'}>
                    {latestJob.balance}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 italic text-center pt-2">
              {latestJob.invoiceStatus === 'PAID'
                ? 'Invoice settled. Thank you for choosing AutoCare System!'
                : 'Please pay at the cashier counter upon vehicle pickup.'}
            </p>
          </div>
        </div>
      ) : null}

      {/* CLIENT PERSONAL REPAIR HISTORY SECTION */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-blue-600 shrink-0" />
            <h2 className="text-lg font-bold text-gray-900">
              My Personal Vehicle Repair History ({myJobOrders.length})
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
              Total Settled Payments: {formattedTotalPaid}
            </span>
            <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-full shrink-0">
              {user?.name || user?.username || 'Client'}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Job ID</th>
                <th className="p-3">Vehicle Details</th>
                <th className="p-3">Service Availed</th>
                <th className="p-3">Assigned Technician</th>
                <th className="p-3">Service Timestamp</th>
                <th className="p-3">Repair Status</th>
                <th className="p-3">Bill Amount</th>
                <th className="p-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myJobOrders.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-blue-600">#Job-{job.id}</td>
                  <td className="p-3 font-bold text-gray-900">
                    {job.vehicleName} <span className="font-mono text-[11px] text-gray-500">({job.plateNumber})</span>
                  </td>
                  <td className="p-3 font-extrabold text-purple-700">{job.serviceCategory}</td>
                  <td className="p-3 font-semibold text-gray-800">{job.assignedMechanic}</td>
                  <td className="p-3 font-mono text-gray-700">{getFullDateLabel(job.dateTime)}</td>
                  <td className="p-3">{getStatusBadge(job.status)}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border inline-block ${
                      job.invoiceStatus === 'PAID'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : job.invoiceStatus === 'PARTIAL'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}>
                      {job.invoiceStatus || 'UNPAID'} ({job.totalPrice})
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-blue-600/20 inline-flex items-center space-x-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View History Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {myJobOrders.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-xs">
            No personal vehicle repair history recorded for <span className="font-semibold text-gray-700">{user?.name || user?.username || 'Client'}</span> yet.
          </div>
        )}
      </div>

      {/* CLIENT RECORDED FEEDBACKS SECTION */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600 shrink-0" />
            <h2 className="text-lg font-bold text-gray-900">
              My Recorded Feedbacks & Service Reviews ({myFeedbacks.length})
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center space-x-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Submit New Feedback</span>
            </button>
            <Link
              to="/feedback"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1"
            >
              <span>View All Community Reviews →</span>
            </Link>
          </div>
        </div>

        {myFeedbacks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myFeedbacks.map((fb) => (
              <div
                key={fb.id}
                className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 space-y-3 relative hover:border-blue-200 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900 text-xs">{fb.vehicle || 'Vehicle'}</span>
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {fb.serviceCategory || 'Servicing'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{fb.date}</p>
                  </div>

                  <div className="flex items-center space-x-1">
                    <div className="flex text-amber-400">
                      {[...Array(fb.rating || 5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <button
                      onClick={() => deleteFeedback(fb.id)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors ml-2"
                      title="Delete Feedback"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-700 italic leading-relaxed bg-white p-3 rounded-xl border border-gray-100">
                  "{fb.comment}"
                </p>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    ✓ Recorded on Account
                  </span>
                  <span className="text-gray-400">Status: {fb.status || 'Approved'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-xs space-y-2">
            <MessageSquare className="h-8 w-8 mx-auto text-gray-300" />
            <p className="font-semibold text-gray-700">No recorded feedback submitted yet.</p>
            <p>Click "Submit New Feedback" above to share your repair experience!</p>
          </div>
        )}
      </div>

      {/* SUBMIT FEEDBACK MODAL */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Submit Service Feedback</h3>
                  <p className="text-xs text-gray-500">Record your feedback for AutoCare System</p>
                </div>
              </div>

              <button
                onClick={() => setShowFeedbackModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Vehicle Model / Plate</label>
                {myJobOrders.length > 0 ? (
                  <select
                    value={fbVehicle}
                    onChange={(e) => setFbVehicle(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="">Select from your vehicles...</option>
                    {myJobOrders.map((job) => (
                      <option key={job.id} value={`${job.vehicleName} (${job.plateNumber})`}>
                        {job.vehicleName} ({job.plateNumber})
                      </option>
                    ))}
                    <option value="Custom Vehicle">Other / Custom Vehicle</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Toyota Vios (ABC-123)"
                    value={fbVehicle}
                    onChange={(e) => setFbVehicle(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Service Category</label>
                <select
                  value={fbServiceCategory}
                  onChange={(e) => setFbServiceCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="Change Oil & Maintenance">Change Oil & Maintenance</option>
                  <option value="Brake & Suspension Overhaul">Brake & Suspension Overhaul</option>
                  <option value="Engine Overhauling">Engine Overhauling</option>
                  <option value="Body Paint & Refinishing">Body Paint & Refinishing</option>
                  <option value="Air Conditioning Services">Air Conditioning Services</option>
                  <option value="General Maintenance">General Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Rating</label>
                <div className="flex items-center space-x-1 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFbRating(star)}
                      onMouseEnter={() => setFbHoverRating(star)}
                      onMouseLeave={() => setFbHoverRating(0)}
                      className="p-1 focus:outline-none hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= (fbHoverRating || fbRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Your Comments</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share your experience with our mechanics and service quality..."
                  value={fbComment}
                  onChange={(e) => setFbComment(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 shadow-md flex items-center space-x-1"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit & Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT CLIENT PERSONAL REPAIR HISTORY MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Job Order #{selectedJob.id} Details</h3>
                  <p className="text-xs text-gray-500 font-mono">Service Date: {getFullDateLabel(selectedJob.dateTime)}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Vehicle Identification</span>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Type / Model of Vehicle:</span>
                    <strong className="text-gray-900 text-sm">{selectedJob.vehicleName}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Vehicle Plate Number:</span>
                    <span className="font-mono font-bold text-gray-900 text-xs bg-gray-200 px-2 py-0.5 rounded border border-gray-300 inline-block">{selectedJob.plateNumber}</span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-1">
                <span className="text-[10px] font-bold text-purple-900 uppercase block">Repair Service Availed</span>
                <p className="font-extrabold text-purple-900 text-sm">{selectedJob.serviceCategory}</p>
                <p className="text-gray-600 italic">Reported Problem: "{selectedJob.problemDescription}"</p>
              </div>

              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-amber-900 uppercase flex items-center space-x-1">
                    <Package className="h-3.5 w-3.5 text-amber-600" />
                    <span>Add-On Spare Parts Installed:</span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded">
                    {selectedJob.usedParts ? selectedJob.usedParts.length : 0} Item(s)
                  </span>
                </div>

                {selectedJob.usedParts && selectedJob.usedParts.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedJob.usedParts.map((part, pIdx) => (
                      <span key={pIdx} className="bg-white text-amber-950 font-bold text-[11px] px-3 py-1 rounded-xl border border-amber-300 shadow-sm">
                        ✓ {part}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-xs">No extra add-on spare parts installed on this job.</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Assigned Technician</span>
                <p className="font-bold text-blue-600">{selectedJob.assignedMechanic}</p>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1.5">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-1">
                  <span className="text-xs font-bold uppercase text-gray-300">Bill Payment Status:</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    selectedJob.invoiceStatus === 'PAID' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {selectedJob.invoiceStatus || 'UNPAID'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Service Package Charge:</span>
                  <span className="font-bold text-white">{selectedJob.serviceFee || '₱2,800.00'}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Labor Charge:</span>
                  <span className="font-bold text-amber-400">{selectedJob.laborFee || '₱700.00'}</span>
                </div>
                <div className="flex justify-between text-emerald-400 text-sm font-black border-t border-slate-800 pt-2 my-1">
                  <span>Total Billed Amount:</span>
                  <span className="text-base">{selectedJob.totalPrice}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              {selectedJob.invoiceStatus === 'PAID' ? (
                <button
                  onClick={() => {
                    setSelectedReceipt(selectedJob);
                    setSelectedJob(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center space-x-1"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Official Receipt</span>
                </button>
              ) : (
                <div className="text-[11px] font-bold text-red-600">Unpaid Bill (Payable at Cashier)</div>
              )}

              <button
                onClick={() => setSelectedJob(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 ml-auto"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mall Thermal Cash Register Receipt Modal */}
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
