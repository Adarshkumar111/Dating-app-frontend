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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
        <p className="text-blue-800 font-medium">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Welcome to M Nikah</h1>
          <p className="text-gray-600">Discover your perfect match</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setTab('discover')}
            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
              tab === 'discover' 
                ? 'bg-premium-gradient text-white shadow-xl' 
                : 'bg-white text-blue-800 hover:bg-blue-50 shadow-lg border border-blue-200'
            }`}
          >
            🔍 Discover
          </button>
          <button
            onClick={() => setTab('friends')}
            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
              tab === 'friends' 
                ? 'bg-premium-gradient text-white shadow-xl' 
                : 'bg-white text-blue-800 hover:bg-blue-50 shadow-lg border border-blue-200'
            }`}
          >
            💬 Messages
          </button>
        </div>

        {info && (
          <div className={`mb-6 p-4 rounded-xl text-center font-medium ${
            info.includes('limit reached') || info.includes('Redirecting') 
              ? 'bg-amber-50 text-amber-800 border border-amber-200' 
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {info}
          </div>
        )}
        
        {/* Discover Tab */}
        {tab === 'discover' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(u => (
              <div key={u._id} className="bg-white shadow-xl rounded-2xl overflow-hidden transform hover:scale-105 transition-all duration-300 animate-fade-in">
                {/* Profile Image */}
                <div className="h-64 bg-premium-gradient flex items-center justify-center relative">
                  {u.profilePhoto ? (
                    <img src={u.profilePhoto} alt="profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-6xl font-bold text-white">{u.name?.[0]?.toUpperCase() || '?'}</div>
                  )}
                  <div className="absolute top-4 right-4">
                    <Link
                      to={`/profile/${u._id}`}
                      className="bg-white bg-opacity-90 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold hover:bg-opacity-100 transition-all duration-300"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
                
                {/* Profile Info */}
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-blue-800">{u.name}</h3>
                      {u.isPremium && (
                        <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-xs font-semibold">
                          ⭐ Premium
                        </span>
                      )}
                    </div>
                    {u.age && <p className="text-sm text-gray-600 mb-2">{u.age} years • {u.location}</p>}
                    {u.about && <p className="text-sm text-gray-500 line-clamp-2">{u.about}</p>}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {u.requestStatus === 'none' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFollow(u._id)}
                          className="flex-1 btn-accent"
                        >
                          💝 Follow
                        </button>
                        <button
                          onClick={() => handleReject(u._id)}
                          className="px-4 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all duration-300"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    
                    {u.requestStatus === 'pending' && u.requestDirection === 'sent' && (
                      <button
                        onClick={() => handleCancelRequest(u._id)}
                        className="w-full bg-amber-100 text-amber-800 py-3 rounded-lg font-semibold hover:bg-amber-200 transition-all duration-300 border border-amber-300"
                      >
                        ⏳ Request Sent (Cancel)
                      </button>
                    )}
                    
                    {u.requestStatus === 'accepted' && (
                      <div className="flex gap-2">
                        <Link
                          to={`/chat/${u._id}`}
                          className="flex-1 btn-primary text-center"
                        >
                          💬 Chat
                        </Link>
                        <button
                          onClick={() => handleUnfollow(u._id)}
                          className="px-4 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all duration-300"
                        >
                          Unfollow
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {users.length === 0 && (
              <div className="col-span-full text-center py-20">
                <div className="text-6xl mb-4">💝</div>
                <h3 className="text-xl font-semibold text-blue-800 mb-2">No More Profiles</h3>
                <p className="text-gray-500">You've seen all available profiles!</p>
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {tab === 'friends' && (
          friends.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">💬</div>
              <h3 className="text-2xl font-bold text-blue-800 mb-3">No Messages Yet</h3>
              <p className="text-gray-600 mb-6">Start following people from the Discover tab to begin conversations!</p>
              <button
                onClick={() => setTab('discover')}
                className="btn-accent"
              >
                🔍 Start Discovering
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {friends.map((friend) => (
                <div 
                  key={friend._id} 
                  onClick={() => navigate(`/chat/${friend._id}`)}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer animate-fade-in"
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-premium-gradient flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 relative">
                        {friend.profilePhoto ? (
                          <img 
                            src={friend.profilePhoto} 
                            alt={friend.name} 
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          friend.name?.[0]?.toUpperCase() || '?'
                        )}
                        {friend.unreadCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center animate-pulse-glow">
                            {friend.unreadCount > 9 ? '9+' : friend.unreadCount}
                          </span>
                        )}
                      </div>

                      <div className="ml-4 flex-1 min-w-0">
                        <div className="font-bold text-lg text-blue-800 truncate mb-1">
                          {friend.name}
                        </div>
                        {friend.age && friend.location && (
                          <p className="text-sm text-gray-600 mb-1">{friend.age} years • {friend.location}</p>
                        )}
                        {friend.about && (
                          <p className="text-sm text-gray-500 truncate">{friend.about}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-blue-600">
                        <BsChatDots className="text-xl mr-2" />
                        <span className="text-sm font-medium">Start Chat</span>
                      </div>
                      {friend.unreadCount > 0 && (
                        <div className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-semibold">
                          {friend.unreadCount} new message{friend.unreadCount > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
