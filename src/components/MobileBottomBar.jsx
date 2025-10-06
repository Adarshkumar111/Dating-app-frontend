import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { MdHome, MdMessage, MdPerson, MdNotifications } from 'react-icons/md'

export default function MobileBottomBar() {
  const { user } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [openSheet, setOpenSheet] = useState(false)

  if (!user) return null

  // Only show on phones
  // Hidden on md and above via tailwind
  const isAdmin = !!user.isAdmin

  const go = (path) => {
    setOpenSheet(false)
    if (loc.pathname !== path) nav(path)
  }

  const Item = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center py-2 ${active ? 'text-white' : 'text-white/80'}`}
    >
      {children}
    </button>
  )

  return (
    <>
      {/* Bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="mx-auto max-w-7xl">
          <div className="bg-blue-600 rounded-t-2xl shadow-2xl flex items-center">
            {/* For users: Messages | Home (center emphasized) | Notifications | Profile */}
            {/* For admins: Dashboard | Notifications | Profile */}
            {!isAdmin && (
              <>
                <Item active={loc.pathname.startsWith('/dashboard') && loc.search.includes('tab=messages')} onClick={() => go('/dashboard?tab=messages')}>
                  <MdMessage className="text-2xl" />
                </Item>
                <Item active={loc.pathname.startsWith('/dashboard') && !loc.search.includes('tab=messages')} onClick={() => go('/dashboard')}>
                  <MdHome className="text-3xl" />
                </Item>
                <Item active={false} onClick={() => setOpenSheet(true)}>
                  <MdNotifications className="text-2xl" />
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
                  <MdNotifications className="text-2xl" />
                </Item>
                <Item active={loc.pathname.startsWith('/profile/')} onClick={() => go(`/profile/${user.id}`)}>
                  <MdPerson className="text-2xl" />
                </Item>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Simple bottom sheet to deep-link to notifications page */}
      {openSheet && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setOpenSheet(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl p-4 shadow-2xl animate-slide-up">
            <div className="text-center font-semibold text-blue-800 mb-2">Notifications</div>
            <button
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold"
              onClick={(e) => { e.stopPropagation(); setOpenSheet(false); nav('/notifications') }}
            >
              Open Notifications
            </button>
          </div>
        </div>
      )}
    </>
  )
}
