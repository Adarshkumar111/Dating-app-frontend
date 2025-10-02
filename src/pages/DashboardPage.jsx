import React, { useEffect, useState } from 'react';
import { listOpposite, rejectUser } from '../services/userService.js';
import { sendRequest, unfollow } from '../services/requestService.js';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState('');

  const loadUsers = async () => {
    const res = await listOpposite();
    setUsers(res.items || []);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleFollow = async (id) => {
    try {
      await sendRequest({ toUserId: id, type: 'follow' });
      setInfo('Request sent!');
      loadUsers();
    } catch (e) {
      setInfo(e.response?.data?.message || 'Error');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectUser(id);
      setUsers(users.filter(u => u._id !== id));
      setInfo('Removed from feed');
    } catch (e) {
      setInfo(e.response?.data?.message || 'Error');
    }
  };

  const handleUnfollow = async (id) => {
    try {
      await unfollow(id);
      setInfo('Unfollowed');
      loadUsers();
    } catch (e) {
      setInfo(e.response?.data?.message || 'Error');
    }
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-6 p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Discover</h2>
      {info && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg">{info}</div>
      )}
      
      <div className="space-y-6">
        {users.map(u => (
          <div key={u._id} className="bg-white shadow-md rounded-xl overflow-hidden">
            {/* Profile Image */}
            <div className="h-64 bg-gradient-to-br from-pink-200 to-purple-300 flex items-center justify-center">
              {u.profilePhoto ? (
                <img src={u.profilePhoto} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <div className="text-6xl font-bold text-white">{u.name}</div>
              )}
            </div>
            
            {/* Profile Info */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{u.name}</h3>
                  {u.age && <p className="text-sm text-gray-600">{u.age} • {u.location}</p>}
                  {u.about && <p className="text-sm text-gray-500 mt-1">{u.about.slice(0, 100)}</p>}
                </div>
                <Link
                  to={`/profile/${u._id}`}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  View Profile
                </Link>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                {u.requestStatus === 'none' && (
                  <>
                    <button
                      onClick={() => handleFollow(u._id)}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-orange-600 transition"
                    >
                      Follow
                    </button>
                    <button
                      onClick={() => handleReject(u._id)}
                      className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                      ✕
                    </button>
                  </>
                )}
                
                {u.requestStatus === 'pending' && u.requestDirection === 'sent' && (
                  <button
                    disabled
                    className="flex-1 bg-gray-300 text-gray-600 py-2 rounded-lg font-semibold cursor-not-allowed"
                  >
                    Pending...
                  </button>
                )}
                
                {u.requestStatus === 'accepted' && (
                  <>
                    <Link
                      to={`/chat/${u._id}`}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition text-center"
                    >
                      💬 Chat
                    </Link>
                    <button
                      onClick={() => handleUnfollow(u._id)}
                      className="px-6 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                      Unfollow
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No more profiles to show
          </div>
        )}
      </div>
    </div>
  );
}
