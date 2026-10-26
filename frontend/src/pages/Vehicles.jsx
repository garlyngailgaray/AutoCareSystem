import React, { useEffect, useState } from 'react';
import { fetchVehicles, addVehicle, deleteVehicle } from '../api';
import { Car, Plus, Trash2, Gauge, Tag, FileText } from 'lucide-react';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    license_plate: '',
    vin: '',
    current_mileage: '',
  });

  const loadVehicles = () => {
    setLoading(true);
    fetchVehicles()
      .then(setVehicles)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await addVehicle({
        ...formData,
        year: parseInt(formData.year) || 2022,
        current_mileage: parseInt(formData.current_mileage) || 0,
      });
      setShowModal(false);
      setFormData({ make: '', model: '', year: '', license_plate: '', vin: '', current_mileage: '' });
      loadVehicles();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add vehicle');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await deleteVehicle(id);
        loadVehicles();
      } catch (err) {
        alert('Failed to delete vehicle');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Garage</h1>
          <p className="text-sm text-gray-500">Manage registered vehicles and maintenance mileage</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center space-x-2 shadow-md shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading vehicles...</div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800">No vehicles registered yet</h3>
          <p className="text-sm text-gray-500 mt-1">Click "Add Vehicle" to register your first car.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all relative group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Car className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {v.year} {v.make} {v.model}
                    </h3>
                    <span className="inline-block bg-gray-100 text-gray-700 font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md mt-1">
                      {v.license_plate}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(v.id)}
                  className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                  title="Delete Vehicle"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              <div className="border-t border-gray-50 pt-4 space-y-2 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Gauge className="h-3.5 w-3.5 text-gray-400" />
                    <span>Current Mileage:</span>
                  </span>
                  <span className="font-semibold text-gray-900">{v.current_mileage.toLocaleString()} miles</span>
                </div>
                {v.vin && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <FileText className="h-3.5 w-3.5 text-gray-400" />
                      <span>VIN:</span>
                    </span>
                    <span className="font-mono text-gray-700">{v.vin}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Vehicle</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Make</label>
                  <input
                    type="text"
                    required
                    placeholder="Toyota"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="Camry"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    required
                    placeholder="2022"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">License Plate</label>
                  <input
                    type="text"
                    required
                    placeholder="ABC-1234"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">VIN (Optional)</label>
                <input
                  type="text"
                  placeholder="1HGCR2F83HA123456"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Current Mileage</label>
                <input
                  type="number"
                  placeholder="45000"
                  value={formData.current_mileage}
                  onChange={(e) => setFormData({ ...formData, current_mileage: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
