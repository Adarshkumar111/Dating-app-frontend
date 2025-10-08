import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getFriends } from '../services/userService.js'
import NotificationDropdown from './NotificationDropdown.jsx'
import HelpDropdown from './HelpDropdown.jsx'
import { MdMessage, MdMenu, MdClose, MdSettings } from 'react-icons/md'
import { connectSocket, disconnectSocket, onSocketEvent } from '../services/socketService.js'
import { toast } from 'react-toastify'

export default function Navbar(){
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  const handleLogout = () => {
    logout()
    nav('/login')
  }

  const handleNotificationUpdate = () => {
    setRefreshKey(prev => prev + 1)
  }

  const loadUnreadCount = async () => {
    if (!user.isAdmin) {
      try {
        const data = await getFriends()
        const total = data.friends.reduce((sum, friend) => sum + friend.unreadCount, 0)
        setUnreadCount(total)
      } catch (e) {
        console.error('Failed to load unread count:', e)
      }
    }
  }

  useEffect(() => {
    if (user && !user.isAdmin) {
      loadUnreadCount()
      
      // Connect socket for real-time updates
      connectSocket(user.id)
      
      // Listen for new messages
      const unsubMessage = onSocketEvent('newMessage', () => {
        loadUnreadCount()
      })
      
      // Listen for profile approval/rejection notifications
      const unsubUserEvent = onSocketEvent('userEvent', (payload) => {
        if (payload?.kind === 'profile:approved') {
          toast.success('✅ Great news! Admin approved your profile changes!', {
            position: 'top-center',
            autoClose: 5000,
            hideProgressBar: false
          })
          // Refresh user data to show updated profile
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        } else if (payload?.kind === 'profile:rejected') {
          const reason = payload.reason ? ` Reason: ${payload.reason}` : ''
          toast.error(`❌ Your profile changes were rejected by admin.${reason}`, {
            position: 'top-center',
            autoClose: 6000,
            hideProgressBar: false
          })
        }
      })
      
      // Refresh every 60 seconds as fallback
      const interval = setInterval(() => {
        loadUnreadCount()
      }, 60000)
      
      // Listen for on-demand refresh from ChatPage after markAsSeen
      const handler = () => loadUnreadCount()
      window.addEventListener('unread:update', handler)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('unread:update', handler)
        unsubMessage()
        unsubUserEvent()
        disconnectSocket()
      }
    }
  }, [user])
  
  if (!user || user.status === 'pending') return null
  
  return (
    <nav className="fixed top-2 md:top-4 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-2 md:px-4 relative ">
        <div className="shadow-xl rounded-2xl relative" style={{backgroundColor: '#F5F5DC'}}>
          <div className="px-4 py-3 md:py-4">
            <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to={user.isAdmin ? '/admin' : '/dashboard'} className="font-bold text-2xl hover:opacity-90 transition-all duration-300 transform hover:scale-105 " style={{color: '#B8860B'}}>
            <span style={{color: '#B8860B'}}>M</span> Nikah
          </Link>

          {/* Desktop Menu (minimal + Discover/Premium restored) */}
          <div className="hidden md:flex items-center gap-4">
            {/* Discover */}
            {!user.isAdmin && (
              <Link to='/dashboard' className="hover:opacity-80 transition-all duration-300 font-medium" style={{color: '#B8860B'}}>
                Discover
              </Link>
            )}

            {/* Premium */}
            {!user.isAdmin && (
              <Link to='/premium' className="px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 border-2" style={{backgroundColor: '#DAA520', color: '#2C2C2C', borderColor: '#B8860B'}}>
                Premium
              </Link>
            )}

            {/* Notification Bell */}
            <NotificationDropdown key={refreshKey} onUpdate={handleNotificationUpdate} />

            {/* Help Dropdown - Only for non-admin users */}
            {!user.isAdmin && <HelpDropdown />}

            {/* Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSettings((s) => !s)}
                className="p-2 hover:bg-black hover:bg-opacity-10 rounded-full transition-all duration-300"
                aria-label="Settings"
                style={{color: '#B8860B'}}
              >
                <MdSettings className="w-6 h-6" />
              </button>
              {showSettings && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                  <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border min-w-[200px] z-50 overflow-hidden" style={{borderColor: '#D4AF37', color: '#2C2C2C'}}>
                    <button
                      onClick={() => { setShowSettings(false); nav(`/profile/${user.id}`) }}
                      className="w-full text-left px-4 py-3 hover:bg-opacity-10 transition"
                      style={{hover: {backgroundColor: '#F5F5DC'}}}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5DC'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => { setShowSettings(false); nav('/blocked-users') }}
                      className="w-full text-left px-4 py-3 transition"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5DC'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Blocked Users
                    </button>
                    {user.isAdmin && (
                      <button
                        onClick={() => { setShowSettings(false); nav('/admin') }}
                        className="w-full text-left px-4 py-3 transition"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5DC'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        Admin Panel
                      </button>
                    )}
                    <button
                      onClick={() => { setShowSettings(false); handleLogout() }}
                      className="w-full text-left px-4 py-3 transition"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5DC'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-black hover:bg-opacity-10 rounded-lg transition-all duration-300"
            style={{color: '#B8860B'}}
          >
            {isMobileMenuOpen ? <MdClose className="w-6 h-6" /> : <MdMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu (simplified) */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute left-2 right-2 md:left-4 md:right-4 top-[calc(100%+0.25rem)] shadow-2xl animate-slide-down z-40 rounded-2xl overflow-hidden" style={{backgroundColor: '#F5F5DC'}}>
          <div className="px-4 py-4 space-y-2">
              {/* Discover (mobile) */}
              {!user.isAdmin && (
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); nav('/dashboard') }}
                  className="block w-full text-left py-2 px-4 rounded-lg transition-all duration-300 font-medium"
                  style={{
                    color: window.location.pathname === '/dashboard' ? '#B8860B' : '#2C2C2C',
                    backgroundColor: window.location.pathname === '/dashboard' ? '#F5F5DC' : 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5DC'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = window.location.pathname === '/dashboard' ? '#F5F5DC' : 'transparent'}
                >
                  Discover
                </button>
              )}
              {/* Premium (mobile) */}
              {!user.isAdmin && (
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); nav('/premium') }}
                  className="block w-full text-left py-2 px-4 rounded-lg transition-all duration-300 font-medium"
                  style={{
                    color: window.location.pathname === '/premium' ? '#B8860B' : '#2C2C2C',
                    backgroundColor: window.location.pathname === '/premium' ? '#F5F5DC' : 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5DC'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = window.location.pathname === '/premium' ? '#F5F5DC' : 'transparent'}
                >
                  Premium
                </button>
              )}
              <button 
                onClick={() => { setIsMobileMenuOpen(false); nav(`/profile/${user.id}`) }}
                className="block w-full text-left py-2 px-4 rounded-lg transition-all duration-300 font-medium"
                style={{
                  color: window.location.pathname.startsWith('/profile/') ? '#B8860B' : '#2C2C2C',
                  backgroundColor: window.location.pathname.startsWith('/profile/') ? '#F5F5DC' : 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5DC'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = window.location.pathname.startsWith('/profile/') ? '#F5F5DC' : 'transparent'}
              >
                Profile
              </button>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); nav('/blocked-users') }}
                className="block w-full text-left py-2 px-4 rounded-lg transition-all duration-300 font-medium"
                style={{
                  color: window.location.pathname === '/blocked-users' ? '#B8860B' : '#2C2C2C',
                  backgroundColor: window.location.pathname === '/blocked-users' ? '#F5F5DC' : 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5DC'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = window.location.pathname === '/blocked-users' ? '#F5F5DC' : 'transparent'}
              >
                Blocked Users
              </button>
              {user.isAdmin && (
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); nav('/admin') }} 
                  className="block w-full text-left py-2 px-4 rounded-lg transition-all duration-300 font-medium"
                  style={{
                    color: window.location.pathname === '/admin' ? '#B8860B' : '#2C2C2C',
                    backgroundColor: window.location.pathname === '/admin' ? '#F5F5DC' : 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5DC'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = window.location.pathname === '/admin' ? '#F5F5DC' : 'transparent'}
                >
                  Admin Panel
                </button>
              )}
              <button 
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false) }} 
                className="w-full text-left py-2 px-4 rounded-lg transition-all duration-300 font-medium"
                style={{color: '#2C2C2C'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5DC'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Logout
              </button>
          </div>
        </div>
      )}
        </div>
      </div>
    </nav>
  )
}
