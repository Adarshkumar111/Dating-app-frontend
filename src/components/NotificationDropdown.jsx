import React, { useState, useEffect, useRef } from 'react'
import { getNotifications } from '../services/notificationService.js'
import { respond } from '../services/requestService.js'

export default function NotificationDropdown({ onUpdate }) {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  const loadNotifications = async () => {
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch (e) {
      console.error('Failed to load notifications:', e)
    }
  }

  useEffect(() => {
    loadNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRespond = async (requestId, action) => {
    setLoading(true)
    try {
      await respond({ requestId, action })
      await loadNotifications()
      if (onUpdate) onUpdate()
    } catch (e) {
      console.error('Failed to respond:', e)
    }
    setLoading(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-pink-600 rounded-full transition"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
          </div>
          
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notif) => (
                <div key={notif._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    {notif.from?.profilePhoto ? (
                      <img
                        src={notif.from.profilePhoto}
                        alt={notif.from.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-300 to-purple-400 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {notif.from?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{notif.from?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600 mt-1">{notif.from?.about || 'Sent you a follow request'}</p>
                      
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleRespond(notif._id, 'accept')}
                          disabled={loading}
                          className="flex-1 bg-green-500 text-white text-sm py-1.5 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespond(notif._id, 'reject')}
                          disabled={loading}
                          className="flex-1 bg-red-500 text-white text-sm py-1.5 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
