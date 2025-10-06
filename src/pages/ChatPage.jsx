import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { getChatWithUser, sendMessage as sendMsg, deleteMessage as delMsg, addReaction as addReact, uploadMedia, markAsSeen, blockChat, unblockChat } from '../services/chatService.js'
import { blockUser, unblockUser } from '../services/userService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { IoMdAdd, IoMdClose, IoMdNotifications } from 'react-icons/io'
import { MdImage, MdVideocam, MdCamera, MdPhotoLibrary, MdVideoLibrary, MdSend, MdDoneAll, MdDone, MdBlock, MdMoreVert } from 'react-icons/md'
import { BsEmojiSmile } from 'react-icons/bs'

export default function ChatPage() {
    const { chatId: userIdParam } = useParams()
    const { user: currentUser } = useAuth()

    const [chatData, setChatData] = useState(null)
    const [messages, setMessages] = useState([])
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [showMediaMenu, setShowMediaMenu] = useState(false)
    const [showCameraModal, setShowCameraModal] = useState(false)
    const [cameraMode, setCameraMode] = useState('photo')
    const [cameraStream, setCameraStream] = useState(null)
    const [isRecordingVideo, setIsRecordingVideo] = useState(false)
    const [zoomedImage, setZoomedImage] = useState(null)
    const [notification, setNotification] = useState(null)
    const [hasNewMessage, setHasNewMessage] = useState(false)
    const [contextMenu, setContextMenu] = useState(null)
    const [reactionMenu, setReactionMenu] = useState(null)
    const [showOptions, setShowOptions] = useState(false)
    const [isUserBlocked, setIsUserBlocked] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    const navigate = useNavigate()
    const chatEndRef = useRef(null)
    const socketRef = useRef(null)
    const currentRoomRef = useRef(null)
    const pendingClientIdsRef = useRef(new Set())
    const fileInputRef = useRef(null)
    const videoInputRef = useRef(null)
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const videoRecorderRef = useRef(null)

    useEffect(() => {
        loadChat()
        return () => {
            if (socketRef.current) socketRef.current.disconnect()
            if (cameraStream) cameraStream.getTracks().forEach(track => track.stop())
        }
    }, [userIdParam])

    const loadChat = async () => {
        try {
            const data = await getChatWithUser(userIdParam)
            setChatData(data)
            setMessages(data.messages || [])
            setIsUserBlocked(data.isBlockedByMe || data.isBlockedByThem || false)
            setLoading(false)

            // Mark any delivered messages as seen on load and refresh unread badge
            if (data?.chatId) {
                try {
                    await markAsSeen(data.chatId)
                    window.dispatchEvent(new Event('unread:update'))
                } catch (e) { /* ignore */ }
            }

            if (!socketRef.current) {
                socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
                    transports: ['websocket'],
                    auth: { token: localStorage.getItem('token') }
                })
            }

            // Always (re)join the active chat room and leave the previous one
            if (socketRef.current) {
                if (currentRoomRef.current && currentRoomRef.current !== data.chatId) {
                    socketRef.current.emit('leave', currentRoomRef.current)
                }
                socketRef.current.emit('join', data.chatId)
                currentRoomRef.current = data.chatId
            }
            if (socketRef.current && !socketRef.current.__handlersAttached) {
                socketRef.current.__handlersAttached = true
                socketRef.current.on('message', (m) => {
                    const fromSelf = String(m.sender) === String(currentUser.id)
                    // If this is my echo and I have an optimistic message with same clientId, replace it
                    if (fromSelf && m.clientId && pendingClientIdsRef.current.has(m.clientId)) {
                        pendingClientIdsRef.current.delete(m.clientId)
                        setMessages(prev => {
                            const idx = prev.findIndex(x => x.clientId === m.clientId)
                            if (idx !== -1) {
                                const copy = [...prev]
                                copy[idx] = { ...m, fromSelf: true }
                                return copy
                            }
                            return [...prev, { ...m, fromSelf: true }]
                        })
                        return
                    }
                    // Fallback: no clientId from server -> replace the most recent local optimistic if same text within 3s
                    if (fromSelf && (!m.clientId)) {
                        setMessages(prev => {
                            const copy = [...prev]
                            const serverTs = m.sentAt ? new Date(m.sentAt).getTime() : Date.now()
                            for (let i = copy.length - 1; i >= 0; i--) {
                                const cand = copy[i]
                                if (cand.fromSelf && String(cand._id || '').startsWith('local-') && cand.text === m.text) {
                                    const candTs = cand.sentAt ? new Date(cand.sentAt).getTime() : serverTs
                                    if (Math.abs(serverTs - candTs) <= 3000) {
                                        copy[i] = { ...m, fromSelf: true }
                                        return copy
                                    }
                                    break
                                }
                            }
                            return [...prev, { ...m, fromSelf }]
                        })
                        return
                    }
                    setMessages(prev => [...prev, { ...m, fromSelf }])

                    if (!fromSelf) {
                        const otherUser = data.users.find(u => String(u._id) !== String(currentUser.id))
                        setNotification({
                            name: otherUser?.name || 'Someone',
                            text: m.messageType === 'text' ? m.text : `Sent a ${m.messageType}`,
                            photo: otherUser?.profilePhoto
                        })
                        setTimeout(() => setNotification(null), 4000)
                        setHasNewMessage(true)
                    }
                })

                socketRef.current.on('messageDeleted', ({ messageId, deleteType }) => {
                    if (deleteType === 'forEveryone') {
                        setMessages(prev => prev.map(m =>
                            String(m._id) === String(messageId)
                                ? { ...m, deletedForEveryone: true, text: '', mediaUrl: null }
                                : m
                        ))
                    }
                })

                socketRef.current.on('reactionUpdated', ({ messageId, reactions }) => {
                    setMessages(prev => prev.map(m =>
                        String(m._id) === String(messageId) ? { ...m, reactions } : m
                    ))
                })

                socketRef.current.on('chatBlocked', ({ blockedBy }) => {
                    setChatData(prev => ({ ...prev, isBlocked: true, blockedBy }))
                    alert('This chat has been blocked')
                })

                socketRef.current.on('chatUnblocked', () => {
                    setChatData(prev => ({ ...prev, isBlocked: false, blockedBy: null }))
                    alert('This chat has been unblocked')
                })
            }
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to load chat')
            setLoading(false)
        }
    }

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        if (hasNewMessage) {
            setTimeout(() => setHasNewMessage(false), 3000)
            if (chatData) {
                markAsSeen(chatData.chatId)
                  .then(() => window.dispatchEvent(new Event('unread:update')))
                  .catch(console.error)
            }
        }
    }, [messages])

    const onSend = async (e) => {
        e && e.preventDefault()
        const msg = text.trim()
        if (!msg || !chatData) return

        // Check if blocked before sending
        if (chatData.isBlockedByMe || chatData.isBlockedByThem) {
            return // Silently prevent send
        }

        try {
            // Optimistic UI update
            const clientId = 'c-' + Date.now() + '-' + Math.random().toString(36).slice(2,8)
            pendingClientIdsRef.current.add(clientId)
            const local = {
                _id: 'local-' + Date.now(),
                sender: currentUser.id,
                fromSelf: true,
                text: msg,
                messageType: 'text',
                sentAt: new Date().toISOString(),
                reactions: [],
                clientId
            }
            setMessages(prev => [...prev, local])
            setText('')
            await sendMsg(chatData.chatId, { messageText: msg, messageType: 'text', clientId })
        } catch (e) {
            // Don't show alert for block errors
            if (e.response?.data?.blocked) {
                return
            }
            alert(e.response?.data?.message || 'Failed to send')
            // Rollback optimistic if needed (optional): we keep it for now to avoid flicker.
        }
    }

    const handleFileUpload = async (file, type) => {
        if (!chatData) return
        if (type === 'video') {
            const video = document.createElement('video')
            video.preload = 'metadata'
            video.onloadedmetadata = async () => {
                URL.revokeObjectURL(video.src)
                if (video.duration > 120) return alert('Video must be less than 2 minutes')
                await uploadAndSend(file)
            }
            video.src = URL.createObjectURL(file)
        } else {
            await uploadAndSend(file)
        }
    }

    const uploadAndSend = async (file) => {
        setUploading(true)
        setShowMediaMenu(false)
        try {
            await uploadMedia(chatData.chatId, file)
        } catch (e) {
            alert(e.response?.data?.message || 'Upload failed')
        }
        setUploading(false)
    }

    const openCamera = async (mode) => {
        try {
            setShowMediaMenu(false)
            setCameraMode(mode)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: mode === 'video'
            })
            setCameraStream(stream)
            setShowCameraModal(true)
            setTimeout(() => {
                if (videoRef.current) videoRef.current.srcObject = stream
            }, 100)
        } catch (e) {
            alert('Camera access denied')
        }
    }

    const closeCamera = () => {
        if (cameraStream) cameraStream.getTracks().forEach(track => track.stop())
        setCameraStream(null)
        if (videoRecorderRef.current) videoRecorderRef.current.stop()
        setShowCameraModal(false)
    }

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return
        const video = videoRef.current
        const canvas = canvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)
        canvas.toBlob(async (blob) => {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
            closeCamera()
            await uploadAndSend(file)
        }, 'image/jpeg', 0.95)
    }

    const startVideoRecording = () => {
        if (!cameraStream) return
        const recorder = new MediaRecorder(cameraStream, { mimeType: 'video/webm' })
        const chunks = []
        recorder.ondataavailable = (e) => chunks.push(e.data)
        recorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'video/webm' })
            const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' })
            closeCamera()
            await uploadAndSend(file)
        }
        recorder.start()
        videoRecorderRef.current = recorder
        setIsRecordingVideo(true)
        setTimeout(() => {
            if (videoRecorderRef.current?.state === 'recording') stopVideoRecording()
        }, 120000)
    }

    const stopVideoRecording = () => {
        if (videoRecorderRef.current) {
            videoRecorderRef.current.stop()
            setIsRecordingVideo(false)
        }
    }

    const handleDeleteMessage = async (messageId, deleteType) => {
        try {
            await delMsg(chatData.chatId, messageId, deleteType)
            if (deleteType === 'forMe') {
                setMessages(prev => prev.filter(m => String(m._id) !== String(messageId)))
            }
            setContextMenu(null)
        } catch (e) {
            alert(e.response?.data?.message || 'Delete failed')
        }
    }

    const handleReaction = async (messageId, emoji) => {
        try {
            await addReact(chatData.chatId, messageId, emoji)
            setReactionMenu(null)
        } catch (e) {
            console.error(e)
        }
    }

    const getOtherUser = () => {
        if (!chatData?.users) return null
        return chatData.users.find(u => String(u._id) !== String(currentUser.id))
    }

    const getMessageStatus = (m) => {
        if (!m.fromSelf) return null
        const otherUser = getOtherUser()
        if (m.seenBy?.some(id => String(id) === String(otherUser?._id))) {
            return { icon: <MdDoneAll className="text-blue-500" />, text: 'Seen' }
        }
        if (m.deliveredTo?.some(id => String(id) === String(otherUser?._id))) {
            return { icon: <MdDoneAll className="text-gray-400" />, text: null }
        }
        return { icon: <MdDone className="text-gray-400" />, text: null }
    }

    const handleBlock = async () => {
        if (!confirm('Are you sure you want to block this user? They will not be able to send you messages.')) return
        try {
            await blockChat(chatData.chatId)
            setChatData(prev => ({ ...prev, isBlocked: true, blockedBy: currentUser.id }))
            setShowOptions(false)
            alert('User blocked successfully')
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to block user')
        }
    }

    const handleUnblock = async () => {
        try {
            await unblockChat(chatData.chatId)
            setChatData(prev => ({ ...prev, isBlocked: false, blockedBy: null }))
            setShowOptions(false)
            alert('User unblocked successfully')
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to unblock user')
        }
    }

    const handleBlockUser = async () => {
        const otherUser = getOtherUser()
        if (!confirm(`Block ${otherUser?.name}? They won't be able to send you messages or view your profile. Old messages will remain visible.`)) return
        try {
            await blockUser(otherUser._id)
            setShowOptions(false)
            // Reload chat to reflect block status
            await loadChat()
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to block user')
        }
    }

    const handleUnblockUser = async () => {
        const otherUser = getOtherUser()
        if (!confirm(`Unblock ${otherUser?.name}? You'll need to send a follow request again to chat.`)) return
        try {
            await unblockUser(otherUser._id)
            setShowOptions(false)
            alert('User unblocked. Send a follow request to connect again.')
            await loadChat()
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to unblock user')
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
                <p className="text-blue-800 font-medium">Loading chat...</p>
            </div>
        </div>
    )
    if (!chatData) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-2xl font-bold text-blue-800 mb-2">Chat Not Found</h2>
                <p className="text-gray-600">This conversation doesn't exist or you don't have access to it.</p>
            </div>
        </div>
    )

    const otherUser = getOtherUser()

    return (
        <div className="fixed inset-0 bg-blue-50 px-2 overflow-hidden pt-20 md:pt-24" style={{ overscrollBehavior: 'none' }}>
            <div className="max-w-7xl w-full h-full mx-auto bg-white rounded-2xl shadow-md flex flex-col">
            {/* Header */}
            <div className="bg-blue-500 text-white px-4 py-2 md:py-3 flex items-center gap-3 shadow rounded-t-2xl relative">
                <Link to={`/profile/${otherUser?._id}`} className="flex items-center gap-3 hover:opacity-90 flex-1">
                    <div className="w-12 h-12 rounded-full bg-white text-blue-800 flex items-center justify-center font-bold text-xl shadow-lg">
                        {otherUser?.profilePhoto ? (
                            <img src={otherUser.profilePhoto} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                            otherUser?.name?.[0]?.toUpperCase() || '?'
                        )}
                    </div>
                    <div>
                        <div className="font-semibold text-lg">{otherUser?.name || 'Chat'}</div>
                        {(chatData?.isBlockedByMe || chatData?.isBlockedByThem) ? (
                            <div className="text-xs md:text-sm text-red-100 flex items-center gap-1">
                                <MdBlock />
                                {chatData.isBlockedByMe ? 'You blocked this user' : 'You are blocked'}
                            </div>
                        ) : (
                            <div className="text-xs md:text-sm text-blue-100">Tap to view profile</div>
                        )}
                    </div>
                </Link>
                {/* Right actions: bell + options */}
                <div className="flex items-center gap-1 md:gap-2">
                    <button
                        type="button"
                        onClick={() => setNotification(null)}
                        className="relative p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                        aria-label="Notifications"
                    >
                        <IoMdNotifications className="text-2xl md:text-3xl text-white" />
                        {(hasNewMessage || !!notification) && (
                            <>
                                <span className="absolute top-1 right-1 block w-2 h-2 bg-yellow-300 rounded-full"></span>
                                <span className="absolute top-1 right-1 block w-2 h-2 bg-yellow-300 rounded-full animate-ping"></span>
                            </>
                        )}
                    </button>
                {/* Options Menu */}
                <div className="relative">
                    <button
                        onClick={() => { setShowOptions(!showOptions); setUnreadCount(0) }}
                        className="relative p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all duration-300"
                    >
                        <MdMoreVert className="text-2xl" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] leading-4 rounded-full text-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    {showOptions && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
                            <div className="absolute right-0 top-12 bg-white text-gray-800 rounded-lg shadow-xl py-2 min-w-[180px] z-50">
                                {!isUserBlocked ? (
                                    <button
                                        onClick={handleBlockUser}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-left text-red-600"
                                    >
                                        <MdBlock />
                                        <span>Block User</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleUnblockUser}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-left text-green-600"
                                    >
                                        <MdBlock />
                                        <span>Unblock User</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => { navigate('/dashboard'); setShowOptions(false) }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-left"
                                >
                                    <span>Back to Messages</span>
                                </button>
                            </div>
                        </>
                    )}
                    </div>
                </div>
            </div>

            {/* Notification Popup */}
            {notification && (
                <div className="fixed top-20 right-4 z-50 bg-white rounded-xl shadow-2xl border p-4 max-w-sm animate-slide-in">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-premium-gradient text-white flex items-center justify-center font-bold flex-shrink-0">
                            {notification.photo ? (
                                <img src={notification.photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                                notification.name[0]?.toUpperCase()
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold">{notification.name}</div>
                            <div className="text-sm text-gray-600 truncate">{notification.text}</div>
                        </div>
                        <button onClick={() => setNotification(null)}>
                            <IoMdClose className="text-xl" />
                        </button>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 p-2 md:p-3 overflow-y-auto flex flex-col gap-2 bg-blue-50" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', overscrollBehaviorY: 'contain' }}>
                {messages.map((m) => {
                    const status = getMessageStatus(m)
                    return (
                        <div
                            key={m._id}
                            onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, message: m }) }}
                            className={`max-w-[78%] md:max-w-[70%] px-3 py-2 md:px-4 md:py-3 rounded-2xl break-words relative group shadow ${
                                m.fromSelf 
                                    ? 'self-end bg-blue-500 text-white' 
                                    : 'self-start bg-white border border-blue-100'
                                }`}
                        >
                            {m.deletedForEveryone ? (
                                <div className="flex items-center gap-2 text-gray-500 italic">
                                    <span>🚫</span><span>Message deleted</span>
                                </div>
                            ) : m.messageType === 'image' && m.mediaUrl ? (
                                <img
                                    src={m.mediaUrl}
                                    alt="shared"
                                    className="max-w-full rounded-lg max-h-64 object-cover cursor-pointer"
                                    onClick={() => setZoomedImage(m.mediaUrl)}
                                />
                            ) : m.messageType === 'video' && m.mediaUrl ? (
                                <video controls className="max-w-full rounded-lg max-h-64">
                                    <source src={m.mediaUrl} type="video/mp4" />
                                </video>
                            ) : (
                                <div>{m.text}</div>
                            )}

                            {!m.deletedForEveryone && m.reactions?.length > 0 && (
                                <div className="absolute -bottom-2 right-2 flex gap-1 bg-white rounded-full px-3 py-1 shadow-lg border border-blue-100">
                                    {m.reactions.map((r, idx) => <span key={idx} className="text-lg">{r.emoji}</span>)}
                                </div>
                            )}

                            {!m.deletedForEveryone && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setReactionMenu({ x: e.clientX, y: e.clientY, message: m }) }}
                                    className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 bg-white rounded-full p-2 shadow-lg border border-blue-100 hover:scale-110 transition-all duration-300"
                                >
                                    😊
                                </button>
                            )}

                            <div className={`text-[10px] md:text-xs mt-1 md:mt-2 flex items-center gap-1 ${m.fromSelf ? 'text-blue-100' : 'text-gray-500'}`}>
                                <span>{new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {status && (
                                    <>
                                        {status.icon}
                                        {status.text && <span className="text-blue-400 font-medium">{status.text}</span>}
                                    </>
                                )}
                            </div>
                        </div>
                    )
                })}
                <div ref={chatEndRef} />
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
                    <div className="fixed z-50 bg-white border border-blue-100 rounded-xl shadow-2xl py-2 min-w-[180px]" style={{ top: contextMenu.y, left: contextMenu.x }}>
                        <button onClick={() => handleDeleteMessage(contextMenu.message._id, 'forMe')} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
                            Delete for Me
                        </button>
                        {contextMenu.message.fromSelf && (
                            <button onClick={() => handleDeleteMessage(contextMenu.message._id, 'forEveryone')} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600">
                                Delete for Everyone
                            </button>
                        )}
                    </div>
                </>
            )}

            {/* Reaction Menu */}
            {reactionMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setReactionMenu(null)} />
                    <div className="fixed z-50 bg-white border border-blue-100 rounded-full shadow-2xl px-4 py-3 flex gap-3" style={{ top: reactionMenu.y - 50, left: reactionMenu.x - 100 }}>
                        {['❤️', '😂', '😮', '😢', '🙏', '👍'].map(emoji => (
                            <button key={emoji} onClick={() => handleReaction(reactionMenu.message._id, emoji)} className="text-2xl hover:scale-125 transition-all duration-300 hover:bg-blue-50 rounded-full p-1">
                                {emoji}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Camera Modal */}
            {showCameraModal && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
                    <div className="relative w-full max-w-2xl">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg" />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                            {cameraMode === 'photo' ? (
                                <>
                                    <button onClick={capturePhoto} className="btn-secondary">
                                        📸 Capture Photo
                                    </button>
                                    <button onClick={closeCamera} className="btn-accent">
                                        ✕ Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    {!isRecordingVideo ? (
                                        <button onClick={startVideoRecording} className="btn-accent">
                                            ⏺ Start Recording
                                        </button>
                                    ) : (
                                        <button onClick={stopVideoRecording} className="btn-secondary animate-pulse">
                                            ⏹ Stop Recording
                                        </button>
                                    )}
                                    <button onClick={closeCamera} className="btn-primary">
                                        ✕ Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Zoom */}
            {zoomedImage && (
                <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
                    <button onClick={() => setZoomedImage(null)} className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2">
                        <IoMdClose className="text-3xl" />
                    </button>
                    <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
                </div>
            )}

            {/* Input */}
            <div className="p-3 md:p-4 border-t border-blue-100 bg-white shadow rounded-b-2xl sticky bottom-0">
                {(chatData?.isBlockedByMe || chatData?.isBlockedByThem) && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-red-700">
                                <MdBlock className="text-2xl" />
                                <div>
                                    <div className="font-semibold text-red-800">
                                        {chatData.isBlockedByMe
                                            ? 'You blocked this user'
                                            : 'This user has blocked you'}
                                    </div>
                                    <div className="text-sm text-red-600">
                                        {chatData.isBlockedByMe
                                            ? 'Unblock to send messages. You\'ll need to connect again.'
                                            : 'You cannot send messages or view their profile.'}
                                    </div>
                                </div>
                            </div>
                            {chatData.isBlockedByMe && (
                                <button
                                    onClick={handleUnblockUser}
                                    className="btn-primary text-sm"
                                >
                                    Unblock
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {uploading && <div className="mb-3 text-sm text-blue-800 flex items-center gap-2 bg-blue-50 p-3 rounded-lg">
                    <div className="w-4 h-4 border-2 border-blue-800 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-medium">Uploading media...</span>
                </div>}

                <form onSubmit={onSend} className="flex gap-2 md:gap-3 items-center relative">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')} className="hidden" />
                    <input ref={videoInputRef} type="file" accept="video/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'video')} className="hidden" />

                    <div className="relative">
                        <button type="button" onClick={() => setShowMediaMenu(!showMediaMenu)} disabled={chatData?.isBlockedByMe || chatData?.isBlockedByThem} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300">
                            <IoMdAdd className="text-2xl" />
                        </button>
                        {showMediaMenu && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowMediaMenu(false)} />
                                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-2xl border border-blue-100 py-2 min-w-[200px] z-40">
                                    <button onClick={() => openCamera('photo')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-left">
                                        <MdCamera className="text-xl text-blue-500" />
                                        <span className="text-sm font-medium">Camera</span>
                                    </button>
                                    <button onClick={() => { fileInputRef.current?.click(); setShowMediaMenu(false) }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-left">
                                        <MdPhotoLibrary className="text-xl text-green-500" />
                                        <span className="text-sm font-medium">Image</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="relative flex-1">
                        <input
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder={(chatData?.isBlockedByMe || chatData?.isBlockedByThem) ? "Cannot send messages" : "Type a message..."}
                            disabled={chatData?.isBlockedByMe || chatData?.isBlockedByThem}
                            className="w-full pr-12 pl-4 py-2 md:py-2.5 rounded-full border-2 border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                        />
                        <button
                            type="button"
                            onClick={onSend}
                            disabled={chatData?.isBlockedByMe || chatData?.isBlockedByThem}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Send"
                        >
                            <MdSend className="text-lg" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </div>
    )
}
