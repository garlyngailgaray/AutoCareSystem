const { db } = require('../db/database');

const formatCurrency = (val) => {
  const num = typeof val === 'number' ? val : parseFloat(val || 0);
  return `₱${(isNaN(num) ? 0 : num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const parseVal = (valStr) => {
  if (typeof valStr === 'number') return valStr;
  if (!valStr) return 0;
  return parseFloat(valStr.toString().replace(/[^0-9.-]+/g, '') || 0);
};

const formatDateForApi = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return null;
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${dateVal.getFullYear()}-${pad(dateVal.getMonth() + 1)}-${pad(dateVal.getDate())} ${pad(dateVal.getHours())}:${pad(dateVal.getMinutes())}:${pad(dateVal.getSeconds())}`;
  }
  return dateVal.toString();
};

const INITIAL_JOB_ORDERS = [
  {
    id: 21,
    client_name: 'Mike Gerald Bacasmas',
    client_username: 'clt_mikegerald303',
    client_custom_id: 'CLT-303',
    client_phone: '09631371882',
    vehicle_name: 'Toyota Vios',
    plate_number: 'BCS-303',
    service_category: 'Brake & Suspension Overhaul',
    problem_description: 'no brake response, pedal sinks to floor',
    assigned_mechanic: 'Dave Garay',
    status: 'PENDING',
    service_fee: 2800.00,
    labor_fee: 700.00,
    total_price: 7500.00,
    amount_paid: 0.00,
    balance: 7500.00,
    invoice_status: 'UNPAID',
    date_time: '2026-09-15 14:30:12',
    mechanic_notes: 'Job order reported by Front Desk. Assigned technician waiting to start repair.',
    manager_notified_cashier: 0,
    used_parts: JSON.stringify(['2x Ceramic Front Brake Pads (Pair)', '1x DOT4 Hydraulic Brake Fluid (500ml)']),
  },
  {
    id: 20,
    client_name: 'Mike Gerald Bacasmas',
    client_username: 'clt_mikegerald303',
    client_custom_id: 'CLT-303',
    client_phone: '09631371882',
    vehicle_name: 'Toyota Vios',
    plate_number: 'BCS-303',
    service_category: 'Change Oil & Maintenance',
    problem_description: 'routine oil filter maintenance',
    assigned_mechanic: 'Dave Garay',
    status: 'COMPLETED',
    service_fee: 1800.00,
    labor_fee: 350.00,
    total_price: 4300.00,
    amount_paid: 4300.00,
    balance: 0.00,
    invoice_status: 'PAID',
    date_time: '2026-09-12 10:15:00',
    mechanic_notes: 'Synthetic oil 5W-30 and high flow oil filter replaced.',
    manager_notified_cashier: 1,
    cashier_name: 'Lovielle Garay',
    used_parts: JSON.stringify(['1x Fully Synthetic Engine Oil 5W-30 (4L)', '1x OEM High-Flow Oil Filter']),
  },
  {
    id: 19,
    client_name: 'Lucky Garay',
    client_username: 'lucky_garay',
    client_custom_id: 'CLT-302',
    client_phone: '09966009233',
    vehicle_name: 'Van',
    plate_number: 'GRY-633',
    service_category: 'Body Paint & Refinishing',
    problem_description: 'body paint fade and minor scratches',
    assigned_mechanic: 'Christian Brina',
    status: 'COMPLETED',
    service_fee: 15000.00,
    labor_fee: 4000.00,
    total_price: 26700.00,
    amount_paid: 26700.00,
    balance: 0.00,
    invoice_status: 'PAID',
    date_time: '2026-09-15 16:14:38',
    mechanic_notes: 'Full oven-baked respray and ceramic glaze wax completed.',
    manager_notified_cashier: 1,
    cashier_name: 'Lovielle Garay',
    used_parts: JSON.stringify(['1x Oven-Baked Automotive Primer Paint', '1x High-Gloss Ceramic Clear Coat Glaze']),
  },
  {
    id: 15,
    client_name: 'Claire Deliman',
    client_username: 'CLT-4',
    client_custom_id: 'CLT-301',
    client_phone: '09090909090',
    vehicle_name: 'Ford Ranger',
    plate_number: 'GRY-768',
    service_category: 'Engine Overhauling',
    problem_description: 'engine knocking noise',
    assigned_mechanic: 'Dave Garay',
    status: 'COMPLETED',
    service_fee: 9500.00,
    labor_fee: 3000.00,
    total_price: 19800.00,
    amount_paid: 19800.00,
    balance: 0.00,
    invoice_status: 'PAID',
    date_time: '2026-09-05 09:37:56',
    mechanic_notes: 'Engine head resurfaced and piston rings replaced.',
    manager_notified_cashier: 1,
    cashier_name: 'Claire Deliman',
    used_parts: JSON.stringify(['1x Precision Piston Ring Set', '1x Multi-Layer Steel Head Gasket']),
  },
  {
    id: 14,
    client_name: 'Lucky Garay',
    client_username: 'lucky_garay',
    client_custom_id: 'CLT-302',
    client_phone: '09966009233',
    vehicle_name: 'Royce',
    plate_number: 'CSS-742',
    service_category: 'Brake & Suspension Overhaul',
    problem_description: 'brake squeal noise',
    assigned_mechanic: 'Christian Brina',
    status: 'CANCELLED',
    service_fee: 800.00,
    labor_fee: 0.00,
    total_price: 800.00,
    amount_paid: 800.00,
    balance: 0.00,
    invoice_status: 'PAID',
    date_time: '2026-09-05 23:07:01',
    mechanic_notes: 'Client requested cancellation after inspection.',
    manager_notified_cashier: 1,
    cashier_name: 'Lovielle Garay',
    used_parts: JSON.stringify(['1x Ceramic Front Brake Pads (Pair)']),
  },
  {
    id: 10,
    client_name: 'Lucky Garay',
    client_username: 'lucky_garay',
    client_custom_id: 'CLT-302',
    client_phone: '09966009233',
    vehicle_name: 'Royce',
    plate_number: 'CSS-742',
    service_category: 'Air Conditioning Services',
    problem_description: 'aircon not cooling',
    assigned_mechanic: 'Christian Brina',
    status: 'COMPLETED',
    service_fee: 1000.00,
    labor_fee: 5000.00,
    total_price: 6800.00,
    amount_paid: 6800.00,
    balance: 0.00,
    invoice_status: 'PAID',
    date_time: '2026-08-28 11:21:23',
    mechanic_notes: 'Refrigerant leak repaired and system recharged.',
    manager_notified_cashier: 1,
    cashier_name: 'Lovielle Garay',
    used_parts: JSON.stringify(['1x R134a Refrigerant Gas Refill']),
  },
  {
    id: 8,
    client_name: 'Claire Deliman',
    client_username: 'CLT-4',
    client_custom_id: 'CLT-301',
    client_phone: '09090909090',
    vehicle_name: 'Ford Ranger',
    plate_number: 'GRY-768',
    service_category: 'Air Conditioning Services',
    problem_description: 'aircon refrigerant leak',
    assigned_mechanic: 'Christian Brina',
    status: 'COMPLETED',
    service_fee: 1000.00,
    labor_fee: 5000.00,
    total_price: 6800.00,
    amount_paid: 6800.00,
    balance: 0.00,
    invoice_status: 'PAID',
    date_time: '2026-08-27 18:45:10',
    mechanic_notes: 'Evaporator coil serviced and gas topped up.',
    manager_notified_cashier: 1,
    cashier_name: 'Claire Deliman',
    used_parts: JSON.stringify(['1x R134a Refrigerant Gas Refill']),
  },
  {
    id: 7,
    client_name: 'Claire Deliman',
    client_username: 'CLT-4',
    client_custom_id: 'CLT-301',
    client_phone: '09090909090',
    vehicle_name: 'Ford Ranger',
    plate_number: 'GRY-768',
    service_category: 'Change Oil & Maintenance',
    problem_description: 'routine oil change maintenance',
    assigned_mechanic: 'Dave Garay',
    status: 'COMPLETED',
    service_fee: 1800.00,
    labor_fee: 350.00,
    total_price: 3950.00,
    amount_paid: 3950.00,
    balance: 0.00,
    invoice_status: 'PAID',
    date_time: '2026-08-27 22:21:29',
    mechanic_notes: 'Regular periodic maintenance service completed.',
    manager_notified_cashier: 1,
    cashier_name: 'Lovielle Garay',
    used_parts: JSON.stringify(['1x Fully Synthetic Engine Oil 5W-30 (4L)']),
  },
];

