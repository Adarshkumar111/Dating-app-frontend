import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getFriends } from '../services/userService.js'
import NotificationDropdown from './NotificationDropdown.jsx'
import { MdMessage } from 'react-icons/md'

export default function Navbar(){
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  
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
    <nav className="bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to='/dashboard' className="font-bold text-xl hover:text-pink-100 transition-colors">
          M Nikah
        </Link>
        <div className="flex gap-6 items-center">
          {!user.isAdmin && <Link to='/dashboard' className="hover:text-pink-100 transition-colors">Discover</Link>}
          <Link to={`/profile/${user.id}`} className="hover:text-pink-100 transition-colors">Profile</Link>
          {user.isAdmin && <Link to='/admin' className="hover:text-pink-100 transition-colors">Admin Panel</Link>}
          {!user.isAdmin && <Link to='/premium' className="hover:text-pink-100 transition-colors">Premium</Link>}
          
          {/* Message Notification - Instagram Style (show nothing when 0) */}
          {!user.isAdmin && unreadCount > 0 && (
            <Link to='/dashboard?tab=messages' className="relative p-2 hover:bg-pink-600 rounded-full transition" title="Messages">
              <MdMessage className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </Link>
          )}
          
          {/* Notification Bell */}
          <NotificationDropdown key={refreshKey} onUpdate={handleNotificationUpdate} />
          
          <button 
            onClick={handleLogout} 
            className="bg-white text-pink-500 px-4 py-2 rounded-lg font-semibold hover:bg-pink-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
