import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdSearch, MdVisibility, MdDelete, MdCheckCircle } from 'react-icons/md';
import { listUsers, approveUser, deleteUser, searchUsers } from '../../services/adminService.js';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [genderFilter, setGenderFilter] = useState('all');
  const [genderCounts, setGenderCounts] = useState({ total: 0, male: 0, female: 0 });

  useEffect(() => {
    loadUsers();
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
      loadUsers();
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

  return (
    <div className="space-y-6">
      {info && (
        <div className="p-4 bg-green-50 text-green-800 rounded-xl border border-green-200 text-center font-medium">
          {info}
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-md p-4">
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
                          onClick={() => onDelete(u._id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          title="Delete"
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
  );
}