let tableEnsured = false;
const ensureBillingTables = async () => {
  if (tableEnsured) return;
  try {
    // 1. Table for Job Orders & Invoices in MySQL
    await db.query(`
      CREATE TABLE IF NOT EXISTS job_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_name VARCHAR(150) NOT NULL,
        client_username VARCHAR(100) DEFAULT '',
        client_custom_id VARCHAR(50) DEFAULT '',
        client_phone VARCHAR(50) DEFAULT '',
        vehicle_name VARCHAR(150) NOT NULL,
        plate_number VARCHAR(50) NOT NULL,
        service_category VARCHAR(150) NOT NULL,
        problem_description TEXT,
        assigned_mechanic VARCHAR(150) DEFAULT '',
        status VARCHAR(50) DEFAULT 'PENDING',
        service_fee DECIMAL(10, 2) NOT NULL DEFAULT 2800.00,
        labor_fee DECIMAL(10, 2) NOT NULL DEFAULT 700.00,
        total_price DECIMAL(10, 2) NOT NULL DEFAULT 3500.00,
        amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        balance DECIMAL(10, 2) NOT NULL DEFAULT 3500.00,
        invoice_status VARCHAR(50) DEFAULT 'UNPAID',
        date_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        mechanic_notes TEXT,
        manager_notified_cashier TINYINT(1) DEFAULT 0,
        cashier_name VARCHAR(150) DEFAULT NULL,
        payment_method VARCHAR(50) DEFAULT 'CASH',
        used_parts TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Migrate any existing VARCHAR financial/date columns in job_orders
    try {
      const [joCols] = await db.query('SHOW COLUMNS FROM job_orders');
      const serviceFeeCol = joCols.find((c) => c.Field === 'service_fee');
      if (serviceFeeCol && serviceFeeCol.Type.toLowerCase().includes('varchar')) {
        await db.query(`
          UPDATE job_orders SET
            service_fee = REPLACE(REPLACE(REPLACE(service_fee, '₱', ''), ',', ''), ' ', ''),
            labor_fee = REPLACE(REPLACE(REPLACE(labor_fee, '₱', ''), ',', ''), ' ', ''),
            total_price = REPLACE(REPLACE(REPLACE(total_price, '₱', ''), ',', ''), ' ', ''),
            amount_paid = REPLACE(REPLACE(REPLACE(amount_paid, '₱', ''), ',', ''), ' ', ''),
            balance = REPLACE(REPLACE(REPLACE(balance, '₱', ''), ',', ''), ' ', '')
        `);
        await db.query(`
          ALTER TABLE job_orders
            MODIFY COLUMN service_fee DECIMAL(10, 2) NOT NULL DEFAULT 2800.00,
            MODIFY COLUMN labor_fee DECIMAL(10, 2) NOT NULL DEFAULT 700.00,
            MODIFY COLUMN total_price DECIMAL(10, 2) NOT NULL DEFAULT 3500.00,
            MODIFY COLUMN amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            MODIFY COLUMN balance DECIMAL(10, 2) NOT NULL DEFAULT 3500.00
        `);
        console.log('✅ Migrated MySQL job_orders table financial columns to DECIMAL(10, 2)!');
      }

      const dtCol = joCols.find((c) => c.Field === 'date_time');
      if (dtCol && dtCol.Type.toLowerCase().includes('varchar')) {
        await db.query(`UPDATE job_orders SET date_time = NULL WHERE date_time = '' OR date_time = 'null' OR date_time = 'Recently'`);
        await db.query(`ALTER TABLE job_orders MODIFY COLUMN date_time DATETIME DEFAULT CURRENT_TIMESTAMP`);
        console.log('✅ Migrated MySQL job_orders.date_time to DATETIME!');
      }
    } catch (eMigJo) {
      console.warn('Job orders column type migration notice:', eMigJo.message);
    }

    // 2. Table for Payment Transaction History in MySQL
    await db.query(`
      CREATE TABLE IF NOT EXISTS payment_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_order_id INT NOT NULL,
        client_name VARCHAR(150) NOT NULL,
        client_username VARCHAR(100) DEFAULT '',
        client_custom_id VARCHAR(50) DEFAULT '',
        vehicle_name VARCHAR(150) DEFAULT '',
        plate_number VARCHAR(50) DEFAULT '',
        service_category VARCHAR(150) DEFAULT '',
        payment_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        total_paid_to_date DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        remaining_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        cash_tendered DECIMAL(10, 2) DEFAULT 0.00,
        change_due DECIMAL(10, 2) DEFAULT 0.00,
        payment_type VARCHAR(50) DEFAULT 'FULL PAYMENT',
        payment_method VARCHAR(50) DEFAULT 'CASH',
        cashier_name VARCHAR(150) DEFAULT 'Lovielle Garay',
        payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Migrate any existing VARCHAR financial/date columns in payment_history
    try {
      const [phCols] = await db.query('SHOW COLUMNS FROM payment_history');
      const paymentAmountCol = phCols.find((c) => c.Field === 'payment_amount');
      if (paymentAmountCol && paymentAmountCol.Type.toLowerCase().includes('varchar')) {
        await db.query(`
          UPDATE IGNORE payment_history SET
            payment_amount = IF(payment_amount = '' OR payment_amount IS NULL OR payment_amount = 'null', '0', REPLACE(REPLACE(REPLACE(payment_amount, '₱', ''), ',', ''), ' ', '')),
            total_paid_to_date = IF(total_paid_to_date = '' OR total_paid_to_date IS NULL OR total_paid_to_date = 'null', '0', REPLACE(REPLACE(REPLACE(total_paid_to_date, '₱', ''), ',', ''), ' ', '')),
            remaining_balance = IF(remaining_balance = '' OR remaining_balance IS NULL OR remaining_balance = 'null', '0', REPLACE(REPLACE(REPLACE(remaining_balance, '₱', ''), ',', ''), ' ', '')),
            cash_tendered = IF(cash_tendered = '' OR cash_tendered IS NULL OR cash_tendered = 'null', '0', REPLACE(REPLACE(REPLACE(cash_tendered, '₱', ''), ',', ''), ' ', '')),
            change_due = IF(change_due = '' OR change_due IS NULL OR change_due = 'null', '0', REPLACE(REPLACE(REPLACE(change_due, '₱', ''), ',', ''), ' ', ''))
        `);
        await db.query(`
          ALTER TABLE payment_history
            MODIFY COLUMN payment_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            MODIFY COLUMN total_paid_to_date DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            MODIFY COLUMN remaining_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            MODIFY COLUMN cash_tendered DECIMAL(10, 2) DEFAULT 0.00,
            MODIFY COLUMN change_due DECIMAL(10, 2) DEFAULT 0.00
        `);
        console.log('✅ Migrated MySQL payment_history table financial columns to DECIMAL(10, 2)!');
      }

      const pdCol = phCols.find((c) => c.Field === 'payment_date');
      if (pdCol && pdCol.Type.toLowerCase().includes('varchar')) {
        await db.query(`UPDATE IGNORE payment_history SET payment_date = NULL WHERE payment_date = '' OR payment_date = 'null' OR payment_date = 'Recently'`);
        await db.query(`ALTER TABLE payment_history MODIFY COLUMN payment_date DATETIME DEFAULT CURRENT_TIMESTAMP`);
        console.log('✅ Migrated MySQL payment_history.payment_date to DATETIME!');
      }
    } catch (eMigPh) {
      console.warn('Payment history column type migration notice:', eMigPh.message);
    }

    // 3. Table for Complete Billing & Invoice History in MySQL
    await db.query(`
      CREATE TABLE IF NOT EXISTS billing_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_order_id INT NOT NULL,
        invoice_number VARCHAR(50) NOT NULL,
        client_name VARCHAR(150) NOT NULL,
        client_username VARCHAR(100) DEFAULT '',
        client_custom_id VARCHAR(50) DEFAULT '',
        vehicle_name VARCHAR(150) DEFAULT '',
        plate_number VARCHAR(50) DEFAULT '',
        service_category VARCHAR(150) DEFAULT '',
        action_type VARCHAR(100) NOT NULL,
        service_fee DECIMAL(10, 2) DEFAULT 0.00,
        labor_fee DECIMAL(10, 2) DEFAULT 0.00,
        total_price DECIMAL(10, 2) DEFAULT 0.00,
        amount_paid DECIMAL(10, 2) DEFAULT 0.00,
        balance DECIMAL(10, 2) DEFAULT 0.00,
        invoice_status VARCHAR(50) DEFAULT 'UNPAID',
        notes TEXT,
        actor_name VARCHAR(150) DEFAULT 'System',
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Migrate any existing VARCHAR financial/date columns in billing_history
    try {
      const [bhCols] = await db.query('SHOW COLUMNS FROM billing_history');
      const serviceFeeColBh = bhCols.find((c) => c.Field === 'service_fee');
      if (serviceFeeColBh && serviceFeeColBh.Type.toLowerCase().includes('varchar')) {
        await db.query(`
          UPDATE billing_history SET
            service_fee = REPLACE(REPLACE(REPLACE(service_fee, '₱', ''), ',', ''), ' ', ''),
            labor_fee = REPLACE(REPLACE(REPLACE(labor_fee, '₱', ''), ',', ''), ' ', ''),
            total_price = REPLACE(REPLACE(REPLACE(total_price, '₱', ''), ',', ''), ' ', ''),
            amount_paid = REPLACE(REPLACE(REPLACE(amount_paid, '₱', ''), ',', ''), ' ', ''),
            balance = REPLACE(REPLACE(REPLACE(balance, '₱', ''), ',', ''), ' ', '')
        `);
        await db.query(`
          ALTER TABLE billing_history
            MODIFY COLUMN service_fee DECIMAL(10, 2) DEFAULT 0.00,
            MODIFY COLUMN labor_fee DECIMAL(10, 2) DEFAULT 0.00,
            MODIFY COLUMN total_price DECIMAL(10, 2) DEFAULT 0.00,
            MODIFY COLUMN amount_paid DECIMAL(10, 2) DEFAULT 0.00,
            MODIFY COLUMN balance DECIMAL(10, 2) DEFAULT 0.00
        `);
        console.log('✅ Migrated MySQL billing_history table financial columns to DECIMAL(10, 2)!');
      }

      const raCol = bhCols.find((c) => c.Field === 'recorded_at');
      if (raCol && raCol.Type.toLowerCase().includes('varchar')) {
        await db.query(`UPDATE billing_history SET recorded_at = NULL WHERE recorded_at = '' OR recorded_at = 'null'`);
        await db.query(`ALTER TABLE billing_history MODIFY COLUMN recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
        console.log('✅ Migrated MySQL billing_history.recorded_at to DATETIME!');
      }
    } catch (eMigBh) {
      console.warn('Billing history column type migration notice:', eMigBh.message);
    }

    // Safely add Foreign Key Constraints on payment_history and billing_history pointing to job_orders(id)
    try {
      const [fkPh] = await db.query(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_history' AND CONSTRAINT_NAME = 'fk_payment_history_job_order'
      `);
      if (!fkPh || fkPh.length === 0) {
        await db.query(`DELETE FROM payment_history WHERE job_order_id NOT IN (SELECT id FROM job_orders)`);
        await db.query(`ALTER TABLE payment_history ADD CONSTRAINT fk_payment_history_job_order FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE CASCADE ON UPDATE CASCADE`);
        console.log('✅ Added Foreign Key Constraint fk_payment_history_job_order on payment_history table!');
      }
    } catch (eFkPh) {
      console.warn('Payment history FK notice:', eFkPh.message);
    }

    try {
      const [fkBh] = await db.query(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'billing_history' AND CONSTRAINT_NAME = 'fk_billing_history_job_order'
      `);
      if (!fkBh || fkBh.length === 0) {
        await db.query(`DELETE FROM billing_history WHERE job_order_id NOT IN (SELECT id FROM job_orders)`);
        await db.query(`ALTER TABLE billing_history ADD CONSTRAINT fk_billing_history_job_order FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE CASCADE ON UPDATE CASCADE`);
        console.log('✅ Added Foreign Key Constraint fk_billing_history_job_order on billing_history table!');
      }
    } catch (eFkBh) {
      console.warn('Billing history FK notice:', eFkBh.message);
    }

    // 4. Table for Availed Services in MySQL (stores who availed which service and links to job order)
    await db.query(`
      CREATE TABLE IF NOT EXISTS availed_services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_order_id INT DEFAULT NULL,
        service_request_id INT DEFAULT NULL,
        client_name VARCHAR(150) NOT NULL,
        client_username VARCHAR(100) DEFAULT '',
        client_custom_id VARCHAR(50) DEFAULT '',
        client_phone VARCHAR(50) DEFAULT '',
        vehicle_name VARCHAR(150) DEFAULT '',
        plate_number VARCHAR(50) DEFAULT '',
        service_category VARCHAR(150) NOT NULL,
        problem_description TEXT,
        service_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        labor_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'PENDING',
        assigned_mechanic VARCHAR(150) DEFAULT '',
        availed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_job_order_id (job_order_id),
        INDEX idx_client_username (client_username),
        INDEX idx_client_custom_id (client_custom_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure all initial job orders & history logs exist in MySQL DB
    for (const jo of INITIAL_JOB_ORDERS) {
      const sFee = parseVal(jo.service_fee);
      const lFee = parseVal(jo.labor_fee);
      const tPrice = parseVal(jo.total_price);
      const aPaid = parseVal(jo.amount_paid);
      const bal = parseVal(jo.balance);

      await db.query(
        `INSERT INTO job_orders (
          id, client_name, client_username, client_custom_id, client_phone,
          vehicle_name, plate_number, service_category, problem_description,
          assigned_mechanic, status, service_fee, labor_fee, total_price,
          amount_paid, balance, invoice_status, date_time, mechanic_notes,
          manager_notified_cashier, cashier_name, used_parts
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          client_name = VALUES(client_name),
          client_username = VALUES(client_username),
          client_custom_id = VALUES(client_custom_id),
          client_phone = VALUES(client_phone),
          vehicle_name = VALUES(vehicle_name),
          plate_number = VALUES(plate_number),
          service_category = VALUES(service_category),
          problem_description = VALUES(problem_description),
          assigned_mechanic = VALUES(assigned_mechanic),
          status = VALUES(status),
          service_fee = VALUES(service_fee),
          labor_fee = VALUES(labor_fee),
          total_price = VALUES(total_price),
          amount_paid = VALUES(amount_paid),
          balance = VALUES(balance),
          invoice_status = VALUES(invoice_status),
          date_time = VALUES(date_time),
          mechanic_notes = VALUES(mechanic_notes),
          manager_notified_cashier = VALUES(manager_notified_cashier),
          cashier_name = VALUES(cashier_name),
          used_parts = VALUES(used_parts)`,
        [
          jo.id,
          jo.client_name,
          jo.client_username,
          jo.client_custom_id,
          jo.client_phone,
          jo.vehicle_name,
          jo.plate_number,
          jo.service_category,
          jo.problem_description,
          jo.assigned_mechanic,
          jo.status,
          sFee,
          lFee,
          tPrice,
          aPaid,
          bal,
          jo.invoice_status,
          jo.date_time,
          jo.mechanic_notes,
          jo.manager_notified_cashier,
          jo.cashier_name || null,
          jo.used_parts,
        ]
      );

      // Seed initial billing history entry
      await recordBillingHistoryLog({
        job_order_id: jo.id,
        invoice_number: `INV-2026-0${jo.id}`,
        client_name: jo.client_name,
        client_username: jo.client_username,
        client_custom_id: jo.client_custom_id,
        vehicle_name: jo.vehicle_name,
        plate_number: jo.plate_number,
        service_category: jo.service_category,
        action_type: jo.invoice_status === 'PAID' ? 'FULL_PAYMENT' : 'BILL_CREATED',
        service_fee: sFee,
        labor_fee: lFee,
        total_price: tPrice,
        amount_paid: aPaid,
        balance: bal,
        invoice_status: jo.invoice_status,
        notes: jo.mechanic_notes,
        actor_name: jo.cashier_name || 'Front Desk',
        recorded_at: jo.date_time,
      });

      // Also seed payment history for paid initial jobs
      if (jo.invoice_status === 'PAID') {
        const [phRows] = await db.query('SELECT COUNT(*) as count FROM payment_history WHERE job_order_id = ?', [jo.id]);
        if (phRows && phRows[0] && phRows[0].count === 0) {
          await db.query(
            `INSERT INTO payment_history (
              job_order_id, client_name, client_username, client_custom_id,
              vehicle_name, plate_number, service_category, payment_amount,
              total_paid_to_date, remaining_balance, cashier_name, payment_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, ?, ?)`,
            [
              jo.id,
              jo.client_name,
              jo.client_username,
              jo.client_custom_id,
              jo.vehicle_name,
              jo.plate_number,
              jo.service_category,
              tPrice,
              tPrice,
              jo.cashier_name || 'Lovielle Garay',
              jo.date_time,
            ]
          );
        }
      }
    }

    // Sync/seed all existing job orders into availed_services table if not already present or updated
    try {
      const [allJobs] = await db.query('SELECT * FROM job_orders');
      for (const j of allJobs) {
        const [existing] = await db.query('SELECT id FROM availed_services WHERE job_order_id = ?', [j.id]);
        if (existing && existing.length > 0) {
          await db.query(
            `UPDATE availed_services SET
               client_name = ?,
               client_username = ?,
               client_custom_id = ?,
               client_phone = ?,
               vehicle_name = ?,
               plate_number = ?,
               service_category = ?,
               problem_description = ?,
               service_fee = ?,
               labor_fee = ?,
               total_price = ?,
               status = ?,
               assigned_mechanic = ?,
               availed_at = ?
             WHERE job_order_id = ?`,
            [
              j.client_name,
              j.client_username,
              j.client_custom_id,
              j.client_phone,
              j.vehicle_name,
              j.plate_number,
              j.service_category,
              j.problem_description,
              j.service_fee,
              j.labor_fee,
              j.total_price,
              j.status,
              j.assigned_mechanic,
              j.date_time || j.created_at,
              j.id,
            ]
          );
        } else {
          await recordAvailedServiceLog({
            job_order_id: j.id,
            client_name: j.client_name,
            client_username: j.client_username,
            client_custom_id: j.client_custom_id,
            client_phone: j.client_phone,
            vehicle_name: j.vehicle_name,
            plate_number: j.plate_number,
            service_category: j.service_category,
            problem_description: j.problem_description,
            service_fee: j.service_fee,
            labor_fee: j.labor_fee,
            total_price: j.total_price,
            status: j.status,
            assigned_mechanic: j.assigned_mechanic,
            availed_at: j.date_time || j.created_at,
          });
        }
      }
      console.log('✅ All job order histories verified and stored in MySQL job_orders & availed_services tables!');
    } catch (eSync) {
      console.warn('Availed services sync notice:', eSync.message);
    }

    // Ensure AUTO_INCREMENT starts above highest seeded ID to avoid primary key collisions
    try {
      const [maxRow] = await db.query('SELECT MAX(id) as maxId FROM job_orders');
      const maxId = maxRow[0]?.maxId || 0;
      const nextAutoInc = Math.max(100, maxId + 1);
      await db.query(`ALTER TABLE job_orders AUTO_INCREMENT = ${nextAutoInc}`);
      console.log(`✅ Set job_orders AUTO_INCREMENT to ${nextAutoInc}`);
    } catch (eAuto) {
      console.warn('Job orders auto increment reset notice:', eAuto.message);
    }

    tableEnsured = true;
  } catch (e) {
    console.warn('Billing & Job orders table initialization warning:', e.message);
  }
};

const recordAvailedServiceLog = async (data, dbConn = null) => {
  const conn = dbConn || db;
  try {
    const numService = parseVal(data.service_fee || data.serviceFee);
    const numLabor = parseVal(data.labor_fee || data.laborFee);
    const numTotal = parseVal(data.total_price || data.totalPrice);

    await conn.query(
      `INSERT INTO availed_services (
        job_order_id, service_request_id, client_name, client_username,
        client_custom_id, client_phone, vehicle_name, plate_number,
        service_category, problem_description, service_fee, labor_fee,
        total_price, status, assigned_mechanic, availed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.job_order_id || null,
        data.service_request_id || null,
        data.client_name || data.clientName || '',
        data.client_username || data.clientUsername || '',
        data.client_custom_id || data.clientCustomId || '',
        data.client_phone || data.clientPhone || '',
        data.vehicle_name || data.vehicleName || '',
        data.plate_number || data.plateNumber || '',
        data.service_category || data.serviceCategory || '',
        data.problem_description || data.problemDescription || '',
        numService,
        numLabor,
        numTotal,
        data.status || 'PENDING',
        data.assigned_mechanic || data.assignedMechanic || '',
        data.availed_at || data.dateTime || new Date(),
      ]
    );
  } catch (e) {
    console.warn('Availed service log warning:', e.message);
  }
};

const recordBillingHistoryLog = async (data, dbConn = null) => {
  const conn = dbConn || db;
  try {
    const numService = parseVal(data.service_fee);
    const numLabor = parseVal(data.labor_fee);
    const numTotal = parseVal(data.total_price);
    const numPaid = parseVal(data.amount_paid);
    const numBal = parseVal(data.balance);

    await conn.query(
      `INSERT INTO billing_history (
        job_order_id, invoice_number, client_name, client_username, client_custom_id,
        vehicle_name, plate_number, service_category, action_type,
        service_fee, labor_fee, total_price, amount_paid, balance,
        invoice_status, notes, actor_name, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.job_order_id,
        data.invoice_number || `INV-2026-0${data.job_order_id}`,
        data.client_name || '',
        data.client_username || '',
        data.client_custom_id || '',
        data.vehicle_name || '',
        data.plate_number || '',
        data.service_category || '',
        data.action_type || 'BILL_UPDATED',
        numService,
        numLabor,
        numTotal,
        numPaid,
        numBal,
        data.invoice_status || 'UNPAID',
        data.notes || '',
        data.actor_name || 'System',
        data.recorded_at || new Date(),
      ]
    );
  } catch (e) {
    console.warn('Billing history log warning:', e.message);
  }
};

const PARTS_PRICE_MAP = {
  'ceramic front brake pads (pair)': 1800,
  'dot4 hydraulic brake fluid (500ml)': 400,
  'vented front brake rotor disc': 2200,
  'heavy-duty gas shock absorber': 3500,
  'fully synthetic engine oil 5w-30 (4l)': 1800,
  'oem high-flow oil filter': 350,
  'engine cabin air filter element': 450,
  'precision piston ring set': 4500,
  'multi-layer steel head gasket': 2800,
  'kevlar reinforced timing belt': 2200,
  'iridium power spark plugs (4x)': 1600,
  'iridium spark plugs (4x)': 1600,
  'r134a refrigerant gas refill': 800,
  'oem rotary ac compressor assembly': 8500,
  'ac condenser cooling coil': 3200,
  'high-density cabin ac filter': 450,
  'oven-baked automotive primer paint': 3500,
  'high-gloss ceramic clear coat glaze': 4200,
  'polyurethane body filler putty': 1200,
  'high-output ignition coil pack': 2400,
  'in-line fuel filter element': 650,
  'front suspension ball joint': 1200,
  'tie rod end & rack end link': 1500,
  'rubber bushing arm set': 900,
};

const calculatePartsTotalBackend = (usedParts) => {
  if (!usedParts) return 0;
  let partsList = [];
  try {
    partsList = typeof usedParts === 'string' ? JSON.parse(usedParts) : usedParts;
  } catch (e) {
    partsList = [];
  }
  if (!Array.isArray(partsList)) return 0;

  let sum = 0;
  partsList.forEach((itemStr) => {
    if (!itemStr) return;
    let qty = 1;
    let name = itemStr.toString().trim();

    if (name.includes('x ')) {
      const parts = name.split('x ');
      qty = parseInt(parts[0], 10) || 1;
      name = parts.slice(1).join('x ').trim();
    }

    const price = PARTS_PRICE_MAP[name.toLowerCase()] || 0;
    sum += price * qty;
  });

  return sum;
};

// GET /api/job-orders - Fetch all job orders & invoices from MySQL
const getJobOrdersApi = async (req, res) => {
  try {
    await ensureBillingTables();
    const [rows] = await db.query('SELECT * FROM job_orders ORDER BY id DESC');

    const formatted = rows.map((r) => {
      let partsList = [];
      try {
        partsList = typeof r.used_parts === 'string' ? JSON.parse(r.used_parts) : r.used_parts || [];
      } catch (e) {
        partsList = [];
      }

      const numService = parseFloat(r.service_fee || 0);
      const numLabor = parseFloat(r.labor_fee || 0);
      const numTotal = parseFloat(r.total_price || 0);
      const numPaid = parseFloat(r.amount_paid || 0);
      const numBal = parseFloat(r.balance || 0);

      return {
        id: r.id,
        clientName: r.client_name,
        clientUsername: r.client_username,
        clientCustomId: r.client_custom_id,
        clientPhone: r.client_phone,
        vehicleName: r.vehicle_name,
        plateNumber: r.plate_number,
        serviceCategory: r.service_category,
        problemDescription: r.problem_description,
        assignedMechanic: r.assigned_mechanic,
        status: r.status,
        serviceFee: formatCurrency(numService),
        laborFee: formatCurrency(numLabor),
        totalPrice: formatCurrency(numTotal),
        amountPaid: formatCurrency(numPaid),
        balance: formatCurrency(numBal),
        serviceFeeNum: numService,
        laborFeeNum: numLabor,
        totalPriceNum: numTotal,
        amountPaidNum: numPaid,
        balanceNum: numBal,
        invoiceStatus: r.invoice_status,
        dateTime: formatDateForApi(r.date_time),
        mechanicNotes: r.mechanic_notes,
        managerNotifiedCashier: Boolean(r.manager_notified_cashier),
        cashierName: r.cashier_name,
        paymentMethod: r.payment_method || 'CASH',
        usedParts: partsList,
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching job orders from MySQL DB:', error);
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/job-orders - Create a new job order in MySQL
const createJobOrderApi = async (req, res) => {
  try {
    await ensureBillingTables();
    const newOrder = req.body || {};

    const clientName = (newOrder.clientName || newOrder.client_name || '').trim() || 'Client Customer';
    const clientUsername = (newOrder.clientUsername || newOrder.client_username || '').trim();
    const clientCustomId = (newOrder.clientCustomId || newOrder.client_custom_id || '').trim();
    const clientPhone = (newOrder.clientPhone || newOrder.client_phone || '').trim() || '09123456789';
    const vehicleName = (newOrder.vehicleName || newOrder.vehicle_name || '').trim() || 'Client Vehicle';
    const plateNumber = (newOrder.plateNumber || newOrder.plate_number || '').trim() || 'N/A';
    const serviceCategory = (newOrder.serviceCategory || newOrder.service_category || '').trim() || 'Change Oil & Maintenance';
    const problemDescription = (newOrder.problemDescription || newOrder.problem_description || '').trim() || 'Job Order reported by Front Desk.';
    const assignedMechanic = (newOrder.assignedMechanic || newOrder.assigned_mechanic || '').trim() || 'Dave Garay';
    const mechanicNotes = (newOrder.mechanicNotes || newOrder.mechanic_notes || '').trim() || 'Job Order reported by Front Desk.';

    const numService = parseVal(newOrder.serviceFee || newOrder.service_fee || 2800);
    const numLabor = parseVal(newOrder.laborFee || newOrder.labor_fee || 700);
    const usedPartsInput = newOrder.usedParts || newOrder.used_parts || [];
    const partsSum = calculatePartsTotalBackend(usedPartsInput);
    const usedPartsJson = JSON.stringify(Array.isArray(usedPartsInput) ? usedPartsInput : [usedPartsInput]);

    const overallTotal = numService + numLabor + partsSum;
    const now = new Date();

    const [result] = await db.query(
      `INSERT INTO job_orders (
        client_name, client_username, client_custom_id, client_phone,
        vehicle_name, plate_number, service_category, problem_description,
        assigned_mechanic, status, service_fee, labor_fee, total_price,
        amount_paid, balance, invoice_status, date_time, mechanic_notes,
        manager_notified_cashier, used_parts
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, 0.00, ?, 'UNPAID', ?, ?, 0, ?)`,
      [
        clientName,
        clientUsername,
        clientCustomId,
        clientPhone,
        vehicleName,
        plateNumber,
        serviceCategory,
        problemDescription,
        assignedMechanic,
        numService,
        numLabor,
        overallTotal,
        overallTotal,
        now,
        mechanicNotes,
        usedPartsJson,
      ]
    );

    const createdId = result.insertId;
    console.log(`✅ Stored new Job Order #${createdId} into MySQL database table 'job_orders' successfully.`);

    // Record Billing History Entry in MySQL DB
    await recordBillingHistoryLog({
      job_order_id: createdId,
      invoice_number: `INV-2026-0${createdId}`,
      client_name: clientName,
      client_username: clientUsername,
      client_custom_id: clientCustomId,
      vehicle_name: vehicleName,
      plate_number: plateNumber,
      service_category: serviceCategory,
      action_type: 'BILL_CREATED',
      service_fee: numService,
      labor_fee: numLabor,
      total_price: overallTotal,
      amount_paid: 0.00,
      balance: overallTotal,
      invoice_status: 'UNPAID',
      notes: mechanicNotes,
      actor_name: 'Front Desk',
      recorded_at: now,
    });

    // Record Availed Service Entry in MySQL DB
    await recordAvailedServiceLog({
      job_order_id: createdId,
      client_name: clientName,
      client_username: clientUsername,
      client_custom_id: clientCustomId,
      client_phone: clientPhone,
      vehicle_name: vehicleName,
      plate_number: plateNumber,
      service_category: serviceCategory,
      problem_description: problemDescription,
      service_fee: numService,
      labor_fee: numLabor,
      total_price: overallTotal,
      status: 'PENDING',
      assigned_mechanic: assignedMechanic,
      availed_at: now,
    });

    const created = {
      id: createdId,
      clientName,
      clientUsername,
      clientCustomId,
      clientPhone,
      vehicleName,
      plateNumber,
      serviceCategory,
      problemDescription,
      assignedMechanic,
      status: 'PENDING',
      serviceFee: formatCurrency(numService),
      laborFee: formatCurrency(numLabor),
      totalPrice: formatCurrency(overallTotal),
      amountPaid: '₱0.00',
      balance: formatCurrency(overallTotal),
      serviceFeeNum: numService,
      laborFeeNum: numLabor,
      totalPriceNum: overallTotal,
      amountPaidNum: 0,
      balanceNum: overallTotal,
      invoiceStatus: 'UNPAID',
      dateTime: formatDateForApi(now),
      mechanicNotes,
      managerNotifiedCashier: false,
      usedParts: newOrder.usedParts || [],
    };

    return res.status(201).json(created);
  } catch (error) {
    console.error('Error creating job order in MySQL DB:', error);
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/job-orders/:id/payment - Process Cashier payment (Full or Partial) in MySQL
const processPaymentApi = async (req, res) => {
  let conn;
  try {
    await ensureBillingTables();
    const id = req.params.id;
    const { cashierName = 'Lovielle Garay', customFees = null, paymentAmount = null, cashTendered = '', changeDue = '' } = req.body;

    conn = await db.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.query('SELECT * FROM job_orders WHERE id = ? FOR UPDATE', [id]);
    if (!rows || rows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Job order not found.' });
    }

    const o = rows[0];
    let numServiceFee = parseVal(o.service_fee);
    let numLaborFee = parseVal(o.labor_fee);
    let partsSum = o.status === 'CANNOT-FIX' ? 0 : calculatePartsTotalBackend(o.used_parts);
    let overallTotalNum = 0;

    if (o.status === 'CANNOT-FIX') {
      numServiceFee = 0;
      numLaborFee = parseVal(o.labor_fee || 500);
      overallTotalNum = numLaborFee;
    } else if (customFees) {
      numServiceFee = parseFloat(customFees.serviceFee || 0);
      numLaborFee = parseFloat(customFees.laborFee || 0);
      overallTotalNum = numServiceFee + numLaborFee + partsSum;
    } else {
      overallTotalNum = numServiceFee + numLaborFee + partsSum;
    }

    const prevPaidNum = parseVal(o.amount_paid || 0);
    const currentBalanceNum = Math.max(0, overallTotalNum - prevPaidNum);

    let payAmount = currentBalanceNum;
    if (paymentAmount !== null && paymentAmount !== undefined && !isNaN(paymentAmount)) {
      payAmount = Math.min(currentBalanceNum, Math.max(0, parseFloat(paymentAmount)));
    }

    const newTotalPaidNum = prevPaidNum + payAmount;
    const newBalanceNum = Math.max(0, overallTotalNum - newTotalPaidNum);

    const isFullyPaid = newBalanceNum <= 0.01;
    const finalBalanceNum = isFullyPaid ? 0 : newBalanceNum;
    const newInvoiceStatus = isFullyPaid ? 'PAID' : newTotalPaidNum > 0 ? 'PARTIAL' : 'UNPAID';
    const paymentTimestamp = new Date();

    const numCashTendered = parseVal(cashTendered);
    const numChangeDue = parseVal(changeDue);
    const paymentTypeLabel = isFullyPaid ? 'FULL PAYMENT' : 'PARTIAL PAYMENT';

    // 1. Update Job Order record in MySQL
    await conn.query(
      `UPDATE job_orders SET
         status = IF(status = 'CANNOT-FIX', 'CANNOT-FIX', 'COMPLETED'),
         invoice_status = ?,
         service_fee = ?,
         labor_fee = ?,
         total_price = ?,
         amount_paid = ?,
         balance = ?,
         payment_method = 'CASH',
         date_time = ?,
         cashier_name = ?
       WHERE id = ?`,
      [
        newInvoiceStatus,
        numServiceFee,
        numLaborFee,
        overallTotalNum,
        newTotalPaidNum,
        finalBalanceNum,
        paymentTimestamp,
        cashierName,
        id,
      ]
    );

    // 2. Insert transaction history record in MySQL payment_history table
    await conn.query(
      `INSERT INTO payment_history (
         job_order_id, client_name, client_username, client_custom_id,
         vehicle_name, plate_number, service_category, payment_amount,
         total_paid_to_date, remaining_balance, cash_tendered, change_due,
         payment_type, payment_method, cashier_name, payment_date
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CASH', ?, ?)`,
      [
        id,
        o.client_name,
        o.client_username,
        o.client_custom_id,
        o.vehicle_name,
        o.plate_number,
        o.service_category,
        payAmount,
        newTotalPaidNum,
        finalBalanceNum,
        numCashTendered,
        numChangeDue,
        paymentTypeLabel,
        cashierName,
        paymentTimestamp,
      ]
    );

    // 3. Record entry in MySQL billing_history table
    await recordBillingHistoryLog({
      job_order_id: id,
      invoice_number: `INV-2026-0${id}`,
      client_name: o.client_name,
      client_username: o.client_username,
      client_custom_id: o.client_custom_id,
      vehicle_name: o.vehicle_name,
      plate_number: o.plate_number,
      service_category: o.service_category,
      action_type: isFullyPaid ? 'FULL_PAYMENT' : 'PARTIAL_PAYMENT',
      service_fee: numServiceFee,
      labor_fee: numLaborFee,
      total_price: overallTotalNum,
      amount_paid: newTotalPaidNum,
      balance: finalBalanceNum,
      invoice_status: newInvoiceStatus,
      notes: `${paymentTypeLabel} of ${formatCurrency(payAmount)} received by Cashier ${cashierName}`,
      actor_name: cashierName,
      recorded_at: paymentTimestamp,
    }, conn);

    await conn.commit();
    conn.release();

    return res.json({
      message: `${paymentTypeLabel} of ${formatCurrency(payAmount)} successfully recorded in MySQL database!`,
      jobOrderId: id,
      invoiceStatus: newInvoiceStatus,
      amountPaid: formatCurrency(newTotalPaidNum),
      balance: formatCurrency(finalBalanceNum),
      lastPaymentAmount: formatCurrency(payAmount),
      amountPaidNum: newTotalPaidNum,
      balanceNum: finalBalanceNum,
      lastPaymentAmountNum: payAmount,
    });
  } catch (error) {
    if (conn) {
      try { await conn.rollback(); } catch (e) {}
      conn.release();
    }
    console.error('Error processing payment in MySQL DB:', error);
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/payment-history - Fetch all settled transaction logs from MySQL
const getPaymentHistoryApi = async (req, res) => {
  try {
    await ensureBillingTables();
    const [rows] = await db.query('SELECT * FROM payment_history ORDER BY id DESC');

    const formatted = rows.map((r) => {
      const pAmt = parseFloat(r.payment_amount || 0);
      const tPaid = parseFloat(r.total_paid_to_date || 0);
      const rBal = parseFloat(r.remaining_balance || 0);
      const cTendered = parseFloat(r.cash_tendered || 0);
      const cDue = parseFloat(r.change_due || 0);

      return {
        id: r.id,
        jobOrderId: r.job_order_id,
        clientName: r.client_name,
        clientUsername: r.client_username,
        clientCustomId: r.client_custom_id,
        vehicleName: r.vehicle_name,
        plateNumber: r.plate_number,
        serviceCategory: r.service_category,
        paymentAmount: formatCurrency(pAmt),
        totalPaidToDate: formatCurrency(tPaid),
        remainingBalance: formatCurrency(rBal),
        cashTendered: cTendered > 0 ? formatCurrency(cTendered) : '',
        changeDue: cDue > 0 ? formatCurrency(cDue) : '',
        paymentAmountNum: pAmt,
        totalPaidToDateNum: tPaid,
        remainingBalanceNum: rBal,
        cashTenderedNum: cTendered,
        changeDueNum: cDue,
        paymentType: r.payment_type,
        paymentMethod: r.payment_method,
        cashierName: r.cashier_name,
        paymentDate: formatDateForApi(r.payment_date),
        createdAt: r.created_at,
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching payment history from MySQL DB:', error);
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/billing-history - Fetch complete billing & invoice audit history logs from MySQL
const getBillingHistoryApi = async (req, res) => {
  try {
    await ensureBillingTables();
    const [rows] = await db.query('SELECT * FROM billing_history ORDER BY id DESC');

    const formatted = rows.map((r) => {
      const sFee = parseFloat(r.service_fee || 0);
      const lFee = parseFloat(r.labor_fee || 0);
      const tPrice = parseFloat(r.total_price || 0);
      const aPaid = parseFloat(r.amount_paid || 0);
      const bal = parseFloat(r.balance || 0);

      return {
        id: r.id,
        jobOrderId: r.job_order_id,
        invoiceNumber: r.invoice_number,
        clientName: r.client_name,
        clientUsername: r.client_username,
        clientCustomId: r.client_custom_id,
        vehicleName: r.vehicle_name,
        plateNumber: r.plate_number,
        serviceCategory: r.service_category,
        actionType: r.action_type,
        serviceFee: formatCurrency(sFee),
        laborFee: formatCurrency(lFee),
        totalPrice: formatCurrency(tPrice),
        amountPaid: formatCurrency(aPaid),
        balance: formatCurrency(bal),
        serviceFeeNum: sFee,
        laborFeeNum: lFee,
        totalPriceNum: tPrice,
        amountPaidNum: aPaid,
        balanceNum: bal,
        invoiceStatus: r.invoice_status,
        notes: r.notes,
        actorName: r.actor_name,
        recordedAt: formatDateForApi(r.recorded_at),
        createdAt: r.created_at,
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching billing history from MySQL DB:', error);
    return res.status(500).json({ error: error.message });
  }
};

// PUT /api/job-orders/:id/status - Update job status or mechanic notes in MySQL
const updateJobStatusApi = async (req, res) => {
  try {
    await ensureBillingTables();
    const id = req.params.id;
    const { status, mechanicNotes, usedParts, serviceFee, laborFee } = req.body;

    const [rows] = await db.query('SELECT * FROM job_orders WHERE id = ?', [id]);
    if (rows && rows.length > 0) {
      const o = rows[0];
      const finalParts = usedParts !== undefined ? usedParts : (typeof o.used_parts === 'string' ? JSON.parse(o.used_parts) : o.used_parts || []);
      const partsJson = JSON.stringify(finalParts);

      let sNum = parseVal(serviceFee !== undefined ? serviceFee : o.service_fee);
      let lNum = parseVal(laborFee !== undefined ? laborFee : o.labor_fee);
      let partsSum = calculatePartsTotalBackend(finalParts);

      if (status === 'CANNOT-FIX') {
        sNum = 0;
        partsSum = 0;
      }

      const overallTotal = sNum + lNum + partsSum;
      const prevPaid = parseVal(o.amount_paid || 0);
      const remBal = Math.max(0, overallTotal - prevPaid);
      const isFullyPaid = remBal <= 0.01;
      const finalBalance = isFullyPaid ? 0 : remBal;
      const newInvoiceStatus = isFullyPaid ? 'PAID' : prevPaid > 0 ? 'PARTIAL' : 'UNPAID';

      await db.query(
        `UPDATE job_orders SET
           status = ?,
           mechanic_notes = ?,
           used_parts = ?,
           service_fee = ?,
           labor_fee = ?,
           total_price = ?,
           balance = ?,
           invoice_status = ?
         WHERE id = ?`,
        [
          status || o.status,
          mechanicNotes !== undefined ? mechanicNotes : o.mechanic_notes,
          partsJson,
          sNum,
          lNum,
          overallTotal,
          finalBalance,
          newInvoiceStatus,
          id,
        ]
      );

      // Also sync status and pricing updates to availed_services table
      await db.query(
        `UPDATE availed_services SET
           status = ?,
           service_fee = ?,
           labor_fee = ?,
           total_price = ?
         WHERE job_order_id = ?`,
        [status || o.status, sNum, lNum, overallTotal, id]
      );
    }

    return res.json({ message: 'Job order status & payment totals updated in MySQL database.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/availed-services - Fetch all availed services from MySQL DB
const getAvailedServicesApi = async (req, res) => {
  try {
    await ensureBillingTables();
    const clientUsername = req.query.client_username || req.query.username;
    const clientCustomId = req.query.client_custom_id || req.query.custom_id;

    let query = 'SELECT * FROM availed_services';
    const params = [];

    if (req.user?.role === 'client' || clientUsername || clientCustomId) {
      const uName = clientUsername || req.user?.username || '';
      const cId = clientCustomId || req.user?.custom_client_id || req.user?.custom_personnel_id || '';
      query += ' WHERE client_username = ? OR client_custom_id = ?';
      params.push(uName, cId);
    }

    query += ' ORDER BY id DESC';

    const [rows] = await db.query(query, params);

    const formatted = rows.map((r) => {
      const sFee = parseFloat(r.service_fee || 0);
      const lFee = parseFloat(r.labor_fee || 0);
      const tPrice = parseFloat(r.total_price || 0);

      return {
        id: r.id,
        jobOrderId: r.job_order_id,
        serviceRequestId: r.service_request_id,
        clientName: r.client_name,
        clientUsername: r.client_username,
        clientCustomId: r.client_custom_id,
        clientPhone: r.client_phone,
        vehicleName: r.vehicle_name,
        plateNumber: r.plate_number,
        serviceCategory: r.service_category,
        problemDescription: r.problem_description,
        serviceFee: formatCurrency(sFee),
        laborFee: formatCurrency(lFee),
        totalPrice: formatCurrency(tPrice),
        serviceFeeNum: sFee,
        laborFeeNum: lFee,
        totalPriceNum: tPrice,
        status: r.status,
        assignedMechanic: r.assigned_mechanic,
        availedAt: formatDateForApi(r.availed_at),
        createdAt: r.created_at,
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching availed services from MySQL DB:', error);
    return res.status(500).json({ error: error.message });
  }
};

// PUT /api/job-orders/:id/notify-cashier - Notify Cashier
const notifyCashierApi = async (req, res) => {
  try {
    await ensureBillingTables();
    const id = req.params.id;
    await db.query('UPDATE job_orders SET manager_notified_cashier = 1 WHERE id = ?', [id]);
    return res.json({ message: 'Cashier notified in MySQL database.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// DELETE /api/job-orders/:id - Delete job order in MySQL
const deleteJobOrderApi = async (req, res) => {
  try {
    await ensureBillingTables();
    const id = req.params.id;
    await db.query('DELETE FROM job_orders WHERE id = ?', [id]);
    await db.query('DELETE FROM payment_history WHERE job_order_id = ?', [id]);
    await db.query('DELETE FROM billing_history WHERE job_order_id = ?', [id]);
    await db.query('DELETE FROM availed_services WHERE job_order_id = ?', [id]);
    return res.json({ message: 'Job order, billing history, payment logs & availed services deleted from MySQL database.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  ensureBillingTables,
  getJobOrdersApi,
  createJobOrderApi,
  processPaymentApi,
  getPaymentHistoryApi,
  getBillingHistoryApi,
  getAvailedServicesApi,
  recordAvailedServiceLog,
  updateJobStatusApi,
  notifyCashierApi,
  deleteJobOrderApi,
};
