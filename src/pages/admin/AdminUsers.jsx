import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdSearch, MdVisibility, MdDelete, MdCheckCircle, MdPushPin } from 'react-icons/md';
import { listUsers, approveUser, deleteUser, searchUsers, setUserPriority } from '../../services/adminService.js';
import { toast } from 'react-toastify';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all, premium, pinned, free
  const [genderCounts, setGenderCounts] = useState({ total: 0, male: 0, female: 0 });
  const [statusCounts, setStatusCounts] = useState({ total: 0, premium: 0, pinned: 0, free: 0 });
  const [presenceCounts, setPresenceCounts] = useState({ online: 0, offline: 0 });
  // Confirm delete modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null); // {_id, name}
  const [presenceFilter, setPresenceFilter] = useState('all'); // all, online, offline

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters(allUsers, genderFilter, statusFilter, presenceFilter);
  }, [allUsers, genderFilter, statusFilter, presenceFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await listUsers();
      setAllUsers(data);
      const genderCounts = {
        total: data.length,
        male: data.filter(user => user.gender === 'male').length,
        female: data.filter(user => user.gender === 'female').length,
      };
      const statusCounts = {
        total: data.length,
        premium: data.filter(user => user.isPremium).length,
        pinned: data.filter(user => (user.displayPriority || 0) > 0).length,
        free: data.filter(user => !user.isPremium && (user.displayPriority || 0) === 0).length,
      };
      const now = Date.now();
      const ONLINE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
      const online = data.filter(u => u.lastActiveAt && (now - new Date(u.lastActiveAt).getTime()) <= ONLINE_WINDOW_MS).length;
      const offline = data.length - online;
      setGenderCounts(genderCounts);
      setStatusCounts(statusCounts);
      setPresenceCounts({ online, offline });
    } catch (e) {
      setInfo('Failed to load users: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (userData, genderFilter, statusFilter, presenceFilter) => {
    let filteredUsers = userData;
    
    // Apply gender filter
    if (genderFilter === 'male') {
      filteredUsers = filteredUsers.filter(user => user.gender === 'male');
    } else if (genderFilter === 'female') {
      filteredUsers = filteredUsers.filter(user => user.gender === 'female');
    }
    
    // Apply status filter
    if (statusFilter === 'premium') {
      filteredUsers = filteredUsers.filter(user => user.isPremium);
    } else if (statusFilter === 'pinned') {
      filteredUsers = filteredUsers.filter(user => (user.displayPriority || 0) > 0);
    } else if (statusFilter === 'free') {
      filteredUsers = filteredUsers.filter(user => !user.isPremium && (user.displayPriority || 0) === 0);
    }

    // Apply presence filter (online/offline by lastActiveAt within 5 minutes)
    if (presenceFilter !== 'all') {
      const now = Date.now();
      const ONLINE_WINDOW_MS = 5 * 60 * 1000;
      filteredUsers = filteredUsers.filter(u => {
        const isOnline = !!u.lastActiveAt && (now - new Date(u.lastActiveAt).getTime()) <= ONLINE_WINDOW_MS;
        return presenceFilter === 'online' ? isOnline : !isOnline;
      });
    }
    
    // No sorting in admin panel - admin can see users in any order
    setUsers(filteredUsers);
  };

  const handleGenderFilter = (filter) => {
    setGenderFilter(filter);
  };

  const handleStatusFilter = (filter) => {
    setStatusFilter(filter);
  };

  const handlePresenceFilter = (filter) => {
    setPresenceFilter(filter);
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

  const onDelete = (user) => {
    setDeletingUser(user);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser?._id) return;
    try {
      await deleteUser(deletingUser._id);
      setInfo('User deleted successfully');
      setConfirmOpen(false);
      setDeletingUser(null);
      loadUsers();
    } catch (e) {
      setInfo('Failed to delete user: ' + (e.response?.data?.message || e.message));
      setConfirmOpen(false);
      setDeletingUser(null);
    }
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setDeletingUser(null);
  };

  const togglePinUser = async (userId, currentPriority) => {
    try {
      // If already pinned (priority > 0), unpin it (set to 0)
      // If not pinned (priority = 0), pin it (set to 100)
      const newPriority = (currentPriority || 0) > 0 ? 0 : 100;
      await setUserPriority(userId, newPriority);
      toast.success(newPriority > 0 ? 'User pinned to top!' : 'User unpinned');
      loadUsers();
    } catch (e) {
      toast.error('Failed to update user priority: ' + (e.response?.data?.message || e.message));
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

  return (
    <div className="space-y-4 md:space-y-6">
      {info && (
        <div className="p-3 md:p-4 text-sm md:text-base bg-blue-50 text-blue-800 border border-blue-200 rounded-lg">{info}</div>
      )}
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-md p-4">
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
            />
          </div>

          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
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
                      <div className="text-xs text-gray-400">Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-'}</div>
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
                  >
                    <MdVisibility /> View Profile
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gender + Presence (side by side on desktop) */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Filter by Gender</h3>
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => handleGenderFilter('all')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  genderFilter === 'all' 
                    ? 'bg-gradient-to-r from-yellow-400 to-pink-500 text-white shadow-xl' 
                    : 'bg-gray-100 text-blue-800 hover:bg-blue-50 border border-blue-200'
                }`}
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
              >
                👩 Girls ({genderCounts.female})
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-800 mb-4">Presence</h3>
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => handlePresenceFilter('all')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  presenceFilter === 'all' 
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-xl' 
                    : 'bg-gray-100 text-green-800 hover:bg-green-50 border border-green-200'
                }`}
              >
                🔄 All ({presenceCounts.online + presenceCounts.offline})
              </button>
              <button
                onClick={() => handlePresenceFilter('online')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  presenceFilter === 'online' 
                    ? 'bg-green-600 text-white shadow-xl' 
                    : 'bg-gray-100 text-green-800 hover:bg-green-50 border border-green-200'
                }`}
              >
                🟢 Online ({presenceCounts.online})
              </button>
              <button
                onClick={() => handlePresenceFilter('offline')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  presenceFilter === 'offline' 
                    ? 'bg-slate-600 text-white shadow-xl' 
                    : 'bg-gray-100 text-slate-700 hover:bg-slate-50 border border-slate-300'
                }`}
              >
                ⚪ Offline ({presenceCounts.offline})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter (Premium/Pinned/Free) */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-purple-800 mb-4">Filter by Status</h3>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => handleStatusFilter('all')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
              statusFilter === 'all' 
                ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-xl' 
                : 'bg-gray-100 text-purple-800 hover:bg-purple-50 border border-purple-200'
            }`}
          >
            🌐 All Status ({statusCounts.total})
          </button>
          <button
            onClick={() => handleStatusFilter('pinned')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
              statusFilter === 'pinned' 
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-xl' 
                : 'bg-gray-100 text-amber-700 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            📌 Pinned ({statusCounts.pinned})
          </button>
          <button
            onClick={() => handleStatusFilter('premium')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
              statusFilter === 'premium' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl' 
                : 'bg-gray-100 text-green-700 hover:bg-green-50 border border-green-200'
            }`}
          >
            ⭐ Premium ({statusCounts.premium})
          </button>
          <button
            onClick={() => handleStatusFilter('free')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
              statusFilter === 'free' 
                ? 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-xl' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            👤 Free Users ({statusCounts.free})
          </button>
        </div>
      </div>

      {/* Active Filters Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm font-medium text-gray-700">
            Showing <span className="font-bold text-blue-700">{users.length}</span> of <span className="font-bold">{genderCounts.total}</span> users
          </div>
          <div className="flex gap-2 flex-wrap">
            {genderFilter !== 'all' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                Gender: {genderFilter === 'male' ? '👨 Boys' : '👩 Girls'}
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                Status: {statusFilter === 'pinned' ? '📌 Pinned' : statusFilter === 'premium' ? '⭐ Premium' : '👤 Free'}
              </span>
            )}
            {presenceFilter !== 'all' && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                Presence: {presenceFilter === 'online' ? '🟢 Online' : '⚪ Offline'}
              </span>
            )}
            {(genderFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setGenderFilter('all');
                  setStatusFilter('all');
                  setPresenceFilter('all');
                }}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold hover:bg-red-200 transition"
              >
                ✕ Clear All
              </button>
            )}
          </div>
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
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3">Pin</th>
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
                users.map(u => {
                  const isPinned = (u.displayPriority || 0) > 0;
                  return (
                    <tr key={u._id} className={`border-b hover:bg-blue-50 transition ${isPinned ? 'bg-yellow-50' : u.isPremium ? 'bg-green-50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        <div className="flex items-center gap-2">
                          {isPinned && <span className="text-yellow-500" title="Pinned to top">📌</span>}
                          {u.isPremium && !isPinned && <span className="text-green-600" title="Premium User">⭐</span>}
                          {u.name}
                        </div>
                      </td>
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
                      <td className="px-4 py-3 text-gray-600 text-sm">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <button
                            onClick={() => togglePinUser(u._id, u.displayPriority)}
                            className={`p-2 rounded-lg transition ${
                              isPinned 
                                ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                            title={isPinned ? 'Unpin from top' : 'Pin to top'}
                          >
                            <MdPushPin className={isPinned ? 'rotate-0' : 'rotate-45'} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => viewProfile(u._id)}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            title="View Profile"
                          >
                            <MdVisibility />
                          </button>
                          {u.status === 'pending' && (
                            <button
                              onClick={() => onApprove(u._id)}
                              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                              title="Approve"
                            >
                              <MdCheckCircle />
                            </button>
                          )}
                          <button
                            onClick={() => onDelete(u)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            title="Delete"
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    {/* Confirm Delete Modal */}
    {confirmOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="bg-white rounded-xl shadow-2xl w-[92%] max-w-md overflow-hidden border" style={{ borderColor: '#D4AF37' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#D4AF37' }}>
            <h3 className="text-lg font-semibold" style={{ color: '#B8860B' }}>Confirm Deletion</h3>
          </div>
          <div className="px-5 py-4 text-sm text-gray-700">
            Are you sure you want to delete
            {' '}<span className="font-semibold">{deletingUser?.name || 'this user'}</span>? This action cannot be undone.
          </div>
          <div className="px-5 py-4 flex items-center justify-end gap-3 border-t" style={{ borderColor: '#D4AF37' }}>
            <button
              onClick={cancelDelete}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: '#F5F5DC', color: '#B8860B', border: '1px solid #D4AF37' }}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 rounded-lg text-white text-sm"
              style={{ backgroundColor: '#B8860B' }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
