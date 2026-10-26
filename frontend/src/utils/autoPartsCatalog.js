import { fetchPartsApi, addPartApi, updatePartStockApi, updatePartPriceApi } from '../api';

// Central Auto Parts & Replaced Components Catalog with Live Persistent Stock Inventory
export const AUTO_PARTS_CATALOG = {
  'Brake & Suspension Overhaul': [
    { id: 'bp-01', name: 'Ceramic Front Brake Pads (Pair)', price: '₱1,800.00', stockQuantity: 28, unit: 'Set', inStock: true },
    { id: 'bp-02', name: 'DOT4 Hydraulic Brake Fluid (500ml)', price: '₱400.00', stockQuantity: 45, unit: 'Bottle', inStock: true },
    { id: 'bp-03', name: 'Vented Front Brake Rotor Disc', price: '₱2,200.00', stockQuantity: 16, unit: 'Piece', inStock: true },
    { id: 'bp-04', name: 'Heavy-Duty Gas Shock Absorber', price: '₱3,500.00', stockQuantity: 12, unit: 'Pair', inStock: true },
  ],
  'Change Oil & Maintenance': [
    { id: 'co-01', name: 'Fully Synthetic Engine Oil 5W-30 (4L)', price: '₱1,800.00', stockQuantity: 35, unit: 'Gallon', inStock: true },
    { id: 'co-02', name: 'OEM High-Flow Oil Filter', price: '₱350.00', stockQuantity: 60, unit: 'Piece', inStock: true },
    { id: 'co-03', name: 'Engine Cabin Air Filter Element', price: '₱450.00', stockQuantity: 22, unit: 'Piece', inStock: true },
  ],
  'Engine Overhauling': [
    { id: 'eo-01', name: 'Precision Piston Ring Set', price: '₱4,500.00', stockQuantity: 8, unit: 'Set', inStock: true },
    { id: 'eo-02', name: 'Multi-Layer Steel Head Gasket', price: '₱2,800.00', stockQuantity: 14, unit: 'Piece', inStock: true },
    { id: 'eo-03', name: 'Kevlar Reinforced Timing Belt', price: '₱2,200.00', stockQuantity: 19, unit: 'Piece', inStock: true },
    { id: 'eo-04', name: 'Iridium Power Spark Plugs (4x)', price: '₱1,600.00', stockQuantity: 30, unit: 'Pack', inStock: true },
  ],
  'Air Conditioning Services': [
    { id: 'ac-01', name: 'R134a Refrigerant Gas Refill', price: '₱800.00', stockQuantity: 50, unit: 'Can', inStock: true },
    { id: 'ac-02', name: 'OEM Rotary AC Compressor Assembly', price: '₱8,500.00', stockQuantity: 6, unit: 'Unit', inStock: true },
    { id: 'ac-03', name: 'AC Condenser Cooling Coil', price: '₱3,200.00', stockQuantity: 11, unit: 'Piece', inStock: true },
    { id: 'ac-04', name: 'High-Density Cabin AC Filter', price: '₱450.00', stockQuantity: 25, unit: 'Piece', inStock: true },
  ],
  'Body Paint & Refinishing': [
    { id: 'bp-10', name: 'Oven-Baked Automotive Primer Paint', price: '₱3,500.00', stockQuantity: 18, unit: 'Liter', inStock: true },
    { id: 'bp-11', name: 'High-Gloss Ceramic Clear Coat Glaze', price: '₱4,200.00', stockQuantity: 15, unit: 'Can', inStock: true },
    { id: 'bp-12', name: 'Polyurethane Body Filler Putty', price: '₱1,200.00', stockQuantity: 20, unit: 'Tin', inStock: true },
  ],
  'Tune Up & Ignition System': [
    { id: 'tu-01', name: 'Iridium Spark Plugs (4x)', price: '₱1,600.00', stockQuantity: 30, unit: 'Pack', inStock: true },
    { id: 'tu-02', name: 'High-Output Ignition Coil Pack', price: '₱2,400.00', stockQuantity: 16, unit: 'Piece', inStock: true },
    { id: 'tu-03', name: 'In-Line Fuel Filter Element', price: '₱650.00', stockQuantity: 24, unit: 'Piece', inStock: true },
  ],
  'Under Chassis & Steering': [
    { id: 'uc-01', name: 'Front Suspension Ball Joint', price: '₱1,200.00', stockQuantity: 22, unit: 'Piece', inStock: true },
    { id: 'uc-02', name: 'Tie Rod End & Rack End Link', price: '₱1,500.00', stockQuantity: 18, unit: 'Pair', inStock: true },
    { id: 'uc-03', name: 'Rubber Bushing Arm Set', price: '₱900.00', stockQuantity: 26, unit: 'Set', inStock: true },
  ],
};

