import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLivePartsInventory, updatePartStockQuantity } from '../utils/autoPartsCatalog';
import {
  Wrench,
  Shield,
  Clock,
  Car,
  Star,
  CheckCircle,
  Sun,
  Moon,
  ChevronRight,
  Send,
  Search,
  Package,
  ShieldCheck,
  ShoppingCart,
  Check,
} from 'lucide-react';

const servicesData = [
  {
    id: 'oil-change',
    category: 'Preventative Care',
    title: 'Change Oil & Maintenance',
    icon: '🛢️',
    price: '₱300',
    image: 'images/ChangeOil.jpg',
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
    id: 'tune-up',
    category: 'Engine Tune-Up',
    title: 'Tune Up & Ignition System',
    icon: '⚙️',
    price: '₱800',
    image: 'images/TuneUp.jpg',
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
    id: 'overhauling',
    category: 'Engine Services',
    title: 'Engine Overhauling & Reconstruction',
    icon: '🔧',
    price: '₱10,000',
    image: 'images/Overhauling.jpg',
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
    id: 'brake-repair',
    category: 'Safety & Braking',
    title: 'Brake Repair & Services',
    icon: '🛑',
    price: '₱2,500 - ₱8,000',
    image: 'images/Brake&Suspension.jpg',
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
    id: 'under-chassis',
    category: 'Chassis & Ride',
    title: 'Under Chassis & Steering',
    icon: '🚘',
    price: '₱1,000 - ₱2,000',
    image: 'images/UnderChassis.jpg',
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
    id: 'electrical',
    category: 'Electrical Systems',
    title: 'Wiring & Electrical Diagnostics',
    icon: '⚡',
    price: '₱500 - ₱1,500',
    image: 'images/Wiring.jpg',
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
    id: 'aircon',
    category: 'Climate Control',
    title: 'Air Conditioning Services',
    icon: '❄️',
    price: '₱3,500 - ₱8,500',
    image: 'images/AirConditioner.jpg',
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
    id: 'wheel-alignment',
    category: 'Wheel & Steering',
    title: 'Wheel Alignment & Balancing',
    icon: '🎯',
    price: '₱350',
    image: 'images/WheelAlignment.jpg',
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
    id: 'vulcanize',
    category: 'Tire Repair',
    title: 'Vulcanize & Tire Care',
    icon: '🛞',
    price: '₱200',
    image: 'images/Vulcanize.jpg',
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
    id: 'body-repair',
    category: 'Body Work',
    title: 'Body Repair & Panel Restoration',
    icon: '🔨',
    price: '₱3,500 - ₱10,000',
    image: 'images/BodyRepair.jpg',
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
    id: 'body-paint',
    category: 'Custom Finish',
    title: 'Body Paint & Refinishing',
    icon: '🎨',
    price: '₱10,000 - ₱15,000',
    image: 'images/BodyPaint.jpg',
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
    id: 'transmission',
    category: 'Drivetrain & Gears',
    title: 'Drive Train & Transmission Services',
    icon: '⛓️',
    price: '₱4,500 - ₱12,000',
    image: 'images/Transmission.jpg',
    description: 'The transmission is crucial for smooth power delivery. Proper maintenance prevents grinding, slipping gears, and fluid leaks.',
    checklist: [
      'Transmission Fluid Flush & Replacement',
      'Clutch Disc & Pressure Plate Overhaul',
      'Drive Shaft & Universal Joint Inspection',
      'Differential Gear Oil Servicing',
      'Transmission Leak & Seal Diagnostics',
    ],
  },
];

