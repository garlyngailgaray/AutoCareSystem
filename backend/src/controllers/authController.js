const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db/database');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const calculateAgeFromBday = (bdayStr) => {
  if (!bdayStr) return null;
  try {
    const birthDate = new Date(bdayStr);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let computedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      computedAge--;
    }
    return computedAge >= 0 ? computedAge : null;
  } catch (e) {
    return null;
  }
};

const ensureAuthTablesExist = async () => {
  try {
    // 1. Create personnel table if not exists in MySQL DB
    await db.query(`
      CREATE TABLE IF NOT EXISTS personnel (
        id INT AUTO_INCREMENT PRIMARY KEY,
        custom_id VARCHAR(50) DEFAULT NULL,
        first_name VARCHAR(100) DEFAULT NULL,
        middle_name VARCHAR(100) DEFAULT NULL,
        last_name VARCHAR(100) DEFAULT NULL,
        name VARCHAR(255) DEFAULT NULL,
        username VARCHAR(100) UNIQUE DEFAULT NULL,
        password VARCHAR(255) DEFAULT NULL,
        email VARCHAR(150) UNIQUE DEFAULT NULL,
        phone VARCHAR(50) DEFAULT NULL,
        address VARCHAR(255) DEFAULT NULL,
        gender VARCHAR(50) DEFAULT 'Female',
        birthday VARCHAR(50) DEFAULT NULL,
        age INT DEFAULT NULL,
        civil_status VARCHAR(50) DEFAULT 'Single',
        avatar LONGTEXT DEFAULT NULL,
        position VARCHAR(50) DEFAULT 'staff',
        role VARCHAR(50) DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Create client table if not exists in MySQL DB
    await db.query(`
      CREATE TABLE IF NOT EXISTS client (
        id INT AUTO_INCREMENT PRIMARY KEY,
        custom_id VARCHAR(50) DEFAULT NULL,
        first_name VARCHAR(100) DEFAULT NULL,
        middle_name VARCHAR(100) DEFAULT NULL,
        last_name VARCHAR(100) DEFAULT NULL,
        name VARCHAR(255) DEFAULT NULL,
        username VARCHAR(100) UNIQUE DEFAULT NULL,
        password VARCHAR(255) DEFAULT NULL,
        email VARCHAR(150) UNIQUE DEFAULT NULL,
        phone VARCHAR(50) DEFAULT NULL,
        address VARCHAR(255) DEFAULT NULL,
        gender VARCHAR(50) DEFAULT 'Male',
        birthday VARCHAR(50) DEFAULT NULL,
        age INT DEFAULT NULL,
        civil_status VARCHAR(50) DEFAULT 'Single',
        avatar LONGTEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (e) {
    console.warn('Auth tables initialization warning:', e.message);
  }
};

const ensuredAuthTables = new Set();
const ensureTableColumns = async (tableName) => {
  if (ensuredAuthTables.has(tableName)) return;
  try {
    await ensureAuthTablesExist();
    const [cols] = await db.query(`SHOW COLUMNS FROM \`${tableName}\``);
    const colNames = new Set(cols.map((c) => c.Field));

    if (!colNames.has('custom_id')) {
      await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`custom_id\` VARCHAR(50) DEFAULT NULL`);
    }

    // Migrate data from redundant custom_client_id and custom_personnel_id into custom_id then drop them
    if (colNames.has('custom_client_id')) {
      try {
        await db.query(`UPDATE \`${tableName}\` SET \`custom_id\` = \`custom_client_id\` WHERE (\`custom_id\` IS NULL OR \`custom_id\` = '') AND \`custom_client_id\` IS NOT NULL AND \`custom_client_id\` != ''`);
        await db.query(`ALTER TABLE \`${tableName}\` DROP COLUMN \`custom_client_id\``);
        console.log(`🧹 Consolidated and dropped redundant 'custom_client_id' column from ${tableName}!`);
      } catch (e1) {}
    }

    if (colNames.has('custom_personnel_id')) {
      try {
        await db.query(`UPDATE \`${tableName}\` SET \`custom_id\` = \`custom_personnel_id\` WHERE (\`custom_id\` IS NULL OR \`custom_id\` = '') AND \`custom_personnel_id\` IS NOT NULL AND \`custom_personnel_id\` != ''`);
        await db.query(`ALTER TABLE \`${tableName}\` DROP COLUMN \`custom_personnel_id\``);
        console.log(`🧹 Consolidated and dropped redundant 'custom_personnel_id' column from ${tableName}!`);
      } catch (e2) {}
    }

    if (colNames.has('client_id')) {
      try {
        await db.query(`ALTER TABLE \`${tableName}\` DROP COLUMN \`client_id\``);
        console.log(`🧹 Dropped redundant 'client_id' column from ${tableName}!`);
      } catch (e3) {}
    }

    if (colNames.has('personnel_id')) {
      try {
        await db.query(`ALTER TABLE \`${tableName}\` DROP COLUMN \`personnel_id\``);
        console.log(`🧹 Dropped redundant 'personnel_id' column from ${tableName}!`);
      } catch (e4) {}
    }

    // Migrate contact_number into phone then drop contact_number
    if (colNames.has('contact_number')) {
      try {
        await db.query(`UPDATE \`${tableName}\` SET \`phone\` = \`contact_number\` WHERE (\`phone\` IS NULL OR \`phone\` = '') AND \`contact_number\` IS NOT NULL AND \`contact_number\` != ''`);
        await db.query(`ALTER TABLE \`${tableName}\` DROP COLUMN \`contact_number\``);
      } catch (e5) {}
    }

    if (!colNames.has('phone')) {
      await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`phone\` VARCHAR(50) DEFAULT NULL`);
    }
    if (!colNames.has('birthday')) {
      await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`birthday\` VARCHAR(50) DEFAULT NULL`);
    }
    if (!colNames.has('age')) {
      await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`age\` INT DEFAULT NULL`);
    }
    if (!colNames.has('gender')) {
      await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`gender\` VARCHAR(50) DEFAULT NULL`);
    }
    if (!colNames.has('civil_status')) {
      await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`civil_status\` VARCHAR(50) DEFAULT NULL`);
    }
    if (!colNames.has('avatar')) {
      await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`avatar\` LONGTEXT DEFAULT NULL`);
    } else {
      try {
        await db.query(`ALTER TABLE \`${tableName}\` MODIFY COLUMN \`avatar\` LONGTEXT DEFAULT NULL`);
      } catch (e) {}
    }
    if (!colNames.has('middle_name')) {
      await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`middle_name\` VARCHAR(100) DEFAULT NULL`);
    }
    if (tableName === 'personnel' && !colNames.has('position')) {
      await db.query(`ALTER TABLE \`personnel\` ADD COLUMN \`position\` VARCHAR(50) DEFAULT 'staff'`);
    }

    ensuredAuthTables.add(tableName);
  } catch (e) {
    console.warn(`Column check/alter warning for ${tableName}:`, e.message);
  }
};

