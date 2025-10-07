import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { listOpposite, rejectUser, getFriends } from '../services/userService.js';
import { getEnabledFilters } from '../services/publicService.js';
import { getAppSettings } from '../services/adminService.js';
import { sendRequest, unfollow, cancelRequest } from '../services/requestService.js';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BsChatDots } from 'react-icons/bs';

export default function DashboardPage() {
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [friendsSearch, setFriendsSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'messages' ? 'friends' : 'dashboard';
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  // inline info banner removed; use toast instead
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [profileDisplay, setProfileDisplay] = useState({});

  // Helper: whether a field is enabled by admin (defaults to true if not configured)
  const showField = (key) => {
    if (!profileDisplay || Object.keys(profileDisplay).length === 0) return true;
    return !!profileDisplay[key];
  };

  // Filters state
  const [enabledFilters, setEnabledFilters] = useState({ age: true, education: true, occupation: true, nameSearch: true });
  const [filters, setFilters] = useState({ page: 1, ageMin: '', ageMax: '', education: '', occupation: '', name: '' });
  const [searchDebounce, setSearchDebounce] = useState(null);

  // Debounce search to reduce API calls
  useEffect(() => {
    if (searchDebounce) clearTimeout(searchDebounce);
    const timer = setTimeout(() => {
      if (tab === 'dashboard' && filters.name) {
        loadUsers();
      }
    }, 500);
    setSearchDebounce(timer);
    return () => clearTimeout(timer);
  }, [filters.name]);

  const loadUsers = async () => {
    const query = { page: filters.page };
    if (filters.ageMin) query.ageMin = filters.ageMin;
    if (filters.ageMax) query.ageMax = filters.ageMax;
    if (filters.education) query.education = filters.education;
    if (filters.occupation) query.occupation = filters.occupation;
    if (filters.name) query.name = filters.name;
    const res = await listOpposite(query);
    setUsers(res.items || []);
    setLoading(false);
  };

  const loadFriends = async () => {
    try {
      const data = await getFriends();
      setFriends(data.friends || []);
      const total = (data.friends || []).reduce((sum, f) => sum + (Number(f.unreadCount) || 0), 0);
      setUnreadTotal(total);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'dashboard') {
      loadUsers();
    } else {
      loadFriends();
    }
    
    // Auto-refresh friends every 10 seconds to update unread counts
    const interval = setInterval(() => {
      if (tab === 'friends') loadFriends();
    }, 10000);
    
    // Listen for request status changes to refresh dashboard
    const handleRequestUpdate = () => {
      if (tab === 'dashboard') {
        loadUsers();
      }
    };
    
    window.addEventListener('requestStatusChanged', handleRequestUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('requestStatusChanged', handleRequestUpdate);
    };
  }, [tab]);

  // Recalculate unread total when friends list changes (safety net)
  useEffect(() => {
    const total = (friends || []).reduce((sum, f) => sum + (Number(f.unreadCount) || 0), 0);
    setUnreadTotal(total);
  }, [friends]);

  // Load enabled filters once
  useEffect(() => {
    (async () => {
      try {
        const data = await getEnabledFilters();
        if (data?.enabledFilters) setEnabledFilters(data.enabledFilters);
      } catch (e) {
        // Ignore failure, keep defaults
      }
    })();
  }, []);

  // Load profile display controls once
  useEffect(() => {
    (async () => {
      try {
        const app = await getAppSettings();
        setProfileDisplay(app?.profileDisplayFields || {});
      } catch (_) {}
    })();
  }, []);

  // Keep URL query param in sync with selected tab
  useEffect(() => {
    const qp = tab === 'friends' ? { tab: 'messages' } : {};
    setSearchParams(qp, { replace: true });
  }, [tab, setSearchParams]);

  // React to external changes to query param (e.g., clicking navbar icon)
  useEffect(() => {
    const qpTab = searchParams.get('tab') === 'messages' ? 'friends' : 'dashboard';
    if (qpTab !== tab) setTab(qpTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleFollow = async (id) => {
    try {
      const res = await sendRequest({ toUserId: id, type: 'follow' });
      if (typeof res?.remaining === 'number' && typeof res?.limit === 'number') {
        toast.success(`Request sent. You have ${res.remaining} free request${res.remaining === 1 ? '' : 's'} remaining today.`);
      } else {
        toast.success('Request sent successfully');
      }
      loadUsers();
    } catch (e) {
      if (e.response?.status === 429 && e.response?.data?.needsPremium) {
        // Show message and redirect to premium page if daily limit reached
        toast.warn(`Daily request limit reached (${e.response.data.limit}). Redirecting to Premium...`);
        setTimeout(() => navigate('/premium'), 2000);
        return;
      }
      toast.error(e.response?.data?.message || 'Error sending request');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectUser(id);
      setUsers(users.filter(u => u._id !== id));
      toast.info('Removed from feed');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error');
    }
  };

  const handleUnfollow = async (id) => {
    try {
      await unfollow(id);
      toast.info('Unfollowed');
      loadUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error');
    }
  };

  const handleCancelRequest = async (id) => {
    try {
      await cancelRequest(id);
      toast.info('Request cancelled');
      loadUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error');
    }
  };

  // Friends search is rendered in the Messages tab UI

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
        <p className="text-blue-800 font-medium">Loading...</p>
      </div>
    </div>
  );

  // Filter friends by search input (case-insensitive) when on friends tab or when a search exists
  const filteredFriends = friends.filter(f =>
    !friendsSearch?.trim() || (f.name || '').toLowerCase().includes(friendsSearch.trim().toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{backgroundColor: '#FFF8E7'}}>
      {/* Desktop top background band to match navbar and prevent white gap on scroll */}
      <div
        className="hidden md:block fixed top-0 left-0 right-0"
        style={{ height: '96px', backgroundColor: '#FFF8E7', zIndex: 5 }}
        aria-hidden="true"
      />
      <div className="max-w-6xl mx-auto px-4 py-6 md:pb-0 md:h-[calc(100vh-96px)] md:flex md:flex-col">
        {/* Fixed header section on desktop */}
        <div
          className="md:sticky md:z-20 mt-20 md:pb-4"
          style={{ position: 'sticky', top: '96px', backgroundColor: '#FFF8E7' }}
        >
          {/* Header (only on dashboard tab) - hidden on mobile */}
          {tab === 'dashboard' && (
            <>
              <div className="text-center mb-4 hidden md:block">
                <h1 className="text-3xl font-bold mb-2" style={{color: '#B8860B'}}>Welcome to M Nikah</h1>
                <p className="text-gray-600">Find your perfect match</p>
              </div>
              {/* Spacer to prevent subtle layout shift under sticky header on desktop */}
              <div className="hidden md:block h-2"></div>
            </>
          )}

          {/* Tabs - hidden on mobile, shown on desktop */}
          <div className="hidden md:flex justify-center gap-3 mb-8 relative">
          <button
            onClick={() => setTab('dashboard')}
            className="px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl"
            style={{
              backgroundColor: tab === 'dashboard' ? '#B8860B' : 'white',
              color: tab === 'dashboard' ? 'white' : '#B8860B',
              border: tab === 'dashboard' ? 'none' : '2px solid #D4AF37'
            }}
          >
             Dashboard
          </button>
          <button
            onClick={() => setTab('friends')}
            className="relative px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl"
            style={{
              backgroundColor: tab === 'friends' ? '#B8860B' : 'white',
              color: tab === 'friends' ? 'white' : '#B8860B',
              border: tab === 'friends' ? 'none' : '2px solid #D4AF37'
            }}
            aria-label="Messages"
          >
             Messages
            {unreadTotal > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                {unreadTotal > 5 ? '5+' : unreadTotal}
              </span>
            )}
          </button>
          {/* Filters button (desktop only, same size as tabs) */}
          {tab === 'dashboard' && (
            <div className="relative">
              <button
                onClick={() => setShowFilters((s) => !s)}
                className="px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
                style={{backgroundColor: 'white', color: '#B8860B', border: '2px solid #D4AF37'}}
                aria-label="Filters"
              >
                Filters
              </button>
              {showFilters && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                  <div className="absolute right-0 mt-2 w-[min(90vw,520px)] bg-white rounded-xl shadow-md p-2 z-50" style={{border: '2px solid #D4AF37'}}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {enabledFilters.age && (
                        <div className="flex items-center gap-2">
                          <input type="number" placeholder="Age min" value={filters.ageMin} onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })} className="w-full px-2.5 py-1.5 rounded-lg text-sm" style={{border: '2px solid #D4AF37'}} />
                          <span className="text-gray-500">-</span>
                          <input type="number" placeholder="Age max" value={filters.ageMax} onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })} className="w-full px-2.5 py-1.5 rounded-lg text-sm" style={{border: '2px solid #D4AF37'}} />
                        </div>
                      )}
                      {enabledFilters.education && (
                        <input type="text" placeholder="Education" value={filters.education} onChange={(e) => setFilters({ ...filters, education: e.target.value })} className="w-full px-2.5 py-1.5 rounded-lg text-sm" style={{border: '2px solid #D4AF37'}} />
                      )}
                      {enabledFilters.occupation && (
                        <input type="text" placeholder="Occupation" value={filters.occupation} onChange={(e) => setFilters({ ...filters, occupation: e.target.value })} className="w-full px-2.5 py-1.5 rounded-lg text-sm" style={{border: '2px solid #D4AF37'}} />
                      )}
                    </div>
                    <div className="mt-2 flex gap-2 justify-end">
                      <button onClick={() => { setShowFilters(false); loadUsers(); }} className="px-3 py-1.5 text-white rounded-lg text-sm" style={{backgroundColor: '#B8860B'}}>Apply</button>
                      <button onClick={() => { setFilters({ page: 1, ageMin: '', ageMax: '', education: '', occupation: '', name: '' }); setShowFilters(false); setLoading(true); loadUsers(); }} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">Reset</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile-only compact filters (fixed under search) */}
        <div
          className="md:hidden flex justify-center gap-3 mt-3"
          style={{ position: 'fixed', top: '140px', left: 0, right: 0, backgroundColor: '#FFF8E7', zIndex: 25, padding: '0 16px' }}
        >
          {tab === 'dashboard' && (
            <div className="relative">
              <button
                onClick={() => setShowFilters((s) => !s)}
                className="px-3 py-2 rounded-xl font-semibold shadow text-sm"
                style={{backgroundColor: 'white', color: '#B8860B', border: '2px solid #D4AF37'}}
                aria-label="Filters"
              >
                Filters
              </button>
              {showFilters && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[85vw] max-w-sm bg-white rounded-xl shadow-md p-3 z-50" style={{border: '2px solid #D4AF37'}}>
                    <div className="grid grid-cols-1 gap-2">
                      {enabledFilters.age && (
                        <div className="flex items-center gap-2">
                          <input type="number" placeholder="Age min" value={filters.ageMin} onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })} className="w-full px-2.5 py-1.5 rounded-lg text-sm" style={{border: '2px solid #D4AF37'}} />
                          <span className="text-gray-500">-</span>
                          <input type="number" placeholder="Age max" value={filters.ageMax} onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })} className="w-full px-2.5 py-1.5 rounded-lg text-sm" style={{border: '2px solid #D4AF37'}} />
                        </div>
                      )}
                      {enabledFilters.education && (
                        <input type="text" placeholder="Education" value={filters.education} onChange={(e) => setFilters({ ...filters, education: e.target.value })} className="w-full px-2.5 py-1.5 rounded-lg text-sm" style={{border: '2px solid #D4AF37'}} />
                      )}
                      {enabledFilters.occupation && (
                        <input type="text" placeholder="Occupation" value={filters.occupation} onChange={(e) => setFilters({ ...filters, occupation: e.target.value })} className="w-full px-2.5 py-1.5 rounded-lg text-sm" style={{border: '2px solid #D4AF37'}} />
                      )}
                    </div>
                    <div className="mt-2 flex gap-2 justify-end">
                      <button onClick={() => { setShowFilters(false); loadUsers(); }} className="px-3 py-1.5 text-white rounded-lg text-sm" style={{backgroundColor: '#B8860B'}}>Apply</button>
                      <button onClick={() => { setFilters({ page: 1, ageMin: '', ageMax: '', education: '', occupation: '', name: '' }); setShowFilters(false); setLoading(true); loadUsers(); }} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">Reset</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

          {/* Dashboard Search (below tabs) */}
          {tab === 'dashboard' && (
            <div
              className="fixed md:static top-[86px] md:top-auto left-0 right-0 md:left-auto md:right-auto z-30 px-4 md:px-0 pb-2 md:pb-0 mb-0 md:mb-4"
              style={{ backgroundColor: '#FFF8E7' }}
            >
              <div className="relative">
                <div className="flex items-center bg-white rounded-xl shadow-sm px-3 py-1" style={{border: '2px solid #D4AF37'}}>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={filters.name}
                    onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                    className="flex-1 outline-none text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadUsers}
                      className="px-3 py-1.5 text-white rounded-lg text-sm"
                      style={{backgroundColor: '#B8860B'}}
                      aria-label="Search"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Inline info banner removed; toasts are used instead */}
        
        {/* Remove external spacer; we will pad the scroll container on mobile */}
        
        {/* dashboard Tab */}
        {tab === 'dashboard' && (
          <div className="overflow-y-auto md:flex-1 md:pr-1 md:pt-0" style={{ height: 'calc(100vh - 180px)', paddingTop: '144px' }}>
            <div className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {users.map(u => (
              <div key={u._id} className="col-span-1 bg-white shadow-md rounded-xl p-4 min-w-0">
                {/* Header: Avatar + Name + view link */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {showField('profilePhoto') && (
                      <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold" style={{backgroundColor: '#B8860B'}}>
                        {u.profilePhoto ? (
                          <img src={u.profilePhoto} alt="profile" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          (showField('name') ? (u.name?.[0]?.toUpperCase() || '?') : '?')
                        )}
                      </div>
                    )}
                    <div>
                      {showField('name') && (
                        <h3 className="font-semibold leading-5" style={{color: '#B8860B'}}>{u.name}</h3>
                      )}
                      {(u.age && showField('age')) || (u.location && showField('location')) ? (
                        <p className="text-xs text-gray-500">
                          {showField('age') && u.age ? `${u.age} yrs` : ''}
                          {showField('age') && showField('location') && u.age && u.location ? ' • ' : ''}
                          {showField('location') && u.location ? u.location : ''}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Link to={`/profile/${u._id}`} className="text-sm font-medium hover:underline" style={{color: '#B8860B'}}>View</Link>
                </div>

                {/* Description */}
                {u.about && showField('about') && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {u.about}
                  </p>
                )}

                {/* Quick facts */}
                {((u.education && showField('education')) || (u.maritalStatus) || (u.occupation && showField('occupation'))) && (
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {u.education && showField('education') && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{backgroundColor: 'white', color: '#B8860B', border: '1px solid #D4AF37'}}>
                        🎓 {u.education}
                      </span>
                    )}
                    {u.occupation && showField('occupation') && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{backgroundColor: 'white', color: '#B8860B', border: '1px solid #D4AF37'}}>
                        💼 {u.occupation}
                      </span>
                    )}
                    {u.maritalStatus && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium capitalize" style={{backgroundColor: 'white', color: '#B8860B', border: '1px solid #D4AF37'}}>
                        💍 {String(u.maritalStatus).replace('_',' ')}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions: simple right aligned primary */}
                <div className="flex items-center justify-end gap-2">
                  {u.requestStatus === 'none' && (
                    <button
                      onClick={() => handleFollow(u._id)}
                      className="px-4 py-2 text-white rounded-lg text-sm"
                      style={{backgroundColor: '#B8860B'}}
                    >
                      Request
                    </button>
                  )}
                  {u.requestStatus === 'pending' && u.requestDirection === 'sent' && (
                    <button
                      onClick={() => handleCancelRequest(u._id)}
                      className="px-4 py-2 rounded-lg text-sm"
                      style={{backgroundColor: 'white', color: '#B8860B', border: '2px solid #D4AF37'}}
                    >
                      Requested (Cancel)
                    </button>
                  )}
                  {u.requestStatus === 'accepted' && (
                    <div className="flex items-center gap-2">
                      <Link to={`/chat/${u._id}`} className="px-4 py-2 text-white rounded-lg text-sm" style={{backgroundColor: '#B8860B'}}>
                        Chat
                      </Link>
                      <button onClick={() => handleUnfollow(u._id)} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                        Unfollow
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            

            
            
            {users.length === 0 && (
              <div className="col-span-full text-center py-20">
                <h3 className="text-xl font-semibold mb-2" style={{color: '#B8860B'}}>No More Profiles</h3>
                <p className="text-gray-500">You've seen all available profiles!</p>
              </div>
            )}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {tab === 'friends' && (
          <div className="overflow-hidden md:flex md:flex-col">
          {friends.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">💬</div>
              <h3 className="text-2xl font-bold mb-3" style={{color: '#B8860B'}}>No Messages Yet</h3>
              <p className="text-gray-600 mb-6">Start following people from the dashboard tab to begin conversations!</p>
              <button
                onClick={() => setTab('dashboard')}
                className="px-6 py-3 text-white font-semibold rounded-lg transition"
                style={{backgroundColor: '#B8860B'}}
              >
                🔍 Start Discovering
              </button>
            </div>
          ) : (
            <>
              {/* Friends-only search bar (matches dashboard search UI) - reduced height */}
              <div className="fixed md:static top-[86px] md:top-auto left-0 right-0 md:left-auto md:right-auto z-30 px-4 md:px-0 pb-2 md:pb-0 mb-0 md:mb-4" style={{ backgroundColor: '#FFF8E7' }}>
                <div className="relative">
                  <div className="flex items-center bg-white rounded-xl shadow-sm px-3 py-1" style={{border: '2px solid #D4AF37'}}>
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={friendsSearch}
                      onChange={(e) => setFriendsSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && null}
                      className="flex-1 outline-none text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { /* same UI as dashboard; filtering already live */ }}
                        className="px-3 py-1.5 text-white rounded-lg text-sm"
                        style={{backgroundColor: '#B8860B'}}
                        aria-label="Search friends"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Remove external spacer; we will pad the messages list container on mobile */}
              {/* Scroll container for messages list only */}
              <div className="overflow-y-auto md:flex-1 md:pt-0" style={{ height: 'calc(100vh - 180px)', paddingTop: '56px' }}>
                <div className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 ">
              {filteredFriends.map((friend) => (
                <div 
                  key={friend._id} 
                  onClick={() => navigate(`/chat/${friend._id}`)}
                  className="col-span-1 overflow-hidden transform transition-all duration-300 cursor-pointer animate-fade-in space-y-4 min-w-0"
                >
                  <div className="p-6 rounded-2xl bg-white hover:bg-gray-100 ">
                    <div className="flex items-center mb-4">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 relative" style={{backgroundColor: '#B8860B'}}>
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
                        <div className="font-bold text-lg truncate mb-1" style={{color: '#B8860B'}}>
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
                      <div className="flex items-center" style={{color: '#B8860B'}}>
                        <BsChatDots className="text-xl mr-2" />
                        <span className="text-sm font-medium">Start Chat</span>
                      </div>
                      {friend.unreadCount > 0 && (
                        <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{backgroundColor: '#F5F5DC', color: '#B8860B'}}>
                          {friend.unreadCount} new message{friend.unreadCount > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  

                  
                      
                  
                  
                </div>
              ))}
            </div>
            </div>
            </>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
