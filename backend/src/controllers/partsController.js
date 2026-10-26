const { db } = require('../db/database');

const INITIAL_AUTO_PARTS = [
  { part_code: 'bp-01', category: 'Brake & Suspension Overhaul', name: 'Ceramic Front Brake Pads (Pair)', price: 1800.00, stock_quantity: 28, unit: 'Set' },
  { part_code: 'bp-02', category: 'Brake & Suspension Overhaul', name: 'DOT4 Hydraulic Brake Fluid (500ml)', price: 400.00, stock_quantity: 45, unit: 'Bottle' },
  { part_code: 'bp-03', category: 'Brake & Suspension Overhaul', name: 'Vented Front Brake Rotor Disc', price: 2200.00, stock_quantity: 16, unit: 'Piece' },
  { part_code: 'bp-04', category: 'Brake & Suspension Overhaul', name: 'Heavy-Duty Gas Shock Absorber', price: 3500.00, stock_quantity: 12, unit: 'Pair' },
  { part_code: 'co-01', category: 'Change Oil & Maintenance', name: 'Fully Synthetic Engine Oil 5W-30 (4L)', price: 1800.00, stock_quantity: 35, unit: 'Gallon' },
  { part_code: 'co-02', category: 'Change Oil & Maintenance', name: 'OEM High-Flow Oil Filter', price: 350.00, stock_quantity: 60, unit: 'Piece' },
  { part_code: 'co-03', category: 'Change Oil & Maintenance', name: 'Engine Cabin Air Filter Element', price: 450.00, stock_quantity: 22, unit: 'Piece' },
  { part_code: 'eo-01', category: 'Engine Overhauling', name: 'Precision Piston Ring Set', price: 4500.00, stock_quantity: 8, unit: 'Set' },
  { part_code: 'eo-02', category: 'Engine Overhauling', name: 'Multi-Layer Steel Head Gasket', price: 2800.00, stock_quantity: 14, unit: 'Piece' },
  { part_code: 'eo-03', category: 'Engine Overhauling', name: 'Kevlar Reinforced Timing Belt', price: 2200.00, stock_quantity: 19, unit: 'Piece' },
  { part_code: 'eo-04', category: 'Engine Overhauling', name: 'Iridium Power Spark Plugs (4x)', price: 1600.00, stock_quantity: 30, unit: 'Pack' },
  { part_code: 'ac-01', category: 'Air Conditioning Services', name: 'R134a Refrigerant Gas Refill', price: 800.00, stock_quantity: 50, unit: 'Can' },
  { part_code: 'ac-02', category: 'Air Conditioning Services', name: 'OEM Rotary AC Compressor Assembly', price: 8500.00, stock_quantity: 6, unit: 'Unit' },
  { part_code: 'ac-03', category: 'Air Conditioning Services', name: 'AC Condenser Cooling Coil', price: 3200.00, stock_quantity: 11, unit: 'Piece' },
  { part_code: 'ac-04', category: 'Air Conditioning Services', name: 'High-Density Cabin AC Filter', price: 450.00, stock_quantity: 25, unit: 'Piece' },
  { part_code: 'bp-10', category: 'Body Paint & Refinishing', name: 'Oven-Baked Automotive Primer Paint', price: 3500.00, stock_quantity: 18, unit: 'Liter' },
  { part_code: 'bp-11', category: 'Body Paint & Refinishing', name: 'High-Gloss Ceramic Clear Coat Glaze', price: 4200.00, stock_quantity: 15, unit: 'Can' },
  { part_code: 'bp-12', category: 'Body Paint & Refinishing', name: 'Polyurethane Body Filler Putty', price: 1200.00, stock_quantity: 20, unit: 'Tin' },
  { part_code: 'tu-01', category: 'Tune Up & Ignition System', name: 'Iridium Spark Plugs (4x)', price: 1600.00, stock_quantity: 30, unit: 'Pack' },
  { part_code: 'tu-02', category: 'Tune Up & Ignition System', name: 'High-Output Ignition Coil Pack', price: 2400.00, stock_quantity: 16, unit: 'Piece' },
  { part_code: 'tu-03', category: 'Tune Up & Ignition System', name: 'In-Line Fuel Filter Element', price: 650.00, stock_quantity: 24, unit: 'Piece' },
  { part_code: 'uc-01', category: 'Under Chassis & Steering', name: 'Front Suspension Ball Joint', price: 1200.00, stock_quantity: 22, unit: 'Piece' },
  { part_code: 'uc-02', category: 'Under Chassis & Steering', name: 'Tie Rod End & Rack End Link', price: 1500.00, stock_quantity: 18, unit: 'Pair' },
  { part_code: 'uc-03', category: 'Under Chassis & Steering', name: 'Rubber Bushing Arm Set', price: 900.00, stock_quantity: 26, unit: 'Set' },
];

