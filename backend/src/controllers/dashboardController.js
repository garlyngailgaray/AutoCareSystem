const { db } = require('../db/database');

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    const username = req.user?.username || '';
    const userRole = (req.user?.role || '').toString().toLowerCase().trim();
    const isClient = ['client', 'customer'].includes(userRole);

    // 1. Vehicles count from MySQL DB
    let totalVehicles = 0;
    try {
      if (isClient && userId) {
        const [vRows] = await db.query('SELECT COUNT(*) as count FROM vehicles WHERE user_id = ?', [userId]);
        totalVehicles = vRows[0]?.count || 0;
      } else {
        const [vRows] = await db.query('SELECT COUNT(*) as count FROM vehicles');
        totalVehicles = vRows[0]?.count || 0;
      }
    } catch (eV) {}

    // 2. Active & Completed Job Orders from MySQL DB
    let activeServices = 0;
    let completedServices = 0;
    let totalSpent = 0.0;

    try {
      let query = 'SELECT status, amount_paid FROM job_orders';
      const params = [];

      if (isClient && username) {
        query += ' WHERE client_username = ? OR client_custom_id = ?';
        params.push(username, req.user?.customId || req.user?.custom_client_id || '');
      }

      const [jRows] = await db.query(query, params);
      jRows.forEach((r) => {
        const st = (r.status || '').toUpperCase();
        if (st === 'PENDING' || st === 'IN-PROGRESS') {
          activeServices++;
        } else if (st === 'COMPLETED') {
          completedServices++;
        }
        const paidNum = typeof r.amount_paid === 'number' ? r.amount_paid : parseFloat(r.amount_paid || 0);
        totalSpent += (isNaN(paidNum) ? 0 : paidNum);
      });
    } catch (eJ) {}

    return res.json({
      totalVehicles,
      activeServices,
      completedServices,
      totalSpent,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats from MySQL DB:', error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboardStats,
};
