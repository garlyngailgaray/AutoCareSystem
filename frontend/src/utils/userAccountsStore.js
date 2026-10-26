// Shared Store for User Accounts (Personnel & Clients)
import { deleteJobOrdersForUser } from './jobOrderStore';
import { fetchAllUsers } from '../api';

const STORAGE_KEY = 'autocare_system_users';

const initialUsers = [
  {
    id: 1,
    customId: 'ADM-1',
    name: 'Garlyn Gail Torillo Garay',
    firstName: 'Garlyn Gail',
    middleName: 'Torillo',
    lastName: 'Garay',
    username: 'admin',
    email: 'garlyn@gmail.com',
    phone: '09127080272',
    address: 'Loay, Bohol',
    role: 'admin',
    civilStatus: 'Married',
    gender: 'Female',
    birthday: '2004-08-25',
    age: 22,
    status: 'Active',
  },
  {
    id: 2,
    customId: 'MGR-102',
    name: 'Faith Hinghing Cruz',
    firstName: 'Faith',
    middleName: 'Hinghing',
    lastName: 'Cruz',
    username: 'faith_cruz',
    email: 'faith@autocare.com',
    phone: '09327182716',
    address: 'Bilar',
    role: 'manager',
    civilStatus: 'Widowed',
    gender: 'Female',
    birthday: '2005-05-09',
    age: 21,
    status: 'Active',
  },
  {
    id: 3,
    customId: 'CSH-201',
    name: 'Lovielle Cathaleya Garay',
    firstName: 'Lovielle Cathaleya',
    middleName: 'Torillo',
    lastName: 'Garay',
    username: 'lovielle_garay',
    email: 'lovielle@gmail.com',
    phone: '09858911514',
    address: 'Italy',
    role: 'cashier',
    civilStatus: 'Single',
    gender: 'Female',
    birthday: '1998-08-08',
    age: 27,
    status: 'Active',
  },
  {
    id: 4,
    customId: 'STF-101',
    name: 'Christian Brina',
    firstName: 'Christian',
    middleName: 'Marticion',
    lastName: 'Brina',
    username: 'christian_brina',
    email: 'christian@gmail.com',
    phone: '09957751462',
    address: 'Sevilla',
    role: 'staff',
    civilStatus: 'Married',
    gender: 'Male',
    birthday: '1992-03-12',
    age: 33,
    status: 'Active',
  },
  {
    id: 5,
    customId: 'STF-102',
    name: 'Dave Garay',
    firstName: 'Dave',
    middleName: 'Torillo',
    lastName: 'Garay',
    username: 'dave_garay',
    email: 'dave@gmail.com',
    phone: '09385149095',
    address: 'Loay',
    role: 'staff',
    civilStatus: 'Single',
    gender: 'Male',
    birthday: '1996-07-22',
    age: 29,
    status: 'Active',
  },
  {
    id: 6,
    customId: 'CLT-301',
    name: 'Claire Deliman',
    firstName: 'Claire',
    middleName: 'Deliman',
    lastName: 'Deliman',
    username: 'CLT-4',
    email: 'claire@gmail.com',
    phone: '09090909090',
    address: 'Baclayon',
    role: 'client',
    civilStatus: 'Married',
    gender: 'Female',
    birthday: '1994-11-10',
    age: 31,
    status: 'Active',
  },
  {
    id: 7,
    customId: 'CLT-302',
    name: 'Lucky Garay',
    firstName: 'Lucky',
    middleName: 'Torillo',
    lastName: 'Garay',
    username: 'lucky_garay',
    email: 'lucky@gmail.com',
    phone: '09966009233',
    address: 'Baclayon',
    role: 'client',
    civilStatus: 'Single',
    gender: 'Male',
    birthday: '1997-04-18',
    age: 28,
    status: 'Active',
  },
  {
    id: 8,
    customId: 'CLT-303',
    name: 'Mike Gerald Bacasmas',
    firstName: 'Mike Gerald',
    middleName: 'Bacasmas',
    lastName: 'Bacasmas',
    username: 'clt_mikegerald303',
    email: 'mike@gmail.com',
    phone: '09631371882',
    address: 'Albur',
    role: 'client',
    civilStatus: 'Married',
    gender: 'Male',
    birthday: '1993-02-14',
    age: 33,
    status: 'Active',
  },
  {
    id: 9,
    customId: 'CLT-304',
    name: 'Deavoune Torillo Garay',
    firstName: 'Deavoune',
    middleName: 'Torillo',
    lastName: 'Garay',
    username: 'deavoune_garay',
    email: 'deavoune@gmail.com',
    phone: '09894166417',
    address: 'Kanipaan',
    role: 'client',
    civilStatus: 'Single',
    gender: 'Female',
    birthday: '2000-09-09',
    age: 25,
    status: 'Active',
  },
  {
    id: 10,
    customId: 'CLT-305',
    name: 'Jaymarie Busaco',
    firstName: 'Jaymarie',
    middleName: 'Busaco',
    lastName: 'Busaco',
    username: 'jaymarie',
    email: 'jaymarie@autocare.com',
    phone: '09123456789',
    address: 'Loay, Bohol',
    role: 'client',
    civilStatus: 'Single',
    gender: 'Female',
    birthday: '1995-08-20',
    age: 30,
    status: 'Active',
  },
  {
    id: 11,
    customId: 'CLT-306',
    name: 'Chris Brina',
    firstName: 'Chris',
    middleName: '',
    lastName: 'Brina',
    username: 'chris_brina',
    email: 'chris@gmail.com',
    phone: '09123456789',
    address: 'Bohol',
    role: 'client',
    civilStatus: 'Single',
    gender: 'Male',
    birthday: '1996-05-15',
    age: 29,
    status: 'Active',
  },
];

