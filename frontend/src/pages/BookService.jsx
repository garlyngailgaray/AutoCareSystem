import React, { useEffect, useState } from 'react';
import { fetchVehicles, fetchServiceRequests, createServiceRequest } from '../api';
import { Calendar, Wrench, Clock, CheckCircle2, AlertCircle, FileText, Check } from 'lucide-react';

const serviceCategories = [
  'Oil Change & Filter',
  'Brake Inspection & Service',
  'Tire Rotation & Balance',
  'Full Vehicle Inspection',
  'Battery & Electrical Check',
  'Engine Diagnostics & Repair',
];

export default function BookService() {
  const [vehicles, setVehicles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedService, setSelectedService] = useState(serviceCategories[0]);
  const [preferredDate, setPreferredDate] = useState('2025-06-01');
  const [mileage, setMileage] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchVehicles(), fetchServiceRequests()])
      .then(([vList, rList]) => {
        setVehicles(vList);
        setRequests(rList);
        if (vList.length > 0 && !selectedVehicle) {
          setSelectedVehicle(vList[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) {
      alert('Please select a vehicle first.');
      return;
    }
    setSubmitting(true);
    try {
      await createServiceRequest({
        vehicle_id: parseInt(selectedVehicle),
        service_type: selectedService,
        preferred_date: preferredDate,
        mileage_at_service: parseInt(mileage) || 0,
        notes,
      });
      setNotes('');
      setMileage('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to book service.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Completed</span>;
      case 'IN_PROGRESS':
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> In Progress</span>;
      case 'CANCELLED':
        return <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> Cancelled</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Pending</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Service Appointments</h1>
        <p className="text-sm text-gray-500">Schedule maintenance services and track request status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5 h-fit">
          <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Book a New Service</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Select Vehicle</label>
              <select
                required
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              >
                {vehicles.length === 0 ? (
                  <option value="">No vehicles found - Add one first</option>
                ) : (
                  vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} ({v.license_plate})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Service Category</label>
              <div className="space-y-1.5">
                {serviceCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedService(cat)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                      selectedService === cat
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{cat}</span>
                    {selectedService === cat && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Preferred Date</label>
              <input
                type="date"
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Current Mileage</label>
              <input
                type="number"
                placeholder="e.g. 45000"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Additional Notes</label>
              <textarea
                rows={2}
                placeholder="Mention any specific noises, symptoms, or requests..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || vehicles.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Confirm Service Appointment'}
            </button>
          </form>
        </div>

        {/* Requests List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Your Scheduled & Past Requests</h2>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm text-gray-500 text-sm">
              No service requests booked yet. Use the form on the left to schedule your first service appointment.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{r.service_type}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Vehicle: <span className="font-semibold text-gray-800">{r.make} {r.model}</span> ({r.license_plate})
                      </p>
                    </div>
                    <div>{getStatusBadge(r.status)}</div>
                  </div>

                  <div className="flex items-center space-x-6 text-xs text-gray-600 border-t border-gray-50 pt-3">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>Date: <strong className="text-gray-800">{r.preferred_date}</strong></span>
                    </span>
                    {r.mileage_at_service > 0 && (
                      <span>Mileage: <strong className="text-gray-800">{r.mileage_at_service.toLocaleString()} mi</strong></span>
                    )}
                  </div>

                  {r.notes && (
                    <div className="bg-gray-50 p-2.5 rounded-xl text-xs text-gray-600 flex items-start space-x-2">
                      <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                      <span>{r.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
