import React, { useState, useEffect } from 'react';
import { getFeedback, addFeedback, deleteFeedback } from '../utils/feedbackStore';
import { getJobOrders } from '../utils/jobOrderStore';
import {
  MessageSquare,
  Star,
  Send,
  CheckCircle,
  Trash2,
  Search,
  Car,
  Wrench,
  Clock,
  Sparkles,
  ShieldCheck,
  Filter,
  Eye,
  Award,
  ThumbsUp,
} from 'lucide-react';

export default function ClientFeedback({ user }) {
  const [feedbackList, setFeedbackList] = useState([]);
  const [myJobOrders, setMyJobOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('my_feedback'); // 'my_feedback' or 'all_reviews'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Form State for Clients
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const role = (user?.role || 'customer').toString().trim().toLowerCase();
  const isViewOnlyStaffMode = role !== 'client' && role !== 'customer';

  const username = (user?.username || '').toLowerCase();
  const name = (user?.name || '').toLowerCase();

  const loadData = () => {
    const allFeedback = getFeedback();
    setFeedbackList(allFeedback);

    // Load jobs to populate vehicle / service choices
    const allJobs = getJobOrders();
    const filteredJobs = allJobs.filter((o) => {
      const oUser = (o.clientUsername || '').toLowerCase();
      const oName = (o.clientName || '').toLowerCase();

      if (username === 'clt-4' || name.includes('claire')) return oUser === 'clt-4' || oName.includes('claire');
      if (username === 'lucky_garay' || name.includes('lucky')) return oUser === 'lucky_garay' || oName.includes('lucky');
      if (username === 'clt_mikegerald303' || name.includes('mike')) return oUser === 'clt_mikegerald303' || oName.includes('mike');
      if (username && oUser === username) return true;
      if (name && name !== 'client' && (oName.includes(name) || name.includes(oName))) return true;

      return false;
    });

    setMyJobOrders(filteredJobs);

    // Set default vehicle & service if available
    if (filteredJobs.length > 0 && !selectedVehicle) {
      const latest = filteredJobs[0];
      setSelectedVehicle(`${latest.vehicleName} (${latest.plateNumber})`);
      setSelectedServiceCategory(latest.serviceCategory || 'General Maintenance');
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('autocare_feedback_updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('autocare_feedback_updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const clientDisplayName = user?.name || user?.username || 'Client';

    addFeedback({
      clientUsername: user?.username || 'client',
      clientName: clientDisplayName,
      name: clientDisplayName,
      vehicle: selectedVehicle || 'Vehicle Owner',
      serviceCategory: selectedServiceCategory || 'AutoCare Servicing',
      rating: rating,
      comment: comment.trim(),
    });

    setComment('');
    setRating(5);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 4000);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      deleteFeedback(id);
    }
  };

  // Filter My Feedback vs All Feedback
  const myFeedbacks = feedbackList.filter((f) => {
    const fUser = (f.clientUsername || '').toLowerCase();
    const fName = (f.clientName || f.name || '').toLowerCase();

    if (username === 'clt-4' || name.includes('claire')) return fUser === 'clt-4' || fName.includes('claire');
    if (username === 'lucky_garay' || name.includes('lucky')) return fUser === 'lucky_garay' || fName.includes('lucky');
    if (username === 'clt_mikegerald303' || name.includes('mike')) return fUser === 'clt_mikegerald303' || fName.includes('mike');
    if (username && fUser === username) return true;
    if (name && name !== 'client' && (fName.includes(name) || name.includes(fName))) return true;

    return false;
  });

  const baseList = isViewOnlyStaffMode
    ? feedbackList
    : activeTab === 'my_feedback'
    ? myFeedbacks
    : feedbackList;

  const filteredList = baseList.filter((f) => {
    const term = searchTerm.toLowerCase();
    const fComment = (f.comment || '').toLowerCase();
    const fVehicle = (f.vehicle || '').toLowerCase();
    const fName = (f.name || f.clientName || '').toLowerCase();
    const fService = (f.serviceCategory || '').toLowerCase();

    const matchesSearch =
      fComment.includes(term) ||
      fVehicle.includes(term) ||
      fName.includes(term) ||
      fService.includes(term);

    const matchesRating =
      selectedRatingFilter === 'all' ||
      (f.rating || 5).toString() === selectedRatingFilter;

    const matchesCategory =
      selectedCategoryFilter === 'all' ||
      fService.toLowerCase().includes(selectedCategoryFilter.toLowerCase());

    return matchesSearch && matchesRating && matchesCategory;
  });

  const overallAverageRating =
    feedbackList.length > 0
      ? (feedbackList.reduce((acc, item) => acc + (item.rating || 5), 0) / feedbackList.length).toFixed(1)
      : '5.0';

  const fiveStarCount = feedbackList.filter((f) => (f.rating || 5) === 5).length;
  const fiveStarPercentage = feedbackList.length > 0 ? Math.round((fiveStarCount / feedbackList.length) * 100) : 100;

  const myAverageRating =
    myFeedbacks.length > 0
      ? (myFeedbacks.reduce((acc, item) => acc + (item.rating || 5), 0) / myFeedbacks.length).toFixed(1)
      : '5.0';

  const getRatingLabel = (stars) => {
    switch (stars) {
      case 5:
        return '5.0 - Outstanding & Highly Satisfied!';
      case 4:
        return '4.0 - Very Good Service';
      case 3:
        return '3.0 - Satisfactory / Average';
      case 2:
        return '2.0 - Needs Improvement';
      case 1:
        return '1.0 - Poor Experience';
      default:
        return '5.0 - Excellent';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start space-x-2">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold px-3 py-1 rounded-full uppercase flex items-center space-x-1">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              {isViewOnlyStaffMode ? 'Client Feedback Dashboard (View Only)' : 'Customer Feedback & Reviews'}
            </span>
            <span className="bg-white/10 text-white text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border border-white/10">
              {role.toUpperCase()}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold">
            {isViewOnlyStaffMode ? 'Customer Reviews & Feedback Dashboard' : 'Share Your AutoCare Experience'}
          </h1>
          <p className="text-blue-100 text-sm max-w-xl">
            {isViewOnlyStaffMode
              ? 'View-only monitoring dashboard of authentic client feedback, service ratings, and vehicle owner reviews.'
              : 'We value your thoughts! Submit feedback on your recent vehicle maintenance and view real reviews from fellow car owners.'}
          </p>
        </div>

        {isViewOnlyStaffMode && (
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-center shrink-0 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">Overall Customer Satisfaction</span>
            <p className="text-3xl font-black text-white flex items-center justify-center gap-1">
              <span>{overallAverageRating}</span>
              <Star className="h-6 w-6 fill-amber-400 text-amber-400 inline" />
            </p>
            <span className="text-[10px] text-gray-300 block font-semibold">{fiveStarPercentage}% 5-Star Approval Rate</span>
          </div>
        )}
      </div>

      {/* Success Notification Alert (Client Mode) */}
      {!isViewOnlyStaffMode && showSuccessToast && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-emerald-400 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-white shrink-0" />
            <div>
              <p className="font-bold text-sm">Thank you for your feedback!</p>
              <p className="text-xs text-emerald-100">Your review has been successfully recorded and recorded on your dashboard.</p>
            </div>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            className="text-white/80 hover:text-white font-bold text-xs bg-white/20 px-3 py-1 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {isViewOnlyStaffMode ? 'Total Client Reviews' : 'My Submitted Reviews'}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {isViewOnlyStaffMode ? `${feedbackList.length} Review(s)` : `${myFeedbacks.length} Feedback(s)`}
            </p>
          </div>
          <div className="p-3 rounded-2xl text-white bg-blue-600">
            <MessageSquare className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Average Rating Score</p>
            <p className="text-2xl font-bold text-amber-500 mt-1 flex items-center gap-1.5">
              <span>{isViewOnlyStaffMode ? overallAverageRating : myAverageRating}</span>
              <Star className="h-5 w-5 fill-amber-400 text-amber-400 inline" />
            </p>
          </div>
          <div className="p-3 rounded-2xl text-white bg-amber-500">
            <Star className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {isViewOnlyStaffMode ? '5-Star Satisfaction Rate' : 'Verified Repair Records'}
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {isViewOnlyStaffMode ? `${fiveStarPercentage}%` : `${myJobOrders.length} Service(s)`}
            </p>
          </div>
          <div className="p-3 rounded-2xl text-white bg-emerald-600">
            {isViewOnlyStaffMode ? <Award className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
        </div>
      </div>

      {/* Main Grid: Form / View Analytics & Feedbacks List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Submit Form for Clients OR View-Only Overview Summary for Staff */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm space-y-5 h-fit">
          {!isViewOnlyStaffMode ? (
            <>
              <div className="border-b border-gray-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span>Leave Your Feedback</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Rate your recent maintenance or repair experience.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Vehicle Selection */}
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                    Vehicle Served
                  </label>
                  {myJobOrders.length > 0 ? (
                    <select
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {myJobOrders.map((job) => (
                        <option key={job.id} value={`${job.vehicleName} (${job.plateNumber})`}>
                          {job.vehicleName} - {job.plateNumber} ({job.serviceCategory})
                        </option>
                      ))}
                      <option value="General Vehicle">Other / Custom Vehicle</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Toyota Vios (ABC-1234)"
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                {/* Service Category */}
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                    Service Category
                  </label>
                  <select
                    value={selectedServiceCategory}
                    onChange={(e) => setSelectedServiceCategory(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Change Oil & Maintenance">Change Oil & Maintenance</option>
                    <option value="Brake & Suspension Overhaul">Brake & Suspension Overhaul</option>
                    <option value="Engine Overhauling">Engine Overhauling</option>
                    <option value="Body Paint & Refinishing">Body Paint & Refinishing</option>
                    <option value="Air Conditioning Services">Air Conditioning Services</option>
                    <option value="General Maintenance">General Auto Servicing</option>
                  </select>
                </div>

                {/* Interactive Star Rating */}
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                    Service Rating
                  </label>
                  <div className="flex items-center space-x-1 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 focus:outline-none transition-transform hover:scale-125"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            star <= (hoverRating || rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300 dark:text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
                    {getRatingLabel(hoverRating || rating)}
                  </p>
                </div>

                {/* Review Comments */}
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                    Your Comments & Suggestions
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write your honest feedback here (e.g., service quality, technician professionalism, repair turn-around time)..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center justify-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Submit Feedback</span>
                </button>
              </form>
            </>
          ) : (
            /* STAFF VIEW ONLY SUMMARY PANEL */
            <div className="space-y-4 text-xs">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-3">
                <span className="text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  View-Only Mode
                </span>
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span>Feedback Summary</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Staff overview of client reviews and ratings.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/80 p-4 rounded-xl space-y-2 border border-gray-100 dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Total Reviews Recorded:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{feedbackList.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">5-Star Outstanding Reviews:</span>
                  <span className="font-bold text-amber-500">{fiveStarCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Average Rating Score:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{overallAverageRating} / 5.0</span>
                </div>
              </div>

              {/* Rating breakdown */}
              <div className="space-y-2 pt-1">
                <p className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">Rating Distribution</p>
                {[5, 4, 3, 2, 1].map((starNum) => {
                  const count = feedbackList.filter((f) => (f.rating || 5) === starNum).length;
                  const pct = feedbackList.length > 0 ? Math.round((count / feedbackList.length) * 100) : 0;
                  return (
                    <div key={starNum} className="space-y-1">
                      <div className="flex justify-between text-[11px] text-gray-600 dark:text-gray-400">
                        <span>{starNum} Stars ({count})</span>
                        <span className="font-mono">{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 p-3.5 rounded-xl text-blue-900 dark:text-blue-200 text-[11px] leading-relaxed">
                ℹ️ <strong>Staff Note:</strong> You are viewing customer feedbacks in view-only mode. Use the search bar and rating filter on the right to inspect feedback by client name, vehicle, or service category.
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: FEEDBACKS DISPLAY LIST */}
        <div className="lg:col-span-2 space-y-5">
          {/* Controls: Tabs / Filters & Search */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            {!isViewOnlyStaffMode ? (
              <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto">
                <button
                  onClick={() => setActiveTab('my_feedback')}
                  className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'my_feedback'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  My Feedbacks ({myFeedbacks.length})
                </button>
                <button
                  onClick={() => setActiveTab('all_reviews')}
                  className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'all_reviews'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  All Customer Reviews ({feedbackList.length})
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Filter Ratings:</span>
                <select
                  value={selectedRatingFilter}
                  onChange={(e) => setSelectedRatingFilter(e.target.value)}
                  className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white px-2.5 py-1.5 rounded-xl text-xs focus:outline-none"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars Only</option>
                  <option value="4">4 Stars Only</option>
                  <option value="3">3 Stars Only</option>
                  <option value="2">2 Stars Only</option>
                  <option value="1">1 Star Only</option>
                </select>
              </div>
            )}

            <div className="relative w-full md:w-64">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-xs pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Feedback Cards List */}
          <div className="space-y-4">
            {filteredList.map((item) => {
              const isOwner =
                (item.clientUsername || '').toLowerCase() === username ||
                (item.clientName || item.name || '').toLowerCase().includes(name);

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm space-y-3 transition-colors hover:border-blue-500/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                        {(item.name || item.clientName || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                            {item.name || item.clientName || 'Client'}
                          </h3>
                          <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                            <ShieldCheck className="h-3 w-3" /> Verified Client
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 mt-0.5">
                          <Car className="h-3.5 w-3.5 inline" /> {item.vehicle || 'Vehicle'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-auto">
                      <div className="flex text-amber-400">
                        {[...Array(item.rating || 5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400" />
                        ))}
                      </div>

                      {(isOwner || role === 'admin') && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete Feedback"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed italic bg-gray-50/70 dark:bg-slate-800/50 p-3.5 rounded-xl border border-gray-100 dark:border-slate-800">
                    "{item.comment}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                    <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold px-2.5 py-0.5 rounded border border-purple-100 dark:border-purple-800 flex items-center gap-1">
                      <Wrench className="h-3 w-3" /> {item.serviceCategory || 'AutoCare Servicing'}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3" /> {item.date}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredList.length === 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-12 text-center text-gray-400 text-xs space-y-2">
                <MessageSquare className="h-8 w-8 mx-auto text-gray-300 dark:text-slate-700" />
                <p className="font-semibold text-gray-600 dark:text-gray-300">No feedbacks found.</p>
                <p>No client feedbacks match your search or filter criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
