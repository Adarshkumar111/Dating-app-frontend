import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProfile } from '../services/userService.js'
import { sendRequest, unfollow } from '../services/requestService.js'
import { getUserChatHistory, adminBlockUser, adminUnblockUser } from '../services/adminService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { MdMoreVert, MdBlock, MdChat, MdPerson } from 'react-icons/md'

export default function ProfileViewPage() {
  const { id } = useParams()
  const { user: currentUser } = useAuth()
  const nav = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [info, setInfo] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [loadingChats, setLoadingChats] = useState(false)

  const loadProfile = async () => {
    try {
      const data = await getProfile(id)
      setProfile(data)
      setLoading(false)
      
      // If admin, load chat history (non-blocking)
      if (currentUser?.isAdmin && String(currentUser.id) !== String(id)) {
        setTimeout(() => loadChatHistory(), 100)
      }
    } catch (e) {
      setInfo(e.response?.data?.message || 'Error loading profile')
      setLoading(false)
    }
  }

  const loadChatHistory = async () => {
    try {
      setLoadingChats(true)
      const history = await getUserChatHistory(id)
      setChatHistory(history || [])
      setLoadingChats(false)
    } catch (e) {
      console.error('Failed to load chat history:', e)
      setChatHistory([])
      setLoadingChats(false)
    }
  }

  const handleAdminBlock = async () => {
    if (!confirm(`Are you sure you want to block ${profile.name}? They will not be able to access the platform.`)) return
    try {
      await adminBlockUser(id)
      setInfo('User blocked by admin')
      setShowAdminMenu(false)
      loadProfile()
    } catch (e) {
      setInfo(e.response?.data?.message || 'Failed to block user')
    }
  }

  const handleAdminUnblock = async () => {
    try {
      await adminUnblockUser(id)
      setInfo('User unblocked by admin')
      setShowAdminMenu(false)
      loadProfile()
    } catch (e) {
      setInfo(e.response?.data?.message || 'Failed to unblock user')
    }
  }

  const openChat = (chatId, otherUserId) => {
    nav(`/chat/${otherUserId}`)
  }

  useEffect(() => {
    loadProfile()
  }, [id])

  const handleFollow = async () => {
    try {
      await sendRequest({ toUserId: id, type: 'follow' })
      setInfo('Request sent!')
      loadProfile()
    } catch (e) {
      setInfo(e.response?.data?.message || 'Error')
    }
  }

  const handleUnfollow = async () => {
    try {
      await unfollow(id)
      setInfo('Unfollowed')
      loadProfile()
    } catch (e) {
      setInfo(e.response?.data?.message || 'Error')
    }
  }

  if (loading) return <div className="text-center mt-20 text-gray-500">Loading...</div>
  if (!profile) return <div className="text-center mt-20 text-red-500">Profile not found</div>

  const isOwnProfile = String(currentUser?.id) === String(id)
  const isAdmin = currentUser?.isAdmin
  
  console.log('Profile data:', profile)
  console.log('Is Admin:', isAdmin)
  console.log('Is Own Profile:', isOwnProfile)

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg font-sans">
      {isAdmin && !isOwnProfile && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <span className="font-semibold">Admin View - Full profile visible (read-only)</span>
          </div>
          {/* Admin Menu */}
          <div className="relative">
            <button
              onClick={() => setShowAdminMenu(!showAdminMenu)}
              className="p-2 hover:bg-blue-100 rounded-full transition"
            >
              <MdMoreVert className="text-xl" />
            </button>
            {showAdminMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAdminMenu(false)} />
                <div className="absolute right-0 top-12 bg-white rounded-lg shadow-xl border py-2 min-w-[200px] z-50">
                  {profile.status === 'blocked' ? (
                    <button
                      onClick={handleAdminUnblock}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-left text-green-600"
                    >
                      <MdBlock />
                      <span>Unblock User</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleAdminBlock}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-left text-red-600"
                    >
                      <MdBlock />
                      <span>Block User</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {info && <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg">{info}</div>}
      
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-6">
        {profile.profilePhoto ? (
          <img
            src={profile.profilePhoto}
            alt="profile"
            className="w-48 h-48 rounded-full object-cover mb-4 border-4 border-pink-300 shadow-lg"
          />
        ) : (
          <div className="w-48 h-48 rounded-full bg-gradient-to-br from-pink-300 to-purple-400 flex items-center justify-center mb-4 border-4 border-pink-300 shadow-lg">
            <span className="text-6xl font-bold text-white">{profile.name?.[0]?.toUpperCase() || '?'}</span>
          </div>
        )}
        
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{profile.name}</h2>
        {profile.location && <p className="text-gray-500 mb-4">{profile.location}</p>}
        {profile.status === 'blocked' && (
          <div className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
            🚫 Blocked by Admin
          </div>
        )}
        
        {/* Action Buttons */}
        {!isOwnProfile && !isAdmin && (
          <div className="flex gap-3 mt-4">
            {!profile.isConnected ? (
              <button
                onClick={handleFollow}
                className="bg-gradient-to-r from-pink-500 to-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-orange-600 transition"
              >
                Follow
              </button>
            ) : (
              <>
                <button
                  onClick={() => nav(`/chat/${id}`)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition"
                >
                  💬 Chat
                </button>
                <button
                  onClick={handleUnfollow}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Unfollow
                </button>
              </>
            )}
          </div>
        )}
        
        {isOwnProfile && (
          <button
            onClick={() => nav('/profile/edit')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition mt-4"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Details */}
      {(profile.isConnected || isOwnProfile || isAdmin) ? (
        <>
          {/* Debug Info (temporary) */}
          {isAdmin && !isOwnProfile && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
              <strong>Debug:</strong> Profile keys: {Object.keys(profile).join(', ')}
            </div>
          )}
          
          {/* Admin-only fields */}
          {isAdmin && !isOwnProfile && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3 text-lg">📋 Admin Info</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {profile.email && (
                  <div>
                    <span className="font-semibold text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-600">{profile.email}</span>
                  </div>
                )}
                {profile.contact && (
                  <div>
                    <span className="font-semibold text-gray-700">Contact:</span>
                    <span className="ml-2 text-gray-600">{profile.contact}</span>
                  </div>
                )}
                {profile.fatherName && (
                  <div>
                    <span className="font-semibold text-gray-700">Father:</span>
                    <span className="ml-2 text-gray-600">{profile.fatherName}</span>
                  </div>
                )}
                {profile.motherName && (
                  <div>
                    <span className="font-semibold text-gray-700">Mother:</span>
                    <span className="ml-2 text-gray-600">{profile.motherName}</span>
                  </div>
                )}
                {profile.itNumber && (
                  <div>
                    <span className="font-semibold text-gray-700">IT Number:</span>
                    <span className="ml-2 text-gray-600">{profile.itNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Chat History (Admin Only) */}
          {isAdmin && !isOwnProfile && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 text-lg flex items-center gap-2">
                <MdChat className="text-blue-500" />
                Chat History
              </h3>
              {loadingChats ? (
                <div className="text-center py-4 text-gray-500">Loading chats...</div>
              ) : chatHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  No chat history found
                </div>
              ) : (
                <div className="space-y-3">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.chatId}
                      onClick={() => openChat(chat.chatId, chat.otherUser._id)}
                      className="p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 hover:border-blue-300 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {chat.otherUser.profilePhoto ? (
                            <img
                              src={chat.otherUser.profilePhoto}
                              alt=""
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            chat.otherUser.name?.[0]?.toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-800">{chat.otherUser.name}</h4>
                            {chat.isBlocked && (
                              <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">
                                Blocked
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{chat.otherUser.email || chat.otherUser.contact}</p>
                          {chat.lastMessage && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              Last: {chat.lastMessage.text} • {new Date(chat.lastMessage.sentAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-blue-600">
                            {chat.messageCount} msgs
                          </div>
                          <div className="text-xs text-gray-500">Click to view</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 mb-6 text-gray-700">
            {profile.age && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="font-semibold">Age:</span> {profile.age}
              </div>
            )}
            {profile.education && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="font-semibold">Education:</span> {profile.education}
              </div>
            )}
            {profile.occupation && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="font-semibold">Occupation:</span> {profile.occupation}
              </div>
            )}
            {profile.gender && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="font-semibold">Gender:</span> {profile.gender}
              </div>
            )}
          </div>

          {profile.about && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2 text-lg">About</h3>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{profile.about}</p>
            </div>
          )}

          {/* Gallery Images */}
          {profile.galleryImages && profile.galleryImages.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 text-lg">Gallery</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profile.galleryImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`gallery-${idx}`}
                    className="w-full h-40 object-cover rounded-lg shadow-md hover:shadow-xl transition"
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-2">🔒 Profile details are private</p>
          <p className="text-sm text-gray-500">Send a follow request to view full profile and images</p>
        </div>
      )}
    </div>
  )
}
