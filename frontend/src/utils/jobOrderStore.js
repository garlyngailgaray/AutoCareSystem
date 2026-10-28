import { calculatePartsTotal } from './autoPartsCatalog';
import {
  fetchJobOrdersApi,
  createJobOrderApi,
  processPaymentApi,
  updateJobStatusApi,
  notifyCashierApi,
  deleteJobOrderApi,
} from '../api';

// Shared Real-Time Job Orders & Billing Store
const STORAGE_KEY = 'autocare_job_orders';

const initialJobOrders = [
  {
    id: 21,
    clientName: 'Mike Gerald Bacasmas',
    clientUsername: 'clt_mikegerald303',
    clientCustomId: 'CLT-303',
    clientPhone: '09631371882',
    vehicleName: 'Toyota Vios',
    plateNumber: 'BCS-303',
    serviceCategory: 'Brake & Suspension Overhaul',
    problemDescription: 'no brake response, pedal sinks to floor',
    assignedMechanic: 'Dave Garay',
    status: 'PENDING',
    serviceFee: '₱2,800.00',
    laborFee: '₱700.00',
    totalPrice: '₱7,500.00',
    amountPaid: '₱0.00',
    balance: '₱7,500.00',
    invoiceStatus: 'UNPAID',
    dateTime: '2026-09-15 14:30:12',
    mechanicNotes: 'Job order reported by Front Desk. Assigned technician waiting to start repair.',
    managerNotifiedCashier: false,
    usedParts: ['2x Ceramic Front Brake Pads (Pair)', '1x DOT4 Hydraulic Brake Fluid (500ml)'],
  },
  {
    id: 19,
    clientName: 'Lucky Garay',
    clientUsername: 'lucky_garay',
    clientCustomId: 'CLT-302',
    clientPhone: '09966009233',
    vehicleName: 'Van',
    plateNumber: 'GRY-633',
    serviceCategory: 'Body Paint & Refinishing',
    problemDescription: 'body paint fade and minor scratches',
    assignedMechanic: 'Christian Brina',
    status: 'COMPLETED',
    serviceFee: '₱15,000.00',
    laborFee: '₱4,000.00',
    totalPrice: '₱26,700.00',
    amountPaid: '₱26,700.00',
    balance: '₱0.00',
    invoiceStatus: 'PAID',
    dateTime: '2026-09-15 16:14:38',
    mechanicNotes: 'Full oven-baked respray and ceramic glaze wax completed.',
    managerNotifiedCashier: true,
    cashierName: 'Lovielle Garay',
    usedParts: ['1x Oven-Baked Automotive Primer Paint', '1x High-Gloss Ceramic Clear Coat Glaze'],
  },
  {
    id: 15,
    clientName: 'Claire Deliman',
    clientUsername: 'CLT-4',
    clientCustomId: 'CLT-301',
    clientPhone: '09090909090',
    vehicleName: 'Ford Ranger',
    plateNumber: 'GRY-768',
    serviceCategory: 'Engine Overhauling',
    problemDescription: 'engine knocking noise',
    assignedMechanic: 'Dave Garay',
    status: 'COMPLETED',
    serviceFee: '₱9,500.00',
    laborFee: '₱3,000.00',
    totalPrice: '₱19,800.00',
    amountPaid: '₱19,800.00',
    balance: '₱0.00',
    invoiceStatus: 'PAID',
    dateTime: '2026-09-05 09:37:56',
    mechanicNotes: 'Engine head resurfaced and piston rings replaced.',
    managerNotifiedCashier: true,
    cashierName: 'Claire Deliman',
    usedParts: ['1x Precision Piston Ring Set', '1x Multi-Layer Steel Head Gasket'],
  },
];

// Sync live job orders, bills, and balances directly from MySQL Database
export const syncJobOrdersWithBackend = async () => {
  try {
    const ordersFromDb = await fetchJobOrdersApi();
    if (Array.isArray(ordersFromDb) && ordersFromDb.length > 0) {
      const currentLocal = localStorage.getItem(STORAGE_KEY);
      const newStr = JSON.stringify(ordersFromDb);
      if (currentLocal !== newStr) {
        localStorage.setItem(STORAGE_KEY, newStr);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('autocare_jobs_updated'));
          window.dispatchEvent(new Event('storage'));
        }
      }
      return ordersFromDb;
    }
  } catch (e) {
    console.warn('MySQL Job Orders API offline/unreachable, fallback to local storage:', e.message);
  }
  return getJobOrders();
};

