import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getPaymentStats, 
  listUsers, 
  getSpammers, 
  approveUser, 
  deleteUser, 
  searchUsers, 
  updateSettings, 
  createPremiumPlan, 
  updatePremiumPlan, 
  deletePremiumPlan, 
  initializeDefaultData,
  getSettings, // Added for loadSettings
  getPremiumPlans // Added for loadPremiumPlans
} from '../services/adminService.js';
import { MdWarning, MdSearch, MdVisibility, MdDelete, MdCheckCircle, MdSettings, MdStar, MdAdd, MdEdit, MdPayment } from 'react-icons/md';

export default function AdminPanelPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [spammers, setSpammers] = useState([]);
  const [tab, setTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [genderFilter, setGenderFilter] = useState('all');
  const [genderCounts, setGenderCounts] = useState({ total: 0, male: 0, female: 0 });
  const [paymentStats, setPaymentStats] = useState({ paidCount: 0, totalAmount: 0, premiumUsers: 0 });
  const [settings, setSettings] = useState({
    freeUserRequestLimit: 2,
    premiumUserRequestLimit: 20,
  });
  const [premiumPlans, setPremiumPlans] = useState([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    duration: 1,
    price: 0,
    discount: 0,
    requestLimit: 50,
    features: [],
  });

  useEffect(() => {
    loadUsers();
    loadSpammers();
    loadSettings();
    loadPremiumPlans();
    loadPaymentStats();
  }, []);

  useEffect(() => {
    applyGenderFilter(allUsers, genderFilter);
  }, [allUsers, genderFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await listUsers();
      setAllUsers(data);
      const counts = {
        total: data.length,
        male: data.filter(user => user.gender === 'male').length,
        female: data.filter(user => user.gender === 'female').length,
      };
      setGenderCounts(counts);
    } catch (e) {
      setInfo('Failed to load users: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const applyGenderFilter = (userData, filter) => {
    let filteredUsers = userData;
    if (filter === 'male') {
      filteredUsers = userData.filter(user => user.gender === 'male');
    } else if (filter === 'female') {
      filteredUsers = userData.filter(user => user.gender === 'female');
    }
    setUsers(filteredUsers);
  };

  const handleGenderFilter = (filter) => {
    setGenderFilter(filter);
  };

  const loadSpammers = async () => {
    try {
      setLoading(true);
      const data = await getSpammers();
      setSpammers(data);
    } catch (e) {
      setInfo('Failed to load spammers: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings(); // Assumes getSettings exists
      setSettings(data);
    } catch (e) {
      setInfo('Failed to load settings: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const loadPremiumPlans = async () => {
    try {
      setLoading(true);
      const data = await getPremiumPlans(); // Assumes getPremiumPlans exists
      setPremiumPlans(data);
    } catch (e) {
      setInfo('Failed to load premium plans: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentStats = async () => {
    try {
      setLoading(true);
      const data = await getPaymentStats();
      setPaymentStats(data);
    } catch (e) {
      setInfo('Failed to load payment stats: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const onApprove = async (userId) => {
    try {
      await approveUser(userId);
      setInfo('User approved');
      loadUsers();
    } catch (e) {
      setInfo('Failed to approve user: ' + (e.response?.data?.message || e.message));
    }
  };

  const onDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await deleteUser(userId);
      setInfo('User deleted successfully');
      if (tab === 'users') loadUsers();
      if (tab === 'spammers') loadSpammers();
    } catch (e) {
      setInfo('Failed to delete user: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setLoading(true);
      const results = await searchUsers(searchTerm);
      setSearchResults(results);
    } catch (e) {
      setInfo('Failed to search users: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const viewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleSettingsUpdate = async () => {
    try {
      await updateSettings(settings);
      setInfo('Settings updated successfully');
    } catch (e) {
      setInfo('Failed to update settings: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleCreatePlan = async () => {
    try {
      await createPremiumPlan(planForm);
      setInfo('Premium plan created successfully');
      setShowPlanModal(false);
      setPlanForm({ name: '', duration: 1, price: 0, discount: 0, requestLimit: 50, features: [] });
      loadPremiumPlans();
    } catch (e) {
      setInfo('Failed to create premium plan: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleUpdatePlan = async () => {
    try {
      await updatePremiumPlan(editingPlan._id, planForm);
      setInfo('Premium plan updated successfully');
      setShowPlanModal(false);
      setEditingPlan(null);
      setPlanForm({ name: '', duration: 1, price: 0, discount: 0, requestLimit: 50, features: [] });
      loadPremiumPlans();
    } catch (e) {
      setInfo('Failed to update premium plan: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to deactivate this plan?')) return;
    try {
      await deletePremiumPlan(planId);
      setInfo('Premium plan deactivated successfully');
      loadPremiumPlans();
    } catch (e) {
      setInfo('Failed to deactivate premium plan: ' + (e.response?.data?.message || e.message));
    }
  };

  const openEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      duration: plan.duration,
      price: plan.price,
      discount: plan.discount,
      requestLimit: plan.requestLimit,
      features: plan.features || [],
    });
    setShowPlanModal(true);
  };

  const handleInitializeData = async () => {
    if (!window.confirm('This will create default premium plans and settings. Continue?')) return;
    try {
      const result = await initializeDefaultData();
      setInfo(result.message);
      if (tab === 'settings') loadSettings();
      if (tab === 'premium') loadPremiumPlans();
    } catch (e) {
      setInfo('Failed to initialize data: ' + (e.response?.data?.message || e.message));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full flex items-center justify-center mb-6">
            <span className="text-3xl font-bold text-white">🛡️</span>
          </div>
          <h1 className="text-4xl font-bold text-blue-800 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage users, settings, and premium plans</p>
        </div>

        <div className="flex justify-center mb-8">
          <button
            onClick={handleInitializeData}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
            aria-label="Initialize Default Data"
          >
            <MdSettings /> Initialize Default Data
          </button>
        </div>

        {info && (
          <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-xl border border-green-200 text-center font-medium">
            {info}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6 bg-white rounded-xl shadow-md p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Search Users</h3>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (!e.target.value.trim()) setSearchResults([]);
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, email, or contact..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Search users"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
              aria-label="Search"
            >
              <MdSearch /> Search
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold mb-2 text-gray-700">Search Results ({searchResults.length})</h4>
              <div className="space-y-2">
                {searchResults.map(user => (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {user.profilePhoto ? (
                          <img src={user.profilePhoto} alt={`${user.name}'s profile`} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          user.name?.[0]?.toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email || user.contact}</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                    <button
                      onClick={() => viewProfile(user._id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                      aria-label={`View ${user.name}'s profile`}
                    >
                      <MdVisibility /> View Profile
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setTab('users')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              tab === 'users' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label="View all users"
          >
            All Users ({genderCounts.total})
          </button>
          <button
            onClick={() => setTab('spammers')}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              tab === 'spammers' ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label="View potential spammers"
          >
            <MdWarning /> Potential Spammers ({spammers.length})
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              tab === 'settings' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label="View settings"
          >
            <MdSettings /> Settings
          </button>
          <button
            onClick={() => setTab('premium')}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              tab === 'premium' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label="View premium plans"
          >
            <MdStar /> Premium Plans ({premiumPlans.length})
          </button>
          <button
            onClick={() => setTab('payments')}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              tab === 'payments' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label="View payments"
          >
            <MdPayment /> Payments ({paymentStats.paidCount})
          </button>
        </div>

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="space-y-6">
            {/* Gender Filter */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">Filter by Gender</h3>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => handleGenderFilter('all')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    genderFilter === 'all' 
                      ? 'bg-gradient-to-r from-yellow-400 to-pink-500 text-white shadow-xl' 
                      : 'bg-gray-100 text-blue-800 hover:bg-blue-50 border border-blue-200'
                  }`}
                  aria-label="Filter by all users"
                >
                  👥 All Users ({genderCounts.total})
                </button>
                <button
                  onClick={() => handleGenderFilter('male')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    genderFilter === 'male' 
                      ? 'bg-blue-600 text-white shadow-xl' 
                      : 'bg-gray-100 text-blue-800 hover:bg-blue-50 border border-blue-200'
                  }`}
                  aria-label="Filter by male users"
                >
                  👨 Boys ({genderCounts.male})
                </button>
                <button
                  onClick={() => handleGenderFilter('female')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    genderFilter === 'female' 
                      ? 'bg-pink-500 text-white shadow-xl' 
                      : 'bg-gray-100 text-blue-800 hover:bg-pink-50 border border-pink-200'
                  }`}
                  aria-label="Filter by female users"
                >
                  👩 Girls ({genderCounts.female})
                </button>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Showing {users.length} of {genderCounts.total} users
                {genderFilter !== 'all' && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    Filtered by: {genderFilter === 'male' ? 'Boys' : 'Girls'}
                  </span>
                )}
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Gender</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-10 text-gray-500">
                          Loading...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-10 text-gray-500">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map(u => (
                        <tr key={u._id} className="border-b hover:bg-blue-50 transition">
                          <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                          <td className="px-4 py-3 text-gray-600 text-sm">{u.email || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              u.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              u.gender === 'male' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-pink-100 text-pink-700'
                            }`}>
                              {u.gender === 'male' ? '👨' : '👩'} {u.gender === 'male' ? 'Boy' : 'Girl'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{u.contact}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => viewProfile(u._id)}
                                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                title="View Profile"
                                aria-label={`View ${u.name}'s profile`}
                              >
                                <MdVisibility />
                              </button>
                              {u.status === 'pending' && (
                                <button
                                  onClick={() => onApprove(u._id)}
                                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                  title="Approve"
                                  aria-label={`Approve ${u.name}`}
                                >
                                  <MdCheckCircle />
                                </button>
                              )}
                              <button
                                onClick={() => onDelete(u._id)}
                                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                title="Delete"
                                aria-label={`Delete ${u.name}`}
                              >
                                <MdDelete />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <MdPayment /> Payment Analytics
            </h3>

            {/* Payment Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Payments</p>
                    <p className="text-3xl font-bold text-green-600">{paymentStats.paidCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <MdPayment className="text-2xl text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-blue-600">₹{paymentStats.totalAmount}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <MdStar className="text-2xl text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Premium Users</p>
                    <p className="text-3xl font-bold text-purple-600">{paymentStats.premiumUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <MdStar className="text-2xl text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h4 className="text-lg font-semibold mb-4 text-gray-700">Premium Users List</h4>
              <div className="text-center py-8 text-gray-500">
                <MdStar className="text-4xl mx-auto mb-2 text-gray-300" />
                <p>Premium users list will be displayed here</p>
                <p className="text-sm">Feature to be implemented</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'spammers' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                <MdWarning className="text-xl" />
                Potential Spammers
              </div>
              <p className="text-sm text-red-600">
                These users have been blocked by 8 or more people. Review their profiles and take appropriate action.
              </p>
            </div>

            {loading ? (
              <div className="text-center py-10 text-gray-500">Loading...</div>
            ) : spammers.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                ✅ No potential spammers detected
              </div>
            ) : (
              <div className="space-y-4">
                {spammers.map(user => (
                  <div key={user._id} className="border border-red-200 rounded-lg p-4 bg-red-50 hover:bg-red-100 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white font-bold text-2xl">
                          {user.profilePhoto ? (
                            <img src={user.profilePhoto} alt={`${user.name}'s profile`} className="w-16 h-16 rounded-full object-cover" />
                          ) : (
                            user.name?.[0]?.toUpperCase()
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-gray-800">{user.name}</h4>
                          <p className="text-sm text-gray-600">{user.email || user.contact}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-red-200 text-red-700 rounded-full font-semibold">
                              🚫 Blocked by {user.blockedByCount} users
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full">
                              {user.gender}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewProfile(user._id)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                          aria-label={`View ${user.name}'s profile`}
                        >
                          <MdVisibility /> View
                        </button>
                        <button
                          onClick={() => onDelete(user._id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                          aria-label={`Delete ${user.name}`}
                        >
                          <MdDelete /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <MdSettings /> Request Limit Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Free User Daily Request Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.freeUserRequestLimit}
                  onChange={(e) => setSettings({...settings, freeUserRequestLimit: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label="Free user daily request limit"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Number of follow requests free users can send per day
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Premium User Daily Request Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={settings.premiumUserRequestLimit}
                  onChange={(e) => setSettings({...settings, premiumUserRequestLimit: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label="Premium user daily request limit"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Number of follow requests premium users can send per day
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSettingsUpdate}
              className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              aria-label="Save settings"
            >
              Save Settings
            </button>
          </div>
        )}

        {/* Premium Plans Tab */}
        {tab === 'premium' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <MdStar /> Premium Plans Management
              </h3>
              <button
                onClick={() => {
                  setPlanForm({ name: '', duration: 1, price: 0, discount: 0, requestLimit: 50, features: [] });
                  setEditingPlan(null);
                  setShowPlanModal(true);
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center gap-2"
                aria-label="Create new premium plan"
              >
                <MdAdd /> Create New Plan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {premiumPlans.map(plan => (
                <div key={plan._id} className="bg-white rounded-xl shadow-md p-6 border-2 border-purple-100">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xl font-bold text-gray-800">{plan.name}</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditPlan(plan)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        aria-label={`Edit ${plan.name}`}
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        aria-label={`Delete ${plan.name}`}
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-gray-600">Duration: <span className="font-semibold">{plan.duration} month(s)</span></p>
                    <p className="text-gray-600">Price: <span className="font-semibold text-green-600">${plan.price}</span></p>
                    {plan.discount > 0 && (
                      <p className="text-gray-600">Discount: <span className="font-semibold text-orange-600">{plan.discount}%</span></p>
                    )}
                    <p className="text-gray-600">Daily Requests: <span className="font-semibold text-purple-600">{plan.requestLimit}</span></p>
                  </div>
                  
                  {plan.features && plan.features.length > 0 && (
                    <div>
                      <p className="font-semibold text-gray-700 mb-2">Features:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {premiumPlans.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <MdStar className="text-6xl mx-auto mb-4 text-gray-300" />
                <p className="text-xl">No premium plans created yet</p>
                <p>Create your first premium plan to get started</p>
              </div>
            )}
          </div>
        )}

        {/* Plan Modal */}
        {showPlanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-6 text-gray-800">
                  {editingPlan ? 'Edit Premium Plan' : 'Create New Premium Plan'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Name</label>
                    <input
                      type="text"
                      value={planForm.name}
                      onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                      placeholder="e.g., 1 Month Premium"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      aria-label="Plan name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (months)</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={planForm.duration}
                        onChange={(e) => setPlanForm({...planForm, duration: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        aria-label="Plan duration"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={planForm.price}
                        onChange={(e) => setPlanForm({...planForm, price: parseFloat(e.target.value)})}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        aria-label="Plan price"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Discount (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={planForm.discount}
                        onChange={(e) => setPlanForm({...planForm, discount: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        aria-label="Plan discount"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Daily Request Limit</label>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={planForm.requestLimit}
                        onChange={(e) => setPlanForm({...planForm, requestLimit: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        aria-label="Daily request limit"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Features (one per line)</label>
                    <textarea
                      value={planForm.features.join('\n')}
                      onChange={(e) => setPlanForm({...planForm, features: e.target.value.split('\n').filter(f => f.trim())})}
                      placeholder="Unlimited messages&#10;Priority support&#10;Advanced search filters"
                      rows="4"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      aria-label="Plan features"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => {
                      setShowPlanModal(false);
                      setPlanForm({ name: '', duration: 1, price: 0, discount: 0, requestLimit: 50, features: [] });
                      setEditingPlan(null);
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                    aria-label="Cancel"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingPlan ? handleUpdatePlan : handleCreatePlan}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                    aria-label={editingPlan ? 'Update plan' : 'Create plan'}
                  >
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}