// Dynamic helper to insert or update user matching exact table columns
const insertUserIntoTable = async (tableName, userObj) => {
  await ensureTableColumns(tableName);

  const isSeed = !!userObj.isSeed;
  const firstName = userObj.firstName || userObj.first_name || '';
  const lastName = userObj.lastName || userObj.last_name || '';

  // Check if user with matching exact username, customId, email, or id already exists in MySQL
  if (userObj.username || userObj.customId || userObj.email || userObj.id) {
    try {
      const conditions = [];
      const queryParams = [];

      if (userObj.id) {
        conditions.push('id = ?');
        queryParams.push(userObj.id);
      }
      if (userObj.username) {
        conditions.push('(username IS NOT NULL AND username != "" AND username = ?)');
        queryParams.push(userObj.username);
      }
      if (userObj.customId) {
        conditions.push('(custom_id IS NOT NULL AND custom_id != "" AND custom_id = ?)');
        queryParams.push(userObj.customId);
      }
      if (userObj.email) {
        conditions.push('(email IS NOT NULL AND email != "" AND email = ?)');
        queryParams.push(userObj.email);
      }

      const [existing] = await db.query(
        `SELECT * FROM \`${tableName}\` WHERE ${conditions.join(' OR ')} LIMIT 1`,
        queryParams
      );

      if (existing && existing.length > 0) {
        const ex = existing[0];
        const exId = ex.id;
        if (exId) {
          // If this is an automated seed call and record already exists in database, preserve user's edited data!
          if (isSeed) {
            return { insertId: exId, skippedSeed: true };
          }

          const preserveCustomId = userObj.customId || ex.custom_id;
          const finalDisplayName = userObj.name || [firstName || ex.first_name, userObj.middleName !== undefined ? userObj.middleName : ex.middle_name, lastName || ex.last_name].filter(Boolean).join(' ') || ex.username;
          const updatedAvatar = userObj.avatar !== undefined && userObj.avatar !== '' ? userObj.avatar : ex.avatar;
          const updatedPassword = userObj.hashedPassword || ex.password;

          if (tableName === 'personnel') {
            await db.query(
              `UPDATE personnel SET
                 first_name = ?,
                 middle_name = ?,
                 last_name = ?,
                 name = ?,
                 username = ?,
                 email = ?,
                 phone = ?,
                 address = ?,
                 custom_id = ?,
                 position = ?,
                 role = ?,
                 gender = ?,
                 birthday = ?,
                 age = ?,
                 civil_status = ?,
                 avatar = ?,
                 password = ?
               WHERE id = ?`,
              [
                firstName || ex.first_name,
                userObj.middleName !== undefined ? userObj.middleName : ex.middle_name,
                lastName || ex.last_name,
                finalDisplayName,
                userObj.username || ex.username,
                userObj.email !== undefined ? userObj.email : ex.email,
                userObj.phone !== undefined ? userObj.phone : ex.phone,
                userObj.address !== undefined ? userObj.address : ex.address,
                preserveCustomId,
                (userObj.role || ex.position || ex.role || 'staff').toLowerCase(),
                (userObj.role || ex.position || ex.role || 'staff').toLowerCase(),
                userObj.gender || ex.gender || 'Female',
                userObj.birthday !== undefined ? userObj.birthday : ex.birthday,
                userObj.computedAgeNum !== undefined && userObj.computedAgeNum !== null ? userObj.computedAgeNum : ex.age,
                userObj.civilStatus || ex.civil_status || 'Single',
                updatedAvatar,
                updatedPassword,
                exId,
              ]
            );
          } else {
            await db.query(
              `UPDATE client SET
                 first_name = ?,
                 middle_name = ?,
                 last_name = ?,
                 name = ?,
                 username = ?,
                 email = ?,
                 phone = ?,
                 address = ?,
                 custom_id = ?,
                 gender = ?,
                 birthday = ?,
                 age = ?,
                 civil_status = ?,
                 avatar = ?,
                 password = ?
               WHERE id = ?`,
              [
                firstName || ex.first_name,
                userObj.middleName !== undefined ? userObj.middleName : ex.middle_name,
                lastName || ex.last_name,
                finalDisplayName,
                userObj.username || ex.username,
                userObj.email !== undefined ? userObj.email : ex.email,
                userObj.phone !== undefined ? userObj.phone : ex.phone,
                userObj.address !== undefined ? userObj.address : ex.address,
                preserveCustomId,
                userObj.gender || ex.gender || 'Male',
                userObj.birthday !== undefined ? userObj.birthday : ex.birthday,
                userObj.computedAgeNum !== undefined && userObj.computedAgeNum !== null ? userObj.computedAgeNum : ex.age,
                userObj.civilStatus || ex.civil_status || 'Single',
                updatedAvatar,
                updatedPassword,
                exId,
              ]
            );
          }
          return { insertId: exId, updated: true };
        }
      }
    } catch (eCheck) {
      console.warn(`User lookup warning before insert in ${tableName}:`, eCheck.message);
    }
  }

  const [cols] = await db.query(`SHOW COLUMNS FROM \`${tableName}\``);
  const colNames = new Set(cols.map((c) => c.Field));

  const fields = [];
  const values = [];

  const add = (col, val) => {
    if (colNames.has(col) && val !== undefined && val !== null) {
      fields.push(`\`${col}\``);
      values.push(val);
    }
  };

  add('custom_id', userObj.customId);
  add('first_name', firstName);
  add('middle_name', userObj.middleName);
  add('last_name', lastName);
  add('name', userObj.name || [firstName, userObj.middleName, lastName].filter(Boolean).join(' '));
  add('civil_status', userObj.civilStatus);
  add('address', userObj.address);
  add('phone', userObj.phone);
  add('username', userObj.username);
  add('password', userObj.hashedPassword);
  add('email', userObj.email);
  add('birthday', userObj.birthday);
  add('age', userObj.computedAgeNum);
  add('gender', userObj.gender);
  add('avatar', userObj.avatar);
  if (tableName === 'personnel') {
    add('position', (userObj.role || 'staff').toLowerCase());
    add('role', (userObj.role || 'staff').toLowerCase());
  }

  if (fields.length === 0) return { insertId: 0 };

  const placeholders = fields.map(() => '?').join(', ');
  const sql = `INSERT INTO \`${tableName}\` (${fields.join(', ')}) VALUES (${placeholders})`;

  try {
    const [result] = await db.query(sql, values);
    return result;
  } catch (errInsert) {
    if (errInsert.message && (errInsert.message.includes('ER_DUP_ENTRY') || errInsert.message.includes('Duplicate entry'))) {
      try {
        const [fallbackRow] = await db.query(
          `SELECT id FROM \`${tableName}\` WHERE username = ? OR email = ? OR custom_id = ? LIMIT 1`,
          [userObj.username || '', userObj.email || '', userObj.customId || '']
        );
        if (fallbackRow && fallbackRow.length > 0) {
          const fId = fallbackRow[0].id;
          await db.query(
            `UPDATE \`${tableName}\` SET birthday = ?, age = ?, phone = ?, address = ?, civil_status = ?, gender = ?, first_name = ?, last_name = ? WHERE id = ?`,
            [userObj.birthday || '', userObj.computedAgeNum || null, userObj.phone || '', userObj.address || '', userObj.civilStatus || 'Single', userObj.gender || 'Male', firstName, lastName, fId]
          );
          return { insertId: fId, updatedFallback: true };
        }
      } catch (eFallback) {}
    }
    console.warn(`Insert fallback warning in ${tableName}:`, errInsert.message);
    return { insertId: 0, error: errInsert.message };
  }
};

