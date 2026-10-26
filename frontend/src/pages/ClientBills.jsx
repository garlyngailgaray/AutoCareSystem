import React, { useState, useEffect } from 'react';
import { getJobOrders } from '../utils/jobOrderStore';
import { getItemizedPartsWithPrices, calculatePartsTotal } from '../utils/autoPartsCatalog';
import {
  DollarSign,
  FileText,
  Eye,
  X,
  Printer,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Clock,
  Search,
  Package,
  ShieldCheck,
  Building,
  Info,
} from 'lucide-react';
import CarMaintenanceInvoiceModal from '../components/CarMaintenanceInvoiceModal';

export default function ClientBills({ user }) {
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [inspectPendingInvoice, setInspectPendingInvoice] = useState(null);
  const [selectedInvoiceJob, setSelectedInvoiceJob] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  const [searchTerm, setSearchTerm] = useState('');
  const [jobOrders, setJobOrders] = useState([]);

  const loadOrders = () => {
    const orders = getJobOrders();
    setJobOrders(orders);
  };

  useEffect(() => {
    loadOrders();
    window.addEventListener('autocare_jobs_updated', loadOrders);
    window.addEventListener('storage', loadOrders);
    const timer = setInterval(loadOrders, 3000);
    return () => {
      window.removeEventListener('autocare_jobs_updated', loadOrders);
      window.removeEventListener('storage', loadOrders);
      clearInterval(timer);
    };
  }, []);

  const username = (user?.username || '').toLowerCase();
  const name = (user?.name || '').toLowerCase();

  // Strict Client Isolation: Filter bills belonging ONLY to the logged-in client
  const myBills = jobOrders.filter((b) => {
    const bUser = (b.clientUsername || '').toLowerCase();
    const bName = (b.clientName || '').toLowerCase();

    if (username === 'clt-4' || name.includes('claire')) {
      return bUser === 'clt-4' || bName.includes('claire');
    }
    if (username === 'lucky_garay' || name.includes('lucky')) {
      return bUser === 'lucky_garay' || bName.includes('lucky');
    }
    if (username === 'clt_mikegerald303' || name.includes('mike')) {
      return bUser === 'clt_mikegerald303' || bName.includes('mike');
    }

    if (username && bUser === username) return true;
    if (name && name !== 'client' && (bName.includes(name) || name.includes(bName))) return true;

    return false;
  });

  const unpaidBills = myBills.filter((b) => b.invoiceStatus !== 'PAID');
  const paidBills = myBills.filter((b) => b.invoiceStatus === 'PAID');

  const unpaidBalance = unpaidBills.reduce(
    (sum, b) => sum + parseFloat((b.balance || '0').replace(/[^0-9.-]+/g, '') || 0),
    0
  );
  const totalPaidAmount = paidBills.reduce(
    (sum, b) => sum + parseFloat((b.amountPaid || '0').replace(/[^0-9.-]+/g, '') || 0),
    0
  );

  // Filter bills based on search query
  const query = searchTerm.toLowerCase();
  const filteredUnpaid = unpaidBills.filter((b) => {
    return (
      b.id.toString().includes(query) ||
      (b.serviceCategory || '').toLowerCase().includes(query) ||
      (b.vehicleName || '').toLowerCase().includes(query) ||
      (b.plateNumber || '').toLowerCase().includes(query)
    );
  });

  const filteredPaid = paidBills.filter((b) => {
    return (
      b.id.toString().includes(query) ||
      (b.serviceCategory || '').toLowerCase().includes(query) ||
      (b.vehicleName || '').toLowerCase().includes(query) ||
      (b.plateNumber || '').toLowerCase().includes(query) ||
      (b.dateTime || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Real-Time Billing Portal
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              {unpaidBills.length > 0 ? 'Pending Balance' : 'Account Good Standing'}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-2 flex items-center space-x-3">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <span>My Bills & Payment Portal</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Personal financial statement and official receipt records for <strong className="text-gray-900">{user?.name || user?.username || 'Client'}</strong>
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="w-full md:w-80 relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice #, vehicle, service..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 shadow-sm"
          />
        </div>
      </div>

      {/* Modern Financial Summary Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase">
            <span>Outstanding Balance</span>
            <Clock className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-3xl font-black text-red-600 font-mono">
            ₱{unpaidBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-red-500 font-bold block">
            {unpaidBills.length} Unpaid Bill(s) Pending
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase">
            <span>Total Lifetime Paid</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-emerald-600 font-mono">
            ₱{totalPaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-emerald-600 font-bold block">
            {paidBills.length} Settled Transactions
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase">
            <span>Payment Location</span>
            <Building className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-base font-extrabold text-gray-900 leading-tight">
            Front Desk Cashier Counter
          </p>
          <span className="text-xs text-gray-500 font-medium block">
            Register #01 • Cash Only
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase">
            <span>Account Status</span>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </div>
          <p className={`text-xl font-extrabold ${unpaidBills.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {unpaidBills.length > 0 ? 'Action Required' : 'All Settled'}
          </p>
          <span className="text-xs text-gray-500 font-medium block">
            {unpaidBills.length > 0 ? 'Pay balance upon vehicle pickup' : 'No overdue accounts'}
          </span>
        </div>
      </div>

      {/* Unpaid Warning Banner */}
      {unpaidBills.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-950 rounded-2xl text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-100 text-red-600 rounded-xl shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-red-900">Outstanding Balance Awaiting Settlement</p>
              <p className="text-xs text-red-800 font-medium">
                You have <strong>{unpaidBills.length} unpaid bill(s)</strong> totaling <strong className="text-red-900">₱{unpaidBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>. Please settle payment at the Front Desk Cashier counter when collecting your vehicle.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('pending')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md shrink-0 text-xs"
          >
            View Outstanding Bills ({unpaidBills.length})
          </button>
        </div>
      )}

      {/* SEPARATED SECTION NAVIGATION TABS */}
      <div className="bg-white rounded-3xl border border-gray-100 p-2 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'pending'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/25 scale-[1.02]'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>1. Pending Unpaid Bills ({unpaidBills.length})</span>
            {unpaidBills.length > 0 && (
              <span className="bg-white text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-1">
                ₱{unpaidBalance.toLocaleString()}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 scale-[1.02]'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>2. Payment & Receipts History ({paidBills.length})</span>
          </button>
        </div>

        <div className="text-xs text-gray-500 font-semibold px-4 hidden md:block">
          Showing {activeTab === 'pending' ? 'Unpaid Outstanding Statements' : 'Settled Official Receipts'}
        </div>
      </div>

      {/* TAB 1: PENDING UNPAID BILLS SECTION */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center space-x-2">
                <Clock className="h-5 w-5 text-red-600" />
                <span>Pending Unpaid Statements ({filteredUnpaid.length})</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Work orders completed or serviced by technicians awaiting cashier payment at Front Desk
              </p>
            </div>

            <span className="text-xs font-mono font-bold bg-red-50 text-red-800 px-3 py-1 rounded-full border border-red-200">
              UNPAID INVOICES
            </span>
          </div>

          <div className="space-y-4">
            {filteredUnpaid.map((bill) => {
              const isUnfixable = bill.status === 'CANNOT-FIX';
              const partsTotal = isUnfixable ? 0 : calculatePartsTotal(bill.usedParts || []);

              return (
                <div
                  key={bill.id}
                  className="bg-white rounded-2xl border border-red-200/80 hover:border-red-400 p-6 shadow-sm transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-extrabold text-gray-900 text-base">
                            Invoice #INV-00{bill.id}
                          </h3>
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                            bill.invoiceStatus === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {bill.invoiceStatus || 'UNPAID'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Date: <span className="font-mono text-gray-700 font-semibold">{bill.dateTime}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-gray-400 font-bold block uppercase">Total Balance Due</span>
                      <span className="text-2xl font-black text-red-600 font-mono">{bill.balance}</span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-gray-50 p-4 rounded-2xl">
                    <div>
                      <span className="text-gray-400 text-[10px] font-bold uppercase block">Vehicle Info</span>
                      <span className="font-bold text-gray-900 text-sm">{bill.vehicleName}</span>
                      <span className="font-mono text-gray-600 block">Plate: {bill.plateNumber}</span>
                    </div>

                    <div>
                      <span className="text-gray-400 text-[10px] font-bold uppercase block">Service Package</span>
                      <span className="font-bold text-purple-800 text-sm">{bill.serviceCategory}</span>
                      <span className="text-gray-500 block">Tech: {bill.assignedMechanic || 'Dave Garay'}</span>
                    </div>

                    <div>
                      <span className="text-gray-400 text-[10px] font-bold uppercase block">Charge Summary</span>
                      <div className="space-y-0.5 font-semibold text-gray-700">
                        <p>Base Service: <strong className="text-gray-900">{bill.serviceFee || '₱2,800.00'}</strong></p>
                        <p>Labor Fee: <strong className="text-gray-900">{bill.laborFee || '₱700.00'}</strong></p>
                        {partsTotal > 0 && (
                          <p>Parts Add-Ons: <strong className="text-emerald-700">₱{partsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Payment Guidance */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="flex items-center space-x-2 text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 w-full sm:w-auto">
                      <Info className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Please present Invoice <strong>#INV-00{bill.id}</strong> to Cashier Register #01 upon vehicle pickup.</span>
                    </div>

                    <button
                      onClick={() => setSelectedInvoiceJob(bill)}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 shrink-0"
                    >
                      <FileText className="h-4 w-4" />
                      <span>View Official Invoice</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredUnpaid.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-xs bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
                <p className="font-bold text-gray-700 text-sm">No Pending Unpaid Bills Found</p>
                <p className="text-gray-500">All vehicle repair statements for your account are fully settled and paid.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT & RECEIPTS HISTORY SECTION */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <span>Settled Payment & Official Receipts History ({filteredPaid.length})</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Verified paid statements with printable official thermal receipts and warranty references
              </p>
            </div>

            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
              SETTLED RECEIPTS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="p-3.5">Official Receipt</th>
                  <th className="p-3.5">Service & Vehicle</th>
                  <th className="p-3.5">Settlement Date</th>
                  <th className="p-3.5">Service Fee</th>
                  <th className="p-3.5">Labor Charge</th>
                  <th className="p-3.5">Total Amount Paid</th>
                  <th className="p-3.5">Cashier</th>
                  <th className="p-3.5 text-right">Receipt Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPaid.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-gray-900">
                      <span className="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg text-xs">
                        #RCT-00{receipt.id}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-gray-900 text-xs">{receipt.serviceCategory}</p>
                      <p className="text-[11px] text-gray-500">{receipt.vehicleName} ({receipt.plateNumber})</p>
                    </td>
                    <td className="p-3.5 font-mono text-gray-700 font-semibold">
                      {receipt.dateTime}
                    </td>
                    <td className="p-3.5">{receipt.serviceFee}</td>
                    <td className="p-3.5">{receipt.laborFee}</td>
                    <td className="p-3.5 font-black text-emerald-600 text-sm font-mono">
                      {receipt.amountPaid || receipt.totalPrice}
                    </td>
                    <td className="p-3.5 font-semibold text-gray-800">
                      {receipt.cashierName || 'Lovielle Garay'}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedInvoiceJob(receipt)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 inline-flex items-center space-x-1.5"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>View Invoice</span>
                        </button>
                        <button
                          onClick={() => setSelectedReceipt(receipt)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 inline-flex items-center space-x-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Official Receipt</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPaid.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-xs bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              No settled receipts found matching "<span className="font-semibold text-gray-700">{searchTerm}</span>".
            </div>
          )}
        </div>
      )}

      {/* INSPECT PENDING INVOICE MODAL */}
      {inspectPendingInvoice && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base uppercase">Pending Statement Breakdown</h3>
                  <p className="text-xs text-gray-500 font-mono">Invoice #INV-00{inspectPendingInvoice.id} • {inspectPendingInvoice.vehicleName}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectPendingInvoice(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Summary Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                <span className="text-gray-400 uppercase font-bold">Service Package</span>
                <span className="text-purple-400 font-bold">{inspectPendingInvoice.serviceCategory}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-400 text-[10px]">Vehicle</p>
                  <p className="font-bold text-white">{inspectPendingInvoice.vehicleName} ({inspectPendingInvoice.plateNumber})</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px]">Status</p>
                  <p className="font-bold text-red-400">UNPAID (AWAITING CASHIER)</p>
                </div>
              </div>

              {/* Itemized Parts */}
              {inspectPendingInvoice.status !== 'CANNOT-FIX' && inspectPendingInvoice.usedParts && inspectPendingInvoice.usedParts.length > 0 && (
                <div className="border-t border-slate-800 pt-3 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center space-x-1">
                    <Package className="h-3.5 w-3.5" />
                    <span>Installed Replacement Spare Parts:</span>
                  </span>
                  <div className="space-y-1 pt-1">
                    {getItemizedPartsWithPrices(inspectPendingInvoice.usedParts).map((partItem, idx) => (
                      <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-[11px] text-white">
                        <span>✓ {partItem.name} ({partItem.quantity}x)</span>
                        <span className="font-mono text-amber-400">{partItem.subtotalFormatted.split(': ')[1] || partItem.unitPriceFormatted}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
                <span className="text-xs text-gray-300 uppercase font-bold">Total Amount Due</span>
                <span className="text-2xl font-black text-red-400 font-mono">{inspectPendingInvoice.balance || inspectPendingInvoice.totalPrice}</span>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1 font-medium">
              <p className="font-bold flex items-center space-x-1 text-amber-800">
                <Info className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Cashier Payment Instructions:</span>
              </p>
              <p className="pl-5 text-amber-800 text-[11px]">
                Please visit the AutoCare Front Desk Cashier counter to settle payment by Cash. Once payment is received, your official receipt will be generated and made available here.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setInspectPendingInvoice(null)}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-2xl text-xs transition-all"
              >
                Close Statement Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MALL THERMAL CASH REGISTER RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="relative animate-fadeIn">
            {/* Close Button Floating Outside Slip */}
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute -top-10 -right-2 text-white/80 hover:text-white p-1 rounded-full bg-slate-800/80 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Thermal Receipt Paper Slip */}
            <div className="w-80 bg-[#fffdf0] text-gray-900 font-mono text-[11px] p-6 shadow-2xl rounded-sm border border-gray-300 relative select-none leading-relaxed">
              {/* Receipt Top Header */}
              <div className="text-center space-y-1 mb-3">
                <img src="/AutoCareLogo.png" alt="AutoCare Logo" className="h-9 w-auto mx-auto object-contain mb-1 filter grayscale" />
                <h2 className="font-bold text-sm tracking-wider uppercase text-black">AUTOCARE SYSTEM</h2>
                <p className="text-[10px] text-gray-700">Purok Sta. Cruz, Villalimpia</p>
                <p className="text-[10px] text-gray-700">Loay, Bohol - Tel: 09093671998</p>
                <p className="text-[10px] text-gray-600">VAT REG TIN: 123-456-789-000</p>
              </div>

              {/* Dotted Separator */}
              <div className="border-b border-dashed border-gray-400 my-2" />

              {/* Receipt Header Metadata */}
              <div className="space-y-0.5 text-[10px] text-gray-800">
                <div className="flex justify-between">
                  <span>OFFICIAL RECEIPT:</span>
                  <span className="font-bold">#RCT-00{selectedReceipt.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE/TIME:</span>
                  <span>{selectedReceipt.dateTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>CLIENT:</span>
                  <span className="font-bold">{(user?.name || selectedReceipt.clientName).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>VEHICLE:</span>
                  <span>{selectedReceipt.vehicleName.toUpperCase()} ({selectedReceipt.plateNumber})</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span className="font-bold">{(selectedReceipt.cashierName || 'LOVIELLE GARAY').toUpperCase()}</span>
                </div>
              </div>

              {/* Dotted Separator */}
              <div className="border-b border-dashed border-gray-400 my-2" />

              {/* Itemized Services Breakdown Table */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-[10px] text-gray-900 border-b border-gray-300 pb-1">
                  <span>ITEM / DESCRIPTION</span>
                  <span>AMOUNT</span>
                </div>

                <div className="flex justify-between text-gray-800">
                  <span className="truncate pr-2">1x {selectedReceipt.serviceCategory.toUpperCase()}</span>
                  <span>{selectedReceipt.serviceFee}</span>
                </div>

                <div className="flex justify-between text-gray-800">
                  <span className="truncate pr-2">1x LABOR CHARGE</span>
                  <span>{selectedReceipt.laborFee}</span>
                </div>

                {selectedReceipt.status !== 'CANNOT-FIX' && selectedReceipt.usedParts && selectedReceipt.usedParts.length > 0 && (
                  <div className="pt-1.5 space-y-1 border-t border-dashed border-gray-300 mt-1">
                    <div className="text-[9px] font-bold text-gray-800 uppercase">
                      REPLACED SPARE PARTS / ADD-ONS:
                    </div>
                    {getItemizedPartsWithPrices(selectedReceipt.usedParts).map((partItem, pIdx) => (
                      <div key={pIdx} className="flex justify-between text-gray-800 text-[10px]">
                        <span className="truncate pr-2">• {partItem.formattedLabel.toUpperCase()}</span>
                        <span>{partItem.subtotalFormatted.split(': ')[1] || partItem.unitPriceFormatted}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dotted Separator */}
              <div className="border-b border-dashed border-gray-400 my-2" />

              {/* Financial Totals */}
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
                  <span>{selectedReceipt.amountPaid}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>PAYMENT METHOD:</span>
                  <span>CASH</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>CHANGE DUE:</span>
                  <span>₱0.00</span>
                </div>
              </div>

              {/* Dotted Separator */}
              <div className="border-b border-dashed border-gray-400 my-3" />

              {/* Footer Thermal Text */}
              <div className="text-center space-y-1 text-[10px] text-gray-700">
                <p className="font-bold uppercase tracking-widest">*** THANK YOU! PLEASE COME AGAIN ***</p>
                <p className="text-[9px] text-gray-500">KEEP THIS RECEIPT FOR WARRANTY CLAIMS</p>
              </div>

              {/* Receipt Action Buttons */}
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