// Multi-field Deduplication Helper by username, customId, email, and name
export const deduplicateUsers = (userList) => {
  if (!Array.isArray(userList)) return [];
  const seenKeys = new Set();

  return userList.filter((u) => {
    if (!u) return false;

    const usernameKey = (u.username || '').toString().trim().toLowerCase();
    const customIdKey = (u.customId || '').toString().trim().toLowerCase();
    const emailKey = (u.email || '').toString().trim().toLowerCase();
    const nameKey = (u.name || `${u.firstName || ''} ${u.lastName || ''}`).toString().trim().toLowerCase();

    // Check if any identifier was previously registered
    if (usernameKey && seenKeys.has(`user:${usernameKey}`)) return false;
    if (customIdKey && seenKeys.has(`cid:${customIdKey}`)) return false;
    if (emailKey && emailKey.includes('@') && !emailKey.includes('gmail.com/default') && seenKeys.has(`email:${emailKey}`)) return false;
    if (nameKey && nameKey.length > 3 && seenKeys.has(`name:${nameKey}`)) return false;

    // Register all identifiers
    if (usernameKey) seenKeys.add(`user:${usernameKey}`);
    if (customIdKey) seenKeys.add(`cid:${customIdKey}`);
    if (emailKey && emailKey.includes('@')) seenKeys.add(`email:${emailKey}`);
    if (nameKey && nameKey.length > 3) seenKeys.add(`name:${nameKey}`);

    return true;
  });
};

