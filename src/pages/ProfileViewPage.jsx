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
  const [expandedChat, setExpandedChat] = useState(null)

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
      // Handle blocked user case
      if (e.response?.data?.blocked) {
        setProfile({ blocked: true, name: e.response.data.name })
        setLoading(false)
        return
      }
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

  const toggleChat = (chatId) => {
    setExpandedChat(expandedChat === chatId ? null : chatId)
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
        <p className="text-blue-800 font-medium">Loading profile...</p>
      </div>
    </div>
  )
  if (!profile) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="text-6xl mb-4">👤</div>
        <h2 className="text-2xl font-bold text-blue-800 mb-2">Profile Not Found</h2>
        <p className="text-gray-600">This profile doesn't exist or you don't have access to it.</p>
      </div>
    </div>
  )

  const isOwnProfile = String(currentUser?.id) === String(id)
  const isAdmin = currentUser?.isAdmin

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {isAdmin && !isOwnProfile && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-amber-50 text-blue-800 rounded-xl border border-blue-200 shadow-lg flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-lg text-white">🛡️</span>
              </div>
              <div>
                <span className="font-semibold text-lg">Admin View</span>
                <p className="text-sm text-blue-600">Full profile visible (read-only)</p>
              </div>
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
        {info && (
          <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 shadow-lg animate-fade-in">
            {info}
          </div>
        )}
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8 transform hover:scale-105 transition-all duration-300">
          {/* Cover Background */}
          <div className="h-32 bg-premium-gradient relative">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          </div>
          
          {/* Profile Content */}
          <div className="relative px-8 pb-8">
            {/* Profile Photo */}
            <div className="flex justify-center -mt-16 mb-6">
              {profile.profilePhoto ? (
                <img
                  src={profile.profilePhoto}
                  alt="profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-2xl"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-premium-gradient flex items-center justify-center border-4 border-white shadow-2xl">
                  <span className="text-4xl font-bold text-white">{profile.name?.[0]?.toUpperCase() || '?'}</span>
                </div>
              )}
            </div>
            
            {/* Profile Info */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-blue-800 mb-2">{profile.name}</h1>
              {profile.location && (
                <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
                  <span>📍</span>
                  <span className="text-lg">{profile.location}</span>
                </div>
              )}
              
              {/* Basic Info Pills */}
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {profile.age && (
                  <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {profile.age} years old
                  </span>
                )}
                {profile.gender && (
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    profile.gender === 'male' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-pink-100 text-pink-800'
                  }`}>
                    {profile.gender === 'male' ? '👨 Male' : '👩 Female'}
                  </span>
                )}
                {profile.isPremium && (
                  <span className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-semibold shadow-lg">
                    ⭐ Premium
                  </span>
                )}
              </div>
              
              {profile.status === 'blocked' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold mb-4">
                  <span>🚫</span>
                  <span>Blocked by Admin</span>
                </div>
              )}
        
              {/* Action Buttons */}
              {!isOwnProfile && !isAdmin && (
                <div className="flex flex-wrap justify-center gap-4">
                  {!profile.isConnected ? (
                    <button
                      onClick={handleFollow}
                      className="btn-accent flex items-center gap-2"
                    >
                      <span>💝</span>
                      <span>Send Follow Request</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => nav(`/chat/${id}`)}
                        className="btn-primary flex items-center gap-2"
                      >
                        <span>💬</span>
                        <span>Start Chat</span>
                      </button>
                      <button
                        onClick={handleUnfollow}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 font-semibold"
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
                  className="btn-secondary flex items-center gap-2"
                >
                  <span>✏️</span>
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>

      {/* Profile Details */}
      {(profile.isConnected || isOwnProfile || isAdmin) ? (
        <>
          {/* Admin-only fields */}
          {isAdmin && !isOwnProfile && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-amber-50 rounded-2xl border border-blue-200 shadow-lg">
              <h3 className="font-bold text-blue-800 mb-4 text-xl flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Admin Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Chat History ({chatHistory.length} conversation{chatHistory.length !== 1 ? 's' : ''})
              </h3>
              {loadingChats ? (
                <div className="text-center py-4 text-gray-500">Loading chats...</div>
              ) : chatHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  No chat history found
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.chatId}
                      className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Chat Header - Clickable */}
                      <div
                        onClick={() => toggleChat(chat.chatId)}
                        className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 cursor-pointer hover:from-blue-100 hover:to-purple-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
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
                              {chat.messageCount} message{chat.messageCount !== 1 ? 's' : ''}
                            </div>
                            <div className="text-xs text-gray-500">
                              {expandedChat === chat.chatId ? '▲ Hide' : '▼ Show'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Messages - Expandable */}
                      {expandedChat === chat.chatId && (
                        <div className="p-4 bg-gray-50 max-h-96 overflow-y-auto">
                          {chat.messages && chat.messages.length > 0 ? (
                            <div className="space-y-2">
                              {chat.messages.map((msg, idx) => {
                                const isTargetUser = String(msg.sender) === String(id);
                                return (
                                  <div
                                    key={msg._id || idx}
                                    className={`flex ${isTargetUser ? 'justify-start' : 'justify-end'}`}
                                  >
                                    <div className={`max-w-[70%] ${isTargetUser ? 'bg-white' : 'bg-blue-500 text-white'} p-3 rounded-lg shadow`}>
                                      <div className="text-xs font-semibold mb-1 opacity-75">
                                        {msg.senderName}
                                      </div>
                                      <div className="text-sm break-words">
                                        {msg.text || `[${msg.messageType}]`}
                                      </div>
                                      <div className="text-xs mt-1 opacity-70">
                                        {new Date(msg.sentAt).toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              No messages in this chat
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Personal Details */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h3 className="font-bold text-blue-800 mb-6 text-xl flex items-center gap-2">
              <span className="text-2xl">👤</span>
              Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.education && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎓</span>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Education</p>
                      <p className="text-blue-800 font-semibold">{profile.education}</p>
                    </div>
                  </div>
                </div>
              )}
              {profile.occupation && (
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💼</span>
                    <div>
                      <p className="text-sm text-amber-600 font-medium">Occupation</p>
                      <p className="text-amber-800 font-semibold">{profile.occupation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* About Section */}
          {profile.about && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
              <h3 className="font-bold text-blue-800 mb-4 text-xl flex items-center gap-2">
                <span className="text-2xl">💭</span>
                About Me
              </h3>
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-xl border border-pink-200">
                <p className="text-gray-700 leading-relaxed text-lg">{profile.about}</p>
              </div>
            </div>
          )}

          {/* Gallery Images */}
          {profile.galleryImages && profile.galleryImages.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="font-bold text-blue-800 mb-6 text-xl flex items-center gap-2">
                <span className="text-2xl">📸</span>
                Photo Gallery ({profile.galleryImages.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {profile.galleryImages.map((img, idx) => (
                  <div key={idx} className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    <img
                      src={img}
                      alt={`gallery-${idx}`}
                      className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔒</span>
            </div>
            <h3 className="text-2xl font-bold text-blue-800 mb-2">Profile is Private</h3>
            <p className="text-gray-600 mb-6">This user's profile details are only visible to connected friends.</p>
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-xl border border-pink-200">
              <p className="text-gray-700 mb-4">
                <strong>To view full profile:</strong>
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Send a follow request</li>
                <li>• Wait for them to accept</li>
                <li>• View complete profile and photos</li>
                <li>• Start conversations</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
