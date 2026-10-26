import React, { useState } from 'react';
import { Wrench, Search, ChevronRight } from 'lucide-react';

const servicesData = [
  {
    id: 1,
    name: 'Change Oil & Maintenance',
    category: 'Preventative Care',
    icon: '🛢️',
    image: 'images/ChangeOil.jpg',
    price: '₱300',
    priceRange: '₱300 - ₱1,500',
    description: "Your car's owner manual provides an essential maintenance schedule. Regular oil and fluid services help extend vehicle life and ensure optimal engine operation.",
    checklist: [
      'Oil & Other Engine Fluids Drain & Refill',
      'Oil Filter & Gasket Replacement',
      'Coolant & Brake Fluid Top-up',
      'Multi-Point Vehicle Inspection',
      'Tire Pressure & Battery Check',
    ],
  },
  {
    id: 2,
    name: 'Tune Up & Ignition System',
    category: 'Engine Tune-Up',
    icon: '⚙️',
    image: 'images/TuneUp.jpg',
    price: '₱800',
    priceRange: '₱800 - ₱2,500',
    description: 'Restore peak fuel efficiency and acceleration responsiveness. Proper engine tune-ups eliminate carbon buildup and replace worn ignition components.',
    checklist: [
      'Spark Plug Inspection & Replacement',
      'Spark Plug Wire & Coil Inspection',
      'Air and Fuel Filter Replacement',
      'Throttle Body & Injector Cleaning',
      'Thorough Inspection of All Engine Components',
    ],
  },
  {
    id: 3,
    name: 'Engine Overhauling & Reconstruction',
    category: 'Engine Services',
    icon: '🔧',
    image: 'images/Overhauling.jpg',
    price: '₱10,000',
    priceRange: '₱10,000 - ₱45,000',
    description: 'One of the most critical automotive repairs. Complete internal engine disassembly, cleaning, and precision rebuilding to avoid expensive engine replacements.',
    checklist: [
      'Complete Engine Block Disassembly',
      'Cylinder Head Resurfacing & Valve Job',
      'Piston Ring, Bearing & Seal Overhaul',
      'Compression & Cylinder Pressure Testing',
      'Timing Belt/Chain Alignment & Calibration',
    ],
  },
  {
    id: 4,
    name: 'Brake Repair & Services',
    category: 'Safety & Braking',
    icon: '🛑',
    image: 'images/Brake&Suspension.jpg',
    price: '₱2,500 - ₱8,000',
    priceRange: '₱2,500 - ₱8,000',
    description: "If your vehicle's braking system begins to falter, it is vital to diagnose and repair it immediately. The brake system is your primary safety component.",
    checklist: [
      'Comprehensive Brake Inspection',
      'Brake Pad & Shoe Replacement',
      'Brake Line & Hose Repair',
      'ABS Diagnosis & Hydraulic Bleeding',
      'Brake Rotor & Drum Resurfacing',
    ],
  },
  {
    id: 5,
    name: 'Under Chassis & Steering',
    category: 'Chassis & Ride',
    icon: '🚘',
    image: 'images/UnderChassis.jpg',
    price: '₱1,000 - ₱2,000',
    priceRange: '₱1,000 - ₱2,000',
    description: 'Eliminate rumbling, grinding, or clunking noises. We repair under-chassis components to ensure smooth handling, firm control, and road safety.',
    checklist: [
      'Shock Absorber & Strut Replacement',
      'Ball Joint & Tie Rod End Repair',
      'Steering Rack & Pinion Servicing',
      'Bushing & Suspension Arm Overhaul',
      'Axle Shaft & CV Joint Boot Repair',
    ],
  },
  {
    id: 6,
    name: 'Wiring & Electrical Diagnostics',
    category: 'Electrical Systems',
    icon: '⚡',
    image: 'images/Wiring.jpg',
    price: '₱500 - ₱1,500',
    priceRange: '₱500 - ₱1,500',
    description: 'Modern vehicles depend on complex electronic networks. We quickly isolate short circuits, ECU fault codes, and faulty wiring harnesses.',
    checklist: [
      'ECU Diagnostics & Fault Code Scan',
      'Wire Harness Inspection & Rewiring',
      'Alternator & Starter Motor Testing',
      'Fuse Box & Relay Troubleshooting',
      'Lighting & Sensor Calibration',
    ],
  },
  {
    id: 7,
    name: 'Air Conditioning Services',
    category: 'Climate Control',
    icon: '❄️',
    image: 'images/AirConditioner.jpg',
    price: '₱3,500 - ₱8,500',
    priceRange: '₱3,500 - ₱8,500',
    description: 'Maintain cabin comfort in all weather. We resolve AC pressure leaks, clean dirty evaporators, and restore icy cold airflow.',
    checklist: [
      'Refrigerant Leak Testing & Freon Recharge',
      'AC Compressor Repair & Replacement',
      'Evaporator & Condenser Cleaning',
      'Cabin Filter Replacement',
      'Thermostat & Expansion Valve Service',
    ],
  },
  {
    id: 8,
    name: 'Wheel Alignment & Balancing',
    category: 'Wheel & Steering',
    icon: '🎯',
    image: 'images/WheelAlignment.jpg',
    price: '₱350',
    priceRange: '₱350 - ₱1,200',
    description: 'Proper wheel alignment protects your tires against uneven tread wear, eliminates wheel vibration, and keeps your vehicle steering straight.',
    checklist: [
      '4-Wheel Computerized Alignment',
      'Wheel Vibration & Balance Adjustment',
      'Steering Wheel Centering',
      'Suspension Geometry Calibration',
      'Tire Noise & Wear Analysis',
    ],
  },
  {
    id: 9,
    name: 'Vulcanize & Tire Care',
    category: 'Tire Repair',
    icon: '🛞',
    image: 'images/Vulcanize.jpg',
    price: '₱200',
    priceRange: '₱200 - ₱800',
    description: 'Fast and reliable tire patching to prevent flats and blowouts. We inspect tread depth, seal punctures, and adjust tire inflation safety.',
    checklist: [
      'Hot Vulcanized Patch Repair',
      'Tubeless Plug Installation',
      'Rim Leak Sealing & Valve Replacement',
      'Sidewall Integrity Inspection',
      'Tire Pressure Optimization',
    ],
  },
  {
    id: 10,
    name: 'Body Repair & Panel Restoration',
    category: 'Body Work',
    icon: '🔨',
    image: 'images/BodyRepair.jpg',
    price: '₱3,500 - ₱10,000',
    priceRange: '₱3,500 - ₱10,000',
    description: 'Repair damage from minor scratches to severe collision impact. We pull dents, realign bent body panels, and restore structural integrity.',
    checklist: [
      'Collision Repair & Panel Straightening',
      'Paintless Dent Removal (PDR)',
      'Bumper, Fender & Hood Replacement',
      'Rust Treatment & Welding',
      'Door & Frame Realignment',
    ],
  },
  {
    id: 11,
    name: 'Body Paint & Refinishing',
    category: 'Custom Finish',
    icon: '🎨',
    image: 'images/BodyPaint.jpg',
    price: '₱10,000 - ₱15,000',
    priceRange: '₱10,000 - ₱15,000',
    description: 'Showroom-quality paint finishes. We use computerized color matching, durable primers, and glossy UV clear coats for long-lasting brilliance.',
    checklist: [
      'Full Body Respray & Spot Touch-ups',
      'Computerized Factory Color Matching',
      'High-Gloss UV Protective Clear Coat',
      'Surface Preparation & Primer Sanding',
      'Paint Buffing & Scratch Correction',
    ],
  },
  {
    id: 12,
    name: 'Drive Train & Transmission Services',
    category: 'Drivetrain & Gears',
    icon: '⛓️',
    image: 'images/Transmission.jpg',
    price: '₱4,500 - ₱12,000',
    priceRange: '₱4,500 - ₱12,000',
    description: 'The transmission is crucial for smooth power delivery. Proper maintenance prevents grinding, slipping gears, and fluid leaks.',
    checklist: [
      'Transmission Fluid Flush & Replacement',
      'Clutch Disc & Pressure Plate Overhaul',
      'Drive Shaft & Universal Joint Inspection',
      'Differential Gear Oil Servicing',
      'Transmission Seal & Hydraulic Diagnostics',
    ],
  },
];