export default function LandingPage({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTabState] = useState(() => {
    return sessionStorage.getItem('landing_active_tab') || 'home';
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    sessionStorage.setItem('landing_active_tab', tab);
  };

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [serviceSearch, setServiceSearch] = useState('');
  const [partSearch, setPartSearch] = useState('');
  const [selectedPartCategory, setSelectedPartCategory] = useState('Brake & Suspension Overhaul');
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const [liveCatalog, setLiveCatalog] = useState(getLivePartsInventory());

  // Restore and persist window scroll position for Landing Page on refresh
  useEffect(() => {
    const saved = sessionStorage.getItem('scroll_win_/');
    if (saved !== null) {
      const target = parseInt(saved, 10);
      window.scrollTo(0, target);
      const t1 = setTimeout(() => window.scrollTo(0, target), 50);
      const t2 = setTimeout(() => window.scrollTo(0, target), 200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('scroll_win_/', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadInventory = () => {
      const updated = getLivePartsInventory();
      setLiveCatalog((prev) => (JSON.stringify(prev) === JSON.stringify(updated) ? prev : updated));
    };

    loadInventory();
    window.addEventListener('storage', loadInventory);
    const timer = setInterval(loadInventory, 2000);
    return () => {
      window.removeEventListener('storage', loadInventory);
      clearInterval(timer);
    };
  }, []);

  const scrollToSection = (id) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredServices = servicesData.filter((service) => {
    const query = serviceSearch.toLowerCase();
    return (
      service.title.toLowerCase().includes(query) ||
      service.category.toLowerCase().includes(query) ||
      service.description.toLowerCase().includes(query) ||
      service.checklist.some((item) => item.toLowerCase().includes(query))
    );
  });

  // Flat list of all auto parts across service categories using liveCatalog
  const allPartsList = Object.entries(liveCatalog).flatMap(([cat, parts]) =>
    parts.map((p) => ({ ...p, category: cat }))
  );

  const filteredParts = allPartsList.filter((p) => {
    const query = partSearch.toLowerCase();
    const matchesCategory = !selectedPartCategory || p.category === selectedPartCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.unit.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={`min-h-screen font-sans ${isDarkMode ? 'bg-[#0a0e1a] text-white' : 'bg-slate-50 text-slate-900'} transition-colors duration-300`}>
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#0c101d]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo on Left */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer shrink-0"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setActiveTab('home');
            }}
          >
            <img src="/AutoCareLogo.png" alt="AutoCare Logo" className="h-9 w-auto object-contain" />
          </div>

          {/* Upper Right Side Navigation Container */}
          <div className="flex items-center space-x-3 lg:space-x-4 ml-auto">
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm font-medium">
              {[
                { id: 'home', label: 'Home' },
                { id: 'how-it-works', label: 'How It Works' },
                { id: 'services', label: 'Services' },
                { id: 'parts-catalog', label: 'Auto Parts' },
                { id: 'about', label: 'About' },
                { id: 'contact', label: 'Contact Us' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`px-3.5 py-1.5 text-sm transition-all duration-200 relative ${
                    activeTab === tab.id
                      ? 'text-white font-bold border-b-2 border-amber-500 pb-1'
                      : 'text-gray-300 hover:text-white hover:bg-slate-800/50 rounded-lg'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Right Action Controls */}
            <div className="flex items-center space-x-2.5">
              {user ? (
                <Link
                  to="/dashboard"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-2 rounded-lg text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 uppercase tracking-wide"
                >
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-2 rounded-lg text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 uppercase tracking-wide"
                  >
                    SIGN IN
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-5 py-2 rounded-lg text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 uppercase tracking-wide"
                  >
                    SIGN UP
                  </Link>
                </div>
              )}

              {/* Dark/Light Theme Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition-all border border-slate-700"
                title="Toggle theme"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4 text-slate-700" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background image with overlay gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=2000&q=80"
            alt="AutoCare Shop Garage with Cars on Lifts"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/85 to-[#0c101d]/75" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 py-20 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight uppercase drop-shadow-md">
              Professional Vehicle <br />
              <span className="text-amber-500">Care You Can Trust</span>
            </h1>
            <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
              From routine maintenance to complex engine repairs, AutoCare provides reliable, high-quality service for all types of cars and luxury automobiles.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => scrollToSection('services')}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-8 py-3.5 rounded-lg text-sm tracking-wider uppercase transition-all shadow-lg shadow-amber-500/30 hover:scale-105"
            >
              Explore Services
            </button>
            <button
              onClick={() => scrollToSection('parts-catalog')}
              className="w-full sm:w-auto bg-slate-900/90 hover:bg-slate-800 text-white font-bold px-8 py-3.5 rounded-lg text-sm tracking-wider uppercase transition-all border border-slate-700 hover:border-amber-500/50 backdrop-blur-md hover:scale-105"
            >
              View Auto Parts
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center space-y-3 mb-16">
          <span className="text-amber-400 text-xs font-extrabold uppercase tracking-widest bg-amber-500/10 px-3.5 py-1 rounded-full border border-amber-500/20">
            Simple & Transparent
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">How AutoCare Works</h2>
          <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full my-2" />
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            Getting your vehicle serviced has never been easier. Four simple steps to peace of mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              step: '01',
              title: 'Visit Front Desk',
              desc: 'Our front desk records your vehicle and reported problem in seconds.',
              icon: Car,
            },
            {
              step: '02',
              title: 'Expert Diagnostics',
              desc: 'Our certified technicians perform a thorough computer inspection.',
              icon: Wrench,
            },
            {
              step: '03',
              title: 'Quality Repairs',
              desc: 'We use genuine manufacturer parts with full service warranty.',
              icon: Shield,
            },
            {
              step: '04',
              title: 'Drive Away Happy',
              desc: 'Receive digital reports, track service history, and enjoy smooth driving.',
              icon: CheckCircle,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl relative hover:border-amber-500/50 transition-all group shadow-lg"
              >
                <div className="text-4xl font-black text-amber-500/30 mb-4 font-mono group-hover:text-amber-400 transition-colors">
                  {item.step}
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl w-fit mb-4 border border-amber-500/20">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Services Reference Grid Section */}
      <section id="services" className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/80 my-6">
        <div className="text-center space-y-2 mb-10">
          <span className="text-amber-500 font-black text-xs tracking-widest uppercase block">
            WHAT WE DO
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
            LET US RESTORE YOUR VEHICLE'S PERFORMANCE!
          </h2>
          <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full my-3" />
          <p className="text-gray-300 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed">
            From routine preventative maintenance to complex engine and transmission overhauls, our certified technicians deliver expert craftsmanship and transparent pricing.
          </p>

          {/* Search Filter Input */}
          <div className="max-w-md mx-auto pt-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search for a service or feature..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-gray-400 text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Minimized 12 Services Grid with Images */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredServices.map((service) => {
            const isExpanded = expandedServiceId === service.id;
            return (
              <div
                key={service.id}
                className="bg-slate-900/90 border border-slate-800/90 rounded-2xl overflow-hidden hover:border-amber-500/60 transition-all duration-300 shadow-lg flex flex-col justify-between group"
              >
                {/* Service Image Banner with Overlaid Price Badge */}
                <div className="relative h-36 overflow-hidden bg-slate-800">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg shadow-md border border-amber-400/40">
                    {service.price}
                  </div>
                  <div className="absolute bottom-2 left-2.5">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-black/70 backdrop-blur-md px-2 py-0.5 rounded border border-white/20">
                      {service.category}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Title & Emoji Icon */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">
                        {service.title}
                      </h3>
                      <span className="text-lg shrink-0">{service.icon}</span>
                    </div>

                    {/* Compact Description */}
                    <p className="text-gray-400 text-[11px] leading-relaxed line-clamp-2">
                      {service.description}
                    </p>
                  </div>

                  {/* Toggle Checklist Dropdown */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => setExpandedServiceId(isExpanded ? null : service.id)}
                      className="text-[11px] font-semibold text-gray-400 hover:text-amber-400 flex items-center space-x-1 transition-colors w-full justify-between"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View What We Do'}</span>
                      <ChevronRight className={`h-3 w-3 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Collapsible Checklist */}
                    {isExpanded && (
                      <div className="pt-2 mt-2 border-t border-slate-800/60 space-y-1.5 animate-fadeIn">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                          Checklist Items:
                        </h4>
                        <ul className="space-y-1 text-[11px] text-gray-300">
                          {service.checklist.map((item, idx) => (
                            <li key={idx} className="flex items-start space-x-1.5">
                              <span className="text-amber-400 font-bold shrink-0">✓</span>
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
            No services matching "<span className="text-white font-semibold">{serviceSearch}</span>" found.
          </div>
        )}
      </section>

      {/* GENUINE AUTO PARTS & REPLACED COMPONENTS CATALOG SECTION */}
      <section id="parts-catalog" className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center space-y-2 mb-10">
          <span className="text-amber-400 font-extrabold text-xs tracking-widest uppercase flex items-center justify-center space-x-1">
            <Package className="h-4 w-4 text-amber-400" />
            <span>GENUINE SPARE PARTS & REPLACEMENTS</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Live Shop Auto Parts
          </h2>
          <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full my-3" />
          <p className="text-gray-300 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed">
            Inspect live stock availability of OEM spare parts installed by our technicians for each repair service category.
          </p>

          {/* Search Parts Input */}
          <div className="max-w-md mx-auto pt-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={partSearch}
                onChange={(e) => setPartSearch(e.target.value)}
                placeholder="Search spare parts (e.g. Brake Pads, Oil Filter, Spark Plugs)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-gray-400 text-xs focus:outline-none focus:border-amber-500 transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Category Tabs for Auto Parts */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setSelectedPartCategory('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              !selectedPartCategory
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-gray-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            All Spare Parts
          </button>
          {Object.keys(liveCatalog).map((category, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedPartCategory(category)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedPartCategory === category
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-gray-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Auto Parts Cards Grid with Live Stock Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredParts.map((part) => (
            <div
              key={part.id}
              className="bg-slate-900/90 border border-slate-800/90 p-5 rounded-2xl space-y-3 hover:border-amber-500/60 transition-all group flex flex-col justify-between shadow-lg"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase">
                    {part.id}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center space-x-1">
                    <ShieldCheck className="h-3 w-3" />
                    <span>OEM Genuine</span>
                  </span>
                </div>

                <h3 className="font-extrabold text-white text-sm group-hover:text-amber-400 transition-colors leading-snug">
                  {part.name}
                </h3>
                <p className="text-[11px] text-gray-400 font-semibold">{part.category}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-bold">Unit Charge</span>
                  <span className="text-base font-black text-amber-400">{part.price}</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-500 uppercase block font-bold">Available Stocks</span>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg border inline-flex items-center space-x-1 ${
                    part.stockQuantity > 0
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : 'text-red-400 bg-red-500/10 border-red-500/20'
                  }`}>
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{part.stockQuantity} {part.unit}s</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredParts.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-xs">
            No spare parts found matching "<span className="text-white font-semibold">{partSearch}</span>".
          </div>
        )}
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6 max-w-4xl mx-auto border-t border-slate-800/80">
        <div className="text-center space-y-6">
          <span className="text-amber-500 font-extrabold text-xs tracking-widest uppercase block">
            WHO WE ARE
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            About AutoCare
          </h2>
          <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full" />

          <div className="bg-slate-900/90 border border-slate-800/90 p-8 sm:p-12 rounded-3xl shadow-2xl text-left space-y-6 text-gray-300 text-sm sm:text-base leading-relaxed hover:border-amber-500/40 transition-colors">
            <p>
              Founded in 2005, AutoCare has grown from a small local garage to the city's most trusted auto and motor repair shop. Our team consists of certified admins, dedicated cashiers, and highly skilled mechanics who treat every vehicle as if it were their own.
            </p>
            <p>
              We believe in complete transparency, using only premium quality parts, and providing honest, reliable labor. Our mission is to ensure your safety on the road and extend the lifespan of your vehicle through meticulous care.
            </p>
            <p>
              Whether you drive a compact car, a luxury sedan, or ride a heavy-duty motorcycle, we have the state-of-the-art diagnostic tools and expertise to get you back on the road safely and efficiently.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Contact Info */}
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Get in Touch</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Have questions about our services or want to book an appointment? Reach out to us and our team will get back to you shortly.
            </p>

            <div className="space-y-5 pt-2">
              <div className="flex items-start space-x-4">
                <span className="text-2xl">📍</span>
                <div>
                  <h4 className="font-bold text-white text-sm mb-0.5">Address</h4>
                  <p className="text-gray-400 text-xs sm:text-sm">Purok Sta. Cruz, Villalimpia, Loay, Bohol</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <span className="text-2xl">📞</span>
                <div>
                  <h4 className="font-bold text-white text-sm mb-0.5">Phone</h4>
                  <p className="text-gray-400 text-xs sm:text-sm">09093671998</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <span className="text-2xl">✉️</span>
                <div>
                  <h4 className="font-bold text-white text-sm mb-0.5">Email</h4>
                  <p className="text-gray-400 text-xs sm:text-sm">garixxxxx81@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <span className="text-2xl">⏰</span>
                <div>
                  <h4 className="font-bold text-white text-sm mb-0.5">Working Hours</h4>
                  <p className="text-gray-400 text-xs sm:text-sm">Mon - Fri: 8:00 AM - 5:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Message sent! We will contact you soon.');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Service Inquiry"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Message</label>
                <textarea
                  rows={4}
                  placeholder="How can we help you?"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/30"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#080c17] py-8 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <img src="/AutoCareLogo.png" alt="AutoCare Logo" className="h-7 w-auto object-contain" />
          </div>
          <p>© {new Date().getFullYear()} AutoCare Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
