const { db } = require('../db/database');

const formatDateForApi = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return null;
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${dateVal.getFullYear()}-${pad(dateVal.getMonth() + 1)}-${pad(dateVal.getDate())} ${pad(dateVal.getHours())}:${pad(dateVal.getMinutes())}:${pad(dateVal.getSeconds())}`;
  }
  return dateVal.toString();
};

let tableEnsured = false;
const ensureMaintenanceLogsTable = async () => {
  if (tableEnsured) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS maintenance_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vehicle_id INT DEFAULT NULL,
        service_request_id INT DEFAULT NULL,
        service_type VARCHAR(150) NOT NULL,
        service_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        cost DECIMAL(10, 2) DEFAULT 0.00,
        mileage INT DEFAULT 0,
        mechanic_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vehicle_id (vehicle_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    try {
      const [cols] = await db.query(`SHOW COLUMNS FROM maintenance_logs`);
      const sdCol = cols.find((c) => c.Field === 'service_date');
      if (sdCol && sdCol.Type.toLowerCase().includes('varchar')) {
        await db.query(`UPDATE maintenance_logs SET service_date = NULL WHERE service_date = '' OR service_date = 'null'`);
        await db.query(`ALTER TABLE maintenance_logs MODIFY COLUMN service_date DATETIME DEFAULT CURRENT_TIMESTAMP`);
        console.log('✅ Migrated MySQL maintenance_logs.service_date to DATETIME!');
      }
    } catch (eSd) {
      console.warn('Maintenance logs service_date migration notice:', eSd.message);
    }

    // Safely add foreign key constraint on vehicle_id
    try {
      const [fkRows] = await db.query(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'maintenance_logs' AND CONSTRAINT_NAME = 'fk_maintenance_logs_vehicle'
      `);
      if (!fkRows || fkRows.length === 0) {
        await db.query(`DELETE FROM maintenance_logs WHERE vehicle_id IS NOT NULL AND vehicle_id NOT IN (SELECT id FROM vehicles)`);
        await db.query(`ALTER TABLE maintenance_logs ADD CONSTRAINT fk_maintenance_logs_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE ON UPDATE CASCADE`);
        console.log('✅ Added Foreign Key Constraint fk_maintenance_logs_vehicle on maintenance_logs table!');
      }
    } catch (eFkMl) {
      console.warn('Maintenance logs FK notice:', eFkMl.message);
    }

    tableEnsured = true;
  } catch (e) {
    console.warn('Maintenance logs table check warning:', e.message);
  }
};

const getMaintenanceLogs = async (req, res) => {
  try {
    await ensureMaintenanceLogsTable();
    const userId = req.user?.id;
    const userRole = (req.user?.role || '').toString().toLowerCase().trim();
    const vehicleId = req.query.vehicle_id;

    let query = `
      SELECT ml.*, v.make, v.model, v.license_plate
      FROM maintenance_logs ml
      LEFT JOIN vehicles v ON ml.vehicle_id = v.id
    `;
    const params = [];

    if (['admin', 'manager', 'staff', 'mechanic', 'cashier'].includes(userRole)) {
      if (vehicleId) {
        query += ` WHERE ml.vehicle_id = ?`;
        params.push(vehicleId);
      }
    } else if (userId) {
      query += ` WHERE v.user_id = ?`;
      params.push(userId);
      if (vehicleId) {
        query += ` AND ml.vehicle_id = ?`;
        params.push(vehicleId);
      }
    } else if (vehicleId) {
      query += ` WHERE ml.vehicle_id = ?`;
      params.push(vehicleId);
    }

    query += ` ORDER BY ml.id DESC`;

    const [rows] = await db.query(query, params);
    const formatted = rows.map((r) => ({
      ...r,
      service_date: formatDateForApi(r.service_date),
    }));

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const addMaintenanceLog = async (req, res) => {
  try {
    await ensureMaintenanceLogsTable();
    const { vehicle_id, service_type, service_date, cost, mileage, mechanic_notes } = req.body;

    if (!service_type || !service_date) {
      return res.status(400).json({ error: 'Service type and service date are required.' });
    }

    const logDate = new Date(service_date);
    const validDate = isNaN(logDate.getTime()) ? new Date() : logDate;

    const [result] = await db.query(
      `INSERT INTO maintenance_logs (vehicle_id, service_type, service_date, cost, mileage, mechanic_notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [vehicle_id || null, service_type, validDate, cost || 0.0, mileage || 0, mechanic_notes || '']
    );

    return res.status(201).json({
      id: result.insertId,
      vehicle_id,
      service_type,
      service_date: formatDateForApi(validDate),
      cost: cost || 0.0,
      mileage: mileage || 0,
      mechanic_notes: mechanic_notes || '',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMaintenanceLogs,
  addMaintenanceLog,
};
