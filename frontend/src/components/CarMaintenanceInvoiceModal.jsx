import React from 'react';
import { X, Printer, Zap } from 'lucide-react';
import { getItemizedPartsWithPrices } from '../utils/autoPartsCatalog';
import { getUserAccounts } from '../utils/userAccountsStore';

export default function CarMaintenanceInvoiceModal({ job, onClose }) {
  if (!job) return null;

  // Retrieve exact matching client account from user store
  const allUsers = getUserAccounts();
  const clientAccount = allUsers.find((u) => {
    if (!u) return false;
    if (job.clientUsername && u.username && u.username.toLowerCase() === job.clientUsername.toLowerCase()) return true;
    if (job.clientCustomId && u.customId && u.customId.toLowerCase() === job.clientCustomId.toLowerCase()) return true;
    if (job.clientName && u.name && u.name.toLowerCase().trim() === job.clientName.toLowerCase().trim()) return true;
    if (job.clientName && u.name && (u.name.toLowerCase().includes(job.clientName.toLowerCase()) || job.clientName.toLowerCase().includes(u.name.toLowerCase()))) return true;
    return false;
  });

  // Client Info Resolution
  const clientName = job.clientName || clientAccount?.name || 'John Smith';
  const clientAddress = job.clientAddress || clientAccount?.address || 'Purok Sta. Cruz, Loay, Bohol';
  const clientPhone = job.clientPhone || clientAccount?.phone || '09093671998';
  const clientEmail = job.clientEmail || clientAccount?.email || `${(job.clientUsername || 'john.smith').toLowerCase().replace(/\s+/g, '')}@gmail.com`;
  const vehicleName = job.vehicleName || 'Toyota Camry';
  const plateNumber = job.plateNumber || 'ABC123';
  const odometer = job.odometer || '65,120 km';
  const serviceAdvisor = job.assignedMechanic || 'Dave Garay';

  // Parse numerical amounts
  const parseNum = (valStr) => {
    if (typeof valStr === 'number') return valStr;
    if (!valStr) return 0;
    return parseFloat(valStr.toString().replace(/[^0-9.-]+/g, '') || 0);
  };

  const isUnfixable = job.status === 'CANNOT-FIX';
  const serviceFeeNum = isUnfixable ? 0 : parseNum(job.serviceFee || '2800');
  const laborFeeNum = parseNum(job.laborFee || '700');

  const itemizedParts = isUnfixable ? [] : getItemizedPartsWithPrices(job.usedParts || []);
  const partsSumNum = itemizedParts.reduce((sum, item) => sum + (item.subtotalNum || 0), 0);

  const totalAmountNum = serviceFeeNum + laborFeeNum + partsSumNum;

  // Subtotal without VAT (12% tax)
  const subtotalWithoutVat = totalAmountNum / 1.12;
  const vatAmount = totalAmountNum - subtotalWithoutVat;

  const currencySymbol = '₱';

  const formatMoney = (amount) => {
    return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handlePrint = () => {
    window.print();
  };

  // Date formatting
  const rawDate = job.dateTime ? job.dateTime.split(' ')[0] : new Date().toISOString().split('T')[0];
  const invoiceDateStr = rawDate;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 overflow-y-auto p-4 sm:p-8 flex justify-center items-start min-h-screen">
      {/* Print-specific style override */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-car-invoice, #printable-car-invoice * {
            visibility: visible;
          }
          #printable-car-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none;
            border: none;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* MODAL WRAPPER CONTAINER */}
      <div className="relative max-w-4xl w-full my-4 space-y-4">

        {/* TOP CONTROLS BAR (Positioned completely ABOVE the invoice paper with clear gap) */}
        <div className="no-print flex items-center justify-between bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl border border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Official Invoice View
            </span>
            <span className="text-xs text-slate-300 font-mono font-semibold">#INV-2026-0{job.id}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print / Download PDF</span>
              <span className="sm:hidden">Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <X className="h-4 w-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* INVOICE PAPER CONTAINER (Starts cleanly below the top controls bar) */}
        <div
          id="printable-car-invoice"
          className="bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-3xl border border-slate-200 font-sans space-y-8 text-xs sm:text-sm"
        >
          {/* 1. HEADER TITLE & LOGO */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight leading-tight">
                CAR MAINTENANCE INVOICE
              </h1>
            </div>

            {/* Logo area */}
            <div className="flex items-center space-x-2 text-indigo-900">
              <Zap className="h-6 w-6 text-indigo-600 fill-indigo-600" />
              <span className="text-xl font-extrabold tracking-tight lowercase">enerpize</span>
            </div>
          </div>

          {/* 2. BUSINESS DETAILS */}
          <div className="space-y-1 text-slate-700 text-xs sm:text-sm">
            <p>
              <strong className="text-slate-900">Business Name:</strong> AutoCare Service Center
            </p>
            <p>
              <strong className="text-slate-900">ABN / TIN:</strong> 123-456-789-000
            </p>
            <p>
              <strong className="text-slate-900">Business Address:</strong> Purok Sta. Cruz, Villalimpia, Loay, Bohol 6303
            </p>
            <p>
              <strong className="text-slate-900">Phone:</strong> (03) 9123 4567 / 09093671998
            </p>
            <p>
              <strong className="text-slate-900">Email:</strong> service@autocare.com.au
            </p>
            <p>
              <strong className="text-slate-900">Website:</strong> www.autocare.com.au
            </p>
          </div>

          {/* DIVIDER LINE */}
          <hr className="border-t border-slate-400 my-4" />

          {/* 3. BILL TO & INVOICE DETAILS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
            {/* Left Column: Bill To */}
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Bill To</h3>
              <div className="grid grid-cols-3 gap-x-2">
                <span className="font-bold text-slate-900">Customer Name:</span>
                <span className="col-span-2 font-medium text-slate-800">{clientName}</span>

                <span className="font-bold text-slate-900">Address:</span>
                <span className="col-span-2 font-medium text-slate-800">{clientAddress}</span>

                <span className="font-bold text-slate-900">Phone:</span>
                <span className="col-span-2 font-medium text-slate-800">{clientPhone}</span>

                <span className="font-bold text-slate-900">Email:</span>
                <span className="col-span-2 font-medium text-slate-800">{clientEmail}</span>

                <span className="font-bold text-slate-900">Vehicle:</span>
                <span className="col-span-2 font-medium text-slate-800">{vehicleName}</span>

                <span className="font-bold text-slate-900">Registration:</span>
                <span className="col-span-2 font-medium text-slate-800 font-mono">{plateNumber}</span>
              </div>
            </div>

            {/* Right Column: Invoice Metadata */}
            <div className="space-y-1.5 sm:text-right">
              <div className="grid grid-cols-2 gap-x-2 sm:justify-end">
                <span className="font-bold text-slate-900">Invoice Number</span>
                <span className="font-medium text-slate-800 font-mono">INV-2026-0{job.id}</span>

                <span className="font-bold text-slate-900">Invoice Date</span>
                <span className="font-medium text-slate-800 font-mono">{invoiceDateStr}</span>

                <span className="font-bold text-slate-900">Due Date</span>
                <span className="font-medium text-slate-800 font-mono">{invoiceDateStr}</span>

                <span className="font-bold text-slate-900">Odometer Reading</span>
                <span className="font-medium text-slate-800">{odometer}</span>

                <span className="font-bold text-slate-900">Service Advisor</span>
                <span className="font-medium text-slate-800">{serviceAdvisor}</span>
              </div>
            </div>
          </div>

          {/* 4. ITEMIZED CHARGES TABLE */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full border-collapse border border-slate-400 text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[11px] sm:text-xs">
                  <th className="border border-slate-400 p-3 w-1/2">Description</th>
                  <th className="border border-slate-400 p-3 text-center w-1/6">Quantity</th>
                  <th className="border border-slate-400 p-3 text-right w-1/5">Unit Price</th>
                  <th className="border border-slate-400 p-3 text-right w-1/5">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {/* Row 1: Availed Service Package */}
                <tr>
                  <td className="border border-slate-300 p-3 text-slate-800">
                    <p className="font-bold text-slate-900">
                      Service Availed: {job.serviceCategory || 'Car Maintenance & Repair Service'}
                    </p>
                    {job.problemDescription && (
                      <p className="text-xs text-slate-600 font-normal pt-0.5">
                        <strong className="text-slate-700">Service Notes / Issue:</strong> {job.problemDescription}
                      </p>
                    )}
                  </td>
                  <td className="border border-slate-300 p-3 text-center font-medium">1</td>
                  <td className="border border-slate-300 p-3 text-right font-mono">
                    {isUnfixable ? formatMoney(0) : formatMoney(serviceFeeNum)}
                  </td>
                  <td className="border border-slate-300 p-3 text-right font-mono font-bold">
                    {isUnfixable ? formatMoney(0) : formatMoney(serviceFeeNum)}
                  </td>
                </tr>

                {/* Row 2: Labor Charge */}
                <tr>
                  <td className="border border-slate-300 p-3 text-slate-800">
                    <p className="font-bold text-slate-900">
                      Labor ({isUnfixable ? 'Diagnostic Labor Charge' : `Technician Work Charge - ${serviceAdvisor}`})
                    </p>
                    <p className="text-xs text-slate-600 font-normal pt-0.5">
                      Service Repair Labor for {job.serviceCategory || 'Vehicle Service'}
                    </p>
                  </td>
                  <td className="border border-slate-300 p-3 text-center font-medium">1.0</td>
                  <td className="border border-slate-300 p-3 text-right font-mono">{formatMoney(laborFeeNum)}</td>
                  <td className="border border-slate-300 p-3 text-right font-mono font-bold">{formatMoney(laborFeeNum)}</td>
                </tr>

                {/* Additional Itemized Spare Parts Rows */}
                {!isUnfixable &&
                  itemizedParts.map((part, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-300 p-3 text-slate-800">
                        <p className="font-bold text-slate-900">{part.name}</p>
                        <p className="text-xs text-slate-600 font-normal pt-0.5">Replaced Spare Part / Component</p>
                      </td>
                      <td className="border border-slate-300 p-3 text-center font-medium">{part.quantity}</td>
                      <td className="border border-slate-300 p-3 text-right font-mono">{formatMoney(part.unitPriceNum)}</td>
                      <td className="border border-slate-300 p-3 text-right font-mono font-bold">
                        {formatMoney(part.subtotalNum)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* 5. TOTALS SUMMARY & FOOTER NOTE */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            {/* Left side footer messages */}
            <div className="space-y-1 text-slate-700 text-xs sm:text-sm max-w-sm">
              <p className="font-semibold text-slate-900">Thank you for choosing AutoCare Service Center.</p>
              <p className="text-slate-600">Payment is due upon receipt. We appreciate your business!</p>
            </div>

            {/* Right side subtotal breakdown */}
            <div className="w-full sm:w-80 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center py-1">
                <span className="font-extrabold text-slate-800">Total without GST</span>
                <span className="font-mono font-semibold text-slate-900">{formatMoney(subtotalWithoutVat)}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-extrabold text-slate-800">GST (10%) / VAT (12%)</span>
                <span className="font-mono font-semibold text-slate-900">{formatMoney(vatAmount)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-slate-300 pt-1">
                <span className="font-extrabold text-slate-900">Total Invoice Amount</span>
                <span className="font-mono font-bold text-slate-900">{formatMoney(totalAmountNum)}</span>
              </div>

              {parseNum(job.amountPaid || 0) > 0 && (
                <div className="flex justify-between items-center py-1 text-emerald-700">
                  <span className="font-extrabold">Amount Paid to Date</span>
                  <span className="font-mono font-bold">{formatMoney(parseNum(job.amountPaid))}</span>
                </div>
              )}

              <hr className="border-t border-slate-400 my-1" />

              <div className="flex justify-between items-center py-1">
                <span className="font-black text-slate-900 text-sm sm:text-base uppercase tracking-tight">
                  REMAINING BALANCE
                </span>
                <span className={`font-mono font-black text-lg sm:text-xl ${parseNum(job.balance || Math.max(0, totalAmountNum - parseNum(job.amountPaid || 0))) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatMoney(parseNum(job.balance || Math.max(0, totalAmountNum - parseNum(job.amountPaid || 0))))}
                </span>
              </div>
            </div>
          </div>

          {/* BOTTOM CLOSING ACTIONS */}
          <div className="no-print pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500 font-medium">AutoCare Service Center • Official Maintenance Statement</p>
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print / Download PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                <X className="h-4 w-4" />
                <span>Close & Go Back</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