// Auto-repair Client IDs so every client has a unique sequential ID
export const fixAndSequentializeClientIds = (userList) => {
  if (!Array.isArray(userList)) return [];

  const seenIds = new Set();
  let clientCounter = 301;

  const fixedList = userList.map((u) => {
    if (!u) return u;
    const uName = (u.name || '').toLowerCase();
    const uUsername = (u.username || '').toLowerCase();

    // Ensure Deavoune Garay is strictly a Client (CLT-304)
    if (uName.includes('deavoune') || uUsername.includes('deavoune')) {
      seenIds.add('CLT-304');
      return {
        ...u,
        role: 'client',
        customId: 'CLT-304',
      };
    }

    // Ensure Jaymarie Busaco is strictly a Client (CLT-305)
    if (uName.includes('jaymarie') || uUsername.includes('jaymarie')) {
      seenIds.add('CLT-305');
      return {
        ...u,
        role: 'client',
        customId: 'CLT-305',
      };
    }

    // Ensure Chris Brina is strictly a Client (CLT-306)
    if ((uName.includes('chris') && uName.includes('brina') && !uName.includes('christian')) || uUsername.includes('chris_brina')) {
      seenIds.add('CLT-306');
      return {
        ...u,
        role: 'client',
        customId: 'CLT-306',
      };
    }

    const role = (u.role || 'client').toLowerCase();

    if (role === 'client' || role === 'customer') {
      if (uName.includes('claire') || u.username === 'CLT-4') {
        seenIds.add('CLT-301');
        return { ...u, customId: 'CLT-301' };
      }
      if (uName.includes('lucky') || u.username === 'lucky_garay') {
        seenIds.add('CLT-302');
        return { ...u, customId: 'CLT-302' };
      }
      if (uName.includes('mike') || u.username === 'clt_mikegerald303') {
        seenIds.add('CLT-303');
        return { ...u, customId: 'CLT-303' };
      }
    }
    return u;
  });

  return fixedList.map((u) => {
    if (!u) return u;
    const uName = (u.name || '').toLowerCase();
    const role = (u.role || 'client').toLowerCase();

    if (role === 'client' || role === 'customer') {
      if (uName.includes('claire') || uName.includes('lucky') || uName.includes('mike') || uName.includes('deavoune') || uName.includes('jaymarie')) {
        return u;
      }

      if (!u.customId || seenIds.has(u.customId) || u.customId === 'CLT-301') {
        while (seenIds.has(`CLT-${clientCounter}`)) {
          clientCounter++;
        }
        const newId = `CLT-${clientCounter}`;
        seenIds.add(newId);
        clientCounter++;
        return { ...u, customId: newId };
      } else {
        seenIds.add(u.customId);
      }
    }
    return u;
  });
};

// Ensure core system personnel (Admin, Faith, Lovielle, Mechanics) are always present
export const ensureCoreUsersPresent = (userList) => {
  if (!Array.isArray(userList)) userList = [];

  const requiredCore = [
    {
      id: 1,
      customId: 'ADM-1',
      name: 'Garlyn Gail Torillo Garay',
      firstName: 'Garlyn Gail',
      lastName: 'Garay',
      username: 'admin',
      email: 'garlyn@gmail.com',
      phone: '09127080272',
      address: 'Loay, Bohol',
      role: 'admin',
      civilStatus: 'Married',
      gender: 'Female',
      status: 'Active',
    },
    {
      id: 2,
      customId: 'MGR-102',
      name: 'Faith Hinghing Cruz',
      firstName: 'Faith',
      middleName: 'Hinghing',
      lastName: 'Cruz',
      username: 'faith_cruz',
      email: 'faith@autocare.com',
      phone: '09327182716',
      address: 'Bilar',
      role: 'manager',
      civilStatus: 'Widowed',
      gender: 'Female',
      birthday: '2005-05-09',
      age: 21,
      status: 'Active',
    },
    {
      id: 3,
      customId: 'CSH-201',
      name: 'Lovielle Cathaleya Garay',
      firstName: 'Lovielle Cathaleya',
      lastName: 'Garay',
      username: 'lovielle_garay',
      email: 'lovielle@gmail.com',
      phone: '09858911514',
      address: 'Italy',
      role: 'cashier',
      civilStatus: 'Single',
      gender: 'Female',
      status: 'Active',
    },
    {
      id: 4,
      customId: 'STF-101',
      name: 'Christian Brina',
      firstName: 'Christian',
      lastName: 'Brina',
      username: 'christian_brina',
      email: 'christian@gmail.com',
      phone: '09957751462',
      address: 'Sevilla',
      role: 'staff',
      civilStatus: 'Married',
      gender: 'Male',
      status: 'Active',
    },
    {
      id: 5,
      customId: 'STF-102',
      name: 'Dave Garay',
      firstName: 'Dave',
      lastName: 'Garay',
      username: 'dave_garay',
      email: 'dave@gmail.com',
      phone: '09385149095',
      address: 'Loay',
      role: 'staff',
      civilStatus: 'Single',
      gender: 'Male',
      status: 'Active',
    },
    {
      id: 10,
      customId: 'CLT-305',
      name: 'Jaymarie Busaco',
      firstName: 'Jaymarie',
      lastName: 'Busaco',
      username: 'jaymarie',
      email: 'jaymarie@autocare.com',
      phone: '09123456789',
      address: 'Loay, Bohol',
      role: 'client',
      civilStatus: 'Single',
      gender: 'Female',
      status: 'Active',
    },
    {
      id: 11,
      customId: 'CLT-306',
      name: 'Chris Brina',
      firstName: 'Chris',
      lastName: 'Brina',
      username: 'chris_brina',
      email: 'chris@gmail.com',
      phone: '09123456789',
      address: 'Bohol',
      role: 'client',
      civilStatus: 'Single',
      gender: 'Male',
      status: 'Active',
    },
  ];

  const merged = [...userList];
  requiredCore.forEach((core) => {
    const exists = merged.some(
      (u) =>
        u &&
        ((u.username && u.username.toLowerCase() === core.username.toLowerCase()) ||
          (u.customId && u.customId.toLowerCase() === core.customId.toLowerCase()))
    );
    if (!exists) {
      merged.push(core);
    }
  });

  return merged;
};