// Cleanup duplicate Deavoune client rows
const cleanupDuplicateDeavoune = async () => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM client WHERE (first_name LIKE '%Deavoune%' OR email = 'deavoune@gmail.com' OR username = 'deavoune_garay') ORDER BY id ASC`
    );

    if (rows.length > 1) {
      const keepRow = rows[0];
      const keepId = keepRow.id;
      const deleteIds = rows.slice(1).map((r) => r.id).filter(Boolean);

      if (deleteIds.length > 0) {
        await db.query(`DELETE FROM client WHERE id IN (?)`, [deleteIds]);
        console.log(`🧹 Cleaned up ${deleteIds.length} duplicate Deavoune client rows from MySQL database!`);
      }

      await db.query(`UPDATE client SET custom_id = 'CLT-304' WHERE id = ?`, [keepId]);
    } else if (rows.length === 1) {
      const keepId = rows[0].id;
      await db.query(`UPDATE client SET custom_id = 'CLT-304' WHERE id = ?`, [keepId]);
    }

    // Also remove Deavoune from personnel table if present
    try {
      await db.query(`DELETE FROM personnel WHERE (username = 'deavoune_garay' OR first_name LIKE '%Deavoune%')`);
    } catch (e5) {}
  } catch (e) {
    console.warn('Cleanup duplicate Deavoune warning:', e.message);
  }
};

// Ensure Jaymarie Busaco is strictly a Client in client table
const ensureJaymarieBusacoClientAccount = async () => {
  try {
    const hashedPassword = await bcrypt.hash('client123', 10);
    await insertUserIntoTable('client', {
      customId: 'CLT-305',
      firstName: 'Jaymarie',
      middleName: '',
      lastName: 'Busaco',
      civilStatus: 'Single',
      address: 'Loay, Bohol',
      phone: '09123456789',
      username: 'jaymarie',
      hashedPassword,
      email: 'jaymarie@autocare.com',
      birthday: '1995-08-20',
      computedAgeNum: 30,
      gender: 'Female',
      role: 'client',
      isSeed: true,
    });

    try {
      await db.query(`UPDATE client SET username = 'jaymarie', custom_id = 'CLT-305' WHERE username = 'jaymarie_busaco' OR first_name LIKE '%Jaymarie%'`);
    } catch (e1) {}

    try {
      await db.query(`DELETE FROM personnel WHERE (username IN ('jaymarie', 'jaymarie_busaco') OR first_name LIKE '%Jaymarie%')`);
    } catch (e2) {}
  } catch (e) {
    console.warn('Jaymarie Busaco client setup warning:', e.message);
  }
};

// Ensure Chris Brina is strictly a Client in client table (CLT-306)
const ensureChrisBrinaClientAccount = async () => {
  try {
    const hashedPassword = await bcrypt.hash('client123', 10);
    await insertUserIntoTable('client', {
      customId: 'CLT-306',
      firstName: 'Chris',
      middleName: '',
      lastName: 'Brina',
      civilStatus: 'Single',
      address: 'Bohol',
      phone: '09123456789',
      username: 'chris_brina',
      hashedPassword,
      email: 'chris@gmail.com',
      birthday: '1996-05-15',
      computedAgeNum: 29,
      gender: 'Male',
      role: 'client',
      isSeed: true,
    });

    try {
      await db.query(`UPDATE client SET custom_id = 'CLT-306' WHERE username = 'chris_brina' OR (first_name = 'Chris' AND last_name = 'Brina')`);
    } catch (e1) {}
  } catch (e) {
    console.warn('Chris Brina client setup warning:', e.message);
  }
};

// Ensure system core personnel (Admin, Faith, Lovielle, Mechanics) are set properly
const ensureCoreSystemPersonnel = async () => {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Garlyn Gail Torillo Garay - ADMIN
    await insertUserIntoTable('personnel', {
      customId: 'ADM-1',
      firstName: 'Garlyn Gail',
      middleName: 'Torillo',
      lastName: 'Garay',
      civilStatus: 'Married',
      address: 'Loay, Bohol',
      phone: '09127080272',
      username: 'admin',
      hashedPassword,
      email: 'garlyn@gmail.com',
      birthday: '2004-08-25',
      computedAgeNum: 22,
      gender: 'Female',
      role: 'admin',
      isSeed: true,
    });

    // AutoCareAdmin - SECOND ADMIN
    const adminHashedPassword = await bcrypt.hash('Admin321', 10);
    await insertUserIntoTable('personnel', {
      customId: 'ADM-2',
      firstName: 'AutoCare',
      middleName: '',
      lastName: 'Admin',
      name: 'AutoCare Admin',
      civilStatus: 'Single',
      address: 'Loay, Bohol',
      phone: '09127080272',
      username: 'AutoCareAdmin',
      hashedPassword: adminHashedPassword,
      email: 'autocareadmin@gmail.com',
      birthday: '2000-01-01',
      computedAgeNum: 26,
      gender: 'Female',
      role: 'admin',
      isSeed: true,
    });

    // Faith Hinghing Cruz - MANAGER (Front Desk)
    await insertUserIntoTable('personnel', {
      customId: 'MGR-102',
      firstName: 'Faith',
      middleName: 'Hinghing',
      lastName: 'Cruz',
      civilStatus: 'Widowed',
      address: 'Bilar',
      phone: '09327182716',
      username: 'faith_cruz',
      hashedPassword,
      email: 'faith@autocare.com',
      birthday: '2005-05-09',
      computedAgeNum: 21,
      gender: 'Female',
      role: 'manager',
      isSeed: true,
    });

    // Lovielle Cathaleya Garay - CASHIER
    await insertUserIntoTable('personnel', {
      customId: 'CSH-201',
      firstName: 'Lovielle Cathaleya',
      middleName: 'Torillo',
      lastName: 'Garay',
      civilStatus: 'Single',
      address: 'Italy',
      phone: '09858911514',
      username: 'lovielle_garay',
      hashedPassword,
      email: 'lovielle@gmail.com',
      birthday: '1998-08-08',
      computedAgeNum: 27,
      gender: 'Female',
      role: 'cashier',
      isSeed: true,
    });

    // Christian Brina - STAFF
    await insertUserIntoTable('personnel', {
      customId: 'STF-101',
      firstName: 'Christian',
      middleName: 'Marticion',
      lastName: 'Brina',
      civilStatus: 'Married',
      address: 'Sevilla',
      phone: '09957751462',
      username: 'christian_brina',
      hashedPassword,
      email: 'christian@gmail.com',
      birthday: '1992-03-12',
      computedAgeNum: 33,
      gender: 'Male',
      role: 'staff',
      isSeed: true,
    });

    // Dave Garay - STAFF
    await insertUserIntoTable('personnel', {
      customId: 'STF-102',
      firstName: 'Dave',
      middleName: 'Torillo',
      lastName: 'Garay',
      civilStatus: 'Single',
      address: 'Loay',
      phone: '09385149095',
      username: 'dave_garay',
      hashedPassword,
      email: 'dave@gmail.com',
      birthday: '1996-07-22',
      computedAgeNum: 29,
      gender: 'Male',
      role: 'staff',
      isSeed: true,
    });
  } catch (e) {
    console.warn('Core personnel setup warning:', e.message);
  }
};

const createAccount = async (req, res) => {
  const {
    role = 'client',
    firstName,
    middleName = '',
    lastName,
    username,
    password,
    email,
    phone = '',
    address = '',
    civilStatus = 'Single',
    birthday = '',
    age = '',
    gender = 'Male',
  } = req.body;

  if (!username || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'First name, last name, username, and password are required.' });
  }

  const computedAgeNum = age !== undefined && age !== '' && !isNaN(parseInt(age, 10))
    ? parseInt(age, 10)
    : calculateAgeFromBday(birthday);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userEmail = email || `${username}@gmail.com`;

    if (role.toLowerCase() === 'client' || role.toLowerCase() === 'customer') {
      let customClientId = '';
      try {
        const [existingClients] = await db.query('SELECT custom_id FROM client');
        const numbers = existingClients
          .map((c) => {
            const cid = c.custom_id || '';
            if (cid.startsWith('CLT-')) {
              const num = parseInt(cid.replace('CLT-', ''), 10);
              return isNaN(num) ? null : num;
            }
            return null;
          })
          .filter((n) => n !== null);

        const nextNum = numbers.length > 0 ? Math.max(...numbers, 304) + 1 : 301;
        customClientId = `CLT-${nextNum}`;
      } catch (e) {
        customClientId = `CLT-305`;
      }

      const result = await insertUserIntoTable('client', {
        customId: customClientId,
        firstName,
        middleName,
        lastName,
        civilStatus,
        address,
        phone,
        username,
        hashedPassword,
        email: userEmail,
        birthday,
        computedAgeNum,
        gender,
        role: 'client',
      });

      console.log(`✅ Client account for ${firstName} ${lastName} (@${username}) stored in MySQL database! ID: ${customClientId}`);

      return res.status(201).json({
        message: `Client account for ${firstName} ${lastName} created & stored in database successfully!`,
        customId: customClientId,
        userId: result.insertId,
        role: 'client',
      });
    } else {
      const prefix = role.toLowerCase() === 'admin' ? 'ADM' : role.toLowerCase() === 'manager' ? 'MGR' : role.toLowerCase() === 'cashier' ? 'CSH' : 'STF';
      let customPersonnelId = '';

      try {
        const [existingPersonnel] = await db.query('SELECT custom_id FROM personnel');
        const numbers = existingPersonnel
          .map((p) => {
            const cid = p.custom_id || '';
            if (cid.startsWith(`${prefix}-`)) {
              const num = parseInt(cid.replace(`${prefix}-`, ''), 10);
              return isNaN(num) ? null : num;
            }
            return null;
          })
          .filter((n) => n !== null);

        const startBase = prefix === 'ADM' ? 1 : prefix === 'MGR' ? 101 : prefix === 'CSH' ? 201 : 101;
        const nextNum = numbers.length > 0 ? Math.max(...numbers, startBase) + 1 : startBase;
        customPersonnelId = `${prefix}-${nextNum}`;
      } catch (e) {
        customPersonnelId = `${prefix}-101`;
      }

      const result = await insertUserIntoTable('personnel', {
        customId: customPersonnelId,
        firstName,
        middleName,
        lastName,
        civilStatus,
        address,
        phone,
        username,
        hashedPassword,
        email: userEmail,
        birthday,
        computedAgeNum,
        gender,
        role: role.toLowerCase(),
      });

      console.log(`✅ ${role.toUpperCase()} account for ${firstName} ${lastName} (@${username}) stored in MySQL database! ID: ${customPersonnelId}`);

      return res.status(201).json({
        message: `${role.toUpperCase()} account for ${firstName} ${lastName} created & stored in database successfully!`,
        customId: customPersonnelId,
        userId: result.insertId,
        role: role.toLowerCase(),
      });
    }
  } catch (error) {
    if (error.message && error.message.includes('ER_DUP_ENTRY')) {
      return res.status(400).json({ error: 'Username or email already exists in the system.' });
    }
    return res.status(500).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  const user = req.user;
  const {
    id: targetId,
    firstName,
    first_name,
    middleName,
    middle_name,
    lastName,
    last_name,
    email,
    phone,
    contact_number,
    address,
    civilStatus,
    civil_status,
    birthday,
    age,
    gender,
    username,
    customId,
    custom_id,
    custom_personnel_id,
    custom_client_id,
    avatar,
    role,
    position,
    password,
    newPassword,
    originalUsername,
  } = req.body;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Normalize incoming field values
  const finalFirstName = firstName !== undefined ? firstName : (first_name !== undefined ? first_name : '');
  const finalMiddleName = middleName !== undefined ? middleName : (middle_name !== undefined ? middle_name : '');
  const finalLastName = lastName !== undefined ? lastName : (last_name !== undefined ? last_name : '');
  const finalUsername = username || originalUsername || user.username;
  const finalEmail = email !== undefined ? email : user.email;
  const finalPhone = phone !== undefined ? phone : (contact_number !== undefined ? contact_number : '');
  const finalAddress = address !== undefined ? address : user.address;
  const finalCivilStatus = civilStatus || civil_status || user.civilStatus || user.civil_status || 'Single';
  const finalBirthday = birthday !== undefined ? birthday : user.birthday;
  const finalGender = gender || user.gender || 'Female';
  const finalAvatar = avatar !== undefined ? avatar : user.avatar;
  const finalRole = role || position || user.role || 'client';
  if (password !== undefined || newPassword !== undefined) {
    return res.status(400).json({ error: 'Use the change-password endpoint to update your password.' });
  }
  const targetCustomId = customId || custom_id || custom_personnel_id || custom_client_id || user.customId;
  const userIdToMatch = targetId || user.id;
  const origUsername = originalUsername || username || user.username;

  const fullNameParts = [finalFirstName, finalMiddleName, finalLastName]
    .filter(Boolean)
    .map((s) => s.trim())
    .filter(Boolean);
  const newDisplayName = fullNameParts.join(' ') || finalUsername;

  const computedAgeNum = age !== undefined && age !== '' && !isNaN(parseInt(age, 10))
    ? parseInt(age, 10)
    : calculateAgeFromBday(finalBirthday);

  try {
    const userPayload = {
      customId: targetCustomId,
      firstName: finalFirstName,
      middleName: finalMiddleName,
      lastName: finalLastName,
      name: newDisplayName,
      civilStatus: finalCivilStatus,
      address: finalAddress,
      phone: finalPhone,
      username: finalUsername,
      hashedPassword: null,
      email: finalEmail,
      birthday: finalBirthday,
      computedAgeNum,
      gender: finalGender,
      avatar: finalAvatar,
      role: finalRole,
    };

    // Determine target table based on user role
    const isClient = ['client', 'customer'].includes((finalRole || '').toLowerCase());
    const primaryTable = isClient ? 'client' : 'personnel';
    const secondaryTable = isClient ? 'personnel' : 'client';

    await insertUserIntoTable(primaryTable, userPayload);

    // Clean up duplicate from secondary table if role changed or user previously got misclassified
    try {
      if (origUsername) {
        await db.query(`DELETE FROM \`${secondaryTable}\` WHERE username = ? OR email = ?`, [origUsername, finalEmail]);
      }
    } catch (eDel) {}

    console.log(`✅ Profile synchronized and saved in '${primaryTable}' MySQL database table for @${finalUsername}`);

    const updatedUserObj = {
      ...user,
      id: userIdToMatch,
      name: newDisplayName,
      firstName: finalFirstName,
      first_name: finalFirstName,
      middleName: finalMiddleName,
      middle_name: finalMiddleName,
      lastName: finalLastName,
      last_name: finalLastName,
      username: finalUsername,
      email: finalEmail,
      phone: finalPhone,
      address: finalAddress,
      civilStatus: finalCivilStatus,
      civil_status: finalCivilStatus,
      birthday: finalBirthday,
      age: computedAgeNum !== null ? computedAgeNum : user.age,
      gender: finalGender,
      avatar: finalAvatar,
      customId: targetCustomId,
      custom_id: targetCustomId,
      custom_client_id: targetCustomId,
      custom_personnel_id: targetCustomId,
      role: finalRole,
    };

    return res.json({
      message: 'Profile information updated and saved in MySQL database (client & personnel tables) successfully!',
      user: updatedUserObj,
    });
  } catch (error) {
    console.error('Error updating profile in database:', error);
    return res.status(500).json({ error: error.message });
  }
};

