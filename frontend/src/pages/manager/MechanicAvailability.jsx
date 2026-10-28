import React, { useState, useEffect } from 'react';
import { getMechanicsList } from '../../utils/jobOrderStore';
import { fetchAllUsers } from '../../api';
import { Users, UserCheck, Phone, CheckCircle, Clock } from 'lucide-react';

export default function MechanicAvailability() {
  const [mechanics, setMechanics] = useState([]);

  const loadMechanics = async () => {
    try {
      const dbUsers = await fetchAllUsers();
      const list = getMechanicsList(Array.isArray(dbUsers) ? dbUsers : null);
      setMechanics((prev) => (JSON.stringify(prev) === JSON.stringify(list) ? prev : list));
    } catch (e) {
      console.warn('Database mechanics fetch warning, using local mechanics:', e.message);
      const list = getMechanicsList();
      setMechanics((prev) => (JSON.stringify(prev) === JSON.stringify(list) ? prev : list));
    }
  };

  useEffect(() => {
    loadMechanics();
    const timer = setInterval(loadMechanics, 3000);
    return () => clearInterval(timer);
  }, []);

  const availableCount = mechanics.filter((m) => m.status === 'Available').length;
  const occupiedCount = mechanics.filter((m) => m.status !== 'Available').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <Users className="h-6 w-6 text-purple-600" />
          <span>Mechanic Availability & Live Repairs</span>
        </h1>
        <p className="text-sm text-gray-500">
          Monitor shop technicians' real-time availability, active repair assignments, and duty workload
        </p>
      </div>

      {/* Summary Availability Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-gray-500 uppercase">Total Mechanics</span>
          <p className="text-2xl font-black text-gray-900">{mechanics.length} Technicians</p>
          <span className="text-xs text-gray-400">Shop Technical Staff</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-gray-500 uppercase">Available Mechanics</span>
          <p className="text-2xl font-black text-emerald-600">
            {availableCount} Ready
          </p>
          <span className="text-xs text-emerald-600 font-semibold">Available for New Job Orders</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-gray-500 uppercase">Occupied / Repairing</span>
          <p className="text-2xl font-black text-amber-600">
            {occupiedCount} Working
          </p>
          <span className="text-xs text-amber-600 font-semibold">Currently Servicing Vehicles</span>
        </div>
      </div>

      {/* Mechanics Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mechanics.map((m) => (
          <div
            key={m.id}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Card Top Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{m.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">{m.customId} • {m.role}</p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                  m.status === 'Available'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {m.status}
                </span>
              </div>

              {/* Current Job Assignment */}
              {m.currentAssignment ? (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-amber-200/60 pb-2">
                    <span className="font-bold text-amber-900">Job {m.currentAssignment.jobId}</span>
                    <span className="text-[10px] text-amber-800 font-semibold uppercase">REPAIRING IN PROGRESS</span>
                  </div>

                  <div>
                    <p className="text-gray-500 text-[10px] uppercase font-semibold">Client Name</p>
                    <p className="font-bold text-gray-900">{m.currentAssignment.clientName}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-[10px] uppercase font-semibold">Vehicle & Plate</p>
                    <p className="font-semibold text-gray-900">{m.currentAssignment.vehicle}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-[10px] uppercase font-semibold">Service</p>
                    <p className="font-bold text-purple-700">{m.currentAssignment.service}</p>
                  </div>

                  <div className="pt-1 text-[11px] text-gray-600 italic border-t border-amber-200/40">
                    "{m.currentAssignment.progress}"
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-4 text-center text-xs space-y-1">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mx-auto" />
                  <p className="font-bold text-emerald-900">Available for Assignment</p>
                  <p className="text-[11px] text-emerald-700">Finished repairing previous job. Ready for new job orders!</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center space-x-1">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                <span>{m.phone}</span>
              </span>
              <span>{m.address}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