export const getJobOrders = () => {
  if (typeof window !== 'undefined' && !window._jobsSyncing) {
    window._jobsSyncing = true;
    syncJobOrdersWithBackend().finally(() => {
      window._jobsSyncing = false;
    });
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialJobOrders));
      return initialJobOrders;
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialJobOrders));
      return initialJobOrders;
    }
  } catch (e) {
    console.error('Error reading job orders from localStorage:', e);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialJobOrders));
    return initialJobOrders;
  }
};

export const createJobOrder = async (newOrder) => {
  const orders = getJobOrders();

  const numService = parseFloat((newOrder.serviceFee || '2800').replace(/[^0-9.-]+/g, '') || 2800);
  const numLabor = parseFloat((newOrder.laborFee || '700').replace(/[^0-9.-]+/g, '') || 700);
  const partsSum = calculatePartsTotal(newOrder.usedParts || []);
  const overallTotal = numService + numLabor + partsSum;

  const tempId = orders.length > 0 ? Math.max(...orders.map((o) => o.id || 0)) + 1 : 1;

  const fallbackCreated = {
    id: tempId,
    status: 'PENDING',
    invoiceStatus: 'UNPAID',
    serviceFee: `₱${numService.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    laborFee: `₱${numLabor.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    totalPrice: `₱${overallTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    amountPaid: '₱0.00',
    balance: `₱${overallTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    dateTime: new Date().toLocaleString('sv-SE').replace('T', ' '),
    mechanicNotes: newOrder.mechanicNotes || 'Job Order reported by Front Desk. Waiting for mechanic to start fix.',
    managerNotifiedCashier: false,
    usedParts: newOrder.usedParts || [],
    ...newOrder,
  };

  try {
    const dbOrder = await createJobOrderApi(newOrder);
    if (dbOrder && dbOrder.id) {
      const currentOrders = getJobOrders();
      const updated = [dbOrder, ...currentOrders.filter((o) => o.id !== dbOrder.id && o.id !== tempId)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('autocare_jobs_updated'));
        window.dispatchEvent(new Event('storage'));
      }
      return dbOrder;
    }
  } catch (e) {
    console.warn('MySQL job order creation API error, falling back to local store:', e.message);
    const currentOrders = getJobOrders();
    const updated = [fallbackCreated, ...currentOrders];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('autocare_jobs_updated'));
      window.dispatchEvent(new Event('storage'));
    }
  }

  return fallbackCreated;
};

