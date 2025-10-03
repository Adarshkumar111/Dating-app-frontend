import React, { useEffect, useState } from 'react';
import { listOpposite, rejectUser, getFriends } from '../services/userService.js';
import { sendRequest, unfollow, cancelRequest } from '../services/requestService.js';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BsChatDots } from 'react-icons/bs';

export default function DashboardPage() {
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'messages' ? 'friends' : 'discover';
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState('');
  const navigate = useNavigate();

  const loadUsers = async () => {
    const res = await listOpposite();
    setUsers(res.items || []);
    setLoading(false);
  };

  const loadFriends = async () => {
    try {
      const data = await getFriends();
      setFriends(data.friends || []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'discover') {
      loadUsers();
    } else {
      loadFriends();
    }
    
    // Auto-refresh friends every 10 seconds to update unread counts
    const interval = setInterval(() => {
      if (tab === 'friends') loadFriends();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [tab]);

  // Keep URL query param in sync with selected tab
  useEffect(() => {
    const qp = tab === 'friends' ? { tab: 'messages' } : {};
    setSearchParams(qp, { replace: true });
  }, [tab, setSearchParams]);

  // React to external changes to query param (e.g., clicking navbar icon)
  useEffect(() => {
    const qpTab = searchParams.get('tab') === 'messages' ? 'friends' : 'discover';
    if (qpTab !== tab) setTab(qpTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleFollow = async (id) => {
    try {
      await sendRequest({ toUserId: id, type: 'follow' });
      setInfo('Request sent!');
      loadUsers();
    } catch (e) {
      if (e.response?.status === 429 && e.response?.data?.needsPremium) {
        // Show message and redirect to premium page if daily limit reached
        setInfo(`Daily request limit reached (${e.response.data.limit} requests). Redirecting to Premium...`);
        setTimeout(() => navigate('/premium'), 2000);
        return;
      }
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

  const handleCancelRequest = async (id) => {
    try {
      await cancelRequest(id);
      setInfo('Request cancelled');
      loadUsers();
    } catch (e) {
      setInfo(e.response?.data?.message || 'Error');
    }
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto mt-6 p-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('discover')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            tab === 'discover' ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Discover
        </button>
        <button
          onClick={() => setTab('friends')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            tab === 'friends' ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Messages
        </button>
      </div>

      {info && (
        <div className={`mb-4 p-3 rounded-lg ${
          info.includes('limit reached') || info.includes('Redirecting') 
            ? 'bg-orange-50 text-orange-700 border border-orange-200' 
            : 'bg-blue-50 text-blue-700'
        }`}>
          {info}
        </div>
      )}
      
      {/* Discover Tab */}
      {tab === 'discover' && (
      <div className="space-y-6">
        {users.map(u => (
          <div key={u._id} className="bg-white shadow-md rounded-xl overflow-hidden">
            {/* Profile Image */}
            <div className="h-64 bg-gradient-to-br from-pink-200 to-purple-300 flex items-center justify-center">
              {u.profilePhoto ? (
                <img src={u.profilePhoto} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <div className="text-6xl font-bold text-white">{u.name?.[0]?.toUpperCase() || '?'}</div>
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
                    onClick={() => handleCancelRequest(u._id)}
                    className="flex-1 bg-yellow-100 text-yellow-700 py-2 rounded-lg font-semibold hover:bg-yellow-200 transition border border-yellow-300"
                  >
                    ⏳ Pending (Click to Cancel)
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
      )}

      {/* Messages Tab */}
      {tab === 'friends' && (
        friends.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Messages Yet</h3>
            <p className="text-gray-500">Start following people from the Discover tab!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map((friend) => (
              <div 
                key={friend._id} 
                onClick={() => navigate(`/chat/${friend._id}`)}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
              >
                <div className="flex items-center p-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                    {friend.profilePhoto ? (
                      <img 
                        src={friend.profilePhoto} 
                        alt={friend.name} 
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      friend.name?.[0]?.toUpperCase() || '?'
                    )}
                  </div>

                  <div className="ml-4 flex-1 min-w-0">
                    <div className="font-bold text-lg text-gray-900 truncate">
                      {friend.name}
                    </div>
                    {friend.age && friend.location && (
                      <p className="text-sm text-gray-600">{friend.age} • {friend.location}</p>
                    )}
                    {friend.about && (
                      <p className="text-sm text-gray-500 truncate mt-1">{friend.about}</p>
                    )}
                  </div>

                  <div className="ml-4 relative">
                    <BsChatDots className="text-3xl text-blue-500" />
                    {friend.unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                        {friend.unreadCount > 9 ? '9+' : friend.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
