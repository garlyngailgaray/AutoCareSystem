const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Create MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'acms',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection and initialize tables function
async function initDatabase() {
  try {
    const connection = await db.getConnection();
    console.log('✅ Connected to MySQL Database: ' + (process.env.DB_NAME || 'acms'));
    connection.release();

    const {
      ensureAuthTablesExist,
      purgeAndKeepOnly5CorePersonnel,
      cleanupDuplicateDeavoune,
      ensureJaymarieBusacoClientAccount,
      ensureChrisBrinaClientAccount,
    } = require('../controllers/authController');

    // Ensure personnel & client tables exist first
    if (ensureAuthTablesExist) {
      await ensureAuthTablesExist();
    }

    // Clean up and enforce strictly core accounts in MySQL database tables
    await cleanupDuplicateDeavoune();
    await ensureJaymarieBusacoClientAccount();
    if (ensureChrisBrinaClientAccount) {
      await ensureChrisBrinaClientAccount();
    }
    await purgeAndKeepOnly5CorePersonnel();

    // Ensure auto_parts table exists and auto parts are stored in MySQL DB
    const { ensureAutoPartsTable } = require('../controllers/partsController');
    await ensureAutoPartsTable();

    // Ensure job orders, billing history, payment history & availed services tables exist & are seeded in MySQL DB
    const { ensureBillingTables } = require('../controllers/billingController');
    await ensureBillingTables();

    // Ensure service requests table exists in MySQL DB
    const { ensureServiceRequestsTable } = require('../controllers/serviceController');
    await ensureServiceRequestsTable();

    console.log('📦 Personnel accounts, clients, job orders, availed services, and auto parts initialized & strictly stored in MySQL DB.');
  } catch (error) {
    console.error('❌ Database init error:', error.message);
  }
}

module.exports = {
  db,
  initDatabase,
};