// Helper to remove deleted accounts (e.g., Chrislyn Garay Brina)
export const filterDeletedUsers = (userList) => {
  if (!Array.isArray(userList)) return [];
  return userList.filter((u) => {
    if (!u) return false;
    const uName = (u.name || `${u.firstName || ''} ${u.lastName || ''}`).toLowerCase();
    const uUsername = (u.username || '').toLowerCase();

    // Filter out Chrislyn Garay Brina who was deleted in User Management
    if (uName.includes('chrislyn') || uUsername.includes('chrislyn')) {
      return false;
    }
    return true;
  });
};

export const syncUsersWithBackend = async () => {
  try {
    const dbUsers = await fetchAllUsers();
    if (Array.isArray(dbUsers) && dbUsers.length > 0) {
      const merged = filterDeletedUsers(ensureCoreUsersPresent(fixAndSequentializeClientIds(deduplicateUsers(dbUsers))));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (e) {
    console.warn('MySQL Users API offline/unreachable:', e.message);
  }
  return getUserAccounts();
};

export const getUserAccounts = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const cleanInitial = filterDeletedUsers(ensureCoreUsersPresent(fixAndSequentializeClientIds(deduplicateUsers(initialUsers))));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanInitial));
      return cleanInitial;
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const deduped = filterDeletedUsers(ensureCoreUsersPresent(fixAndSequentializeClientIds(deduplicateUsers(parsed))));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
      return deduped;
    } else {
      const cleanInitial = filterDeletedUsers(ensureCoreUsersPresent(fixAndSequentializeClientIds(deduplicateUsers(initialUsers))));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanInitial));
      return cleanInitial;
    }
  } catch (e) {
    console.error('Error reading users from localStorage:', e);
    const cleanInitial = filterDeletedUsers(ensureCoreUsersPresent(fixAndSequentializeClientIds(deduplicateUsers(initialUsers))));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanInitial));
    return cleanInitial;
  }
};

export const addUserAccount = (newUser) => {
  const users = getUserAccounts();

  const userRole = newUser.role || 'client';
  const rolePrefix = userRole === 'admin' ? 'ADM' : userRole === 'manager' ? 'MGR' : userRole === 'cashier' ? 'CSH' : userRole === 'staff' || userRole === 'mechanic' ? 'STF' : 'CLT';

  const numbers = users
    .map((u) => {
      if (!u || !u.customId) return null;
      const parts = u.customId.split('-');
      if (parts.length === 2 && parts[0].toUpperCase() === rolePrefix) {
        const num = parseInt(parts[1], 10);
        return isNaN(num) ? null : num;
      }
      return null;
    })
    .filter((n) => n !== null);

  let customId = newUser.customId;
  if (!customId) {
    let nextNum = 1;
    if (rolePrefix === 'CLT') {
      nextNum = numbers.length > 0 ? Math.max(...numbers, 304) + 1 : 301;
    } else if (rolePrefix === 'STF') {
      nextNum = numbers.length > 0 ? Math.max(...numbers, 102) + 1 : 101;
    } else if (rolePrefix === 'CSH') {
      nextNum = numbers.length > 0 ? Math.max(...numbers, 201) + 1 : 201;
    } else if (rolePrefix === 'MGR') {
      nextNum = numbers.length > 0 ? Math.max(...numbers, 102) + 1 : 101;
    } else {
      nextNum = numbers.length > 0 ? Math.max(...numbers, 1) + 1 : 1;
    }
    customId = `${rolePrefix}-${nextNum}`;
  }

  const fullName = [newUser.firstName, newUser.middleName, newUser.lastName]
    .filter(Boolean)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ');

  const createdUser = {
    id: users.length > 0 ? Math.max(...users.map((u) => u.id || 0)) + 1 : 1,
    customId,
    name: fullName || `${newUser.firstName} ${newUser.lastName}`.trim(),
    firstName: newUser.firstName,
    middleName: newUser.middleName || '',
    lastName: newUser.lastName,
    username: newUser.username,
    email: newUser.email || `${newUser.username}@gmail.com`,
    phone: newUser.phone || '09123456789',
    address: newUser.address || 'Bohol',
    role: userRole,
    gender: newUser.gender || 'Female',
    birthday: newUser.birthday || '',
    age: newUser.age || '',
    civilStatus: newUser.civilStatus || 'Single',
    status: 'Active',
  };

  const updated = filterDeletedUsers(ensureCoreUsersPresent(fixAndSequentializeClientIds(deduplicateUsers([createdUser, ...users]))));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('autocare_users_updated'));
  window.dispatchEvent(new Event('storage'));
  return createdUser;
};

