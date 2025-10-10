import React, { useEffect, useState, useRef } from 'react'
import { toast } from 'react-toastify'
import { useParams, useNavigate } from 'react-router-dom'
import { getProfile } from '../services/userService.js'
import { sendRequest, unfollow } from '../services/requestService.js'
import { getUserChatHistory, adminBlockUser, adminUnblockUser, getAppSettings } from '../services/adminService.js'
import { updateProfile } from '../services/profileService.js'
import { useAuth } from '../context/AuthContext.jsx'
import {
  MdMoreVert,
  MdBlock,
  MdChat,
  MdPerson,
  MdSecurity,
  MdLocationOn,
  MdMale,
  MdFemale,
  MdStar,
  MdEdit,
  MdCake,
  MdFavorite,
  MdInfo,
  MdPhotoCamera,
  MdLock,
  MdFamilyRestroom,
  MdWork,
  MdLanguage,
  MdPublic,
  MdSchool
} from 'react-icons/md'
import { io } from 'socket.io-client'

export default function ProfileViewPage() {
  const { id } = useParams()
  const { user: currentUser } = useAuth()
  const nav = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [info, setInfo] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [profileDisplay, setProfileDisplay] = useState({})
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [loadingChats, setLoadingChats] = useState(false)
  const [expandedChat, setExpandedChat] = useState(null)
  const socketRef = useRef(null)
  // Lightbox for zooming images
  const [lightbox, setLightbox] = useState({ open: false, src: '' })
  const [zoom, setZoom] = useState({ scale: 1, x: 0, y: 0, dragging: false, originX: 0, originY: 0 })

  // Helper to check if a field is enabled by admin.
  // Always show ALL fields to the owner of the profile.
  const showField = (key) => {
    try {
      // currentUser and id are available in component scope
      if (String(currentUser?.id) === String(id)) return true
    } catch {}
    if (!profileDisplay || Object.keys(profileDisplay).length === 0) return true
    return !!profileDisplay[key]
  }

  const openLightbox = (src) => {
    setLightbox({ open: true, src })
    setZoom({ scale: 1, x: 0, y: 0, dragging: false, originX: 0, originY: 0 })
  }
  const closeLightbox = () => {
    setLightbox({ open: false, src: '' })
    setZoom({ scale: 1, x: 0, y: 0, dragging: false, originX: 0, originY: 0 })
  }

  // Ensure ImageKit images render reliably by applying safe transformations
  const transformUrl = (url) => {
    if (!url) return url
    try {
      const hasQuery = url.includes('?')
      if (url.includes('ik.imagekit.io')) {
        // Fit within bounds, auto format, auto focus (avoid black boxes)
        return `${url}${hasQuery ? '&' : '?'}tr=w-1000,h-1000,f-auto,fo-auto`
      }
      return url
    } catch {
      return url
    }
  }

  const handleImgError = (e) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = 'https://via.placeholder.com/800x800.png?text=Image+Unavailable'
    e.currentTarget.classList.add('bg-gray-100')
  }

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

  const handleToggleVisibility = async () => {
    try {
      const next = !profile?.isPublic
      const fd = new FormData()
      fd.append('isPublic', next ? 'true' : 'false')
      await updateProfile(fd)
      setProfile({ ...profile, isPublic: next })
      try { toast.success(next ? 'Your profile is now Public' : 'Your profile is now Private') } catch {}
    } catch (e) {
      try { toast.error(e.response?.data?.message || 'Failed to update visibility') } catch {}
    }
  }

  useEffect(() => {
    loadProfile()
    // Load admin profile display controls so friends can see fields as configured
    ;(async () => {
      try {
        const app = await getAppSettings()
        setProfileDisplay(app?.profileDisplayFields || {})
      } catch {}
    })()
    // Setup real-time updates for photo request state
    if (currentUser?.id) {
      socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000')
      const channel = `user:${currentUser.id}`
      socketRef.current.on(channel, (payload) => {
        if (!payload || !payload.kind) return
        // Only react to events related to this profile view
        const involvesThisPair = (payload.from === String(currentUser.id) && payload.to === String(id)) ||
                                 (payload.from === String(id) && payload.to === String(currentUser.id))
        if (!involvesThisPair) return
        if (payload.kind === 'photo:approved') {
          setInfo('Your photo request was approved')
          loadProfile()
        } else if (payload.kind === 'photo:rejected') {
          setInfo('Your photo request was rejected')
          loadProfile()
        } else if (payload.kind === 'photo:requested') {
          // If the other user requested my photos and I am viewing their profile, refresh for status
          loadProfile()
        }
      })
    }
    return () => {
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [id])

  // Close lightbox on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox({ open: false, src: '' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleFollow = async () => {
    try {
      const res = await sendRequest({ toUserId: id, type: 'follow' })
      if (typeof res?.remaining === 'number' && typeof res?.limit === 'number') {
        toast.success(`Request sent. You have ${res.remaining} free request${res.remaining === 1 ? '' : 's'} remaining today.`)
      } else {
        toast.success('Request sent!')
      }
      loadProfile()
    } catch (e) {
      if (e.response?.status === 429 && e.response?.data?.needsPremium) {
        toast.warn(`Daily request limit reached (${e.response.data.limit}). Redirecting to Premium...`)
        setTimeout(() => nav('/premium'), 2000)
        return
      }
      toast.error(e.response?.data?.message || 'Error')
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

  const handleRequestPhotos = async () => {
    try {
      await sendRequest({ toUserId: id, type: 'photo' })
      setInfo('Photo access request sent!')
      try { toast.success('📸 Photo access request sent!', { autoClose: 2500 }) } catch {}
      loadProfile()
    } catch (e) {
      setInfo(e.response?.data?.message || 'Failed to send photo request')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderColor:'#B8860B'}}></div>
        <p className="font-medium" style={{color:'#B8860B'}}>Loading profile...</p>
      </div>
    </div>
  )
  if (!profile) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <MdPerson className="text-6xl mx-auto mb-4" style={{color:'#B8860B'}} />
        <h2 className="text-2xl font-bold mb-2" style={{color:'#B8860B'}}>Profile Not Found</h2>
        <p className="text-gray-600">This profile doesn't exist or you don't have access to it.</p>
      </div>
    </div>
  )

  const isOwnProfile = String(currentUser?.id) === String(id)
  const isAdmin = currentUser?.isAdmin

  return (
    <div className='h-full ' style={{backgroundColor:'#FFF8E7'}}>
      
      <div>
      <div className="min-h-screen py-6 px-3  " >
      <div className="max-w-3xl mx-auto">
        {isAdmin && !isOwnProfile && (
          <div className="mb-6 p-4 bg-white rounded-xl shadow-md flex items-center justify-between" style={{border:'1px solid #F5DEB3', color:'#2C2C2C'}}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{backgroundColor:'#B8860B'}}>
                <MdSecurity className="text-xl" />
              </div>
              <div>
                <span className="font-semibold text-lg" style={{color:'#B8860B'}}>Admin View</span>
                <p className="text-sm" style={{color:'#C9A227'}}>Full profile visible (read-only)</p>
              </div>
            </div>
          {/* Admin Menu */}
          <div className="relative">
            <button
              onClick={() => setShowAdminMenu(!showAdminMenu)}
              className="p-2 rounded-full transition"
              style={{color:'#B8860B'}}
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
          <div className="mb-6 p-4 rounded-xl shadow-md" style={{backgroundColor:'#FFF8E7', color:'#B8860B', border:'1px solid #F5DEB3'}}>
            {info}
          </div>
        )}
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6" style={{border:'1px solid #F5DEB3'}}>
          {/* Cover Background */}
          <div className="h-36 relative rounded-t-3xl" style={{background:'linear-gradient(90deg, #C9A227, #F5DEB3)'}}>
            <div className="absolute inset-0" style={{backgroundColor:'#F5DEB3', opacity:0.1}}></div>
          </div>
          
          {/* Profile Content */}
          <div className="relative px-8 pb-8">
            {/* Profile Photo */}
            {showField('profilePhoto') && (
              <div className="flex justify-center -mt-14 mb-4">
                {profile.profilePhoto ? (
                  <img
                    src={transformUrl(profile.profilePhoto)}
                    onError={handleImgError}
                    onClick={() => openLightbox(transformUrl(profile.profilePhoto))}
                    alt="profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md cursor-zoom-in ring-2 ring-white/60"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-premium-gradient flex items-center justify-center border-2 border-white shadow-md">
                    <span className="text-2xl font-bold text-white">{profile.name?.[0]?.toUpperCase() || '?'}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Profile Info */}
            <div className="text-center">
              {showField('name') && (
                <h1 className="text-2xl font-bold mb-1" style={{color:'#B8860B'}}>{profile.name}</h1>
              )}
              {profile.location && showField('location') && (
                <div className="flex items-center justify-center gap-2 text-gray-600 mb-3">
                  <MdLocationOn style={{color:'#B8860B'}} />
                  <span className="text-lg">{profile.location}</span>
                </div>
              )}
              
              {/* Basic Info Pills */}
              <div className="flex flex-wrap justify-center gap-2.5 mb-4">
                {profile.age && showField('age') && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-semibold shadow-sm" style={{backgroundColor:'#FFF8E7', color:'#B8860B', border:'1px solid #F5DEB3'}}>
                    {profile.age} years old
                  </span>
                )}
                {profile.gender && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm" style={{backgroundColor:'#FFF8E7', color:'#B8860B', border:'1px solid #F5DEB3'}}>
                    {profile.gender === 'male' ? <MdMale style={{color:'#B8860B'}} /> : <MdFemale className="text-pink-600" />}
                    <span className="capitalize">{profile.gender}</span>
                  </span>
                )}
                {profile.isPremium && (
                  <span className="px-3.5 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-xs font-semibold shadow-lg inline-flex items-center gap-1.5">
                    <MdStar /> Premium
                  </span>
                )}
              </div>
              
              {profile.status === 'blocked' && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold mb-3">
                  <MdBlock />
                  <span>Blocked by Admin</span>
                </div>
              )}
        
              {/* Action Buttons */}
              {!isOwnProfile && !isAdmin && (
                <div className="flex flex-wrap justify-center gap-3.5">
                  {!profile.isConnected ? (
                    <button
                      onClick={handleFollow}
                      className="px-5 py-2.5 text-white rounded-lg transition flex items-center gap-2"
                      style={{backgroundColor:'#B8860B'}}
                    >
                      <MdFavorite />
                      <span>Send Follow Request</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => nav(`/chat/${id}`)}
                        className="px-5 py-2.5 text-white rounded-lg transition flex items-center gap-2"
                        style={{backgroundColor:'#B8860B'}}
                      >
                        <MdChat />
                        <span>Start Chat</span>
                      </button>
                      {/* Request Photos button: hidden if already accessible */}
                      {!profile.isPhotoAccessible && (
                        profile.photoRequestStatus === 'pending' ? (
                          <button
                            disabled
                            className="px-6 py-3 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
                          >
                            Pending Photo Request
                          </button>
                        ) : (
                          <button
                            onClick={handleRequestPhotos}
                            disabled={profile.isBlockedByMe || profile.isBlockedByThem}
                            className={`px-5 py-2.5 rounded-lg font-semibold transition flex items-center gap-2 ${
                              (profile.isBlockedByMe || profile.isBlockedByThem)
                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                : 'text-white'
                            }`}
                            style={!(profile.isBlockedByMe || profile.isBlockedByThem) ? {backgroundColor:'#B8860B'} : {}}
                          >
                            <MdPhotoCamera />
                            <span>Request Photos</span>
                          </button>
                        )
                      )}
                      <button
                        onClick={handleUnfollow}
                        className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 font-semibold"
                      >
                        Unfollow
                      </button>
                    </>
                  )}
                </div>
              )}
              
              {isOwnProfile && (
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => nav('/profile/edit')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold shadow transition"
                    style={{backgroundColor:'#F5DEB3', color:'#2C2C2C'}}
                  >
                    <MdEdit />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={handleToggleVisibility}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold shadow transition-all duration-200 border ${profile?.isPublic ? 'bg-amber-600 text-white hover:bg-amber-700 border-amber-700' : 'bg-white text-amber-700 hover:bg-amber-50 border-amber-300 opacity-90'}`}
                    title={profile?.isPublic ? 'Make Private' : 'Make Public'}
                  >
                    {profile?.isPublic ? <MdPublic /> : <MdLock />}
                    <span>{profile?.isPublic ? 'Public' : 'Private'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Profile Details */}
      {(profile.isConnected || isOwnProfile || isAdmin || profile.isPublic) ? (
        <>
          {/* Admin-only fields */}
          {isAdmin && !isOwnProfile && (
            <div className="mb-8 p-6 bg-white rounded-2xl shadow-md" style={{border:'1px solid #F5DEB3'}}>
              <h3 className="font-bold mb-4 text-xl flex items-center gap-2" style={{color:'#B8860B'}}>
                <MdInfo className="text-2xl" />
                <span>Admin Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.email && showField('email') && (
                  <div>
                    <span className="font-semibold text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-600">{profile.email}</span>
                  </div>
                )}
                {profile.contact && showField('contact') && (
                  <div>
                    <span className="font-semibold text-gray-700">Contact:</span>
                    <span className="ml-2 text-gray-600">{profile.contact}</span>
                  </div>
                )}
                {profile.fatherName && showField('fatherName') && (
                  <div>
                    <span className="font-semibold text-gray-700">Father:</span>
                    <span className="ml-2 text-gray-600">{profile.fatherName}</span>
                  </div>
                )}
                {profile.motherName && showField('motherName') && (
                  <div>
                    <span className="font-semibold text-gray-700">Mother:</span>
                    <span className="ml-2 text-gray-600">{profile.motherName}</span>
                  </div>
                )}
                {profile.itNumber && showField('itNumber') && (
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
                <MdChat style={{color:'#B8860B'}} />
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
                        className="p-4 cursor-pointer transition"
                        style={{background:'linear-gradient(90deg, #FFF8E7, #FDF2D6)'}}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{background:'linear-gradient(135deg, #C9A227, #B8860B)'}}>
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
                            <div className="text-sm font-semibold" style={{color:'#B8860B'}}>
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
                                    <div className={`max-w-[70%] ${isTargetUser ? 'bg-white' : ''} p-3 rounded-lg shadow`} style={!isTargetUser ? {backgroundColor:'#F5DEB3', color:'#2C2C2C'} : {}}>
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
          <div className="bg-white rounded-2xl shadow-xl p-5 mb-6" style={{border:'1px solid #F5DEB3'}}>
            <h3 className="font-bold mb-4 text-lg flex items-center gap-2" style={{color:'#B8860B'}}>
              <MdPerson className="text-2xl" />
              <span>Personal Details</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {profile.fatherName && showField('fatherName') && (
                <div className="p-3.5 rounded-xl" style={{backgroundColor:'#FFF8E7', border:'1px solid #F5DEB3'}}>
                  <div className="flex items-center gap-3">
                    <MdPerson className="text-2xl" style={{color:'#B8860B'}} />
                    <div>
                      <p className="text-sm font-medium" style={{color:'#C9A227'}}>Father's Name</p>
                      <p className="font-semibold" style={{color:'#B8860B'}}>{profile.fatherName}</p>
                    </div>
                  </div>
                </div>
              )}
              {profile.motherName && showField('motherName') && (
                <div className="p-4 rounded-xl" style={{backgroundColor:'#FFF8E7', border:'1px solid #F5DEB3'}}>
                  <div className="flex items-center gap-3">
                    <MdPerson className="text-2xl" style={{color:'#B8860B'}} />
                    <div>
                      <p className="text-sm font-medium" style={{color:'#C9A227'}}>Mother's Name</p>
                      <p className="font-semibold" style={{color:'#B8860B'}}>{profile.motherName}</p>
                    </div>
                  </div>
                </div>
              )}
              {profile.dateOfBirth && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <MdCake className="text-2xl text-purple-600" />
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Date of Birth</p>
                      <p className="text-purple-800 font-semibold">{new Date(profile.dateOfBirth).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}
              {profile.maritalStatus && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <MdFavorite className="text-2xl text-indigo-600" />
                    <div>
                      <p className="text-sm text-indigo-600 font-medium">Marital Status</p>
                      <p className="text-indigo-800 font-semibold capitalize">{profile.maritalStatus.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
              )}
              {profile.disability && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <MdBlock className="text-2xl text-red-500 rotate-45" />
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Disability</p>
                      <p className="text-gray-800 font-semibold">{profile.disability}</p>
                    </div>
                  </div>
                </div>
              )}
              {profile.countryOfOrigin && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <MdPublic className="text-2xl text-green-600" />
                    <div>
                      <p className="text-sm text-green-600 font-medium">Country of Origin</p>
                      <p className="text-green-800 font-semibold">{profile.countryOfOrigin}</p>
                    </div>
                  </div>
                </div>
              )}
              {profile.education && (
                <div className="p-3.5 rounded-xl" style={{background:'linear-gradient(90deg, #FFF8E7, #FDF2D6)', border:'1px solid #F5DEB3'}}>
                  <div className="flex items-center gap-3">
                    <MdSchool className="text-2xl" style={{color:'#B8860B'}} />
                    <div>
                      <p className="text-sm font-medium" style={{color:'#C9A227'}}>Education</p>
                      <p className="font-semibold" style={{color:'#B8860B'}}>{profile.education}</p>
                    </div>
                  </div>
                </div>
              )}
              {profile.occupation && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <MdWork className="text-2xl text-amber-600" />
                    <div>
                      <p className="text-sm text-amber-600 font-medium">Occupation</p>
                      <p className="text-amber-800 font-semibold">{profile.occupation}</p>
                    </div>
                  </div>
                </div>
              )}
              {profile.languagesKnown && profile.languagesKnown.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <MdLanguage className="text-2xl text-teal-600" />
                    <div>
                      <p className="text-sm text-teal-600 font-medium">Languages Known</p>
                      <p className="text-teal-800 font-semibold">{profile.languagesKnown.join(', ')}</p>
                    </div>
                  </div>
                </div>
              )}
              {profile.numberOfSiblings !== undefined && profile.numberOfSiblings !== null && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <MdFamilyRestroom className="text-2xl text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Number of Siblings</p>
                      <p className="text-orange-800 font-semibold">{profile.numberOfSiblings}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Looking For Section */}
          {profile.lookingFor && (
            <div className="bg-white rounded-2xl shadow-md p-5 mb-6">
              <h3 className="font-bold mb-3.5 text-lg flex items-center gap-2" style={{color:'#B8860B'}}>
                <MdFavorite className="text-2xl text-pink-600" />
                <span>Looking For</span>
              </h3>
              <div className="p-4 rounded-xl" style={{backgroundColor:'#FFF8E7', border:'1px solid #F5DEB3'}}>
                <p className="text-gray-700 leading-relaxed text-base">{profile.lookingFor}</p>
              </div>
            </div>
          )}

          {/* About Section */}
          {profile.about && showField('about') && (
            <div className="bg-white rounded-2xl shadow-md p-5 mb-6">
              <h3 className="font-bold mb-3.5 text-lg flex items-center gap-2" style={{color:'#B8860B'}}>
                <MdInfo className="text-2xl" />
                <span>About Me</span>
              </h3>
              <div className="p-4 rounded-xl" style={{backgroundColor:'#FFF8E7', border:'1px solid #F5DEB3'}}>
                <p className="text-gray-700 leading-relaxed text-base">{profile.about}</p>
              </div>
            </div>
          )}

          {/* Gallery Images */}
          {profile.galleryImages && profile.galleryImages.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md p-5">
              <h3 className="font-bold mb-5 text-lg flex items-center gap-2" style={{color:'#B8860B'}}>
                <MdPhotoCamera className="text-2xl" />
                <span>Photo Gallery ({profile.galleryImages.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.galleryImages.map((src, idx) => {
                  const isVideo = /\.(mp4|webm|mov)$/i.test(src)
                  const url = transformUrl(src)
                  return (
                    <div key={idx} className="relative overflow-hidden rounded-2xl shadow bg-white" style={{border:'1px solid #F5DEB3'}}>
                      {isVideo ? (
                        <video
                          src={url}
                          controls
                          className="w-full h-56 object-cover bg-black"
                        />
                      ) : (
                        <img
                          src={url}
                          onError={handleImgError}
                          onClick={() => openLightbox(url)}
                          alt={`gallery-${idx}`}
                          className="w-full h-56 object-cover transition-transform duration-300 cursor-zoom-in bg-white"
                        />
                      )}
                      <div className="absolute inset-0 pointer-events-none"></div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdLock className="text-4xl text-blue-700" />
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
              {/* Show Request Photos button for locked photos even when details hidden */}
              {!isOwnProfile && !isAdmin && !profile.isPhotoAccessible && (
                <div className="mt-6">
                  {profile.photoRequestStatus === 'pending' ? (
                    <button
                      disabled
                      className="px-6 py-3 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
                    >
                      Pending Photo Request
                    </button>
                  ) : (
                    <button
                      onClick={handleRequestPhotos}
                      disabled={profile.isBlockedByMe || profile.isBlockedByThem}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                        (profile.isBlockedByMe || profile.isBlockedByThem)
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      <span>📸</span>
                      <span>Request Photos</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Lightbox Overlay */}
      {lightbox.open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <img
            src={lightbox.src}
            alt="preview"
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={() => setZoom((z) => ({ ...z, scale: z.scale > 1 ? 1 : 2, x: 0, y: 0 }))}
            onWheel={(e) => {
              e.preventDefault()
              setZoom((z) => {
                const delta = e.deltaY > 0 ? -0.2 : 0.2
                const ns = Math.min(4, Math.max(1, z.scale + delta))
                return { ...z, scale: ns }
              })
            }}
            onMouseDown={(e) => setZoom((z) => ({ ...z, dragging: true, originX: e.clientX - z.x, originY: e.clientY - z.y }))}
            onMouseMove={(e) => zoom.dragging && setZoom((z) => ({ ...z, x: e.clientX - z.originX, y: e.clientY - z.originY }))}
            onMouseUp={() => setZoom((z) => ({ ...z, dragging: false }))}
            onMouseLeave={() => setZoom((z) => ({ ...z, dragging: false }))}
            onTouchStart={(e) => {
              const t = e.touches[0]
              setZoom((z) => ({ ...z, dragging: true, originX: t.clientX - z.x, originY: t.clientY - z.y }))
            }}
            onTouchMove={(e) => {
              if (!zoom.dragging) return
              const t = e.touches[0]
              setZoom((z) => ({ ...z, x: t.clientX - z.originX, y: t.clientY - z.originY }))
            }}
            onTouchEnd={() => setZoom((z) => ({ ...z, dragging: false }))}
            className={`max-w-[92vw] max-h-[92vh] object-contain rounded-lg shadow-2xl ${zoom.dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})` }}
            onError={handleImgError}
          />
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-2xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
      </div>
    </div>
      </div>
    </div>
  )
}

