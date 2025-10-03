import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getFriends } from '../services/userService.js'
import NotificationDropdown from './NotificationDropdown.jsx'
import { MdMessage, MdMenu, MdClose } from 'react-icons/md'

export default function Navbar(){
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  if (!user || user.status === 'pending') return null
  
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
      // Refresh every 10 seconds
      const interval = setInterval(loadUnreadCount, 10000)
      // Listen for on-demand refresh from ChatPage after markAsSeen
      const handler = () => loadUnreadCount()
      window.addEventListener('unread:update', handler)
      return () => {
        clearInterval(interval)
        window.removeEventListener('unread:update', handler)
      }
    }
  }, [user])
  
  return (
    <nav className="bg-premium-gradient text-white shadow-xl relative z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to='/dashboard' className="font-bold text-2xl hover:text-amber-300 transition-all duration-300 transform hover:scale-105">
            <span className="text-amber-400">M</span> Nikah
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8 items-center">
            {!user.isAdmin && (
              <Link to='/dashboard' className="hover:text-amber-300 transition-all duration-300 font-medium transform hover:scale-105">
                Discover
              </Link>
            )}
            <Link to={`/profile/${user.id}`} className="hover:text-amber-300 transition-all duration-300 font-medium transform hover:scale-105">
              Profile
            </Link>
            <Link to='/blocked-users' className="hover:text-amber-300 transition-all duration-300 font-medium transform hover:scale-105">
              Blocked
            </Link>
            {user.isAdmin && (
              <Link to='/admin' className="hover:text-amber-300 transition-all duration-300 font-medium transform hover:scale-105">
                Admin Panel
              </Link>
            )}
            {!user.isAdmin && (
              <Link to='/premium' className="bg-gold-gradient text-blue-900 px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                Premium
              </Link>
            )}
            
            {/* Message Notification */}
            {!user.isAdmin && unreadCount > 0 && (
              <Link to='/dashboard?tab=messages' className="relative p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all duration-300" title="Messages">
                <MdMessage className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center font-bold animate-pulse-glow">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </Link>
            )}
            
            {/* Notification Bell */}
            <NotificationDropdown key={refreshKey} onUpdate={handleNotificationUpdate} />
            
            <button 
              onClick={handleLogout} 
              className="bg-white text-blue-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-300"
          >
            {isMobileMenuOpen ? <MdClose className="w-6 h-6" /> : <MdMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-blue-900 shadow-2xl animate-slide-down z-40">
            <div className="px-4 py-6 space-y-4">
              {!user.isAdmin && (
                <Link 
                  to='/dashboard' 
                  className="block py-3 px-4 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-300 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Discover
                </Link>
              )}
              <Link 
                to={`/profile/${user.id}`} 
                className="block py-3 px-4 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-300 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <Link 
                to='/blocked-users' 
                className="block py-3 px-4 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-300 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Blocked Users
              </Link>
              {user.isAdmin && (
                <Link 
                  to='/admin' 
                  className="block py-3 px-4 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-300 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              {!user.isAdmin && (
                <Link 
                  to='/premium' 
                  className="block bg-gold-gradient text-blue-900 py-3 px-4 rounded-lg font-semibold text-center transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Premium
                </Link>
              )}
              
              {/* Mobile Messages Link */}
              {!user.isAdmin && unreadCount > 0 && (
                <Link 
                  to='/dashboard?tab=messages' 
                  className="flex items-center justify-between py-3 px-4 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-300 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>Messages</span>
                  <span className="bg-pink-500 text-white text-xs rounded-full min-w-[20px] h-5 px-2 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </Link>
              )}
              
              <button 
                onClick={() => {
                  handleLogout()
                  setIsMobileMenuOpen(false)
                }} 
                className="w-full bg-white text-blue-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
