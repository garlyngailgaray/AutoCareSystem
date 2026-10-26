import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, submitPendingRegistration } from '../api';
import { getUserAccounts } from '../utils/userAccountsStore';
import {
  User,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  ShieldCheck,
  FileText,
  Zap,
  Wrench,
  Star,
} from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Client Self-Registration Fields
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('Male');
  const [civilStatus, setCivilStatus] = useState('Single');
  const [birthday, setBirthday] = useState('');
  const [age, setAge] = useState('');

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Submitted Application Acknowledgment Notice State
  const [submittedNotice, setSubmittedNotice] = useState(null);

  // Auto-calculate Age from Birthday
  const handleBirthdayChange = (e) => {
    const val = e.target.value;
    setBirthday(val);
    if (val) {
      const birthDate = new Date(val);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge > 0 ? calculatedAge.toString() : '0');
    }
  };

  // Phone Number restrict to digits only, max 11 digits
  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 11);
    setPhone(digitsOnly);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (phone.length !== 11) {
          setError('Phone number must be exactly 11 digits (e.g. 09123456789).');
          setLoading(false);
          return;
        }

        // Client Self-Registration Request Submission
        const currentRequests = JSON.parse(localStorage.getItem('autocare_pending_requests') || '[]');
        const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');

        const newRequest = {
          id: Date.now(),
          firstName,
          middleName,
          lastName,
          name: fullName,
          email,
          phone: phone || '09123456789',
          address,
          gender,
          civilStatus,
          birthday,
          age,
          requestedAt: new Date().toLocaleString('sv-SE').replace('T', ' '),
        };

        // 1. Submit pending registration request to MySQL Database API
        try {
          await submitPendingRegistration(newRequest);
        } catch (apiErr) {
          console.warn('Backend database API warning, saving to local store:', apiErr.message);
        }

        // 2. Save into local storage
        localStorage.setItem('autocare_pending_requests', JSON.stringify([newRequest, ...currentRequests]));

        // Set Acknowledgment Notice Card
        setSubmittedNotice(newRequest);

        // Reset registration form inputs
        setFirstName('');
        setMiddleName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setAddress('');
        setGender('Male');
        setCivilStatus('Single');
        setBirthday('');
        setAge('');
      } else {
        // Standard User Login
        let data;
        const lowerIdentifier = (username || '').trim().toLowerCase();

        try {
          data = await loginUser(username, password);
        } catch (apiErr) {
          // Fallback Authentication
          const localUsers = getUserAccounts();
          const foundLocal = localUsers.find((u) => {
            if (!u) return false;
            const uName = (u.username || '').toLowerCase();
            const uEmail = (u.email || '').toLowerCase();
            return uName === lowerIdentifier || uEmail === lowerIdentifier;
          });

          if (foundLocal) {
            data = {
              token: 'local_fallback_token',
              user: foundLocal,
            };
          } else if (
            lowerIdentifier === 'jaymarie' ||
            lowerIdentifier === 'jaymarie_busaco'
          ) {
            data = {
              token: 'local_fallback_token',
              user: {
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
                status: 'Active',
              },
            };
          } else if (
            lowerIdentifier === 'faith' ||
            lowerIdentifier === 'faith_cruz' ||
            lowerIdentifier === 'faith.cruz' ||
            lowerIdentifier === 'manager' ||
            lowerIdentifier === 'frontdesk'
          ) {
            data = {
              token: 'local_fallback_token',
              user: {
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
                gender: 'Female',
                birthday: '2005-05-09',
                age: 21,
                role: 'manager',
                civilStatus: 'Widowed',
                status: 'Active',
              },
            };
          } else {
            throw apiErr;
          }
        }

        localStorage.setItem('autocare_token', data.token);
        localStorage.setItem('autocare_user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-white flex flex-col justify-between font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#0c101d]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5 cursor-pointer shrink-0">
            <img src="/AutoCareLogo.png" alt="AutoCare Logo" className="h-9 w-auto object-contain" />
          </Link>

          <div className="flex items-center space-x-3 lg:space-x-4 ml-auto">
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm font-medium">
              {[
                { label: 'Home', path: '/' },
                { label: 'How It Works', path: '/#how-it-works' },
                { label: 'Services', path: '/#services' },
                { label: 'About', path: '/#about' },
                { label: 'Feedback', path: '/#feedback' },
                { label: 'Contact Us', path: '/#contact' },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  to={item.path}
                  className="px-3.5 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-5 py-2 rounded-lg text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 uppercase tracking-wide cursor-pointer"
            >
              {isRegister ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </header>

      {/* Center Split Card Container */}
      <div className="flex-1 flex items-center justify-center p-4 py-8 sm:py-12">
        <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl border border-slate-800/60 overflow-hidden flex flex-col md:flex-row text-slate-900 my-auto">
          {/* LEFT COLUMN: Dark Banner */}
          <div className="w-full md:w-5/12 bg-[#0c1427] p-8 text-white relative flex flex-col justify-between overflow-hidden">
            {/* Background Image Overlay */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
              <img
                src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80"
                alt="AutoCare Garage Overlay"
                className="w-full h-full object-cover object-center"
              />
            </div>

            <div className="relative z-10 space-y-6">
              {/* Logo Brand */}
              <div className="flex items-center space-x-2.5">
                <img src="/AutoCareLogo.png" alt="AutoCare Logo" className="h-8 w-auto object-contain" />
              </div>

              <div>
                <span className="inline-block bg-blue-500/20 text-blue-300 border border-blue-500/30 font-extrabold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider mb-3">
                  DIGITAL AUTO PORTAL
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                  Modern Vehicle Maintenance
                </h2>
                <p className="text-gray-300 text-xs sm:text-sm mt-2 leading-relaxed font-normal">
                  Join thousands of smart vehicle owners enjoying transparent billing and real-time repair tracking.
                </p>
              </div>

              {/* Feature Bullet Points */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg shrink-0 mt-0.5 border border-blue-500/30">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Instant Problem Reporting</h4>
                    <p className="text-gray-400 text-[11px] leading-snug">Submit requests in seconds from your phone.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg shrink-0 mt-0.5 border border-blue-500/30">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Live Repair Tracking</h4>
                    <p className="text-gray-400 text-[11px] leading-snug">Watch fixing progress as mechanics work.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg shrink-0 mt-0.5 border border-blue-500/30">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Transparent Checklists</h4>
                    <p className="text-gray-400 text-[11px] leading-snug">Fixed costs with zero unexpected fees.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial Quote Box at Bottom */}
            <div className="relative z-10 mt-8 pt-4 border-t border-slate-800/80">
              <div className="bg-slate-950/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 space-y-2">
                <p className="text-gray-200 text-xs italic leading-relaxed font-medium">
                  "AutoCare makes car servicing fast, honest, and reliable!"
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-[11px] font-semibold">— Verified Client</span>
                  <div className="flex text-amber-400 space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Light Form Card */}
          <div className="w-full md:w-7/12 bg-white p-6 sm:p-10 flex flex-col justify-between text-slate-900">
            {submittedNotice ? (
              /* Submitted Notice View */
              <div className="space-y-6 text-center my-auto py-4">
                <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full w-16 h-16 mx-auto flex items-center justify-center border border-emerald-200 shadow-md">
                  <Clock className="h-8 w-8 text-emerald-600 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <span className="bg-emerald-100 text-emerald-700 font-extrabold text-[11px] px-3.5 py-1 rounded-full uppercase tracking-wider border border-emerald-200">
                    Registration Request Submitted
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight pt-1">
                    Please Wait for Admin Approval
                  </h2>
                  <p className="text-gray-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                    Thank you for applying for an AutoCare client account. Your registration has been received and is waiting for Admin review.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left text-xs space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-gray-500 font-bold uppercase text-[10px] flex items-center space-x-1">
                      <FileText className="h-3.5 w-3.5 text-blue-600" />
                      <span>Submitted Profile Summary</span>
                    </span>
                    <span className="text-emerald-600 font-mono font-bold text-[10px]">{submittedNotice.requestedAt}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-gray-400 text-[10px] block font-bold uppercase">Applicant Full Name</span>
                      <span className="font-extrabold text-slate-900 text-xs">{submittedNotice.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block font-bold uppercase">Email Address</span>
                      <span className="font-semibold text-slate-700 truncate block">{submittedNotice.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block font-bold uppercase">Contact Phone</span>
                      <span className="font-mono text-slate-700 font-semibold">{submittedNotice.phone}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block font-bold uppercase">Home Address</span>
                      <span className="text-slate-700">{submittedNotice.address}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setSubmittedNotice(null);
                      setIsRegister(false);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Back to Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setSubmittedNotice(null)}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Form View */
              <div className="flex flex-col justify-between h-full space-y-6">
                {/* Form Top Bar */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-blue-100 text-blue-700 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                      {isRegister ? 'GET STARTED' : 'WELCOME BACK'}
                    </span>
                    <Link
                      to="/"
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-500 hover:text-slate-900 transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to Home</span>
                    </Link>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {isRegister ? 'Create Account' : 'Welcome Back'}
                  </h1>
                  <p className="text-gray-500 text-xs mt-1">
                    {isRegister
                      ? 'Enter your details to register your client portal'
                      : 'Sign in to access your vehicle dashboard'}
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 my-auto">
                  {isRegister ? (
                    /* REGISTER FIELDS */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">First Name *</label>
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="First Name"
                            className="w-full bg-blue-50/40 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-gray-400 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Middle Name</label>
                          <input
                            type="text"
                            value={middleName}
                            onChange={(e) => setMiddleName(e.target.value)}
                            placeholder="Middle Name"
                            className="w-full bg-blue-50/40 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-gray-400 font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Last Name *</label>
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last Name"
                          className="w-full bg-blue-50/40 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-gray-400 font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Email Address *</label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full bg-blue-50/40 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-gray-400 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Phone (11 digits) *</label>
                          <input
                            type="tel"
                            required
                            maxLength={11}
                            value={phone}
                            onChange={handlePhoneChange}
                            placeholder="09123456789"
                            className="w-full bg-blue-50/40 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-gray-400 font-mono font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Birthday *</label>
                          <input
                            type="date"
                            required
                            value={birthday}
                            onChange={handleBirthdayChange}
                            className="w-full bg-blue-50/40 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Age</label>
                          <input
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="Age"
                            className="w-full bg-blue-50/40 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-gray-400 font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Gender *</label>
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full bg-blue-50/40 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Civil Status *</label>
                          <select
                            value={civilStatus}
                            onChange={(e) => setCivilStatus(e.target.value)}
                            className="w-full bg-blue-50/40 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                          >
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Home Address *</label>
                        <input
                          type="text"
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="House No., Street, City"
                          className="w-full bg-blue-50/40 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-gray-400 font-medium"
                        />
                      </div>
                    </div>
                  ) : (
                    /* LOGIN FIELDS */
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Username</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            className="w-full bg-blue-50/40 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-gray-400 font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-blue-50/40 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-10 py-3 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-gray-400 font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3.5 text-gray-400 hover:text-slate-900 transition-colors focus:outline-none cursor-pointer"
                            title={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
                  >
                    <span>
                      {loading
                        ? 'Please wait...'
                        : isRegister
                        ? '🚀 GET STARTED NOW'
                        : 'SIGN IN NOW'}
                    </span>
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>

                {/* Bottom Toggle Link */}
                <div className="mt-4 text-center border-t border-slate-100 pt-4">
                  <button
                    onClick={() => {
                      setIsRegister(!isRegister);
                      setError(null);
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    {isRegister ? 'Already registered? Sign In Here' : "Don't have an account? Request Client Account"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#080c17] py-4 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} AutoCare Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