const STOCK_STORAGE_KEY = 'autocare_parts_inventory';

export const getLivePartsInventory = () => {
  try {
    const data = localStorage.getItem(STOCK_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(AUTO_PARTS_CATALOG));
      return AUTO_PARTS_CATALOG;
    }
    const parsed = JSON.parse(data);
    return parsed && typeof parsed === 'object' ? parsed : AUTO_PARTS_CATALOG;
  } catch (e) {
    return AUTO_PARTS_CATALOG;
  }
};

// Sync live auto parts from MySQL database into local storage & memory
export const syncPartsWithBackend = async () => {
  try {
    const res = await fetchPartsApi();
    if (res && res.catalog && Object.keys(res.catalog).length > 0) {
      localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(res.catalog));
      return res.catalog;
    }
  } catch (err) {
    console.warn('MySQL Auto Parts API offline/unreachable, fallback to local cache:', err.message);
  }
  return getLivePartsInventory();
};

export const updatePartStockQuantity = (partName, delta) => {
  const catalog = getLivePartsInventory();
  let updated = false;

  const newCatalog = { ...catalog };
  Object.keys(newCatalog).forEach((category) => {
    newCatalog[category] = newCatalog[category].map((part) => {
      if (part.name.toLowerCase() === partName.toLowerCase()) {
        updated = true;
        const newStock = Math.max(0, part.stockQuantity + delta);
        return {
          ...part,
          stockQuantity: newStock,
          inStock: newStock > 0,
        };
      }
      return part;
    });
  });

  if (updated) {
    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(newCatalog));
    // Asynchronously update stock level in MySQL DB
    updatePartStockApi({ name: partName, delta }).catch((e) =>
      console.warn('MySQL part stock sync warning:', e.message)
    );
  }
  return newCatalog;
};

export const updatePartDetails = (partId, updatedFields) => {
  const catalog = getLivePartsInventory();
  const newCatalog = { ...catalog };
  let updated = false;

  const numPrice = typeof updatedFields.price === 'number'
    ? updatedFields.price
    : parseFloat((updatedFields.price || '0').replace(/[^0-9.-]+/g, '') || 0);

  const formattedPrice = `₱${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  Object.keys(newCatalog).forEach((category) => {
    newCatalog[category] = newCatalog[category].map((part) => {
      if (part.id === partId || (part.name && part.name.toLowerCase() === (updatedFields.name || '').toLowerCase())) {
        updated = true;
        return {
          ...part,
          price: formattedPrice,
          ...(updatedFields.name ? { name: updatedFields.name } : {}),
          ...(updatedFields.unit ? { unit: updatedFields.unit } : {}),
          ...(updatedFields.stockQuantity !== undefined ? { stockQuantity: parseInt(updatedFields.stockQuantity, 10) } : {}),
        };
      }
      return part;
    });
  });

  if (updated) {
    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(newCatalog));
    // Asynchronously update price in MySQL DB
    updatePartPriceApi({
      id: partId,
      part_code: partId,
      name: updatedFields.name,
      price: numPrice,
    }).catch((e) => console.warn('MySQL part price sync warning:', e.message));
  }
  return newCatalog;
};

export const addNewPartToCatalog = (partData) => {
  const catalog = getLivePartsInventory();
  const category = partData.category || 'Change Oil & Maintenance';
  const newCatalog = { ...catalog };

  if (!newCatalog[category]) {
    newCatalog[category] = [];
  }

  const categoryParts = newCatalog[category];
  const words = category.split(' ');
  const prefix = words.map((w) => w[0]).join('').toLowerCase().slice(0, 3) || 'pt';
  const customId = partData.id || `${prefix}-${Math.floor(10 + Math.random() * 89)}`;

  const numPrice = typeof partData.price === 'number' ? partData.price : parseFloat((partData.price || '0').replace(/[^0-9.-]+/g, '') || 0);
  const formattedPrice = `₱${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const newPartItem = {
    id: customId,
    name: partData.name,
    price: formattedPrice,
    stockQuantity: Math.max(0, parseInt(partData.stockQuantity, 10) || 10),
    unit: partData.unit || 'Piece',
    inStock: parseInt(partData.stockQuantity, 10) > 0,
  };

  newCatalog[category] = [newPartItem, ...categoryParts];
  localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(newCatalog));

  // Asynchronously save new part to MySQL DB
  addPartApi({
    part_code: customId,
    name: partData.name,
    category,
    price: numPrice,
    stockQuantity: partData.stockQuantity,
    unit: partData.unit || 'Piece',
  }).catch((e) => console.warn('MySQL part creation sync warning:', e.message));

  return newCatalog;
};

