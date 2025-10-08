import React, { useState, useEffect, useRef } from 'react'
import { getNotifications, markAsRead } from '../services/notificationService.js'
import { respondToRequest } from '../services/requestService.js'
import { respondHelpRequest } from '../services/helpService.js'
import { getPendingProfileEdits, approveProfileEditApi, rejectProfileEditApi } from '../services/adminService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { connectSocket, onSocketEvent } from '../services/socketService.js'

export default function NotificationDropdown({ onUpdate, isMobileSheet }) {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)
  const socketRef = useRef(null)
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const getStorageKey = () => `admin:dismissed:notifs:${user?.id || 'anon'}`

  const dismissNotif = async (id, notifKind) => {
    setNotifications((prev) => prev.filter(n => n._id !== id))
    setUnreadCount((c) => Math.max(0, c - 1))
    try {
      // For system notifications, mark as read in database
      if (notifKind === 'system') {
        await markAsRead(null, id)
      }
      // For admin dismissed non-edit items, use localStorage
      if (user?.isAdmin && notifKind !== 'system') {
        const raw = localStorage.getItem(getStorageKey())
        const setIds = new Set(raw ? JSON.parse(raw) : [])
        setIds.add(id)
        localStorage.setItem(getStorageKey(), JSON.stringify(Array.from(setIds)))
      }
    } catch (err) {
      console.error('Failed to dismiss notification:', err)
    }
  }

  const loadNotifications = async () => {
    try {
      if (user?.isAdmin) {
        // Admin: merge pending requests + pending profile edits
        const [requests, edits] = await Promise.all([
          getNotifications(),
          getPendingProfileEdits()
        ])
        const normalizedEdits = (edits || []).map(e => ({
          _id: e._id,
          type: 'admin_edit',
          from: { name: e.name, profilePhoto: e.profilePhoto },
          to: { name: e.name },
          updatedAt: e.updatedAt
        }))
        const normalizedReqs = (requests || []).map(r => ({
          _id: r._id,
          type: r.type,
          from: r.from,
          to: r.to,
          updatedAt: r.createdAt
        }))
        let merged = [...normalizedEdits, ...normalizedReqs].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        // Filter out admin-dismissed non-edit items so they don't reappear
        try {
          const raw = localStorage.getItem(getStorageKey())
          const dismissed = new Set(raw ? JSON.parse(raw) : [])
          merged = merged.filter(n => !(n.type !== 'admin_edit' && dismissed.has(n._id)))
        } catch { }
        setNotifications(merged)
        if (!isOpen) setUnreadCount(merged.length)
      } else {
        const data = await getNotifications()
        // Handle new API response format with requests and systemNotifications
        let allNotifs = []
        if (data.requests && data.systemNotifications) {
          // Normalize requests - filter out ones without proper 'from' data
          const normalizedReqs = (data.requests || [])
            .filter(r => r.from && r.from._id) // Only include if from user exists
            .map(r => ({
              _id: r._id,
              type: r.type,
              from: r.from,
              to: r.to,
              updatedAt: r.createdAt,
              kind: 'request'
            }))
          // Normalize system notifications
          const normalizedSystem = (data.systemNotifications || []).map(n => ({
            _id: n._id,
            type: n.type,
            title: n.title,
            message: n.message,
            dataKind: n.data?.kind,
            updatedAt: n.createdAt,
            kind: 'system'
          }))
          allNotifs = [...normalizedSystem, ...normalizedReqs].sort((a,b)=> new Date(b.updatedAt) - new Date(a.updatedAt))
        } else {
          // Fallback for old API format
          allNotifs = Array.isArray(data) ? data.filter(r => r.from && r.from._id).map(r => ({...r, kind: 'request'})) : []
        }
        setNotifications(allNotifs)
        if (!isOpen) setUnreadCount(allNotifs.length)
      }
    } catch (e) {
      console.error('Failed to load notifications:', e)
    }
  }

  useEffect(() => {
    loadNotifications()
    // Poll as fallback (reduced to 60s for better performance)
    const interval = setInterval(loadNotifications, 60000)

    // Real-time updates via socket
    if (user?.id) {
      connectSocket(user.id)
      
      const unsubUserEvent = onSocketEvent('userEvent', (payload) => {
        if (!payload?.kind) return
        // Always refresh on relevant events
        if (
          payload.kind.startsWith('photo:') ||
          payload.kind.startsWith('profile:') ||
          payload.kind.startsWith('request:help:')
        ) {
          loadNotifications()
        }
        // Profile toasts
        if (payload.kind === 'profile:approved') {
          import('react-toastify').then(({ toast }) => {
            toast.success('✅ Profile approved by admin!', { position: 'top-center', autoClose: 5000 })
          })
        } else if (payload.kind === 'profile:rejected') {
          import('react-toastify').then(({ toast }) => {
            toast.error('❌ Profile changes rejected by admin', { position: 'top-center', autoClose: 5000 })
          })
        }
        // Help request toasts
        if (payload.kind === 'request:help:approved') {
          import('react-toastify').then(({ toast }) => {
            toast.success('✅ Help request approved. You can chat with admin now.', { position: 'top-center', autoClose: 5000 })
          })
        } else if (payload.kind === 'request:help:rejected') {
          import('react-toastify').then(({ toast }) => {
            toast.error('❌ Help request rejected by admin.', { position: 'top-center', autoClose: 5000 })
          })
        } else if (payload.kind === 'request:help:resolved') {
          import('react-toastify').then(({ toast }) => {
            toast.info('ℹ️ Your help query was resolved. Chat is closed.', { position: 'top-center', autoClose: 5000 })
          })
        }
      })
      
      const unsubAdminEdit = onSocketEvent('adminPendingEdit', () => {
        if (user?.isAdmin) loadNotifications()
      })
      
      const unsubAdminRequest = onSocketEvent('adminRequest', () => {
        if (user?.isAdmin) loadNotifications()
      })
      
      return () => {
        clearInterval(interval)
        unsubUserEvent()
        unsubAdminEdit()
        unsubAdminRequest()
      }
    }

    return () => {
      clearInterval(interval)
    }
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
      console.log('Responding to request:', { requestId, action })
      const result = await respondToRequest({ requestId, action })
      console.log('Response result:', result)
      await loadNotifications()
      // Trigger parent update callback to refresh dashboard
      if (onUpdate) onUpdate()
      // Dispatch event to refresh dashboard page
      window.dispatchEvent(new Event('requestStatusChanged'))
    } catch (e) {
      console.error('Failed to respond:', e)
      console.error('Error details:', e.response?.data)
      alert(`Error: ${e.response?.data?.message || 'Failed to respond to request'}`)
    }
    setLoading(false)
  }

  const handleAdminEdit = async (userId, action) => {
    setLoading(true)
    try {
      if (action === 'accept') {
        await approveProfileEditApi(userId)
      } else {
        await rejectProfileEditApi(userId, '')
      }
      await loadNotifications()
    } catch (e) {
      console.error('Failed to process profile edit:', e)
    }
    setLoading(false)
  }

  // If in mobile sheet, render only the content, no button wrapper
  if (isMobileSheet) {
    return (
      <div className="w-full">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`p-4 hover:bg-gray-50 ${user?.isAdmin && notif.type !== 'admin_edit' ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (user?.isAdmin && notif.type !== 'admin_edit') dismissNotif(notif._id, notif.kind)
                }}
              >
                <div className="flex items-start gap-3">
                  {notif.kind === 'system' ? (
                    (() => {
                      const isAccepted = (
                        notif.type === 'profile_approved' ||
                        notif.dataKind === 'request_accepted' ||
                        notif.dataKind === 'request_resolved'
                      )
                      const isAdminMessage = notif.type === 'admin_message'
                      const bg = isAdminMessage ? 'bg-blue-100' : (isAccepted ? 'bg-green-100' : 'bg-red-100')
                      const icon = isAdminMessage ? '❗' : (isAccepted ? '✅' : '❌')
                      return (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg}`}>
                          <span className="text-2xl">{icon}</span>
                        </div>
                      )
                    })()
                  ) : notif.from?.profilePhoto ? (
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
                    {/* System notifications (profile approval/rejection) */}
                    {notif.kind === 'system' ? (
                      <>
                        <p className="font-semibold text-gray-800">{notif.title || 'Notification'}</p>
                        <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                        <button
                          onClick={() => dismissNotif(notif._id, notif.kind)}
                          className="mt-2 text-xs text-blue-600 hover:underline"
                        >
                          Dismiss
                        </button>
                      </>
                    ) : user?.isAdmin ? (
                      /* Admin view for requests */
                      <>
                        <p className="font-semibold text-gray-800">
                          {notif.from?.name || 'Unknown'}
                        </p>
                        {notif.type === 'admin_edit' ? (
                          <>
                            <p className="text-sm text-gray-600 mt-1">submitted profile edits</p>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleAdminEdit(notif._id, 'accept') }}
                                disabled={loading}
                                className="flex-1 bg-green-500 text-white text-sm py-1.5 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleAdminEdit(notif._id, 'reject') }}
                                disabled={loading}
                                className="flex-1 bg-red-500 text-white text-sm py-1.5 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </>
                        ) : notif.type === 'help' ? (
                          <>
                            <p className="text-sm text-gray-600 mt-1">requested help</p>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  try {
                                    await respondHelpRequest({ helpRequestId: notif._id, action: 'approve' })
                                    await loadNotifications()
                                    // Optionally jump straight to chat with the requester
                                    if (notif.from?._id) window.location.href = `/chat/${notif.from._id}`
                                  } catch (err) { console.error(err) }
                                }}
                                disabled={loading}
                                className="flex-1 bg-green-500 text-white text-sm py-1.5 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                              >
                                Approve & Chat
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  try {
                                    await respondHelpRequest({ helpRequestId: notif._id, action: 'reject' })
                                    await loadNotifications()
                                  } catch (err) { console.error(err) }
                                }}
                                disabled={loading}
                                className="flex-1 bg-red-500 text-white text-sm py-1.5 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-gray-600 mt-1">
                            {notif.type === 'photo'
                              ? `requested access to images of ${notif.to?.name || 'Unknown'}`
                              : `sent a request to ${notif.to?.name || 'Unknown'}`}
                          </p>
                        )}
                      </>
                    ) : (
                      /* User view for requests */
                      <>
                        <p className="font-semibold text-gray-800">{notif.from?.name || notif.from || 'Someone'}</p>
                        {notif.type === 'photo' ? (
                          <p className="text-sm text-gray-600 mt-1">requested access to your photos 📸</p>
                        ) : notif.type === 'chat' || notif.type === 'follow' ? (
                          <p className="text-sm text-gray-600 mt-1">sent you a {notif.type === 'chat' ? 'chat' : 'follow'} request</p>
                        ) : (
                          <p className="text-sm text-gray-600 mt-1">sent you a request</p>
                        )}
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
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button
        onClick={() => {
          const next = !isOpen
          setIsOpen(next)
          // Do not zero unread on open; decrement only when items are dismissed
          if (!next) {
            // On close, refresh count from current list (in case some items remain)
            setUnreadCount(Array.isArray(notifications) ? notifications.length : 0)
          }
        }}
        className="relative p-2 hover:bg-black hover:bg-opacity-10 rounded-full transition"
        style={{color: '#B8860B'}}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount}
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
                <div
                  key={notif._id}
                  className={`p-4 hover:bg-gray-50 ${user?.isAdmin && notif.type !== 'admin_edit' ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    // Admin: tap to dismiss read-only entries (not for admin_edit)
                    if (user?.isAdmin && notif.type !== 'admin_edit') dismissNotif(notif._id, notif.kind)
                  }}
                >
                  <div className="flex items-start gap-3">
                    {notif.kind === 'system' ? (
                      (() => {
                        const isAccepted = (
                          notif.type === 'profile_approved' ||
                          notif.dataKind === 'request_accepted' ||
                          notif.dataKind === 'request_resolved'
                        )
                        const isAdminMessage = notif.type === 'admin_message'
                        const bg = isAdminMessage ? 'bg-blue-100' : (isAccepted ? 'bg-green-100' : 'bg-red-100')
                        const icon = isAdminMessage ? '❗' : (isAccepted ? '✅' : '❌')
                        return (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg}`}>
                            <span className="text-2xl">{icon}</span>
                          </div>
                        )
                      })()
                    ) : notif.from?.profilePhoto ? (
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
                      {/* System notifications (profile approval/rejection) */}
                      {notif.kind === 'system' ? (
                        <>
                          <p className="font-semibold text-gray-800">{notif.title || 'Notification'}</p>
                          <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); dismissNotif(notif._id, notif.kind) }}
                            className="mt-2 text-xs text-blue-600 hover:underline"
                          >
                            Dismiss
                          </button>
                        </>
                      ) : user?.isAdmin ? (
                        <>
                          <p className="font-semibold text-gray-800">
                            {notif.from?.name || 'Unknown'}
                          </p>
                          {notif.type === 'admin_edit' ? (
                            <>
                              <p className="text-sm text-gray-600 mt-1">submitted profile edits</p>
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAdminEdit(notif._id, 'accept') }}
                                  disabled={loading}
                                  className="flex-1 bg-green-500 text-white text-sm py-1.5 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAdminEdit(notif._id, 'reject') }}
                                  disabled={loading}
                                  className="flex-1 bg-red-500 text-white text-sm py-1.5 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            </>
                          ) : notif.type === 'help' ? (
                            <>
                              <p className="text-sm text-gray-600 mt-1">requested help</p>
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    try {
                                      await respondHelpRequest({ helpRequestId: notif._id, action: 'approve' })
                                      await loadNotifications()
                                      if (notif.from?._id) window.location.href = `/chat/${notif.from._id}`
                                    } catch (err) { console.error(err) }
                                  }}
                                  disabled={loading}
                                  className="flex-1 bg-green-500 text-white text-sm py-1.5 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                                >
                                  Approve & Chat
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    try {
                                      await respondHelpRequest({ helpRequestId: notif._id, action: 'reject' })
                                      await loadNotifications()
                                    } catch (err) { console.error(err) }
                                  }}
                                  disabled={loading}
                                  className="flex-1 bg-red-500 text-white text-sm py-1.5 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-gray-600 mt-1">
                              {notif.type === 'photo'
                                ? `requested access to images of ${notif.to?.name || 'Unknown'}`
                                : `sent a request to ${notif.to?.name || 'Unknown'}`}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-gray-800">{notif.from?.name || notif.from || 'Someone'}</p>
                          {notif.type === 'photo' ? (
                            <p className="text-sm text-gray-600 mt-1">requested access to your photos 📸</p>
                          ) : notif.type === 'chat' || notif.type === 'follow' ? (
                            <p className="text-sm text-gray-600 mt-1">sent you a {notif.type === 'chat' ? 'chat' : 'follow'} request</p>
                          ) : (
                            <p className="text-sm text-gray-600 mt-1">sent you a request</p>
                          )}
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
                        </>
                      )}
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
