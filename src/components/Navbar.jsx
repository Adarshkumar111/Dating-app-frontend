import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getFriends } from '../services/userService.js'
import { requestHelp, getHelpStatus } from '../services/helpService.js'
import NotificationDropdown from './NotificationDropdown.jsx'
import { MdMessage, MdMenu, MdClose, MdSettings } from 'react-icons/md'
import { connectSocket, disconnectSocket, onSocketEvent } from '../services/socketService.js'
import { toast } from 'react-toastify'

export default function Navbar(){
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [helpStatus, setHelpStatus] = useState({ state: 'none', adminId: null })
  const [helpBusy, setHelpBusy] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  if (!user || user.status === 'pending') return null
  
  const handleLogout = () => {
    logout()
    nav('/login')
  }

  const handleNotificationUpdate = () => {
    setRefreshKey(prev => prev + 1)
  }

  const loadHelpStatus = async () => {
    try {
      const data = await getHelpStatus()
      // Expected: { status: 'none'|'pending'|'approved', adminId?: string }
      if (data?.status) setHelpStatus({ state: data.status, adminId: data.adminId || null })
    } catch (_) {
      // ignore if endpoint not available
    }
  }

  const onHelpClick = async () => {
    if (helpBusy) return
    try {
      setHelpBusy(true)
      // If approved and we know adminId, go to chat
      if (helpStatus.state === 'approved' && helpStatus.adminId) {
        nav(`/chat/${helpStatus.adminId}`)
        return
      }
      await requestHelp()
      setHelpStatus({ state: 'pending', adminId: null })
      // Optionally show a small confirmation
      // alert('Help request sent to admin')
    } catch (e) {
      // alert('Failed to send help request')
    } finally {
      setHelpBusy(false)
    }
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
      loadHelpStatus()
      
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
        loadHelpStatus()
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
  
  return (
    <nav className="fixed top-2 md:top-4 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-2 md:px-4 relative">
        <div className="bg-premium-gradient text-white shadow-xl rounded-2xl relative">
          <div className="px-4 py-3 md:py-4">
            <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to={user.isAdmin ? '/admin' : '/dashboard'} className="font-bold text-2xl hover:text-amber-300 transition-all duration-300 transform hover:scale-105">
            <span className="text-amber-400">M</span> Nikah
          </Link>

          {/* Desktop Menu (minimal + Discover/Premium restored) */}
          <div className="hidden md:flex items-center gap-4">
            {/* Discover */}
            {!user.isAdmin && (
              <Link to='/dashboard' className="hover:text-amber-300 transition-all duration-300 font-medium">
                Discover
              </Link>
            )}

            {/* Premium */}
            {!user.isAdmin && (
              <Link to='/premium' className="bg-gold-gradient text-yellow-400 px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:bg-amber-300 hover:text-black">
                Premium
              </Link>
            )}

            {/* Notification Bell */}
            <NotificationDropdown key={refreshKey} onUpdate={handleNotificationUpdate} />

            {/* Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSettings((s) => !s)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all duration-300"
                aria-label="Settings"
              >
                <MdSettings className="w-6 h-6" />
              </button>
              {showSettings && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                  <div className="absolute right-0 top-10 bg-white text-blue-900 rounded-xl shadow-xl border border-blue-100 min-w-[200px] z-50 overflow-hidden">
                    <button
                      onClick={() => { setShowSettings(false); nav(`/profile/${user.id}`) }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => { setShowSettings(false); nav('/blocked-users') }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50"
                    >
                      Blocked Users
                    </button>
                    {user.isAdmin ? (
                      <button
                        onClick={() => { setShowSettings(false); nav('/admin') }}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50"
                      >
                        Admin Panel
                      </button>
                    ) : (
                      <button
                        onClick={() => { setShowSettings(false); onHelpClick() }}
                        disabled={helpBusy}
                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 ${helpStatus.state === 'approved' ? 'text-green-600' : helpStatus.state === 'pending' ? 'text-amber-600' : ''}`}
                      >
                        {helpStatus.state === 'approved' ? 'Chat Admin' : helpStatus.state === 'pending' ? 'Help Pending' : 'Help'}
                      </button>
                    )}
                    <button
                      onClick={() => { setShowSettings(false); handleLogout() }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50"
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
            className="md:hidden p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-300"
          >
            {isMobileMenuOpen ? <MdClose className="w-6 h-6" /> : <MdMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu (simplified) */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute left-2 right-2 md:left-4 md:right-4 top-[calc(100%+0.25rem)] bg-blue-900 shadow-2xl animate-slide-down z-40 rounded-2xl overflow-hidden">
          <div className="px-4 py-4 space-y-2">
              {/* Discover (mobile) */}
              {!user.isAdmin && (
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); nav('/dashboard') }}
                  className="block w-full text-left py-2 px-4 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-300 font-medium"
                >
                  Discover
                </button>
              )}
              {/* Premium (mobile) */}
              {!user.isAdmin && (
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); nav('/premium') }}
                  className="block w-full text-left py-2 px-4 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-300 font-medium"
                >
                  Premium
                </button>
              )}
              <button 
                onClick={() => { setIsMobileMenuOpen(false); nav(`/profile/${user.id}`) }}
                className="block w-full text-left py-2 px-4 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-300 font-medium"
              >
                Profile
              </button>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); nav('/blocked-users') }}
                className="block w-full text-left py-2 px-4 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-300 font-medium"
              >
                Blocked Users
              </button>
              {user.isAdmin ? (
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); nav('/admin') }} 
                  className="block w-full text-left py-2 px-4 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-300 font-medium"
                >
                  Admin Panel
                </button>
              ) : (
                <button
                  onClick={() => { onHelpClick(); setIsMobileMenuOpen(false) }}
                  disabled={helpBusy}
                  className={`block w-full text-left py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                    helpStatus.state === 'approved' ? 'bg-green-500 text-white hover:bg-green-600' :
                    helpStatus.state === 'pending' ? 'bg-yellow-400 text-blue-900 hover:bg-yellow-500' :
                    'text-white/90 hover:text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  {helpStatus.state === 'approved' ? 'Chat Admin' : helpStatus.state === 'pending' ? 'Help Pending' : 'Help'}
                </button>
              )}
              <button 
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false) }} 
                className="w-full text-left py-2 px-4 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-300 font-medium"
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