const deleteUserAccount = async (req, res) => {
  const userId = req.params.id;
  const username = (req.query.username || req.body?.username || '').trim();

  try {
    if (username) {
      await db.query(
        'DELETE FROM client WHERE id = ? OR username = ? OR custom_id = ?',
        [userId, username, userId]
      );
      await db.query(
        'DELETE FROM personnel WHERE id = ? OR username = ? OR custom_id = ?',
        [userId, username, userId]
      );
    } else {
      await db.query('DELETE FROM client WHERE id = ?', [userId]);
      await db.query('DELETE FROM personnel WHERE id = ?', [userId]);
    }

    return res.json({ message: `User account deleted from MySQL database successfully.` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const authenticatedUser = req.user;

  if (!authenticatedUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' ||
      !currentPassword.trim() || !newPassword.trim()) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
  }

  try {
    const role = (authenticatedUser.role || '').toString().toLowerCase().trim();
    const tableName = role === 'client' || role === 'customer' ? 'client' : 'personnel';
    const conditions = [];
    const params = [];

    if (authenticatedUser.id !== undefined && authenticatedUser.id !== null && authenticatedUser.id !== '') {
      conditions.push('id = ?');
      params.push(authenticatedUser.id);
    }
    if (authenticatedUser.username) {
      conditions.push('username = ?');
      params.push(authenticatedUser.username);
    }
    if (authenticatedUser.email) {
      conditions.push('email = ?');
      params.push(authenticatedUser.email);
    }

    if (conditions.length === 0) {
      return res.status(401).json({ error: 'Authenticated user identity is missing.' });
    }

    const [rows] = await db.query(
      `SELECT id, password FROM \`${tableName}\` WHERE ${conditions.join(' OR ')} LIMIT 1`,
      params
    );
    const account = rows[0];

    if (!account || !account.password) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(account.password);
    const currentPasswordMatches = isBcryptHash
      ? await bcrypt.compare(currentPassword, account.password)
      : currentPassword === account.password;

    if (!currentPasswordMatches) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    await db.query(
      `UPDATE \`${tableName}\` SET password = ? WHERE id = ?`,
      [hashedPassword, account.id]
    );

    return res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ error: 'Unable to change password.' });
  }
};

