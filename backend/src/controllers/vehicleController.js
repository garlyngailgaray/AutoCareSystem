const { db } = require('../db/database');

let tableEnsured = false;
const ensureVehiclesTable = async () => {
  if (tableEnsured) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        make VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INT NOT NULL,
        license_plate VARCHAR(50) NOT NULL,
        vin VARCHAR(100) DEFAULT '',
        current_mileage INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Safely remove restrictive foreign key constraint if present (since vehicles can belong to personnel or clients)
    try {
      const [fkRows] = await db.query(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicles' AND CONSTRAINT_NAME = 'fk_vehicles_user'
      `);
      if (fkRows && fkRows.length > 0) {
        await db.query(`ALTER TABLE vehicles DROP FOREIGN KEY fk_vehicles_user`);
        console.log('✅ Safely removed restrictive fk_vehicles_user foreign key constraint on vehicles table.');
      }
    } catch (eFkV) {
      console.warn('Vehicles FK notice:', eFkV.message);
    }

    tableEnsured = true;
  } catch (e) {
    console.warn('Vehicles table check warning:', e.message);
  }
};

const getVehicles = async (req, res) => {
  try {
    await ensureVehiclesTable();
    const userId = req.user?.id;
    const userRole = (req.user?.role || '').toString().toLowerCase().trim();
    const requestedUserId = req.query.user_id || req.query.userId;
    let rows = [];

    if (requestedUserId) {
      [rows] = await db.query('SELECT * FROM vehicles WHERE user_id = ? ORDER BY id DESC', [requestedUserId]);
    } else if (['admin', 'manager', 'staff', 'mechanic', 'cashier'].includes(userRole)) {
      [rows] = await db.query('SELECT * FROM vehicles ORDER BY id DESC');
    } else if (userId) {
      [rows] = await db.query('SELECT * FROM vehicles WHERE user_id = ? ORDER BY id DESC', [userId]);
    } else {
      [rows] = await db.query('SELECT * FROM vehicles ORDER BY id DESC');
    }

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getVehicleById = async (req, res) => {
  try {
    await ensureVehiclesTable();
    const vehicleId = req.params.id;
    const [rows] = await db.query('SELECT * FROM vehicles WHERE id = ?', [vehicleId]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const addVehicle = async (req, res) => {
  try {
    await ensureVehiclesTable();
    const userId = req.user?.id;
    const { make, model, year, license_plate, vin, current_mileage } = req.body;

    if (!make || !model || !year || !license_plate) {
      return res.status(400).json({ error: 'Make, model, year, and license plate are required.' });
    }

    const [result] = await db.query(
      `INSERT INTO vehicles (user_id, make, model, year, license_plate, vin, current_mileage)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId || null, make, model, parseInt(year, 10), license_plate, vin || '', current_mileage || 0]
    );

    return res.status(201).json({
      id: result.insertId,
      user_id: userId || null,
      make,
      model,
      year: parseInt(year, 10),
      license_plate,
      vin: vin || '',
      current_mileage: current_mileage || 0,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const updateVehicle = async (req, res) => {
  try {
    await ensureVehiclesTable();
    const vehicleId = req.params.id;
    const { make, model, year, license_plate, vin, current_mileage } = req.body;

    await db.query(
      `UPDATE vehicles
       SET make = COALESCE(?, make),
           model = COALESCE(?, model),
           year = COALESCE(?, year),
           license_plate = COALESCE(?, license_plate),
           vin = COALESCE(?, vin),
           current_mileage = COALESCE(?, current_mileage)
       WHERE id = ?`,
      [make, model, year, license_plate, vin, current_mileage, vehicleId]
    );

    return res.json({ message: 'Vehicle updated successfully in MySQL DB.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    await ensureVehiclesTable();
    const vehicleId = req.params.id;

    await db.query('DELETE FROM vehicles WHERE id = ?', [vehicleId]);
    return res.json({ message: 'Vehicle deleted successfully from MySQL DB.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  addVehicle,
  updateVehicle,
  deleteVehicle,
};