let tableEnsured = false;
const ensureAutoPartsTable = async () => {
  if (tableEnsured) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS auto_parts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        part_code VARCHAR(50) NOT NULL UNIQUE,
        category VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        stock_quantity INT NOT NULL DEFAULT 0,
        unit VARCHAR(50) DEFAULT 'Piece',
        in_stock TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure all auto parts defined in code are stored & populated in MySQL database
    for (const p of INITIAL_AUTO_PARTS) {
      await db.query(
        `INSERT INTO auto_parts (part_code, category, name, price, stock_quantity, unit, in_stock)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           category = VALUES(category),
           name = VALUES(name),
           unit = VALUES(unit)`,
        [p.part_code, p.category, p.name, p.price, p.stock_quantity, p.unit, p.stock_quantity > 0 ? 1 : 0]
      );
    }
    tableEnsured = true;
  } catch (e) {
    console.warn('Auto parts table initialization warning:', e.message);
  }
};

// GET /api/parts - Fetch all auto parts from MySQL
const getParts = async (req, res) => {
  try {
    await ensureAutoPartsTable();
    const [rows] = await db.query('SELECT * FROM auto_parts ORDER BY category ASC, name ASC');

    // Build catalog grouped format expected by frontend
    const catalog = {};
    rows.forEach((r) => {
      if (!catalog[r.category]) {
        catalog[r.category] = [];
      }
      const numPrice = parseFloat(r.price || 0);
      catalog[r.category].push({
        id: r.part_code || `pt-${r.id}`,
        dbId: r.id,
        name: r.name,
        price: `₱${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        priceNum: numPrice,
        stockQuantity: r.stock_quantity,
        unit: r.unit || 'Piece',
        inStock: r.stock_quantity > 0,
        category: r.category,
      });
    });

    return res.json({ catalog, parts: rows });
  } catch (error) {
    console.error('Error fetching auto parts from MySQL DB:', error);
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/parts - Create a new auto part in MySQL
const createPart = async (req, res) => {
  try {
    await ensureAutoPartsTable();
    const { name, category, price, stockQuantity, unit, part_code } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Part name and category are required.' });
    }

    const numPrice = typeof price === 'number' ? price : parseFloat((price || '0').replace(/[^0-9.-]+/g, '') || 0);
    const numStock = parseInt(stockQuantity, 10) || 0;
    const unitVal = unit || 'Piece';

    const words = category.split(' ');
    const prefix = words.map((w) => w[0]).join('').toLowerCase().slice(0, 3) || 'pt';
    const generatedCode = part_code || `${prefix}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 89)}`;

    const [result] = await db.query(
      `INSERT INTO auto_parts (part_code, category, name, price, stock_quantity, unit, in_stock)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         category = VALUES(category),
         name = VALUES(name),
         price = VALUES(price),
         stock_quantity = stock_quantity + VALUES(stock_quantity),
         unit = VALUES(unit),
         in_stock = IF(stock_quantity + VALUES(stock_quantity) > 0, 1, 0)`,
      [generatedCode, category, name, numPrice, numStock, unitVal, numStock > 0 ? 1 : 0]
    );

    const insertedPart = {
      id: generatedCode,
      dbId: result.insertId,
      part_code: generatedCode,
      name,
      category,
      price: `₱${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      priceNum: numPrice,
      stockQuantity: numStock,
      unit: unitVal,
      inStock: numStock > 0,
    };

    return res.status(201).json(insertedPart);
  } catch (error) {
    console.error('Error creating auto part in MySQL DB:', error);
    return res.status(500).json({ error: error.message });
  }
};

// PUT /api/parts/stock - Update stock level or Delta stock
const updatePartStock = async (req, res) => {
  try {
    await ensureAutoPartsTable();
    const { name, part_code, delta, stockQuantity } = req.body;

    if (!name && !part_code) {
      return res.status(400).json({ error: 'Part name or part_code is required.' });
    }

    let query = '';
    let params = [];

    if (stockQuantity !== undefined && stockQuantity !== null) {
      const newStock = Math.max(0, parseInt(stockQuantity, 10) || 0);
      if (part_code) {
        query = 'UPDATE auto_parts SET stock_quantity = ?, in_stock = ? WHERE part_code = ?';
        params = [newStock, newStock > 0 ? 1 : 0, part_code];
      } else {
        query = 'UPDATE auto_parts SET stock_quantity = ?, in_stock = ? WHERE name = ?';
        params = [newStock, newStock > 0 ? 1 : 0, name];
      }
    } else if (delta !== undefined && delta !== null) {
      const numDelta = parseInt(delta, 10) || 0;
      if (part_code) {
        query = 'UPDATE auto_parts SET stock_quantity = GREATEST(0, stock_quantity + ?), in_stock = IF(stock_quantity + ? > 0, 1, 0) WHERE part_code = ?';
        params = [numDelta, numDelta, part_code];
      } else {
        query = 'UPDATE auto_parts SET stock_quantity = GREATEST(0, stock_quantity + ?), in_stock = IF(stock_quantity + ? > 0, 1, 0) WHERE name = ?';
        params = [numDelta, numDelta, name];
      }
    } else {
      return res.status(400).json({ error: 'Provide stockQuantity or delta.' });
    }

    await db.query(query, params);
    return res.json({ message: 'Auto part stock successfully updated in MySQL database.' });
  } catch (error) {
    console.error('Error updating part stock in MySQL DB:', error);
    return res.status(500).json({ error: error.message });
  }
};

// DELETE /api/parts/:id - Delete an auto part from MySQL DB
const deletePart = async (req, res) => {
  try {
    await ensureAutoPartsTable();
    const partId = req.params.id;

    await db.query('DELETE FROM auto_parts WHERE id = ? OR part_code = ?', [partId, partId]);
    return res.json({ message: 'Auto part successfully deleted from MySQL database.' });
  } catch (error) {
    console.error('Error deleting part from MySQL DB:', error);
    return res.status(500).json({ error: error.message });
  }
};

// PUT /api/parts/price - Update unit price of an auto part in MySQL database
const updatePartPrice = async (req, res) => {
  try {
    await ensureAutoPartsTable();
    const { id, part_code, name, price } = req.body;

    const numPrice = typeof price === 'number'
      ? price
      : parseFloat((price || '0').toString().replace(/[^0-9.-]+/g, '') || 0);

    if (isNaN(numPrice)) {
      return res.status(400).json({ error: 'Valid price value is required.' });
    }

    const codeOrId = String(part_code || id || '').trim();
    const partName = String(name || '').trim();

    let result;

    if (codeOrId && !isNaN(parseInt(codeOrId, 10)) && String(parseInt(codeOrId, 10)) === codeOrId) {
      // It's an integer primary key ID (e.g. 1, 2, 15)
      const numId = parseInt(codeOrId, 10);
      [result] = await db.query(
        'UPDATE auto_parts SET price = ? WHERE id = ?',
        [numPrice, numId]
      );
    } else if (codeOrId) {
      // It's a string part code (e.g. 'ac-03')
      [result] = await db.query(
        'UPDATE auto_parts SET price = ? WHERE part_code = ? OR name = ?',
        [numPrice, codeOrId, partName || codeOrId]
      );
    } else if (partName) {
      // It's a part name
      [result] = await db.query(
        'UPDATE auto_parts SET price = ? WHERE name = ?',
        [numPrice, partName]
      );
    } else {
      return res.status(400).json({ error: 'part ID, part_code, or name is required.' });
    }

    return res.json({
      message: 'Auto part price successfully updated in MySQL database.',
      price: numPrice,
      affectedRows: result ? result.affectedRows : 0,
    });
  } catch (error) {
    console.error('Error updating part price in MySQL DB:', error);
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/parts/seed - Force re-seed default auto parts into MySQL DB
const seedParts = async (req, res) => {
  try {
    await ensureAutoPartsTable();
    for (const p of INITIAL_AUTO_PARTS) {
      await db.query(
        `INSERT INTO auto_parts (part_code, category, name, price, stock_quantity, unit, in_stock)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity), price = VALUES(price)`,
        [p.part_code, p.category, p.name, p.price, p.stock_quantity, p.unit, p.stock_quantity > 0 ? 1 : 0]
      );
    }
    return res.json({ message: 'Auto parts successfully seeded into MySQL database!' });
  } catch (error) {
    console.error('Error seeding parts into MySQL DB:', error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  ensureAutoPartsTable,
  getParts,
  createPart,
  updatePartStock,
  updatePartPrice,
  deletePart,
  seedParts,
};
