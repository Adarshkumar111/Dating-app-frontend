import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext.jsx'

export default function MessageNotificationBanner() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notification, setNotification] = useState(null)
  const socketRef = React.useRef(null)

  useEffect(() => {
    if (!user) return

    // Connect to Socket.io for global message notifications
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      auth: { token: localStorage.getItem('token') }
    })

    // Listen for incoming messages globally for this user
    socketRef.current.on(`user:${user.id}:newMessage`, (data) => {
      // Only show notification if we're not already in that chat
      const currentPath = window.location.pathname
      const chatPath = `/chat/${data.senderId}`
      
      if (currentPath !== chatPath) {
        setNotification({
          senderId: data.senderId,
          senderName: data.senderName,
          senderPhoto: data.senderPhoto,
          messagePreview: data.messageType === 'text' ? data.text : `Sent a ${data.messageType}`,
          chatId: data.chatId
        })
        
        // Auto-hide after 8 seconds
        setTimeout(() => setNotification(null), 8000)
      }
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [user])

  const handleClick = () => {
    if (notification) {
      navigate(`/chat/${notification.senderId}`)
      setNotification(null)
    }
  }

  const handleClose = (e) => {
    e.stopPropagation()
    setNotification(null)
  }

  if (!notification) return null

  return (
    <div 
      onClick={handleClick}
      className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down cursor-pointer"
    >
      <div className="bg-white rounded-lg shadow-2xl border-2 border-pink-400 p-4 min-w-[350px] max-w-md hover:shadow-3xl transition">
        <div className="flex items-center gap-3">
          {/* Sender Photo */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {notification.senderPhoto ? (
              <img 
                src={notification.senderPhoto} 
                alt={notification.senderName} 
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              notification.senderName[0]?.toUpperCase()
            )}
          </div>
          
          {/* Message Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">{notification.senderName}</span>
              <span className="text-xs text-pink-500 font-medium">● NEW MESSAGE</span>
            </div>
            <p className="text-sm text-gray-600 truncate mt-0.5">
              {notification.messagePreview}
            </p>
            <p className="text-xs text-gray-400 mt-1">Click to open chat</p>
          </div>
          
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold flex-shrink-0"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
