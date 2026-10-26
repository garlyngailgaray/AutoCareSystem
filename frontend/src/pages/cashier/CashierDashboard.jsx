import React, { useState, useEffect } from 'react';
import { getJobOrders, processPaymentByCashier, notifyCashierForBilling } from '../../utils/jobOrderStore';
import { getItemizedPartsWithPrices, calculatePartsTotal } from '../../utils/autoPartsCatalog';
import { getUserAccounts } from '../../utils/userAccountsStore';
import { DollarSign, CheckCircle, Eye, Printer, X, CreditCard, Wallet, ShieldCheck, Lock, Edit3, Package, AlertTriangle, FileText, Search, UserCheck, Clock, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import CarMaintenanceInvoiceModal from '../../components/CarMaintenanceInvoiceModal';

export default function CashierDashboard({ user }) {
  const [posSearchTerm, setPosSearchTerm] = useState('');
  const [jobOrders, setJobOrders] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [activeCheckoutJob, setActiveCheckoutJob] = useState(null);
  const [selectedInvoiceJob, setSelectedInvoiceJob] = useState(null);

  // POS Checkout State
  const [paymentType, setPaymentType] = useState('full'); // 'full' or 'partial'
  const [amountToPay, setAmountToPay] = useState('');
  const [cashTendered, setCashTendered] = useState('');

  // Editable Fee Breakdown State
  const [editServiceFee, setEditServiceFee] = useState(2800);
  const [editLaborFee, setEditLaborFee] = useState(700);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState(null);

  const [registeredClients, setRegisteredClients] = useState([]);

  const parseVal = (valStr) => {
    if (typeof valStr === 'number') return valStr;
    if (!valStr) return 0;
    return parseFloat(valStr.toString().replace(/[^0-9.-]+/g, '') || 0);
  };

  const loadJobs = () => {
    const orders = getJobOrders();
    const validOrders = Array.isArray(orders) ? orders : [];
    setJobOrders((prev) => (JSON.stringify(prev) === JSON.stringify(validOrders) ? prev : validOrders));
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

  const openCheckoutModal = (job) => {
    if (!job) return;
    if (job.status !== 'COMPLETED' && job.status !== 'CANNOT-FIX') {
      alert('Cannot process payment: Vehicle repair is still in progress by technician.');
      return;
    }

    // Auto-unlock managerNotifiedCashier if Cashier initiates checkout directly
    if (!job.managerNotifiedCashier) {
      notifyCashierForBilling(job.id);
      job.managerNotifiedCashier = true;
    }

    setActiveCheckoutJob(job);

    const isUnfixable = job.status === 'CANNOT-FIX';
    const sFee = isUnfixable ? 0 : parseVal(job.serviceFee || '2800');
    const lFee = parseVal(job.laborFee || '700');
    const partsTotal = isUnfixable ? 0 : calculatePartsTotal(job.usedParts || []);
    const overallTotal = sFee + lFee + partsTotal;

    const prevPaid = parseVal(job.amountPaid || '0');
    const remBal = Math.max(0, overallTotal - prevPaid);

    setEditServiceFee(sFee);
    setEditLaborFee(lFee);
    setPaymentType('full');
    setAmountToPay(remBal.toString());
    setCashTendered(remBal.toString());
  };

  const handleConfirmCheckout = async (e) => {
    e.preventDefault();
    if (!activeCheckoutJob) return;

    const isUnfixable = activeCheckoutJob.status === 'CANNOT-FIX';
    const sFee = isUnfixable ? 0 : parseFloat(editServiceFee || 0);
    const lFee = parseFloat(editLaborFee || 0);
    const partsTotal = isUnfixable ? 0 : calculatePartsTotal(activeCheckoutJob.usedParts || []);

    if (lFee > sFee && !isUnfixable) {
      if (!window.confirm('Notice: Labor Fee is higher than the Service Fee. Do you want to proceed?')) {
        return;
      }
    }

    const overallTotal = sFee + lFee + partsTotal;
    const prevPaid = parseVal(activeCheckoutJob.amountPaid || '0');
    const remBal = Math.max(0, overallTotal - prevPaid);

    const numPayAmount = parseFloat(amountToPay || 0);

    if (numPayAmount <= 0) {
      alert('Please enter a valid Payment Amount greater than ₱0.00.');
      return;
    }

    if (numPayAmount > remBal + 0.01) {
      alert(`Payment amount (₱${numPayAmount.toLocaleString()}) cannot exceed the current remaining balance (₱${remBal.toLocaleString()}).`);
      return;
    }

    const numTendered = parseFloat(cashTendered || 0);

    if (numTendered < numPayAmount) {
      alert(`Cash tendered (₱${numTendered.toLocaleString()}) is insufficient to cover the Payment Amount (₱${numPayAmount.toLocaleString()}).`);
      return;
    }

    const changeDue = Math.max(0, numTendered - numPayAmount);

    // Process cash payment in store & store in MySQL database
    await processPaymentByCashier(
      activeCheckoutJob.id,
      user?.name || 'Lovielle Garay',
      {
        serviceFee: sFee,
        laborFee: lFee,
      },
      numPayAmount,
      numTendered,
      changeDue
    );
    loadJobs();

    const formattedTotal = `₱${overallTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const newTotalPaid = prevPaid + numPayAmount;
    const newBalance = Math.max(0, overallTotal - newTotalPaid);
    const isFullyPaid = newBalance <= 0.01;

    const settledJob = {
      ...activeCheckoutJob,
      invoiceStatus: isFullyPaid ? 'PAID' : 'PARTIAL',
      serviceFee: `₱${sFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      laborFee: `₱${lFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      totalPrice: formattedTotal,
      amountPaid: `₱${newTotalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      balance: `₱${(isFullyPaid ? 0 : newBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      payAmountThisTx: `₱${numPayAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      cashTendered: `₱${numTendered.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      changeDue: `₱${changeDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      paymentMethod: 'CASH',
      paymentTypeLabel: isFullyPaid ? 'FULL PAYMENT' : 'PARTIAL PAYMENT',
      cashierName: user?.name || 'Lovielle Garay',
    };

    setActiveCheckoutJob(null);
    setPaymentSuccessMsg(
      `${isFullyPaid ? 'Full' : 'Partial'} Cash payment of ₱${numPayAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} for Job #${activeCheckoutJob.id} (${activeCheckoutJob.clientName}) processed successfully!${!isFullyPaid ? ` Remaining balance: ₱${newBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : ''}`
    );

    // Automatically open thermal receipt modal
    setSelectedReceipt(settledJob);

    setTimeout(() => setPaymentSuccessMsg(null), 5000);
  };

  const safeOrders = Array.isArray(jobOrders) ? jobOrders : [];
  const pendingInvoices = safeOrders.filter((j) => j && j.invoiceStatus !== 'PAID');
  const paidInvoices = safeOrders.filter((j) => j && j.invoiceStatus === 'PAID');

  const readyToPayCount = pendingInvoices.filter((j) => j && (j.status === 'COMPLETED' || j.status === 'CANNOT-FIX') && j.managerNotifiedCashier).length;

  const filteredPosOrders = safeOrders.filter((job) => {
    if (!job) return false;
    const query = (posSearchTerm || '').toLowerCase().trim();
    if (!query) return true;
    return (
      (job.clientName || '').toLowerCase().includes(query) ||
      (job.vehicleName || '').toLowerCase().includes(query) ||
      (job.plateNumber || '').toLowerCase().includes(query) ||
      (job.serviceCategory || '').toLowerCase().includes(query) ||
      (job.status || '').toLowerCase().includes(query) ||
      (job.invoiceStatus || '').toLowerCase().includes(query) ||
      job.id.toString().includes(query)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between">
        <div className="space-y-2 text-center md:text-left">
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase">
            Cashier POS Terminal Counter
          </span>
          <h1 className="text-3xl font-extrabold">Cashier POS - {user?.name || user?.username || 'Lovielle Garay'}</h1>
          <p className="text-emerald-100 text-sm max-w-xl">
            Process full or partial client cash payments for completed repairs or diagnostic labor fees with real-time balance tracking.
          </p>
        </div>

        <div className="mt-6 md:mt-0 flex flex-wrap gap-3">
          <Link
            to="/cashier/history"
            className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center space-x-2"
          >
            <DollarSign className="h-4 w-4 text-emerald-700" />
            <span>Checkout Pay in Payments ({readyToPayCount})</span>
          </Link>
          <Link
            to="/cashier/history"
            className="bg-emerald-900/40 hover:bg-emerald-900/60 text-white border border-emerald-400/30 font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center space-x-2"
          >
            <FileText className="h-4 w-4 text-emerald-300" />
            <span>Payment History ({paidInvoices.length})</span>
          </Link>
        </div>
      </div>

      {paymentSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{paymentSuccessMsg}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <MetricCard
          title="Ready For Cashier Checkout"
          value={`${readyToPayCount} Bill(s) Ready`}
          icon={CheckCircle}
          color="bg-emerald-600"
        />
        <MetricCard
          title="Repairing / Awaiting Front Desk"
          value={`${Math.max(0, pendingInvoices.length - readyToPayCount)} Unnotified`}
          icon={Lock}
          color="bg-amber-600"
        />
        <MetricCard
          title="Registered Shop Clients"
          value={`${registeredClients.length} Clients`}
          icon={UserCheck}
          color="bg-blue-600"
        />
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
            <h2 className="text-lg font-bold text-gray-900">Client Billing Invoices & Balance Ledger</h2>
            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full shrink-0">
              {safeOrders.length} Invoices Recorded
            </span>
          </div>

          {/* POS Search Bar */}
          <div className="w-full sm:w-80">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={posSearchTerm}
                onChange={(e) => setPosSearchTerm(e.target.value)}
                placeholder="Search by client, plate, vehicle, invoice #..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Invoice ID</th>
                <th className="p-3">Client Name</th>
                <th className="p-3">Vehicle & Plate</th>
                <th className="p-3">Service Availed</th>
                <th className="p-3">Total Price</th>
                <th className="p-3">Amount Paid</th>
                <th className="p-3">Remaining Balance</th>
                <th className="p-3">Payment Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPosOrders.map((job) => {
                if (!job) return null;
                const isPaid = job.invoiceStatus === 'PAID';
                const isPartial = job.invoiceStatus === 'PARTIAL';
                const balNum = parseVal(job.balance || '0');

                return (
                  <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-gray-900">#RCT-00{job.id}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoiceJob(job)}
                        className="font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer block text-left"
                        title="Click to view Car Maintenance Invoice"
                      >
                        {job.clientName}
                      </button>
                      <p className="text-[10px] text-gray-400 font-mono">{job.clientCustomId || `CLT-${job.id}`}</p>
                    </td>
                    <td className="p-3 font-medium">
                      {job.vehicleName} (<span className="font-mono text-gray-500">{job.plateNumber}</span>)
                    </td>
                    <td className="p-3 font-bold text-purple-700">{job.serviceCategory}</td>

                    <td className="p-3 font-extrabold text-gray-900">{job.totalPrice}</td>
                    <td className="p-3 font-semibold text-emerald-700">{job.amountPaid || '₱0.00'}</td>
                    <td className="p-3 font-extrabold">
                      <span className={balNum > 0 ? 'text-red-600' : 'text-emerald-600'}>
                        {job.balance || '₱0.00'}
                      </span>
                    </td>

                    {/* Payment Status Badge */}
                    <td className="p-3">
                      <span className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase border ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isPartial
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}>
                        {job.invoiceStatus || 'UNPAID'}
                      </span>
                    </td>

                    {/* Invoice View & Process Payment Actions */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* View Invoice Document Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceJob(job)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center space-x-1 cursor-pointer shrink-0"
                          title="View official itemized Car Maintenance Invoice document"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>View Invoice</span>
                        </button>

                        {/* Payment Process Action */}
                        {isPaid ? (
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(job)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] px-3 py-1.5 rounded-xl border border-emerald-200 transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
                            title="Inspect settled thermal receipt"
                          >
                            <Eye className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Receipt</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openCheckoutModal(job)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center space-x-1 shrink-0 cursor-pointer"
                            title="Process full or partial cash payment"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            <span>{isPartial ? 'Pay Balance' : 'Process Payment'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPosOrders.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-xs bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 space-y-2 my-2">
            <Search className="h-8 w-8 text-gray-300 mx-auto" />
            <p className="font-bold text-gray-700 text-sm">No Records of Bill Found</p>
            <p className="text-gray-500">
              No matching billing records or client invoices found for "<span className="font-semibold text-gray-700">{posSearchTerm}</span>".
            </p>
          </div>
        )}
      </div>

      {/* MODERN CASHIER POS CHECKOUT MODAL (FULL OR PARTIAL PAYMENT) */}
      {activeCheckoutJob && (() => {
        const isUnfixable = activeCheckoutJob.status === 'CANNOT-FIX';
        const sFee = isUnfixable ? 0 : parseFloat(editServiceFee || 0);
        const lFee = parseFloat(editLaborFee || 0);
        const partsTotal = isUnfixable ? 0 : calculatePartsTotal(activeCheckoutJob.usedParts || []);

        const computedOverallTotal = sFee + lFee + partsTotal;
        const prevPaid = parseVal(activeCheckoutJob.amountPaid || '0');
        const remBal = Math.max(0, computedOverallTotal - prevPaid);

        const numPayAmount = parseFloat(amountToPay || 0);
        const numTendered = parseFloat(cashTendered || 0);
        const calculatedChange = Math.max(0, numTendered - numPayAmount);
        const newBalanceAfterPay = Math.max(0, remBal - numPayAmount);

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-fadeIn">
              {/* POS Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base uppercase">AutoCare POS Checkout Terminal</h3>
                    <p className="text-xs text-gray-500 font-mono">Register #01 • Cashier: {user?.name || 'Lovielle Garay'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCheckoutJob(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmCheckout} className="space-y-4">
                {/* Order Summary & Fee Breakdown Editor */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 shadow-inner">
                  <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                    <span className="text-gray-400 uppercase font-bold">Job Order #{activeCheckoutJob.id}</span>
                    <span className="bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-0.5 rounded text-[10px]">
                      CLIENT: {(activeCheckoutJob.clientName || '').toUpperCase()}
                    </span>
                  </div>

                  {activeCheckoutJob.status === 'CANNOT-FIX' && (
                    <div className="bg-red-500/20 border border-red-500/30 p-2.5 rounded-xl text-xs text-red-300 font-bold flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                      <span>UNFIXABLE VEHICLE: Service Fee ₱0.00 • Billed Diagnostic Labor Fee Only ({activeCheckoutJob.totalPrice})</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-400 text-[10px]">Vehicle & Plate</p>
                      <p className="font-bold text-white">{activeCheckoutJob.vehicleName} ({activeCheckoutJob.plateNumber})</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px]">Availed Service</p>
                      <p className="font-bold text-white">{activeCheckoutJob.serviceCategory}</p>
                    </div>
                  </div>

                  {/* Add-On Parts Replaced Display */}
                  {activeCheckoutJob.status !== 'CANNOT-FIX' && activeCheckoutJob.usedParts && activeCheckoutJob.usedParts.length > 0 && (
                    <div className="border-t border-slate-800 pt-2 space-y-1 text-xs">
                      <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center space-x-1">
                        <Package className="h-3.5 w-3.5" />
                        <span>Replaced Parts / Add-Ons Installed:</span>
                      </span>
                      <div className="space-y-1.5 pt-1">
                        {getItemizedPartsWithPrices(activeCheckoutJob.usedParts).map((partItem, idx) => (
                          <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
                            <div className="flex justify-between items-center text-[11px] font-bold text-white">
                              <span>✓ {partItem.name}</span>
                              <span className="text-gray-400 font-mono text-[10px]">{partItem.origPriceFormatted}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-extrabold text-emerald-400 pt-0.5">
                              <span>Quantity Purchased: {partItem.quantity}</span>
                              <span className="font-mono text-amber-400">{partItem.subtotalFormatted}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Editable Service & Labor Fee Breakdown */}
                  <div className="border-t border-slate-800 pt-3 space-y-2">
                    <p className="text-[10px] font-bold text-amber-400 uppercase flex items-center space-x-1">
                      <Edit3 className="h-3 w-3" />
                      <span>Adjust Service & Labor Fee Breakdown:</span>
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] text-gray-300 font-bold mb-1">Service Fee (Base Package)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          disabled={activeCheckoutJob.status === 'CANNOT-FIX'}
                          value={activeCheckoutJob.status === 'CANNOT-FIX' ? 0 : editServiceFee}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value || 0);
                            setEditServiceFee(val);
                            const pSum = calculatePartsTotal(activeCheckoutJob.usedParts || []);
                            const newTotal = val + parseFloat(editLaborFee || 0) + pSum;
                            const newBal = Math.max(0, newTotal - prevPaid);
                            if (paymentType === 'full') {
                              setAmountToPay(newBal.toString());
                              setCashTendered(newBal.toString());
                            }
                          }}
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 font-bold focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-amber-300 font-bold mb-1">Labor Fee (Work Charge)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={editLaborFee}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value || 0);
                            setEditLaborFee(val);
                            const pSum = activeCheckoutJob.status === 'CANNOT-FIX' ? 0 : calculatePartsTotal(activeCheckoutJob.usedParts || []);
                            const sVal = activeCheckoutJob.status === 'CANNOT-FIX' ? 0 : parseFloat(editServiceFee || 0);
                            const newTotal = sVal + val + pSum;
                            const newBal = Math.max(0, newTotal - prevPaid);
                            if (paymentType === 'full') {
                              setAmountToPay(newBal.toString());
                              setCashTendered(newBal.toString());
                            }
                          }}
                          className="w-full bg-slate-950 border border-slate-700 text-amber-400 rounded-xl px-3 py-1.5 font-bold focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Financial Balance Summary Box */}
                  <div className="border-t border-slate-800 pt-3 space-y-1">
                    <div className="flex justify-between items-center text-xs text-gray-300">
                      <span>Overall Total Price:</span>
                      <span className="font-mono font-bold text-white">₱{computedOverallTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {prevPaid > 0 && (
                      <div className="flex justify-between items-center text-xs text-emerald-400">
                        <span>Previously Paid:</span>
                        <span className="font-mono font-bold">₱{prevPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                      <span className="text-xs text-amber-300 uppercase font-bold">Current Balance Due:</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        ₱{remBal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* PAYMENT TYPE SELECTOR (FULL PAYMENT VS PARTIAL PAYMENT) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase">Payment Option</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentType('full');
                        setAmountToPay(remBal.toString());
                        setCashTendered(remBal.toString());
                      }}
                      className={`p-3 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                        paymentType === 'full'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                      <span>Full Payment (₱{remBal.toLocaleString()})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentType('partial');
                        const defaultPartial = Math.min(remBal, Math.round(remBal / 2));
                        setAmountToPay(defaultPartial.toString());
                        setCashTendered(defaultPartial.toString());
                      }}
                      className={`p-3 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                        paymentType === 'partial'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <DollarSign className="h-4 w-4" />
                      <span>Partial Payment</span>
                    </button>
                  </div>
                </div>

                {/* AMOUNT TO PAY INPUT */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      {paymentType === 'full' ? 'Full Payment Amount (₱)' : 'Partial Payment Amount to Collect (₱)'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      min="1"
                      max={remBal}
                      value={amountToPay}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAmountToPay(val);
                        setCashTendered(val);
                      }}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-base font-black text-gray-900 focus:outline-none focus:border-emerald-600 shadow-sm"
                    />
                    {paymentType === 'partial' && (
                      <div className="mt-2 text-[11px] font-bold text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 flex items-center justify-between">
                        <span>Remaining balance after this payment:</span>
                        <span className="font-mono text-sm text-red-600 font-black">
                          ₱{newBalanceAfterPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CASH TENDERED INPUT & CHANGE DUE */}
                  <div className="border-t border-slate-200 pt-3 space-y-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">Cash Received from Client (₱)</label>
                      <input
                        type="number"
                        step="any"
                        required
                        min={numPayAmount}
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        placeholder="Enter cash amount handed by client..."
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-base font-black text-emerald-800 focus:outline-none focus:border-emerald-600 shadow-sm"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase shrink-0">Presets:</span>
                      {[
                        numPayAmount,
                        500,
                        1000,
                        2000,
                        5000,
                      ]
                        .filter((amt) => amt >= numPayAmount)
                        .slice(0, 4)
                        .map((amt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCashTendered(amt.toString())}
                            className="bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-[11px] px-3 py-1 rounded-lg border border-gray-300 hover:border-emerald-500 transition-all cursor-pointer"
                          >
                            ₱{amt.toLocaleString()}
                          </button>
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
                      <span className="font-bold text-gray-600">Calculated Change Due:</span>
                      <span className="text-base font-black text-emerald-600 font-mono">
                        ₱{calculatedChange.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confirm POS Payment Button */}
                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setActiveCheckoutJob(null)}
                    className="px-5 py-3 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center space-x-2 cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Confirm {paymentType === 'full' ? 'Full' : 'Partial'} Payment & Print Receipt</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Mall Thermal Cash Register Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="relative">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute -top-10 -right-2 text-white/80 hover:text-white p-1 rounded-full bg-slate-800/80 transition-colors cursor-pointer"
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
                  <span>TRANSACTION:</span>
                  <span className="font-black text-emerald-800 uppercase">{selectedReceipt.paymentTypeLabel || (selectedReceipt.invoiceStatus === 'PAID' ? 'FULL PAYMENT' : 'PARTIAL PAYMENT')}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE/TIME:</span>
                  <span>{selectedReceipt.dateTime}</span>
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
                  <span className="font-bold">{(selectedReceipt.cashierName || user?.name || 'LOVIELLE GARAY').toUpperCase()}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-gray-400 my-2" />

              {/* Itemized Service, Labor & Spare Parts Fee Breakdown */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-[10px] text-gray-900 border-b border-gray-300 pb-1">
                  <span>ITEM / DESCRIPTION</span>
                  <span>AMOUNT</span>
                </div>

                <div className="flex justify-between text-gray-800">
                  <span className="truncate pr-2">1x SERVICE FEE ({selectedReceipt.serviceCategory ? selectedReceipt.serviceCategory.toUpperCase() : 'BASE'})</span>
                  <span>{selectedReceipt.status === 'CANNOT-FIX' ? '₱0.00 (UNFIXABLE)' : (selectedReceipt.serviceFee || '₱2,800.00')}</span>
                </div>

                <div className="flex justify-between text-gray-800 font-semibold">
                  <span className="truncate pr-2">1x LABOR CHARGE (WORK FEE)</span>
                  <span>{selectedReceipt.laborFee || '₱700.00'}</span>
                </div>

                {/* Replaced Spare Parts Itemized List */}
                {selectedReceipt.status !== 'CANNOT-FIX' && selectedReceipt.usedParts && selectedReceipt.usedParts.length > 0 && (
                  <div className="pt-1.5 text-[10px] text-gray-800 space-y-1.5 border-t border-dashed border-gray-400">
                    <span className="font-bold text-black uppercase block">REPLACED SPARE PARTS ADD-ONS:</span>
                    {getItemizedPartsWithPrices(selectedReceipt.usedParts).map((partItem, idx) => (
                      <div key={idx} className="pl-1 space-y-0.5 border-b border-dashed border-gray-200 pb-1">
                        <div className="flex justify-between font-bold text-[10px] text-black">
                          <span className="truncate pr-1">• {partItem.name}</span>
                          <span className="text-gray-600 font-mono font-normal">{partItem.origPriceFormatted}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-800 font-bold pl-2">
                          <span>Quantity: {partItem.quantity}</span>
                          <span className="font-mono text-black">{partItem.subtotalFormatted}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-b border-dashed border-gray-400 my-2" />

              {/* Financial Overall Totals */}
              <div className="space-y-1 text-[11px] font-bold">
                <div className="flex justify-between text-gray-700">
                  <span>OVERALL TOTAL PRICE:</span>
                  <span>{selectedReceipt.totalPrice}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-black">
                  <span>PAID THIS TRANSACTION:</span>
                  <span>{selectedReceipt.payAmountThisTx || selectedReceipt.amountPaid}</span>
                </div>
                <div className="flex justify-between text-gray-800">
                  <span>TOTAL PAID TO DATE:</span>
                  <span>{selectedReceipt.amountPaid}</span>
                </div>
                <div className="flex justify-between text-red-700 border-t border-b border-gray-800 py-1 my-1">
                  <span>REMAINING BALANCE DUE:</span>
                  <span>{selectedReceipt.balance || '₱0.00'}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>PAYMENT METHOD:</span>
                  <span>CASH</span>
                </div>
                {selectedReceipt.cashTendered && (
                  <div className="flex justify-between text-gray-700">
                    <span>CASH TENDERED:</span>
                    <span>{selectedReceipt.cashTendered}</span>
                  </div>
                )}
                {selectedReceipt.changeDue && (
                  <div className="flex justify-between text-gray-700">
                    <span>CHANGE DUE:</span>
                    <span>{selectedReceipt.changeDue}</span>
                  </div>
                )}
              </div>

              <div className="border-b border-dashed border-gray-400 my-3" />

              <div className="text-center space-y-1 text-[10px] text-gray-700">
                <p className="font-bold uppercase tracking-widest">*** THANK YOU! PLEASE COME AGAIN ***</p>
                <p className="text-[9px] text-gray-500">KEEP THIS RECEIPT FOR WARRANTY CLAIMS</p>
              </div>

              <div className="mt-4 pt-2 border-t border-dashed border-gray-300 flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs py-2 rounded shadow transition-all flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>PRINT RECEIPT</span>
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="flex-1 bg-gray-900 hover:bg-black text-white font-bold text-xs py-2 rounded shadow transition-all cursor-pointer"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CAR MAINTENANCE INVOICE MODAL */}
      {selectedInvoiceJob && (
        <CarMaintenanceInvoiceModal
          job={selectedInvoiceJob}
          onClose={() => setSelectedInvoiceJob(null)}
        />
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