export default function ServicesCatalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedServiceId, setExpandedServiceId] = useState(null);

  const filteredServices = servicesData.filter((s) => {
    const query = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      s.category.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query) ||
      s.checklist.some((item) => item.toLowerCase().includes(query))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-red-600 font-extrabold text-xs tracking-widest uppercase block mb-1">
            WHAT WE DO
          </span>
          <h1 className="text-2xl font-black text-gray-900 flex items-center space-x-2">
            <Wrench className="h-6 w-6 text-red-600" />
            <span>LET US RESTORE YOUR VEHICLE'S PERFORMANCE!</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            From routine preventative maintenance to complex engine and transmission overhauls
          </p>
        </div>

        {/* Real-time Search Input */}
        <div className="w-full sm:w-80">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a service or feature..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Services Grid matching Admin Reference Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredServices.map((service) => {
          const isExpanded = expandedServiceId === service.id;
          return (
            <div
              key={service.id}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-red-500 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between group"
            >
              {/* Service Banner Image with Price Tag */}
              <div className="relative h-36 overflow-hidden bg-gray-100">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 right-2.5 bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-md">
                  {service.price}
                </div>
                <div className="absolute bottom-2 left-2.5">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-black/60 backdrop-blur-md px-2 py-0.5 rounded">
                    {service.category}
                  </span>
                </div>
              </div>

              {/* Card Body Info */}
              <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-black text-gray-900 group-hover:text-red-600 transition-colors">
                      {service.name}
                    </h3>
                    <span className="text-lg shrink-0">{service.icon}</span>
                  </div>

                  <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2">
                    {service.description}
                  </p>
                </div>

                {/* Collapsible Checklist Toggle */}
                <div className="pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setExpandedServiceId(isExpanded ? null : service.id)}
                    className="text-[11px] font-semibold text-gray-500 hover:text-red-600 flex items-center justify-between w-full transition-colors"
                  >
                    <span>{isExpanded ? 'Hide Details' : 'What We Do'}</span>
                    <ChevronRight className={`h-3 w-3 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Checklist Items */}
                  {isExpanded && (
                    <div className="pt-2 mt-2 border-t border-gray-100 space-y-1.5 animate-fadeIn">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                        Checklist Items:
                      </h4>
                      <ul className="space-y-1 text-[11px] text-gray-600">
                        {service.checklist.map((item, idx) => (
                          <li key={idx} className="flex items-start space-x-1.5">
                            <span className="text-red-600 font-bold shrink-0">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-xs">
          No services found matching "<span className="font-semibold text-gray-700">{searchTerm}</span>".
        </div>
      )}
    </div>
  );
}