export const updateUserAccount = (profileData) => {
  const users = getUserAccounts();
  const updated = users.map((u) => {
    if (
      u.username === profileData.username ||
      (profileData.customId && u.customId === profileData.customId) ||
      (profileData.id && u.id === profileData.id)
    ) {
      const fullName = [profileData.firstName || profileData.first_name, profileData.middleName || profileData.middle_name, profileData.lastName || profileData.last_name]
        .filter(Boolean)
        .map((s) => s.trim())
        .join(' ');

      return {
        ...u,
        ...profileData,
        name: fullName || profileData.name || u.name,
        firstName: profileData.firstName || profileData.first_name || u.firstName,
        middleName: profileData.middleName || profileData.middle_name || u.middleName,
        lastName: profileData.lastName || profileData.last_name || u.lastName,
        phone: profileData.phone || u.phone,
        civilStatus: profileData.civilStatus || profileData.civil_status || u.civilStatus,
        birthday: profileData.birthday || u.birthday,
        age: profileData.age !== undefined && profileData.age !== '' ? profileData.age : u.age,
        gender: profileData.gender || u.gender,
        avatar: profileData.avatar || u.avatar,
      };
    }
    return u;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('autocare_users_updated'));
  window.dispatchEvent(new Event('storage'));
};

export const removeUserAccount = (targetUser) => {
  const users = getUserAccounts();
  const targetId = targetUser?.id;
  const targetUsername = (targetUser?.username || '').toString().trim().toLowerCase().replace(/^@/, '');
  const targetCustomId = (targetUser?.customId || targetUser?.custom_client_id || '').toString().trim().toLowerCase();
  const targetName = (targetUser?.name || `${targetUser?.firstName || ''} ${targetUser?.lastName || ''}`).toString().trim().toLowerCase();

  const filtered = users.filter((u) => {
    if (!u) return false;
    const uId = u.id;
    const uUsername = (u.username || '').toString().trim().toLowerCase().replace(/^@/, '');
    const uCustomId = (u.customId || u.custom_client_id || '').toString().trim().toLowerCase();
    const uName = (u.name || `${u.firstName || ''} ${u.lastName || ''}`).toString().trim().toLowerCase();

    if (targetId && String(uId) === String(targetId)) return false;
    if (targetUsername && uUsername === targetUsername) return false;
    if (targetCustomId && uCustomId === targetCustomId) return false;
    if (targetName && targetName.length > 3 && uName === targetName) return false;
    if (targetName.includes('chrislyn') || uName.includes('chrislyn') || targetUsername.includes('chrislyn') || uUsername.includes('chrislyn')) {
      if (uName.includes('chrislyn') || uUsername.includes('chrislyn')) return false;
    }
    return true;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

  try {
    deleteJobOrdersForUser(targetUser);
  } catch (e) {
    console.warn('Error purging job orders for deleted user:', e);
  }

  window.dispatchEvent(new Event('autocare_users_updated'));
  window.dispatchEvent(new Event('storage'));
};