// Purge duplicate rows and ensure core personnel details without removing new accounts
const purgeAndKeepOnly5CorePersonnel = async () => {
  try {
    await ensureCoreSystemPersonnel();

    const [rows] = await db.query('SELECT * FROM personnel ORDER BY id ASC');
    const seenCoreKeys = new Set();
    const deleteIds = [];

    rows.forEach((r) => {
      const pId = r.id;
      const uName = (r.username || '').toString().trim().toLowerCase();
      const customId = (r.custom_id || '').toString().trim().toUpperCase();
      const fullName = `${(r.first_name || '').trim()} ${(r.last_name || '').trim()}`.toLowerCase();

      const isGarlyn = uName === 'admin' || fullName.includes('garlyn') || customId === 'ADM-1';
      const isFaith = uName === 'faith' || fullName.includes('faith') || customId === 'MGR-102';
      const isLovielle = uName === 'lovielle_garay' || fullName.includes('lovielle') || customId === 'CSH-201';
      const isChristian = uName === 'christian_brina' || fullName.includes('christian') || customId === 'STF-101';
      const isDave = uName === 'dave_garay' || fullName.includes('dave') || customId === 'STF-102';

      const coreKey = isGarlyn ? 'admin' : isFaith ? 'faith' : isLovielle ? 'lovielle' : isChristian ? 'christian' : isDave ? 'dave' : null;

      if (coreKey) {
        if (seenCoreKeys.has(coreKey)) {
          if (pId) deleteIds.push(pId);
        } else {
          seenCoreKeys.add(coreKey);
        }
      }
    });

    if (deleteIds.length > 0) {
      await db.query('DELETE FROM personnel WHERE id IN (?)', [deleteIds]);
      console.log(`🧹 Purged ${deleteIds.length} duplicate core rows from personnel table.`);
    }
  } catch (e) {
    console.warn('Personnel table purge warning:', e.message);
  }
};