export const updateJobFees = (id, serviceFeeNum, laborFeeNum) => {
  const orders = getJobOrders();

  const updated = orders.map((o) => {
    if (o.id === id) {
      if (o.status === 'CANNOT-FIX') {
        const laborFormatted = `₱${laborFeeNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        return {
          ...o,
          serviceFee: '₱0.00',
          laborFee: laborFormatted,
          totalPrice: laborFormatted,
          balance: o.invoiceStatus === 'PAID' ? '₱0.00' : laborFormatted,
        };
      }

      const partsSum = calculatePartsTotal(o.usedParts || []);
      const overallTotal = serviceFeeNum + laborFeeNum + partsSum;

      return {
        ...o,
        serviceFee: `₱${serviceFeeNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        laborFee: `₱${laborFeeNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        totalPrice: `₱${overallTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        balance: o.invoiceStatus === 'PAID' ? '₱0.00' : `₱${overallTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      };
    }
    return o;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const updateJobStatus = (id, newStatus, notes = '', usedParts = null) => {
  const orders = getJobOrders();
  const updated = orders.map((o) => {
    if (o.id === id) {
      if (newStatus === 'CANNOT-FIX') {
        return {
          ...o,
          status: 'CANNOT-FIX',
          serviceFee: '₱0.00',
          usedParts: [],
          mechanicNotes: notes || 'Vehicle cannot be fixed.',
        };
      }

      const finalParts = Array.isArray(usedParts) ? usedParts : (o.usedParts || []);
      const numService = parseFloat((o.serviceFee || '2800').replace(/[^0-9.-]+/g, '') || 2800);
      const numLabor = parseFloat((o.laborFee || '700').replace(/[^0-9.-]+/g, '') || 700);
      const partsSum = calculatePartsTotal(finalParts);

      const overallTotal = numService + numLabor + partsSum;
      const formattedTotal = `₱${overallTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

      return {
        ...o,
        status: newStatus !== undefined ? newStatus : o.status,
        mechanicNotes: notes || o.mechanicNotes,
        usedParts: finalParts,
        totalPrice: formattedTotal,
        balance: o.invoiceStatus === 'PAID' ? '₱0.00' : formattedTotal,
      };
    }
    return o;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Sync status update to MySQL Database SQL
  updateJobStatusApi(id, { status: newStatus, mechanicNotes: notes, usedParts }).catch((e) =>
    console.warn('MySQL job status update sync warning:', e.message)
  );

  return updated;
};

// Mechanic simply marks Cannot Fix with reason
export const markJobCannotFix = (id, reason = '') => {
  const orders = getJobOrders();
  const notesText = `VEHICLE CANNOT BE FIXED: ${reason || 'Unrepairable damage / parts obsolete'}. Awaiting Front Desk to decide diagnostic labor fee.`;

  const updated = orders.map((o) => {
    if (o.id === id) {
      return {
        ...o,
        status: 'CANNOT-FIX',
        serviceFee: '₱0.00',
        usedParts: [],
        mechanicNotes: notesText,
      };
    }
    return o;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  updateJobStatusApi(id, { status: 'CANNOT-FIX', mechanicNotes: notesText, usedParts: [] }).catch((e) =>
    console.warn('MySQL cannot fix status sync warning:', e.message)
  );

  return updated;
};

// Front Desk decides and sets the labor fee for unfixable vehicle
export const setFrontDeskLaborFeeAndNotify = (id, laborFeeNum) => {
  const orders = getJobOrders();
  const updated = orders.map((o) => {
    if (o.id === id) {
      const laborFormatted = `₱${laborFeeNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      return {
        ...o,
        status: 'CANNOT-FIX',
        serviceFee: '₱0.00',
        laborFee: laborFormatted,
        totalPrice: laborFormatted,
        balance: o.invoiceStatus === 'PAID' ? '₱0.00' : laborFormatted,
        managerNotifiedCashier: true,
      };
    }
    return o;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('autocare_jobs_updated'));
  window.dispatchEvent(new Event('storage'));

  notifyCashierApi(id).catch((e) => console.warn('MySQL notify cashier sync warning:', e.message));

  return updated;
};

export const notifyCashierForBilling = (id) => {
  const orders = getJobOrders();
  const updated = orders.map((o) => {
    if (o.id === id) {
      return {
        ...o,
        managerNotifiedCashier: true,
      };
    }
    return o;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('autocare_jobs_updated'));
  window.dispatchEvent(new Event('storage'));

  notifyCashierApi(id).catch((e) => console.warn('MySQL notify cashier sync warning:', e.message));

  return updated;
};

// Process Cashier Payment (Full or Partial) & Store Transaction in MySQL DB
export const processPaymentByCashier = async (
  id,
  cashierName = 'Lovielle Garay',
  customFees = null,
  paymentAmountNum = null,
  cashTenderedNum = null,
  changeDueNum = null
) => {
  const orders = getJobOrders();
  const paymentTimestamp = new Date().toLocaleString('sv-SE').replace('T', ' ');

  const parseVal = (valStr) => {
    if (typeof valStr === 'number') return valStr;
    if (!valStr) return 0;
    return parseFloat(valStr.toString().replace(/[^0-9.-]+/g, '') || 0);
  };

  const targetOrder = orders.find((o) => o && (o.id === id || o.id === parseInt(id, 10)));

  const updated = orders.map((o) => {
    if (o && (o.id === id || o.id === parseInt(id, 10))) {
      let finalServiceFee = o.serviceFee;
      let finalLaborFee = o.laborFee;
      let overallTotalNum = parseVal(o.totalPrice);

      if (o.status === 'CANNOT-FIX') {
        finalServiceFee = '₱0.00';
        finalLaborFee = o.laborFee || '₱500.00';
        overallTotalNum = parseVal(finalLaborFee);
      } else if (customFees) {
        const partsSum = calculatePartsTotal(o.usedParts || []);
        finalServiceFee = `₱${customFees.serviceFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        finalLaborFee = `₱${customFees.laborFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        overallTotalNum = customFees.serviceFee + customFees.laborFee + partsSum;
      }

      const formattedTotal = `₱${overallTotalNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      const prevPaidNum = parseVal(o.amountPaid || '0');
      const currentBalanceNum = Math.max(0, overallTotalNum - prevPaidNum);

      let payAmount = currentBalanceNum;
      if (paymentAmountNum !== null && paymentAmountNum !== undefined && !isNaN(paymentAmountNum)) {
        payAmount = Math.min(currentBalanceNum, Math.max(0, parseFloat(paymentAmountNum)));
      }

      const newTotalPaidNum = prevPaidNum + payAmount;
      const newBalanceNum = Math.max(0, overallTotalNum - newTotalPaidNum);

      const isFullyPaid = newBalanceNum <= 0.01;
      const finalBalanceNum = isFullyPaid ? 0 : newBalanceNum;
      const newInvoiceStatus = isFullyPaid ? 'PAID' : newTotalPaidNum > 0 ? 'PARTIAL' : 'UNPAID';

      return {
        ...o,
        status: o.status === 'CANNOT-FIX' ? 'CANNOT-FIX' : 'COMPLETED',
        invoiceStatus: newInvoiceStatus,
        serviceFee: finalServiceFee,
        laborFee: finalLaborFee,
        totalPrice: formattedTotal,
        amountPaid: `₱${newTotalPaidNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        balance: `₱${finalBalanceNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        lastPaymentAmount: `₱${payAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        cashTendered: cashTenderedNum ? `₱${parseVal(cashTenderedNum).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : o.cashTendered,
        changeDue: changeDueNum ? `₱${parseVal(changeDueNum).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : o.changeDue,
        paymentMethod: 'CASH',
        dateTime: paymentTimestamp,
        cashierName,
      };
    }
    return o;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  const payload = {
    cashierName,
    customFees,
    paymentAmount: paymentAmountNum,
    cashTendered: cashTenderedNum,
    changeDue: changeDueNum,
  };

  try {
    // 1. Try process payment in MySQL DB
    await processPaymentApi(id, payload);
    console.log(`✅ Stored payment transaction for Job Order #${id} into MySQL database successfully.`);
  } catch (e) {
    console.warn('MySQL payment process failed initially:', e.message);
    // If order was missing from MySQL DB, create it first then retry payment
    if (targetOrder) {
      try {
        console.log(`Ensuring Job Order #${id} exists in MySQL DB before storing payment...`);
        await createJobOrderApi(targetOrder);
        await processPaymentApi(id, payload);
        console.log(`✅ Stored Job Order #${id} and payment transaction into MySQL database successfully!`);
      } catch (retryErr) {
        console.error('Failed to auto-seed and process payment in MySQL DB:', retryErr.message);
      }
    }
  }

  // Refresh and sync live job orders from MySQL DB
  await syncJobOrdersWithBackend();

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('autocare_jobs_updated'));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (e) {}

  return updated;
};

const isMechanicAccount = (user) => {
  const role = (user?.role || '').toString().trim().toLowerCase();
  const position = (user?.position || '').toString().trim().toLowerCase();
  return ['staff', 'mechanic', 'technician'].includes(role) ||
    ['staff', 'mechanic', 'technician'].includes(position);
};

const calculateMechanicAvailability = (mechanics, orders) => mechanics.map((m) => {
  const activeJob = orders.find(
    (o) =>
      o.status === 'IN-PROGRESS' &&
      o.assignedMechanic &&
      (o.assignedMechanic.toLowerCase().includes(m.name.toLowerCase()) ||
        m.name.toLowerCase().includes(o.assignedMechanic.toLowerCase()) ||
        (o.assignedMechanic.toLowerCase().includes('brina') && m.name.toLowerCase().includes('brina')))
  );

  if (activeJob) {
    return {
      ...m,
      isAvailable: false,
      status: 'Occupied (Repairing)',
      currentAssignment: {
        jobId: `#${activeJob.id}`,
        clientName: activeJob.clientName,
        vehicle: `${activeJob.vehicleName} (Plate: ${activeJob.plateNumber})`,
        service: activeJob.serviceCategory,
        progress: activeJob.mechanicNotes || 'Repair in progress...',
      },
    };
  }

  return {
    ...m,
    isAvailable: true,
    status: 'Available',
    currentAssignment: null,
  };
});

// Dynamic Mechanic Availability Calculator
export const getMechanicsList = (users = null) => {
  const orders = getJobOrders();
  let mechanics = [
    {
      id: 101,
      customId: 'STF-101',
      name: 'Christian Brina',
      role: 'Lead Mechanic Technician',
      phone: '09957751462',
      address: 'Sevilla',
    },
    {
      id: 102,
      customId: 'STF-102',
      name: 'Dave Garay',
      role: 'Staff Technician & Specialist',
      phone: '09385149095',
      address: 'Loay',
    },
  ];

  const databaseMechanics = Array.isArray(users)
    ? users.filter(isMechanicAccount).map((u, index) => ({
      id: u.id || `mechanic-${index}`,
      customId: u.customId || u.custom_id || u.custom_personnel_id || `STF-${u.id || index + 101}`,
      name: u.name || [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ').trim() || u.username,
      role: u.position || u.role || 'Staff Technician',
      phone: u.phone || '',
      address: u.address || '',
    })).filter((m) => m.name)
    : [];

  if (databaseMechanics.length > 0) {
    mechanics = databaseMechanics;
  }

  try {
    const { getUserAccounts } = require('./userAccountsStore');
    const userAccs = getUserAccounts();
    if (databaseMechanics.length === 0 && Array.isArray(userAccs)) {
      const christian = userAccs.find((u) => u && ((u.username && u.username.includes('christian')) || (u.name && u.name.toLowerCase().includes('brina'))));
      if (christian) {
        mechanics[0] = {
          ...mechanics[0],
          name: christian.name || mechanics[0].name,
          phone: christian.phone || mechanics[0].phone,
          address: christian.address || mechanics[0].address,
          customId: christian.customId || mechanics[0].customId,
        };
      }
      const dave = userAccs.find((u) => u && ((u.username && u.username.includes('dave')) || (u.name && u.name.toLowerCase().includes('dave'))));
      if (dave) {
        mechanics[1] = {
          ...mechanics[1],
          name: dave.name || mechanics[1].name,
          phone: dave.phone || mechanics[1].phone,
          address: dave.address || mechanics[1].address,
          customId: dave.customId || mechanics[1].customId,
        };
      }
    }
  } catch (e) {}

  return calculateMechanicAvailability(mechanics, orders);
};

// Remove all repair history / job orders for a deleted user account
export const deleteJobOrdersForUser = (targetUser) => {
  if (!targetUser) return [];
  const orders = getJobOrders();

  const targetUsername = (targetUser.username || '').toString().trim().toLowerCase();
  const targetCustomId = (targetUser.customId || '').toString().trim().toLowerCase();
  const targetName = (targetUser.name || '').toString().trim().toLowerCase();

  const updated = orders.filter((o) => {
    if (!o) return false;
    const cUsername = (o.clientUsername || '').toString().trim().toLowerCase();
    const cCustomId = (o.clientCustomId || '').toString().trim().toLowerCase();
    const cName = (o.clientName || '').toString().trim().toLowerCase();
    const assigned = (o.assignedMechanic || '').toString().trim().toLowerCase();

    // If deleting a client account, remove their job orders/history
    if (targetUsername && cUsername === targetUsername) return false;
    if (targetCustomId && cCustomId === targetCustomId) return false;
    if (targetName && cName === targetName) return false;

    // If deleting a staff/mechanic account, remove their assigned orders
    if (targetName && assigned.includes(targetName)) return false;
    if (targetUsername && assigned.includes(targetUsername)) return false;

    return true;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('autocare_jobs_updated'));
    }
  } catch (e) {}

  return updated;
};

// Remove single job order by ID
export const deleteJobOrder = (id) => {
  const orders = getJobOrders();
  const updated = orders.filter((o) => o && o.id !== id && o.id !== parseInt(id, 10));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  deleteJobOrderApi(id).catch((e) => console.warn('MySQL job order delete sync warning:', e.message));

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('autocare_jobs_updated'));
    }
  } catch (e) {}

  return updated;
};
