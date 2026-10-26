import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getJobOrders, processPaymentByCashier, notifyCashierForBilling } from '../../utils/jobOrderStore';
import { getItemizedPartsWithPrices, calculatePartsTotal } from '../../utils/autoPartsCatalog';
import {
  FileText,
  Eye,
  Search,
  Printer,
  X,
  UserCheck,
  DollarSign,
  Package,
  CheckCircle,
  CreditCard,
  Wallet,
  ShieldCheck,
  Clock,
  Lock,
  Edit3,
  AlertTriangle,
  Check,
} from 'lucide-react';
import CarMaintenanceInvoiceModal from '../../components/CarMaintenanceInvoiceModal';

export default function PaymentHistory({ user }) {
  const [activeTab, setActiveTab] = useState('checkout'); // 'checkout' or 'history'
  const [searchTerm, setSearchTerm] = useState('');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [jobOrders, setJobOrders] = useState([]);
  const [selectedClientHistory, setSelectedClientHistory] = useState(null);
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

  const parseVal = (valStr) => {
    if (typeof valStr === 'number') return valStr;
    if (!valStr) return 0;
    return parseFloat(valStr.toString().replace(/[^0-9.-]+/g, '') || 0);
  };

  const loadOrders = () => {
    const orders = getJobOrders();
    const validOrders = Array.isArray(orders) ? orders : [];
    setJobOrders((prev) => (JSON.stringify(prev) === JSON.stringify(validOrders) ? prev : validOrders));
  };

  useEffect(() => {
    loadOrders();
    window.addEventListener('storage', loadOrders);
    window.addEventListener('autocare_jobs_updated', loadOrders);
    const timer = setInterval(loadOrders, 2000);
    return () => {
      window.removeEventListener('storage', loadOrders);
      window.removeEventListener('autocare_jobs_updated', loadOrders);
      clearInterval(timer);
    };
  }, []);

  const openCheckoutModal = (job) => {
    if (!job) return;
    if (job.status !== 'COMPLETED' && job.status !== 'CANNOT-FIX') {
      alert('Cannot process payment: Vehicle repair is still in progress by technician.');
      return;
    }

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
    loadOrders();

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

    setSelectedReceipt(settledJob);

    setTimeout(() => setPaymentSuccessMsg(null), 5000);
  };

  const pendingBills = jobOrders.filter((j) => j && j.invoiceStatus !== 'PAID');
  const paidBills = jobOrders.filter((j) => j && (j.invoiceStatus === 'PAID' || parseVal(j.amountPaid || '0') > 0));

  const filteredPendingBills = pendingBills.filter((b) => {
    const query = searchTerm.toLowerCase();
    return (
      (b.clientName || '').toLowerCase().includes(query) ||
      (b.vehicleName || '').toLowerCase().includes(query) ||
      (b.plateNumber || '').toLowerCase().includes(query) ||
      (b.serviceCategory || '').toLowerCase().includes(query) ||
      b.id.toString().includes(query)
    );
  });

  // Group paid/settled receipts by unique client so names are NOT repeated
  const groupedClientsMap = {};
  paidBills.forEach((item) => {
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
        (r.serviceCategory || '').toLowerCase().includes(query) ||
        (r.problemDescription || '').toLowerCase().includes(query) ||
        (r.dateTime || '').toLowerCase().includes(query) ||
        r.id.toString().includes(query)
    );
    return matchesName || matchesId || matchesVehicle || matchesRecord;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <CreditCard className="h-6 w-6 text-emerald-600" />
            <span>Cashier Payments & POS Checkout</span>
          </h1>
          <p className="text-sm text-gray-500">
            Process full or partial cash checkout payments for pending vehicle repairs and inspect transaction receipts
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
              placeholder="Search client, vehicle, plate, invoice..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 shadow-sm"
            />
          </div>
        </div>
      </div>

      {paymentSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{paymentSuccessMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 space-x-4">
        <button
          onClick={() => setActiveTab('checkout')}
          className={`pb-3 px-1 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'checkout'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>POS Checkout Pay ({pendingBills.length} Unpaid)</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-1 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Settled Payment History ({filteredClients.length} Clients)</span>
        </button>
      </div>

      {/* TAB 1: POS CHECKOUT PAY (PENDING & PARTIAL PAYMENTS) */}
      {activeTab === 'checkout' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-emerald-600 shrink-0" />
              <h2 className="text-base font-bold text-gray-900">Pending Bills Ready for POS Checkout Payment</h2>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {pendingBills.length} Unpaid / Partial Invoices
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Bill ID</th>
                  <th className="p-3">Client Name</th>
                  <th className="p-3">Vehicle Details</th>
                  <th className="p-3">Service Category</th>
                  <th className="p-3">Total Price</th>
                  <th className="p-3">Amount Paid</th>
                  <th className="p-3">Remaining Balance</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3 text-right">POS Checkout Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPendingBills.map((b) => {
                  const isPartial = b.invoiceStatus === 'PARTIAL';
                  const balNum = parseVal(b.balance || '0');

                  return (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-gray-900">#RCT-00{b.id}</td>
                      <td className="p-3 font-bold text-gray-900">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceJob(b)}
                          className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer text-left"
                          title="Click to view Car Maintenance Invoice"
                        >
                          {b.clientName}
                        </button>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-gray-900">{b.vehicleName}</p>
                        <p className="text-[11px] font-mono text-gray-500">{b.plateNumber}</p>
                      </td>
                      <td className="p-3 font-medium text-gray-900">{b.serviceCategory}</td>

                      <td className="p-3 font-extrabold text-gray-900">{b.totalPrice}</td>
                      <td className="p-3 font-semibold text-emerald-700">{b.amountPaid || '₱0.00'}</td>
                      <td className="p-3 font-extrabold">
                        <span className={balNum > 0 ? 'text-red-600' : 'text-emerald-600'}>
                          {b.balance || '₱0.00'}
                        </span>
                      </td>

                      {/* Payment Status Badge */}
                      <td className="p-3">
                        <span className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase border ${
                          isPartial
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                          {b.invoiceStatus || 'UNPAID'}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceJob(b)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer shrink-0"
                            title="View itemized invoice breakdown, service category & add-on parts"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>View Invoice</span>
                          </button>

                          {b.invoiceStatus === 'PAID' ? (
                            <span className="bg-emerald-50 text-emerald-800 font-bold text-[10px] px-3 py-1.5 rounded-lg border border-emerald-200 shrink-0">
                              PAID
                            </span>
                          ) : b.status === 'COMPLETED' || b.status === 'CANNOT-FIX' ? (
                            <button
                              type="button"
                              onClick={() => openCheckoutModal(b)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-4 py-2 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>{isPartial ? 'Pay Balance' : 'POS Checkout Pay'}</span>
                            </button>
                          ) : (
                            <button
                              disabled
                              className="bg-amber-50 text-amber-800 font-bold text-[10px] px-3 py-2 rounded-lg transition-all flex items-center space-x-1 cursor-not-allowed border border-amber-200 shrink-0"
                              title="Vehicle repair is currently in progress by technician"
                            >
                              <Clock className="h-3 w-3 text-amber-600" />
                              <span>Repair In-Progress</span>
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

          {filteredPendingBills.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-xs bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 space-y-2 my-2">
              <Search className="h-8 w-8 text-gray-300 mx-auto" />
              <p className="font-bold text-gray-700 text-sm">No Unpaid Bills Awaiting POS Checkout</p>
              <p className="text-gray-500">
                All client invoices are fully settled or no unpaid bills match "<span className="font-semibold text-gray-700">{searchTerm}</span>".
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SETTLED PAYMENT HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Client ID</th>
                  <th className="p-3">Client Name</th>
                  <th className="p-3">Associated Vehicles</th>
                  <th className="p-3">Total Settled Bills</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map((client) => {
                  const vehiclesArray = Array.from(client.vehiclesSet);
                  return (
                    <tr key={client.key} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-emerald-600">{client.clientCustomId}</td>
                      <td className="p-3 font-extrabold text-gray-900 text-sm">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceJob(client.records[0])}
                          className="font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer text-left"
                          title="Click to view Car Maintenance Invoice"
                        >
                          {client.clientName}
                        </button>
                      </td>
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
                        <span className="bg-emerald-100 text-emerald-900 font-extrabold px-2.5 py-0.5 rounded-full text-[11px]">
                          {client.records.length} Recorded Payment(s)
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedClientHistory(client);
                            setModalSearchTerm('');
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20 inline-flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Payment History</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-xs bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 space-y-2 my-2">
              <Search className="h-8 w-8 text-gray-300 mx-auto" />
              <p className="font-bold text-gray-700 text-sm">No Records of Settled Bill Found</p>
              <p className="text-gray-500">
                No settled client payment records found matching "<span className="font-semibold text-gray-700">{searchTerm}</span>".
              </p>
            </div>
          )}
        </div>
      )}

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

      {/* MODAL: VIEW ALL SETTLED PAYMENT RECEIPTS FOR SELECTED CLIENT */}
      {selectedClientHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{selectedClientHistory.clientName}</h3>
                  <p className="text-xs text-gray-500 font-mono">
                    Client ID: {selectedClientHistory.clientCustomId} • {selectedClientHistory.records.length} Recorded Transaction(s)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedClientHistory(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* TOTAL CLIENT BILLS SUMMARY BANNER */}
            {(() => {
              const modalTotalAmount = selectedClientHistory.records.reduce((sum, job) => {
                const priceNum = parseVal(job.amountPaid || job.totalPrice);
                return sum + priceNum;
              }, 0);
              const modalTotalFormatted = `₱${modalTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

              return (
                <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between border border-emerald-700/50">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                      Client Billing Financial Summary
                    </span>
                    <p className="text-xs text-emerald-100 font-medium">
                      Total payments collected for <strong className="text-white">{selectedClientHistory.clientName}</strong>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-emerald-300 uppercase block">Total Amount Paid</span>
                    <span className="text-xl font-black text-emerald-300 font-mono">{modalTotalFormatted}</span>
                  </div>
                </div>
              );
            })()}

            {/* Search Input Bar Inside Modal */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={modalSearchTerm}
                onChange={(e) => setModalSearchTerm(e.target.value)}
                placeholder="Search within this client's payment records..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 shadow-sm"
              />
            </div>

            {/* List of Invoices for this Client */}
            <div className="space-y-4 text-xs">
              {selectedClientHistory.records
                .filter((job) => {
                  const query = modalSearchTerm.toLowerCase();
                  return (
                    (job.serviceCategory || '').toLowerCase().includes(query) ||
                    (job.vehicleName || '').toLowerCase().includes(query) ||
                    (job.plateNumber || '').toLowerCase().includes(query) ||
                    (job.cashierName || '').toLowerCase().includes(query) ||
                    (job.dateTime || '').toLowerCase().includes(query) ||
                    (job.usedParts && job.usedParts.some((p) => p.toLowerCase().includes(query))) ||
                    job.id.toString().includes(query)
                  );
                })
                .map((job) => (
                  <div key={job.id} className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-emerald-700 text-xs bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                        Official Receipt #RCT-00{job.id}
                      </span>
                      <h4 className="font-extrabold text-gray-900 text-sm">{job.serviceCategory}</h4>
                    </div>

                    <span className={`border font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase ${
                      job.invoiceStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {job.invoiceStatus || 'UNPAID'} • {job.amountPaid || job.totalPrice} PAID
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Vehicle Details</span>
                      <p className="font-bold text-gray-900">{job.vehicleName} (Plate: {job.plateNumber})</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Payment Timestamp</span>
                      <p className="font-mono font-semibold text-gray-800">{job.dateTime}</p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200 grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Overall Total</span>
                      <p className="font-bold text-gray-900">{job.totalPrice}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Amount Paid</span>
                      <p className="font-bold text-emerald-600">{job.amountPaid || '₱0.00'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Remaining Balance</span>
                      <p className="font-bold text-red-600">{job.balance || '₱0.00'}</p>
                    </div>
                  </div>

                  {job.usedParts && job.usedParts.length > 0 && (
                    <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1">
                      <span className="text-[10px] font-bold text-amber-900 uppercase flex items-center space-x-1">
                        <Package className="h-3.5 w-3.5 text-amber-600" />
                        <span>Add-On Spare Parts Purchased:</span>
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
                    <span>Cashier: <strong className="text-gray-900">{job.cashierName || 'Lovielle Garay'}</strong></span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedInvoiceJob(job)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 shadow-sm cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Car Invoice</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReceipt(job);
                          setSelectedClientHistory(null);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1 shadow-sm cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect Receipt</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedClientHistory(null)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Close History
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
                  <span className="truncate pr-2">1x SERVICE FEE ({selectedReceipt.serviceCategory ? selectedReceipt.serviceCategory.toUpperCase() : 'BASE'})</span>
                  <span>{selectedReceipt.status === 'CANNOT-FIX' ? '₱0.00 (UNFIXABLE)' : (selectedReceipt.serviceFee || '₱2,800.00')}</span>
                </div>

                <div className="flex justify-between text-gray-800 font-semibold">
                  <span className="truncate pr-2">1x LABOR CHARGE (WORK FEE)</span>
                  <span>{selectedReceipt.laborFee || '₱700.00'}</span>
                </div>

                {selectedReceipt.status !== 'CANNOT-FIX' && selectedReceipt.usedParts && selectedReceipt.usedParts.length > 0 && (
                  <div className="pt-1.5 text-[10px] text-gray-800 space-y-1.5 border-t border-dashed border-gray-400">
                    <span className="font-bold text-black uppercase block">REPLACED SPARE PARTS ADD-ONS:</span>
                    {getItemizedPartsWithPrices(selectedReceipt.usedParts).map((partItem, idx) => (
                      <div key={idx} className="pl-1 space-y-0.5 border-b border-dashed border-gray-200 pb-1">
                        <div className="flex justify-between font-bold text-[10px] text-black">
                          <span className="truncate pr-1">• {partItem.name}</span>
                          <span className="text-gray-600 font-mono text-[10px]">{partItem.origPriceFormatted}</span>
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