export const getPartsForService = (serviceName) => {
  const liveCatalog = getLivePartsInventory();
  if (!serviceName) return liveCatalog['Change Oil & Maintenance'];
  return liveCatalog[serviceName] || liveCatalog['Brake & Suspension Overhaul'];
};

export const getAllCatalogParts = () => {
  const liveCatalog = getLivePartsInventory();
  return Object.entries(liveCatalog).flatMap(([category, parts]) =>
    parts.map((p) => ({ ...p, category }))
  );
};

// Calculate total monetary value of parts array
export const calculatePartsTotal = (usedPartsList) => {
  if (!Array.isArray(usedPartsList) || usedPartsList.length === 0) return 0;

  const catalog = getLivePartsInventory();
  const allParts = Object.values(catalog).flat();
  let total = 0;

  usedPartsList.forEach((itemStr) => {
    let qty = 1;
    let name = itemStr;

    if (itemStr.includes('x ')) {
      const parts = itemStr.split('x ');
      qty = parseInt(parts[0], 10) || 1;
      name = parts.slice(1).join('x ');
    }

    const found = allParts.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (found) {
      const numPrice = parseFloat((found.price || '0').replace(/[^0-9.-]+/g, '') || 0);
      total += numPrice * qty;
    }
  });

  return total;
};

// Helper to get detailed breakdown array with Orig Price first, and Sum for N items below it
export const getItemizedPartsWithPrices = (usedPartsList) => {
  if (!Array.isArray(usedPartsList) || usedPartsList.length === 0) return [];

  const catalog = getLivePartsInventory();
  const allParts = Object.values(catalog).flat();

  return usedPartsList.map((itemStr) => {
    let qty = 1;
    let name = itemStr;

    if (itemStr.includes('x ')) {
      const parts = itemStr.split('x ');
      qty = parseInt(parts[0], 10) || 1;
      name = parts.slice(1).join('x ');
    }

    const found = allParts.find((p) => p.name.toLowerCase() === name.toLowerCase());
    const unitPriceNum = found ? parseFloat((found.price || '0').replace(/[^0-9.-]+/g, '') || 0) : 0;
    const subtotalNum = unitPriceNum * qty;

    return {
      name,
      quantity: qty,
      unitPriceFormatted: found ? found.price : '₱0.00',
      unitPriceNum,
      subtotalNum,
      origPriceFormatted: `Orig Price: ${found ? found.price : '₱0.00'} each`,
      subtotalFormatted: `Sum (${qty} ${qty > 1 ? 'items' : 'item'}): ₱${subtotalNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      formattedLabel: `${qty}x ${name}`,
    };
  });
};
