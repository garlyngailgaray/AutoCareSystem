import React, { useState, useEffect } from 'react';
import {
  getLivePartsInventory,
  updatePartStockQuantity,
  addNewPartToCatalog,
  updatePartDetails,
  syncPartsWithBackend,
} from '../../utils/autoPartsCatalog';
import { Package, Search, CheckCircle, AlertTriangle, Plus, Check, X, PlusCircle, Edit3, DollarSign } from 'lucide-react';

export default function PartsInventory({ user }) {
  const role = (user?.role || '').toString().toLowerCase().trim();
  const canRestock = role === 'admin' || role === 'manager' || role === 'frontdesk' || role === 'front desk';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategoryState] = useState(() => {
    return sessionStorage.getItem('partsinv_category') || '';
  });

  const setSelectedCategory = (cat) => {
    setSelectedCategoryState(cat);
    sessionStorage.setItem('partsinv_category', cat);
  };

  const [liveCatalog, setLiveCatalog] = useState(getLivePartsInventory());
  const [actionMessage, setActionMessage] = useState(null);

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [restockTargetPart, setRestockTargetPart] = useState(null);
  const [customRestockQty, setCustomRestockQty] = useState(10);

  // Edit Price Modal State
  const [editPartTarget, setEditPartTarget] = useState(null);
  const [editPartPriceInput, setEditPartPriceInput] = useState('');

  // Form State for Adding New Part
  const [newPartForm, setNewPartForm] = useState({
    name: '',
    category: 'Change Oil & Maintenance',
    price: '1500',
    stockQuantity: 20,
    unit: 'Piece',
  });

  const loadInventory = async () => {
    const backendCatalog = await syncPartsWithBackend();
    if (backendCatalog) {
      setLiveCatalog((prev) => (JSON.stringify(prev) === JSON.stringify(backendCatalog) ? prev : backendCatalog));
    } else {
      const updated = getLivePartsInventory();
      setLiveCatalog((prev) => (JSON.stringify(prev) === JSON.stringify(updated) ? prev : updated));
    }
  };

  useEffect(() => {
    loadInventory();
    window.addEventListener('storage', loadInventory);
    const timer = setInterval(loadInventory, 2000);
    return () => {
      window.removeEventListener('storage', loadInventory);
      clearInterval(timer);
    };
  }, []);

  const handleRestockPart = (partName, currentStock, quantityToAdd = 1) => {
    const amount = Math.max(1, parseInt(quantityToAdd, 10) || 1);
    const updated = updatePartStockQuantity(partName, amount);
    setLiveCatalog(updated);
    window.dispatchEvent(new Event('storage'));
    setActionMessage(`Restocked +${amount} unit(s) for '${partName}'. Live stock increased to ${currentStock + amount}.`);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleCustomRestockSubmit = (e) => {
    e.preventDefault();
    if (!restockTargetPart) return;
    handleRestockPart(restockTargetPart.name, restockTargetPart.stockQuantity, customRestockQty);
    setRestockTargetPart(null);
  };

  const handleAddNewPartSubmit = (e) => {
    e.preventDefault();
    if (!newPartForm.name.trim()) return;

    const updated = addNewPartToCatalog(newPartForm);
    setLiveCatalog(updated);
    window.dispatchEvent(new Event('storage'));
    setActionMessage(`Successfully added & restocked ${newPartForm.stockQuantity} unit(s) of '${newPartForm.name}'!`);
    setShowAddModal(false);
    setNewPartForm({
      name: '',
      category: 'Change Oil & Maintenance',
      price: '1500',
      stockQuantity: 20,
      unit: 'Piece',
    });
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleSavePriceSubmit = (e) => {
    e.preventDefault();
    if (!editPartTarget) return;

    const numPrice = parseFloat((editPartPriceInput || '0').replace(/[^0-9.-]+/g, '') || 0);
    const formattedPrice = `₱${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    const updated = updatePartDetails(editPartTarget.id, {
      price: numPrice,
      name: editPartTarget.name,
    });

    setLiveCatalog(updated);
    window.dispatchEvent(new Event('storage'));

    setActionMessage(`Successfully updated unit price for '${editPartTarget.name}' to ${formattedPrice}!`);
    setEditPartTarget(null);
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Flat list of all auto parts across categories
  const allParts = Object.entries(liveCatalog).flatMap(([category, parts]) =>
    parts.map((p) => ({ ...p, category }))
  );

  const filteredParts = allParts.filter((p) => {
    const query = searchTerm.toLowerCase();
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Package className="h-6 w-6 text-amber-600" />
            <span>Auto Parts & Spare Inventory Stocks</span>
          </h1>
          <p className="text-sm text-gray-500">
            {canRestock
              ? 'Admin & Front Desk management guide to restock spare parts, add new stock inventory, and monitor live quantities'
              : 'Technician reference guide to view available shop spare parts, unit prices, and live stock inventory levels'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Add New Part Button (Admin / Front Desk Only) */}
          {canRestock && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-amber-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>Add / Restock New Part</span>
            </button>
          )}

          {/* Search Bar */}
          <div className="w-full sm:w-72 relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search parts by name, ID, category..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-600 shadow-sm"
            />
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 p-4 rounded-2xl flex items-center space-x-2 text-xs font-bold animate-fadeIn shadow-sm">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-2 shadow-sm flex flex-wrap gap-1.5">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            !selectedCategory
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          All Auto Parts ({allParts.length})
        </button>
        {Object.keys(liveCatalog).map((cat, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Part ID</th>
                <th className="p-3">Part Description</th>
                <th className="p-3">Service Category</th>
                <th className="p-3">Unit Price</th>
                <th className="p-3">Stock Quantity</th>
                <th className="p-3">Live Stock Status</th>
                {canRestock && <th className="p-3 text-center">Restock Inventory Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredParts.map((part) => (
                <tr key={part.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-amber-700">{part.id}</td>
                  <td className="p-3 font-bold text-gray-900">{part.name}</td>
                  <td className="p-3 font-medium text-gray-700">{part.category}</td>
                  <td className="p-3 font-extrabold text-amber-700">
                    <div className="flex items-center space-x-1.5">
                      <span>{part.price}</span>
                      {canRestock && (
                        <button
                          onClick={() => {
                            setEditPartTarget(part);
                            const rawNum = parseFloat((part.price || '0').replace(/[^0-9.-]+/g, '') || 0);
                            setEditPartPriceInput(rawNum > 0 ? rawNum.toString() : '1500');
                          }}
                          className="p-1 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Modify Unit Price"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-3 font-bold text-gray-900">
                    {part.stockQuantity} {part.unit}s
                  </td>
                  <td className="p-3">
                    {part.stockQuantity > 10 ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        <span>In Stock ({part.stockQuantity} left)</span>
                      </span>
                    ) : part.stockQuantity > 0 ? (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                        <span>Low Stock ({part.stockQuantity} left)</span>
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3 text-red-600" />
                        <span>Out of Stock (0 left)</span>
                      </span>
                    )}
                  </td>
                  {canRestock && (
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => {
                            setEditPartTarget(part);
                            const rawNum = parseFloat((part.price || '0').replace(/[^0-9.-]+/g, '') || 0);
                            setEditPartPriceInput(rawNum > 0 ? rawNum.toString() : '1500');
                          }}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 px-2.5 py-1.5 rounded-xl text-[10px] font-bold inline-flex items-center space-x-1 transition-all shadow-sm"
                          title="Modify Unit Price"
                        >
                          <Edit3 className="h-3 w-3 text-amber-600" />
                          <span>Edit Price</span>
                        </button>

                        <button
                          onClick={() => handleRestockPart(part.name, part.stockQuantity, 1)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 px-2.5 py-1.5 rounded-xl text-[10px] font-bold inline-flex items-center space-x-1 transition-all shadow-sm"
                          title="Restock +1 item"
                        >
                          <Plus className="h-3 w-3 text-emerald-600" />
                          <span>+1 Quick</span>
                        </button>

                        <button
                          onClick={() => {
                            setRestockTargetPart(part);
                            setCustomRestockQty(10);
                          }}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300/80 px-2.5 py-1.5 rounded-xl text-[10px] font-bold inline-flex items-center space-x-1 transition-all shadow-sm"
                          title="Restock Custom Quantity"
                        >
                          <PlusCircle className="h-3 w-3 text-blue-600" />
                          <span>+ Qty Restock</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredParts.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-xs">
            No spare parts found matching "<span className="font-semibold text-gray-700">{searchTerm}</span>".
          </div>
        )}
      </div>

      {/* Modal 1: Custom Quantity Restock (Admin / Front Desk Only) */}
      {canRestock && restockTargetPart && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl border border-gray-100 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-gray-900 text-base flex items-center space-x-2">
                <PlusCircle className="h-5 w-5 text-blue-600" />
                <span>Restock Quantity - {restockTargetPart.name}</span>
              </h3>
              <button
                onClick={() => setRestockTargetPart(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCustomRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Current Stock Level</label>
                <input
                  type="text"
                  disabled
                  value={`${restockTargetPart.stockQuantity} ${restockTargetPart.unit}s currently in stock`}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity to Restock (+)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={customRestockQty}
                  onChange={(e) => setCustomRestockQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockTargetPart(null)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl text-xs hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-blue-600/20"
                >
                  Confirm Restock (+{customRestockQty})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add New Spare Part to Inventory (Admin / Front Desk Only) */}
      {canRestock && showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl border border-gray-100 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-gray-900 text-base flex items-center space-x-2">
                <Package className="h-5 w-5 text-amber-600" />
                <span>Add / Restock New Spare Part</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewPartSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Part Description / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Synthetic Engine Oil 5W-40 (4L)"
                  value={newPartForm.name}
                  onChange={(e) => setNewPartForm({ ...newPartForm, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Service Category</label>
                <select
                  value={newPartForm.category}
                  onChange={(e) => setNewPartForm({ ...newPartForm, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-amber-600"
                >
                  {Object.keys(liveCatalog).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Unit Price (₱)</label>
                  <input
                    type="text"
                    required
                    placeholder="1500"
                    value={newPartForm.price}
                    onChange={(e) => setNewPartForm({ ...newPartForm, price: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Restock Qty</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPartForm.stockQuantity}
                    onChange={(e) => setNewPartForm({ ...newPartForm, stockQuantity: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Unit Type</label>
                  <select
                    value={newPartForm.unit}
                    onChange={(e) => setNewPartForm({ ...newPartForm, unit: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-amber-600"
                  >
                    <option value="Piece">Piece</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Set">Set</option>
                    <option value="Gallon">Gallon</option>
                    <option value="Can">Can</option>
                    <option value="Pack">Pack</option>
                    <option value="Unit">Unit</option>
                    <option value="Pair">Pair</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-amber-600/20"
                >
                  Save & Restock Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Modify Part Unit Price (Admin / Front Desk Only) */}
      {canRestock && editPartTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl border border-gray-100 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-gray-900 text-base flex items-center space-x-2">
                <Edit3 className="h-5 w-5 text-amber-600" />
                <span>Modify Unit Price - {editPartTarget.id}</span>
              </h3>
              <button
                onClick={() => setEditPartTarget(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePriceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Part Description</label>
                <input
                  type="text"
                  disabled
                  value={editPartTarget.name}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Service Category</label>
                <input
                  type="text"
                  disabled
                  value={editPartTarget.category}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Current Unit Price</label>
                <span className="inline-block bg-amber-100 text-amber-900 font-extrabold px-3 py-1.5 rounded-lg text-sm">
                  {editPartTarget.price}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">New Unit Price (₱)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-gray-500 text-sm">₱</span>
                  <input
                    type="text"
                    required
                    value={editPartPriceInput}
                    onChange={(e) => setEditPartPriceInput(e.target.value)}
                    placeholder="e.g. 3500.00"
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:border-amber-600"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Updating the price will automatically apply to future job orders, invoice estimates, and inventory totals.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditPartTarget(null)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-amber-600/20 text-xs"
                >
                  Save Price Modification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
