import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getJobOrders } from '../../utils/jobOrderStore';
import { getUserAccounts } from '../../utils/userAccountsStore';
import {
  DollarSign,
  Search,
  CreditCard,
  Lock,
  Check,
  FileText,
  ArrowRight,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Package,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import CarMaintenanceInvoiceModal from '../../components/CarMaintenanceInvoiceModal';

export default function PendingBills({ user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' or 'unpaid'
  const [jobOrders, setJobOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedInvoiceJob, setSelectedInvoiceJob] = useState(null);
  const [collapsedClients, setCollapsedClients] = useState({});

  const loadData = () => {
    const orders = getJobOrders();
    const validOrders = Array.isArray(orders) ? orders : [];
    setJobOrders((prev) => (JSON.stringify(prev) === JSON.stringify(validOrders) ? prev : validOrders));

    const users = getUserAccounts();
    const clients = users.filter((u) => u && (u.role === 'client' || u.role === 'customer'));
    setUsersList((prev) => (JSON.stringify(prev) === JSON.stringify(clients) ? prev : clients));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    window.addEventListener('autocare_jobs_updated', loadData);
    window.addEventListener('autocare_users_updated', loadData);
    const timer = setInterval(loadData, 2000);
    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('autocare_jobs_updated', loadData);
      window.removeEventListener('autocare_users_updated', loadData);
      clearInterval(timer);
    };
  }, []);

  // Group job orders by client
  const clientsMap = {};

  // First seed registered client accounts
  usersList.forEach((clt) => {
    const key = (clt.username || clt.name || '').toLowerCase().trim();
    if (key) {
      clientsMap[key] = {
        key,
        clientName: clt.name || clt.username,
        clientCustomId: clt.customId || `CLT-${clt.id}`,
        clientPhone: clt.phone || '09123456789',
        clientEmail: clt.email || '',
        vehiclesSet: new Set(),
        records: [],
      };
    }
  });

  // Associate job orders with clients
  jobOrders.forEach((job) => {
    if (!job) return;
    const key = (job.clientUsername || job.clientName || 'unknown').toLowerCase().trim();
    if (!clientsMap[key]) {
      clientsMap[key] = {
        key,
        clientName: job.clientName,
        clientCustomId: job.clientCustomId || `CLT-${job.id}`,
        clientPhone: job.clientPhone || '09123456789',
        clientEmail: '',
        vehiclesSet: new Set(),
        records: [],
      };
    }
    if (job.vehicleName) {
      clientsMap[key].vehiclesSet.add(`${job.vehicleName} (${job.plateNumber || 'No Plate'})`);
    }
    clientsMap[key].records.push(job);
  });

  const allGroupedClients = Object.values(clientsMap);

  // Filter clients based on search query and filter mode
  const filteredClients = allGroupedClients.filter((client) => {
    const query = searchTerm.toLowerCase().trim();
    const unpaidRecords = client.records.filter((r) => r && r.invoiceStatus !== 'PAID');

    if (filterMode === 'unpaid' && unpaidRecords.length === 0) {
      return false;
    }

    if (!query) return true;

    const matchesName = client.clientName.toLowerCase().includes(query);
    const matchesId = client.clientCustomId.toLowerCase().includes(query);
    const matchesPhone = client.clientPhone.toLowerCase().includes(query);
    const matchesVehicle = Array.from(client.vehiclesSet).some((v) => v.toLowerCase().includes(query));
    const matchesRecord = client.records.some(
      (r) =>
        (r.serviceCategory || '').toLowerCase().includes(query) ||
        (r.status || '').toLowerCase().includes(query) ||
        (r.invoiceStatus || '').toLowerCase().includes(query) ||
        r.id.toString().includes(query)
    );

    return matchesName || matchesId || matchesPhone || matchesVehicle || matchesRecord;
  });

  const toggleCollapse = (clientKey) => {
    setCollapsedClients((prev) => ({
      ...prev,
      [clientKey]: !prev[clientKey],
    }));
  };

  const totalClientsCount = filteredClients.length;
  const totalUnpaidBillsCount = jobOrders.filter((j) => j && j.invoiceStatus !== 'PAID').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-emerald-600" />
            <span>Client Billing Directory & Invoices</span>
          </h1>
          <p className="text-sm text-gray-500">
            Comprehensive list of all registered clients and their corresponding repair bills and invoices
          </p>
        </div>

        {/* Real-time Search Input */}
        <div className="w-full sm:w-80">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search client, ID, vehicle, plate, bill..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Clients & Bills ({allGroupedClients.length})
          </button>
          <button
            onClick={() => setFilterMode('unpaid')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'unpaid'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Clients with Unpaid Bills ({allGroupedClients.filter((c) => c.records.some((r) => r.invoiceStatus === 'UNPAID')).length})
          </button>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Showing <strong className="text-gray-900">{totalClientsCount}</strong> client(s) • <strong className="text-red-600">{totalUnpaidBillsCount}</strong> total unpaid invoice(s)
        </div>
      </div>

      {/* Clients & Itemized Bills List */}
      <div className="space-y-4">
        {filteredClients.map((client) => {
          const isCollapsed = !!collapsedClients[client.key];
          const vehiclesArray = Array.from(client.vehiclesSet);
          const unpaidRecords = client.records.filter((r) => r && r.invoiceStatus !== 'PAID');
          const paidRecords = client.records.filter((r) => r.invoiceStatus === 'PAID');

          const totalUnpaidAmount = unpaidRecords.reduce((sum, r) => {
            const val = parseFloat((r.totalPrice || '0').replace(/[^0-9.-]+/g, '')) || 0;
            return sum + val;
          }, 0);

          const totalOverallAmount = client.records.reduce((sum, r) => {
            const val = parseFloat((r.totalPrice || '0').replace(/[^0-9.-]+/g, '')) || 0;
            return sum + val;
          }, 0);

          return (
            <div key={client.key} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all">
              {/* Client Header Box */}
              <div
                onClick={() => toggleCollapse(client.key)}
                className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/90 transition-colors"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/20 shrink-0">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/20 px-2.5 py-0.5 rounded border border-blue-400/30">
                        {client.clientCustomId}
                      </span>
                      <h3 className="font-extrabold text-base text-white">{client.clientName}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300 mt-1">
                      <span className="flex items-center space-x-1">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        <span>{client.clientPhone}</span>
                      </span>
                      {vehiclesArray.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-400">Vehicles:</span>
                          <span className="font-semibold text-gray-200">{vehiclesArray.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Outstanding Balance</span>
                    {unpaidRecords.length > 0 ? (
                      <span className="text-base font-black text-red-400 font-mono">
                        ₱{totalUnpaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/30">
                        Fully Settled (₱0.00)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-300 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                      {client.records.length} Bill(s) ({unpaidRecords.length} Unpaid)
                    </span>
                    <button className="p-1.5 text-gray-400 hover:text-white rounded-lg">
                      {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Client's Bills List Table */}
              {!isCollapsed && (
                <div className="p-5 space-y-3">
                  {client.records.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold border-b border-gray-200">
                          <tr>
                            <th className="p-3">Bill ID</th>
                            <th className="p-3">Vehicle Details</th>
                            <th className="p-3">Availed Service</th>
                            <th className="p-3">Total Price</th>
                            <th className="p-3">Amount Paid</th>
                            <th className="p-3">Remaining Balance</th>
                            <th className="p-3">Payment Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {client.records.map((b) => {
                            const isUnpaid = b.invoiceStatus !== 'PAID';
                            const parseVal = (v) => parseFloat((v || '0').replace(/[^0-9.-]+/g, '')) || 0;
                            const balNum = parseVal(b.balance);

                            return (
                              <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-3 font-mono font-bold text-gray-900">#RCT-00{b.id}</td>
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

                                {/* Invoice Payment Status */}
                                <td className="p-3">
                                  <span className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase border ${
                                    b.invoiceStatus === 'PAID'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : b.invoiceStatus === 'PARTIAL'
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
                                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center space-x-1 cursor-pointer shrink-0"
                                      title="View itemized official Car Maintenance Invoice"
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                      <span>View Invoice</span>
                                    </button>

                                    {isUnpaid && (
                                      <Link
                                        to="/cashier/history"
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
                                        title="Navigate to Payments page to perform POS checkout"
                                      >
                                        <CreditCard className="h-3.5 w-3.5" />
                                        <span>Checkout Pay in Payments</span>
                                        <ArrowRight className="h-3.5 w-3.5" />
                                      </Link>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400 text-xs bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      No repair bills or invoices recorded for this client yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredClients.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 space-y-3 shadow-sm">
            <Search className="h-10 w-10 text-gray-300 mx-auto" />
            <p className="font-bold text-gray-800 text-base">No Client Billing Records Found</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              No clients or invoices found matching "<span className="font-semibold text-gray-700">{searchTerm}</span>". Try refining your search query.
            </p>
          </div>
        )}
      </div>

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
