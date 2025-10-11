import React, { useEffect, useState } from 'react'
import { getBlockedUsers, unblockUser, deleteChatsWithUser } from '../services/userService.js'

export default function BlockedUsersPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [info, setInfo] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await getBlockedUsers()
      setItems(data.blockedUsers || [])
    } catch (e) {
      setInfo(e.response?.data?.message || 'Failed to load blocked users')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const onUnblock = async (id) => {
    if (!confirm('Unblock this user? You will need to send/accept a follow request again to chat.')) return
    setBusyId(id)
    try {
      await unblockUser(id)
      setInfo('User unblocked')
      await load()
    } catch (e) {
      setInfo(e.response?.data?.message || 'Failed to unblock')
    }
    setBusyId(null)
  }

  const onDeleteChats = async (id) => {
    if (!confirm('Delete all chats with this blocked user? This is permanent.')) return
    setBusyId(id)
    try {
      await deleteChatsWithUser(id)
      setInfo('All chats deleted')
    } catch (e) {
      setInfo(e.response?.data?.message || 'Failed to delete chats')
    }
    setBusyId(null)
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 pb-24 md:pb-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Blocked Users</h1>
      {info && <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded border border-blue-200">{info}</div>}
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">No blocked users.</div>
      ) : (
        <ul className="divide-y">
          {items.map(u => (
            <li key={u._id} className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-gray-500 font-bold">
                  {u.profilePhoto ? (
                    <img src={u.profilePhoto} alt="" className="w-12 h-12 object-cover" />
                  ) : (u.name?.[0]?.toUpperCase() || '?')}
                </div>
                <div>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-sm text-gray-500">{u.email}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onDeleteChats(u._id)}
                  disabled={busyId === u._id}
                  className="px-3 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                >
                  Delete Chats
                </button>
                <button
                  onClick={() => onUnblock(u._id)}
                  disabled={busyId === u._id}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Unblock
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
