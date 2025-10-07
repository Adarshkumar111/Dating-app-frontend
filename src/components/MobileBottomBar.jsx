import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { MdHome, MdMessage, MdPerson, MdNotifications, MdClose, MdHelp } from 'react-icons/md'
import { getNotifications } from '../services/notificationService.js'
import { getPendingProfileEdits } from '../services/adminService.js'
import { getFriends } from '../services/userService.js'
import NotificationDropdown from './NotificationDropdown.jsx'
import HelpDropdown from './HelpDropdown.jsx'
import { connectSocket, onSocketEvent } from '../services/socketService.js'
import { toast } from 'react-toastify'

export default function MobileBottomBar() {
  const { user } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [openSheet, setOpenSheet] = useState(false)
  const [openHelpSheet, setOpenHelpSheet] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  // Only show on phones
  // Hidden on md and above via tailwind
  const isAdmin = !!user?.isAdmin

  const go = (path) => {
    setOpenSheet(false)
    if (loc.pathname !== path) nav(path)
  }

  const Item = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center py-2"
      style={{color: active ? '#B8860B' : '#8B7355'}}
    >
      {children}
    </button>
  )

  const loadNotifCount = async () => {
    try {
      if (isAdmin) {
        const [reqs, edits] = await Promise.all([getNotifications(), getPendingProfileEdits()])
        const mergedLen = (Array.isArray(reqs) ? reqs.length : 0) + (Array.isArray(edits) ? edits.length : 0)
        setNotifCount(mergedLen)
      } else {
        const data = await getNotifications()
        if (Array.isArray(data)) {
          // Backward-compatible (old API returned array)
          setNotifCount(data.length)
        } else if (data && typeof data === 'object') {
          const r = Array.isArray(data.requests) ? data.requests.length : 0
          const s = Array.isArray(data.systemNotifications) ? data.systemNotifications.length : 0
          setNotifCount(r + s)
        } else {
          setNotifCount(0)
        }
      }
    } catch (_) {
      // ignore
    }
  }

  const loadUnreadCount = async () => {
    if (!isAdmin) {
      try {
        const data = await getFriends()
        const total = data.friends.reduce((sum, friend) => sum + friend.unreadCount, 0)
        setUnreadCount(total)
      } catch (_) {
        // ignore
      }
    }
  }

  useEffect(() => {
    if (!user) return
    
    loadNotifCount()
    loadUnreadCount()
    
    // Connect socket for real-time updates
    connectSocket(user.id)
    
    // Listen for real-time events
    const unsubMessage = onSocketEvent('newMessage', () => {
      loadUnreadCount()
    })
    
    const unsubUserEvent = onSocketEvent('userEvent', (payload) => {
      loadNotifCount()
      // Show toast for profile approval/rejection
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
    
    const unsubAdminEdit = onSocketEvent('adminPendingEdit', () => {
      if (isAdmin) loadNotifCount()
    })
    
    const unsubAdminRequest = onSocketEvent('adminRequest', () => {
      if (isAdmin) loadNotifCount()
    })
    
    const i = setInterval(() => {
      loadNotifCount()
      loadUnreadCount()
    }, 60000)
    
    // Listen for unread update from chat page
    const handler = () => loadUnreadCount()
    window.addEventListener('unread:update', handler)
    
    return () => {
      clearInterval(i)
      window.removeEventListener('unread:update', handler)
      unsubMessage()
      unsubUserEvent()
      unsubAdminEdit()
      unsubAdminRequest()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  // Refresh counts when route changes
  useEffect(() => {
    loadNotifCount()
    loadUnreadCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname, loc.search])

  if (!user) return null

  // Hide bottom bar on chat page
  if (loc.pathname.startsWith('/chat/')) return null

  return (
    <>
      {/* Bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-t-2xl shadow-2xl flex items-center" style={{backgroundColor: '#F5F5DC'}}>
            {/* For users: Messages | Home (center emphasized) | Notifications | Profile */}
            {/* For admins: Dashboard | Notifications | Profile */}
            {!isAdmin && (
              <>
                <Item active={loc.pathname.startsWith('/dashboard') && loc.search.includes('tab=messages')} onClick={() => go('/dashboard?tab=messages')}>
                  <div className="relative">
                    <MdMessage className="text-2xl" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                </Item>
                <Item active={loc.pathname.startsWith('/dashboard') && !loc.search.includes('tab=messages')} onClick={() => go('/dashboard')}>
                  <MdHome className="text-3xl" />
                </Item>
                <Item active={false} onClick={() => setOpenSheet(true)}>
                  <div className="relative">
                    <MdNotifications className="text-2xl" />
                    {notifCount > 0 && (
                      <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                        {notifCount > 9 ? '9+' : notifCount}
                      </span>
                    )}
                  </div>
                </Item>
                <Item active={false} onClick={() => setOpenHelpSheet(true)}>
                  <MdHelp className="text-2xl" />
                </Item>
                <Item active={loc.pathname.startsWith('/profile/')} onClick={() => go(`/profile/${user.id}`)}>
                  <MdPerson className="text-2xl" />
                </Item>
              </>
            )}
            {isAdmin && (
              <>
                <Item active={loc.pathname === '/admin'} onClick={() => go('/admin')}>
                  <MdHome className="text-2xl" />
                </Item>
                <Item active={false} onClick={() => setOpenSheet(true)}>
                  <div className="relative">
                    <MdNotifications className="text-2xl" />
                    {notifCount > 0 && (
                      <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                        {notifCount > 9 ? '9+' : notifCount}
                      </span>
                    )}
                  </div>
                </Item>
                <Item active={loc.pathname.startsWith('/profile/')} onClick={() => go(`/profile/${user.id}`)}>
                  <MdPerson className="text-2xl" />
                </Item>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notifications sheet */}
      {openSheet && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setOpenSheet(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-2xl animate-slide-up max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="text-lg font-semibold text-blue-800">Notifications</div>
              <button onClick={() => setOpenSheet(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <MdClose className="text-xl" />
              </button>
            </div>
            <div className="p-2">
              <NotificationDropdown isMobileSheet onUpdate={loadNotifCount} />
            </div>
          </div>
        </div>
      )}

      {/* Help sheet */}
      {openHelpSheet && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setOpenHelpSheet(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-2xl animate-slide-up max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="text-lg font-semibold text-amber-700 flex items-center gap-2">
                <MdHelp className="text-amber-600" />
                Help & Support
              </div>
              <button onClick={() => setOpenHelpSheet(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <MdClose className="text-xl" />
              </button>
            </div>
            <div className="p-2">
              <HelpDropdown isMobileSheet onClose={() => setOpenHelpSheet(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
