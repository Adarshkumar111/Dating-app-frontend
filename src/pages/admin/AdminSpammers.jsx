import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdWarning, MdVisibility, MdDelete } from 'react-icons/md';
import { getSpammers, deleteUser } from '../../services/adminService.js';

export default function AdminSpammers() {
  const navigate = useNavigate();
  const [spammers, setSpammers] = useState([]);
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSpammers();
  }, []);

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

  const onDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(userId);
      setInfo('User deleted successfully');
      loadSpammers();
    } catch (e) {
      setInfo('Failed to delete user: ' + (e.response?.data?.message || e.message));
    }
  };

  const viewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {info && (
        <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-lg border border-green-200">{info}</div>
      )}

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
                  >
                    <MdVisibility /> View
                  </button>
                  <button
                    onClick={() => onDelete(user._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
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
  );
}