// Remove duplicate rows in personnel & client MySQL tables
const cleanupDatabaseDuplicates = async () => {
  try {
    await purgeAndKeepOnly5CorePersonnel();

    try {
      await db.query(`DELETE FROM client WHERE username = 'chrislyn_brina' OR username = 'chrislyn'`);
      await db.query(`DELETE FROM personnel WHERE username = 'chrislyn_brina' OR username = 'chrislyn'`);
    } catch (e) {}

    // 1. Cleanup Personnel exact username duplicates
    const [personnelRows] = await db.query(`SELECT * FROM personnel ORDER BY id ASC`);
    const seenPersonnel = new Set();
    const deletePersonnelIds = [];

    personnelRows.forEach((r) => {
      const pId = r.id;
      const uKey = (r.username || '').toString().trim().toLowerCase();

      if (uKey && seenPersonnel.has(uKey)) {
        if (pId) deletePersonnelIds.push(pId);
      } else if (uKey) {
        seenPersonnel.add(uKey);
      }
    });

    if (deletePersonnelIds.length > 0) {
      await db.query(`DELETE FROM personnel WHERE id IN (?)`, [deletePersonnelIds]);
      console.log(`🧹 Purged ${deletePersonnelIds.length} duplicate personnel rows from MySQL table!`);
    }

    // 2. Cleanup Client exact username duplicates
    const [clientRows] = await db.query(`SELECT * FROM client ORDER BY id ASC`);
    const seenClients = new Set();
    const deleteClientIds = [];

    clientRows.forEach((r) => {
      const cId = r.id;
      const uKey = (r.username || '').toString().trim().toLowerCase();

      if (uKey && seenClients.has(uKey)) {
        if (cId) deleteClientIds.push(cId);
      } else if (uKey) {
        seenClients.add(uKey);
      }
    });

    if (deleteClientIds.length > 0) {
      await db.query(`DELETE FROM client WHERE id IN (?)`, [deleteClientIds]);
      console.log(`🧹 Purged ${deleteClientIds.length} duplicate client rows from MySQL table!`);
    }
  } catch (e) {
    console.warn('Database deduplication warning:', e.message);
  }
};

