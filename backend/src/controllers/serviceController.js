const { db } = require('../db/database');

let tableEnsured = false;
const ensureServiceRequestsTable = async () => {
  if (tableEnsured) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        vehicle_id INT DEFAULT NULL,
        service_type VARCHAR(150) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        preferred_date DATETIME DEFAULT NULL,
        mileage_at_service INT DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_vehicle_id (vehicle_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Migrate preferred_date column to DATETIME if VARCHAR
    try {
      const [cols] = await db.query(`SHOW COLUMNS FROM service_requests`);
      const pdCol = cols.find((c) => c.Field === 'preferred_date');
      if (pdCol && pdCol.Type.toLowerCase().includes('varchar')) {
        await db.query(`UPDATE service_requests SET preferred_date = NULL WHERE preferred_date = '' OR preferred_date = 'null'`);
        await db.query(`ALTER TABLE service_requests MODIFY COLUMN preferred_date DATETIME DEFAULT NULL`);
        console.log('✅ Migrated MySQL service_requests.preferred_date to DATETIME!');
      }
    } catch (ePd) {
      console.warn('Service requests preferred_date migration notice:', ePd.message);
    }

    // Safely add foreign key constraint on vehicle_id
    try {
      const [fkRows] = await db.query(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'service_requests' AND CONSTRAINT_NAME = 'fk_service_requests_vehicle'
      `);
      if (!fkRows || fkRows.length === 0) {
        await db.query(`DELETE FROM service_requests WHERE vehicle_id IS NOT NULL AND vehicle_id NOT IN (SELECT id FROM vehicles)`);
        await db.query(`ALTER TABLE service_requests ADD CONSTRAINT fk_service_requests_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE ON UPDATE CASCADE`);
        console.log('✅ Added Foreign Key Constraint fk_service_requests_vehicle on service_requests table!');
      }
    } catch (eFkSr) {
      console.warn('Service requests FK notice:', eFkSr.message);
    }

    tableEnsured = true;
  } catch (e) {
    console.warn('Service requests table check warning:', e.message);
  }
};

const getServiceRequests = async (req, res) => {
  try {
    await ensureServiceRequestsTable();
    const userId = req.user?.id;
    const userRole = (req.user?.role || '').toString().toLowerCase().trim();
    let rows = [];

    if (['admin', 'manager', 'staff', 'mechanic', 'cashier'].includes(userRole)) {
      [rows] = await db.query(
        `SELECT sr.*, v.make, v.model, v.license_plate
         FROM service_requests sr
         LEFT JOIN vehicles v ON sr.vehicle_id = v.id
         ORDER BY sr.id DESC`
      );
    } else if (userId) {
      [rows] = await db.query(
        `SELECT sr.*, v.make, v.model, v.license_plate
         FROM service_requests sr
         LEFT JOIN vehicles v ON sr.vehicle_id = v.id
         WHERE sr.user_id = ?
         ORDER BY sr.id DESC`,
        [userId]
      );
    } else {
      [rows] = await db.query(
        `SELECT sr.*, v.make, v.model, v.license_plate
         FROM service_requests sr
         LEFT JOIN vehicles v ON sr.vehicle_id = v.id
         ORDER BY sr.id DESC`
      );
    }

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const createServiceRequest = async (req, res) => {
  try {
    await ensureServiceRequestsTable();
    const userId = req.user?.id;
    const { vehicle_id, service_type, preferred_date, mileage_at_service, notes } = req.body;

    if (!service_type || !preferred_date) {
      return res.status(400).json({ error: 'Service type and preferred date are required.' });
    }

    const prefDate = new Date(preferred_date);
    const validPrefDate = isNaN(prefDate.getTime()) ? null : prefDate;

    // 1. Store service request in service_requests table
    const [result] = await db.query(
      `INSERT INTO service_requests (user_id, vehicle_id, service_type, preferred_date, mileage_at_service, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [userId || null, vehicle_id || null, service_type, validPrefDate, mileage_at_service || 0, notes || '']
    );

    // 2. Automatically store corresponding job order in job_orders table EVERY time a new booking is created
    try {
      let clientName = req.user?.name || req.user?.username || 'Client Customer';
      let clientUsername = req.user?.username || '';
      let clientCustomId = req.user?.custom_id || req.user?.custom_client_id || `CLT-${userId || 'NEW'}`;
      let clientPhone = req.user?.phone || '09123456789';
      let vehicleName = 'Client Vehicle';
      let plateNumber = 'N/A';

      if (userId) {
        let uRows = [];
        const [cRows] = await db.query('SELECT * FROM client WHERE id = ?', [userId]);
        if (cRows && cRows.length > 0) {
          uRows = cRows;
        } else {
          const [pRows] = await db.query('SELECT * FROM personnel WHERE id = ?', [userId]);
          if (pRows && pRows.length > 0) uRows = pRows;
        }

        if (uRows && uRows.length > 0) {
          const u = uRows[0];
          clientName = u.name || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username);
          clientUsername = u.username || clientUsername;
          clientCustomId = u.custom_id || u.custom_client_id || u.custom_personnel_id || clientCustomId;
          clientPhone = u.phone || clientPhone;
        }
      }

      if (vehicle_id) {
        const [vRows] = await db.query('SELECT * FROM vehicles WHERE id = ?', [vehicle_id]);
        if (vRows && vRows.length > 0) {
          const v = vRows[0];
          vehicleName = `${v.make || ''} ${v.model || ''}`.trim() || vehicleName;
          plateNumber = v.license_plate || v.plate_number || plateNumber;
        }
      }

      // Check service category pricing
      const defaultServiceFees = {
        'Oil Change & Filter': 1800,
        'Change Oil & Maintenance': 1800,
        'Brake Inspection & Service': 2800,
        'Brake & Suspension Overhaul': 2800,
        'Full Vehicle Inspection': 1500,
        'Battery & Electrical Check': 1500,
        'Engine Diagnostics & Repair': 3500,
        'Tire Rotation & Balance': 1000,
      };

      const numService = defaultServiceFees[service_type] || 2800.0;
      const numLabor = 700.0;
      const overallTotal = numService + numLabor;
      const now = new Date();

      const [joRes] = await db.query(
        `INSERT INTO job_orders (
          client_name, client_username, client_custom_id, client_phone,
          vehicle_name, plate_number, service_category, problem_description,
          assigned_mechanic, status, service_fee, labor_fee, total_price,
          amount_paid, balance, invoice_status, date_time, mechanic_notes,
          manager_notified_cashier, used_parts
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Dave Garay', 'PENDING', ?, ?, ?, 0.00, ?, 'UNPAID', ?, ?, 0, '[]')`,
        [
          clientName,
          clientUsername,
          clientCustomId,
          clientPhone,
          vehicleName,
          plateNumber,
          service_type,
          notes || `Online Service Booking request for ${service_type}`,
          numService,
          numLabor,
          overallTotal,
          overallTotal,
          now,
          `Client scheduled appointment for ${preferred_date}. ${notes || ''}`.trim(),
        ]
      );

      // Record in billing_history table as well
      const { recordBillingHistoryLog, recordAvailedServiceLog } = require('./billingController');
      await recordBillingHistoryLog({
        job_order_id: joRes.insertId,
        invoice_number: `INV-2026-0${joRes.insertId}`,
        client_name: clientName,
        client_username: clientUsername,
        client_custom_id: clientCustomId,
        vehicle_name: vehicleName,
        plate_number: plateNumber,
        service_category: service_type,
        action_type: 'BILL_CREATED',
        service_fee: numService,
        labor_fee: numLabor,
        total_price: overallTotal,
        amount_paid: 0.00,
        balance: overallTotal,
        invoice_status: 'UNPAID',
        notes: notes || `Online Service Booking request for ${service_type}`,
        actor_name: clientName,
        recorded_at: now,
      });

      await recordAvailedServiceLog({
        job_order_id: joRes.insertId,
        service_request_id: result.insertId,
        client_name: clientName,
        client_username: clientUsername,
        client_custom_id: clientCustomId,
        client_phone: clientPhone,
        vehicle_name: vehicleName,
        plate_number: plateNumber,
        service_category: service_type,
        problem_description: notes || `Online Service Booking for ${service_type}`,
        service_fee: numService,
        labor_fee: numLabor,
        total_price: overallTotal,
        status: 'PENDING',
        assigned_mechanic: 'Dave Garay',
        availed_at: now,
      });

      console.log(`✅ Automatically created & stored new job order & availed service in MySQL DB for service booking ID #${result.insertId}`);
    } catch (eJo) {
      console.warn('Auto job order creation notice:', eJo.message);
    }

    return res.status(201).json({
      id: result.insertId,
      user_id: userId || null,
      vehicle_id: vehicle_id || null,
      service_type,
      status: 'PENDING',
      preferred_date,
      mileage_at_service: mileage_at_service || 0,
      notes: notes || '',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const updateServiceStatus = async (req, res) => {
  try {
    await ensureServiceRequestsTable();
    const { status, mechanic_notes } = req.body;
    const requestId = req.params.id;

    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    await db.query(`UPDATE service_requests SET status = ?, notes = COALESCE(?, notes) WHERE id = ?`, [
      status,
      mechanic_notes,
      requestId,
    ]);

    return res.json({ message: `Service request status updated to ${status}.` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  ensureServiceRequestsTable,
  getServiceRequests,
  createServiceRequest,
  updateServiceStatus,
};
