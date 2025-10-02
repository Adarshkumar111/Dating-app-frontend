import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import NotificationDropdown from './NotificationDropdown.jsx'

export default function Navbar(){
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  
  if (!user || user.status === 'pending') return null
  
  const handleLogout = () => {
    logout()
    nav('/login')
  }

  const handleNotificationUpdate = () => {
    setRefreshKey(prev => prev + 1)
  }
  
  return (
    <nav className="bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to='/dashboard' className="font-bold text-xl hover:text-pink-100 transition-colors">
          M Nikah
        </Link>
        <div className="flex gap-6 items-center">
          <Link to='/dashboard' className="hover:text-pink-100 transition-colors">Home</Link>
          <Link to={`/profile/${user.id}`} className="hover:text-pink-100 transition-colors">Profile</Link>
          {user.isAdmin && <Link to='/admin' className="hover:text-pink-100 transition-colors">Admin</Link>}
          <Link to='/premium' className="hover:text-pink-100 transition-colors">Premium</Link>
          
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