const getAllUsers = async (req, res) => {
  try {
    await ensureCoreSystemPersonnel();
    await ensureChrisBrinaClientAccount();
    let allUsers = [];

    // 1. Read personnel table
    try {
      const [personnel] = await db.query('SELECT * FROM personnel ORDER BY id ASC');
      personnel.forEach((u) => {
        const fullName = [u.first_name, u.middle_name, u.last_name].filter(Boolean).map((s) => s.trim()).filter(Boolean).join(' ') || u.username;
        const computedAge = u.age !== null && u.age !== undefined ? u.age : calculateAgeFromBday(u.birthday);
        let pRole = (u.position || u.role || 'staff').toString().trim().toLowerCase();

        if (u.username === 'admin' || (u.first_name && u.first_name.toLowerCase().includes('garlyn'))) {
          pRole = 'admin';
        }

        const pCustomId = u.custom_id || (pRole === 'admin' ? 'ADM-1' : pRole === 'manager' ? 'MGR-102' : pRole === 'cashier' ? 'CSH-201' : `PER-${u.id}`);

        allUsers.push({
          id: u.id,
          customId: pCustomId,
          custom_id: pCustomId,
          custom_personnel_id: pCustomId,
          custom_client_id: pCustomId,
          name: fullName,
          firstName: u.first_name,
          middleName: u.middle_name || '',
          lastName: u.last_name,
          username: u.username,
          email: u.email || `${u.username}@gmail.com`,
          phone: u.phone || '',
          address: u.address || '',
          civilStatus: u.civil_status || 'Single',
          birthday: u.birthday || '',
          age: computedAge || '',
          gender: u.gender || 'Female',
          avatar: u.avatar || '',
          role: pRole,
          status: 'Active',
        });
      });
    } catch (e) {
      console.warn('Personnel query warning:', e.message);
    }

    // 2. Read client table
    try {
      const [clients] = await db.query('SELECT * FROM client ORDER BY id ASC');
      clients.forEach((u) => {
        const fullName = [u.first_name, u.middle_name, u.last_name].filter(Boolean).map((s) => s.trim()).filter(Boolean).join(' ') || u.username;
        const computedAge = u.age !== null && u.age !== undefined ? u.age : calculateAgeFromBday(u.birthday);
        const cCustomId = u.custom_id || `CLT-${300 + parseInt(u.id || 1, 10)}`;

        allUsers.push({
          id: u.id,
          customId: cCustomId,
          custom_id: cCustomId,
          custom_client_id: cCustomId,
          custom_personnel_id: cCustomId,
          name: fullName,
          firstName: u.first_name,
          middleName: u.middle_name || '',
          lastName: u.last_name,
          username: u.username,
          email: u.email || `${u.username}@gmail.com`,
          phone: u.phone || '',
          address: u.address || '',
          civilStatus: u.civil_status || 'Single',
          birthday: u.birthday || '',
          age: computedAge || '',
          gender: u.gender || 'Female',
          avatar: u.avatar || '',
          role: 'client',
          status: 'Active',
        });
      });
    } catch (e) {
      console.warn('Client query warning:', e.message);
    }

    // 3. Multi-key Deduplication
    const seenKeys = new Set();
    const cleanAllUsers = allUsers.filter((u) => {
      if (!u) return false;
      const uKey = (u.username || '').toLowerCase();
      const cKey = (u.customId || '').toLowerCase();
      const nKey = (u.name || '').toLowerCase();

      if (uKey && seenKeys.has(`u:${uKey}`)) return false;
      if (cKey && seenKeys.has(`c:${cKey}`)) return false;
      if (nKey && nKey.length > 3 && seenKeys.has(`n:${nKey}`)) return false;

      if (uKey) seenKeys.add(`u:${uKey}`);
      if (cKey) seenKeys.add(`c:${cKey}`);
      if (nKey && nKey.length > 3) seenKeys.add(`n:${nKey}`);

      return true;
    });

    return res.json(cleanAllUsers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const register = async (req, res) => {
  return createAccount(req, res);
};

const login = async (req, res) => {
  const { username, email, password } = req.body;
  const identifier = (username || email || '').trim().toLowerCase();

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const [clients] = await db.query(
      'SELECT * FROM client WHERE username = ? OR email = ?',
      [identifier, identifier]
    );

    let user = clients[0];
    let userRole = 'customer';

    if (!user) {
      const [personnel] = await db.query(
        'SELECT * FROM personnel WHERE username = ? OR email = ?',
        [identifier, identifier]
      );
      user = personnel[0];
      if (user) {
        userRole = (user.position || user.role || 'staff').toString().trim().toLowerCase();
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Admin strict override
    if (identifier === 'admin' || identifier === 'garlyn' || identifier === 'autocareadmin' || user.username === 'admin' || user.username === 'AutoCareAdmin') {
      userRole = 'admin';
    }

    let isMatch = false;

    if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
      isMatch = await bcrypt.compare(password, user.password);
    } else if (user.password) {
      isMatch = password === user.password;
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const displayName = [user.first_name, user.middle_name, user.last_name]
      .filter(Boolean)
      .map((s) => s.trim())
      .filter(Boolean)
      .join(' ') || user.username;

    let customId = user.custom_id;
    if (userRole === 'customer' || userRole === 'client') {
      if (!customId || (customId === 'CLT-301' && !displayName.toLowerCase().includes('claire') && user.username !== 'CLT-4')) {
        customId = `CLT-${300 + parseInt(user.id || 4, 10)}`;
        try {
          db.query('UPDATE client SET custom_id = ? WHERE id = ?', [customId, user.id]);
        } catch (e) {}
      }
    } else {
      if (!customId) {
        customId = userRole === 'admin' ? 'ADM-1' : userRole === 'manager' ? 'MGR-102' : userRole === 'cashier' ? 'CSH-201' : 'STF-101';
      }
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: userRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const computedAge = user.age !== null && user.age !== undefined ? user.age : calculateAgeFromBday(user.birthday);

    return res.json({
      token,
      user: {
        id: user.id,
        name: displayName,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        address: user.address,
        civilStatus: user.civil_status || 'Single',
        birthday: user.birthday || '',
        age: computedAge || '',
        gender: user.gender || 'Female',
        avatar: user.avatar || '',
        customId,
        custom_id: customId,
        custom_client_id: customId,
        custom_personnel_id: customId,
        role: userRole,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const requestedRole = (req.user.role || '').toLowerCase().trim();
  const isClientRole = ['client', 'customer'].includes(requestedRole);

  try {
    if (isClientRole) {
      const [clients] = await db.query(
        'SELECT * FROM client WHERE username = ? OR email = ? OR id = ?',
        [req.user.username, req.user.username, req.user.id]
      );

      if (clients.length > 0) {
        const u = clients[0];
        const fullName = [u.first_name, u.middle_name, u.last_name].filter(Boolean).map((s) => s.trim()).filter(Boolean).join(' ') || u.username;
        const computedAge = u.age !== null && u.age !== undefined ? u.age : calculateAgeFromBday(u.birthday);

        let clientCustomId = u.custom_id;
        if (!clientCustomId || (clientCustomId === 'CLT-301' && !fullName.toLowerCase().includes('claire') && u.username !== 'CLT-4')) {
          clientCustomId = `CLT-${300 + parseInt(u.id || 4, 10)}`;
        }

        return res.json({
          id: u.id,
          name: fullName,
          firstName: u.first_name,
          first_name: u.first_name,
          middleName: u.middle_name || '',
          middle_name: u.middle_name || '',
          lastName: u.last_name,
          last_name: u.last_name,
          username: u.username,
          email: u.email,
          phone: u.phone || '',
          address: u.address || '',
          civilStatus: u.civil_status || 'Single',
          civil_status: u.civil_status || 'Single',
          birthday: u.birthday || '',
          age: computedAge || '',
          gender: u.gender || 'Female',
          avatar: u.avatar || '',
          customId: clientCustomId,
          custom_id: clientCustomId,
          custom_client_id: clientCustomId,
          role: 'client',
        });
      }
    }

    const [personnel] = await db.query(
      'SELECT * FROM personnel WHERE username = ? OR email = ? OR id = ?',
      [req.user.username, req.user.username, req.user.id]
    );

    if (personnel.length > 0) {
      const u = personnel[0];
      let pRole = (u.position || u.role || 'staff').toString().trim().toLowerCase();
      if (u.username === 'admin' || (u.first_name && u.first_name.toLowerCase().includes('garlyn'))) {
        pRole = 'admin';
      }

      const fullName = [u.first_name, u.middle_name, u.last_name].filter(Boolean).map((s) => s.trim()).filter(Boolean).join(' ') || u.username;
      const pCustomId = u.custom_id || (pRole === 'admin' ? 'ADM-1' : pRole === 'manager' ? 'MGR-102' : pRole === 'cashier' ? 'CSH-201' : 'STF-101');
      const computedAge = u.age !== null && u.age !== undefined ? u.age : calculateAgeFromBday(u.birthday);
      return res.json({
        id: u.id,
        name: fullName,
        firstName: u.first_name,
        first_name: u.first_name,
        middleName: u.middle_name || '',
        middle_name: u.middle_name || '',
        lastName: u.last_name,
        last_name: u.last_name,
        username: u.username,
        email: u.email,
        phone: u.phone || '',
        address: u.address || '',
        civilStatus: u.civil_status || 'Single',
        civil_status: u.civil_status || 'Single',
        birthday: u.birthday || '',
        age: computedAge || '',
        gender: u.gender || 'Female',
        avatar: u.avatar || '',
        customId: pCustomId,
        custom_id: pCustomId,
        custom_personnel_id: pCustomId,
        role: pRole,
      });
    }

    if (!isClientRole) {
      const [clientsFallback] = await db.query(
        'SELECT * FROM client WHERE username = ? OR email = ? OR id = ?',
        [req.user.username, req.user.username, req.user.id]
      );
      if (clientsFallback.length > 0) {
        const u = clientsFallback[0];
        const fullName = [u.first_name, u.middle_name, u.last_name].filter(Boolean).map((s) => s.trim()).filter(Boolean).join(' ') || u.username;
        const computedAge = u.age !== null && u.age !== undefined ? u.age : calculateAgeFromBday(u.birthday);
        let clientCustomId = u.custom_id || `CLT-${300 + parseInt(u.id || 4, 10)}`;

        return res.json({
          id: u.id,
          name: fullName,
          firstName: u.first_name,
          first_name: u.first_name,
          middleName: u.middle_name || '',
          middle_name: u.middle_name || '',
          lastName: u.last_name,
          last_name: u.last_name,
          username: u.username,
          email: u.email,
          phone: u.phone || '',
          address: u.address || '',
          civilStatus: u.civil_status || 'Single',
          civil_status: u.civil_status || 'Single',
          birthday: u.birthday || '',
          age: computedAge || '',
          gender: u.gender || 'Female',
          avatar: u.avatar || '',
          customId: clientCustomId,
          custom_id: clientCustomId,
          custom_client_id: clientCustomId,
          role: 'client',
        });
      }
    }

    return res.status(404).json({ error: 'User not found.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

let pendingRequestsTableEnsured = false;
const ensurePendingRequestsTable = async () => {
  if (pendingRequestsTableEnsured) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS pending_client_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100) DEFAULT '',
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        phone VARCHAR(50) DEFAULT '',
        address VARCHAR(255) DEFAULT '',
        gender VARCHAR(50) DEFAULT 'Male',
        civil_status VARCHAR(50) DEFAULT 'Single',
        birthday VARCHAR(50) DEFAULT '',
        age INT DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        requested_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [cols] = await db.query(`SHOW COLUMNS FROM pending_client_requests`);
    const colNames = new Set(cols.map((c) => c.Field));
    if (!colNames.has('phone')) {
      await db.query(`ALTER TABLE pending_client_requests ADD COLUMN phone VARCHAR(50) DEFAULT ''`);
    }
    if (colNames.has('contact_number')) {
      try {
        await db.query(`UPDATE pending_client_requests SET phone = contact_number WHERE (phone IS NULL OR phone = '') AND contact_number IS NOT NULL AND contact_number != ''`);
      } catch (e1) {}
      try {
        await db.query(`ALTER TABLE pending_client_requests DROP COLUMN contact_number`);
      } catch (e2) {}
    }

    const reqAtCol = cols.find((c) => c.Field === 'requested_at');
    if (reqAtCol && reqAtCol.Type.toLowerCase().includes('varchar')) {
      await db.query(`UPDATE pending_client_requests SET requested_at = NULL WHERE requested_at = '' OR requested_at = 'null' OR requested_at = 'Recently'`);
      await db.query(`ALTER TABLE pending_client_requests MODIFY COLUMN requested_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
      console.log('✅ Migrated MySQL pending_client_requests.requested_at to DATETIME!');
    }

    pendingRequestsTableEnsured = true;
  } catch (e) {
    console.warn('pending_client_requests table check warning:', e.message);
  }
};

const submitPendingRequest = async (req, res) => {
  const {
    firstName,
    middleName = '',
    lastName,
    email,
    phone = '',
    address = '',
    gender = 'Male',
    civilStatus = 'Single',
    birthday = '',
    age = '',
  } = req.body;

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'First name, last name, and email are required.' });
  }

  const computedAgeNum = age !== undefined && age !== '' && !isNaN(parseInt(age, 10))
    ? parseInt(age, 10)
    : calculateAgeFromBday(birthday);

  const now = new Date();

  try {
    await ensurePendingRequestsTable();

    const [result] = await db.query(
      `INSERT INTO pending_client_requests (first_name, middle_name, last_name, email, phone, address, gender, civil_status, birthday, age, status, requested_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
      [
        firstName,
        middleName,
        lastName,
        email,
        phone,
        address,
        gender,
        civilStatus,
        birthday,
        computedAgeNum,
        now,
      ]
    );

    return res.status(201).json({
      message: 'Account registration request submitted to database successfully!',
      requestId: result.insertId,
    });
  } catch (error) {
    console.error('Pending request SQL error:', error);
    return res.status(500).json({ error: error.message });
  }
};

const formatDateForApi = (dateVal) => {
  if (!dateVal) return 'Recently';
  if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return 'Recently';
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${dateVal.getFullYear()}-${pad(dateVal.getMonth() + 1)}-${pad(dateVal.getDate())} ${pad(dateVal.getHours())}:${pad(dateVal.getMinutes())}:${pad(dateVal.getSeconds())}`;
  }
  return dateVal.toString();
};

const getPendingRequestsApi = async (req, res) => {
  try {
    await ensurePendingRequestsTable();
    const [rows] = await db.query('SELECT * FROM pending_client_requests WHERE status = "PENDING" ORDER BY id DESC');

    const formatted = rows.map((r) => ({
      id: r.id,
      firstName: r.first_name,
      middleName: r.middle_name || '',
      lastName: r.last_name,
      name: [r.first_name, r.middle_name, r.last_name].filter(Boolean).map((s) => s.trim()).filter(Boolean).join(' '),
      email: r.email,
      phone: r.phone || '',
      address: r.address || '',
      gender: r.gender || 'Male',
      civilStatus: r.civil_status || 'Single',
      birthday: r.birthday || '',
      age: r.age || '',
      requestedAt: formatDateForApi(r.requested_at),
    }));

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const deletePendingRequestApiHandler = async (req, res) => {
  const reqId = req.params.id;
  const email = (req.query.email || req.body?.email || '').trim();
  try {
    await ensurePendingRequestsTable();
    if (email) {
      await db.query('DELETE FROM pending_client_requests WHERE id = ? OR email = ?', [reqId, email]);
    } else {
      await db.query('DELETE FROM pending_client_requests WHERE id = ?', [reqId]);
    }
    return res.json({ message: 'Pending request removed from database.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  ensureAuthTablesExist,
  createAccount,
  updateProfile,
  changePassword,
  deleteUserAccount,
  getAllUsers,
  register,
  login,
  getProfile,
  submitPendingRequest,
  getPendingRequestsApi,
  deletePendingRequestApiHandler,
  ensureTableColumns,
  purgeAndKeepOnly5CorePersonnel,
  cleanupDatabaseDuplicates,
  ensureCoreSystemPersonnel,
  ensureJaymarieBusacoClientAccount,
  ensureChrisBrinaClientAccount,
  cleanupDuplicateDeavoune,
};
