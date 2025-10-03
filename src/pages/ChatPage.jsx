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

    const navigate = useNavigate()
    const chatEndRef = useRef(null)
    const socketRef = useRef(null)
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

                socketRef.current.emit('join', data.chatId)

                socketRef.current.on('message', (m) => {
                    const fromSelf = String(m.sender) === String(currentUser.id)
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
        e.preventDefault()
        if (!text.trim() || !chatData) return

        try {
            await sendMsg(chatData.chatId, { messageText: text, messageType: 'text' })
            setText('')
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to send')
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
        if (!confirm(`Are you sure you want to block ${otherUser?.name}? You won't be able to see their messages or profile.`)) return
        try {
            await blockUser(otherUser._id)
            setIsUserBlocked(true)
            setShowOptions(false)
            alert('User blocked successfully. You can unblock them from your profile settings.')
            navigate('/dashboard')
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to block user')
        }
    }

    const handleUnblockUser = async () => {
        const otherUser = getOtherUser()
        try {
            await unblockUser(otherUser._id)
            setIsUserBlocked(false)
            setShowOptions(false)
            alert('User unblocked successfully')
            loadChat()
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to unblock user')
        }
    }

    if (loading) return <div className="text-center mt-20">Loading...</div>
    if (!chatData) return <div className="text-center mt-20">Chat not found</div>

    const otherUser = getOtherUser()

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-400 to-orange-400 text-white p-4 flex items-center gap-3 shadow-md relative">
                <Link to={`/profile/${otherUser?._id}`} className="flex items-center gap-3 hover:opacity-90 flex-1">
                    <div className="w-12 h-12 rounded-full bg-white text-pink-500 flex items-center justify-center font-bold text-xl">
                        {otherUser?.profilePhoto ? (
                            <img src={otherUser.profilePhoto} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                            otherUser?.name?.[0]?.toUpperCase() || '?'
                        )}
                    </div>
                    <div>
                        <div className="font-semibold text-lg">{otherUser?.name || 'Chat'}</div>
                        {chatData?.isBlocked ? (
                            <div className="text-sm text-red-200 flex items-center gap-1">
                                <MdBlock />
                                {String(chatData.blockedBy) === String(currentUser.id) ? 'You blocked this user' : 'You are blocked'}
                            </div>
                        ) : (
                            <div className="text-sm text-pink-100">Click to view profile</div>
                        )}
                    </div>
                </Link>
                {hasNewMessage && (
                    <div className="absolute right-14 top-1/2 -translate-y-1/2 animate-bounce">
                        <IoMdNotifications className="text-yellow-300 text-3xl" />
                    </div>
                )}
                {/* Options Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="p-2 hover:bg-pink-500 rounded-full transition"
                    >
                        <MdMoreVert className="text-2xl" />
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

            {/* Notification Popup */}
            {notification && (
                <div className="fixed top-20 right-4 z-50 bg-white rounded-lg shadow-2xl border p-4 max-w-sm animate-slide-in">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold flex-shrink-0">
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
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2 bg-gray-50">
                {messages.map((m) => {
                    const status = getMessageStatus(m)
                    return (
                        <div
                            key={m._id}
                            onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, message: m }) }}
                            className={`max-w-[70%] p-3 rounded-2xl break-words relative group ${m.fromSelf ? 'self-end bg-pink-400 text-white' : 'self-start bg-white border'
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
                                <div className="absolute -bottom-2 right-2 flex gap-1 bg-white rounded-full px-2 py-0.5 shadow">
                                    {m.reactions.map((r, idx) => <span key={idx} className="text-sm">{r.emoji}</span>)}
                                </div>
                            )}

                            {!m.deletedForEveryone && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setReactionMenu({ x: e.clientX, y: e.clientY, message: m }) }}
                                    className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 bg-white rounded-full p-1 shadow"
                                >
                                    😊
                                </button>
                            )}

                            <div className={`text-xs mt-1 flex items-center gap-1 ${m.fromSelf ? 'text-pink-100' : 'text-gray-500'}`}>
                                <span>{new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {status && (
                                    <>
                                        {status.icon}
                                        {status.text && <span className="text-blue-500 font-medium">{status.text}</span>}
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
                    <div className="fixed z-50 bg-white border rounded-lg shadow-xl py-2 min-w-[180px]" style={{ top: contextMenu.y, left: contextMenu.x }}>
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
                    <div className="fixed z-50 bg-white border rounded-full shadow-xl px-3 py-2 flex gap-2" style={{ top: reactionMenu.y - 50, left: reactionMenu.x - 100 }}>
                        {['❤️', '😂', '😮', '😢', '🙏', '👍'].map(emoji => (
                            <button key={emoji} onClick={() => handleReaction(reactionMenu.message._id, emoji)} className="text-2xl hover:scale-125 transition">
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
                                    <button onClick={capturePhoto} className="bg-white text-gray-900 px-6 py-3 rounded-full font-semibold">
                                        📸 Capture
                                    </button>
                                    <button onClick={closeCamera} className="bg-red-500 text-white px-6 py-3 rounded-full font-semibold">
                                        ✕ Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    {!isRecordingVideo ? (
                                        <button onClick={startVideoRecording} className="bg-red-500 text-white px-6 py-3 rounded-full font-semibold">
                                            ⏺ Record
                                        </button>
                                    ) : (
                                        <button onClick={stopVideoRecording} className="bg-white text-gray-900 px-6 py-3 rounded-full font-semibold animate-pulse">
                                            ⏹ Stop
                                        </button>
                                    )}
                                    <button onClick={closeCamera} className="bg-gray-500 text-white px-6 py-3 rounded-full font-semibold">
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
            <div className="p-3 border-t bg-white">
                {chatData?.isBlocked && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-center text-red-700 text-sm">
                        <MdBlock className="inline text-lg mr-1" />
                        {String(chatData.blockedBy) === String(currentUser.id)
                            ? 'You have blocked this user. Unblock to send messages.'
                            : 'You cannot send messages. This user has blocked you.'}
                    </div>
                )}

                {uploading && <div className="mb-2 text-sm text-blue-600 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                </div>}

                <form onSubmit={onSend} className="flex gap-2 items-center relative">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')} className="hidden" />
                    <input ref={videoInputRef} type="file" accept="video/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'video')} className="hidden" />

                    <button type="button" className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" title="Emoji">
                        <BsEmojiSmile className="text-2xl" />
                    </button>

                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" title="Image">
                        <MdImage className="text-2xl" />
                    </button>

                    <div className="relative">
                        <button type="button" onClick={() => setShowMediaMenu(!showMediaMenu)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                            <IoMdAdd className="text-2xl" />
                        </button>
                        {showMediaMenu && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowMediaMenu(false)} />
                                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border py-2 min-w-[200px] z-40">
                                    <button onClick={() => openCamera('photo')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-left">
                                        <MdCamera className="text-xl text-blue-500" />
                                        <span className="text-sm font-medium">Take Photo</span>
                                    </button>
                                    <button onClick={() => { fileInputRef.current?.click(); setShowMediaMenu(false) }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-left">
                                        <MdPhotoLibrary className="text-xl text-green-500" />
                                        <span className="text-sm font-medium">Photo Gallery</span>
                                    </button>
                                    <button onClick={() => openCamera('video')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-left">
                                        <MdVideocam className="text-xl text-red-500" />
                                        <span className="text-sm font-medium">Record Video</span>
                                    </button>
                                    <button onClick={() => { videoInputRef.current?.click(); setShowMediaMenu(false) }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-left">
                                        <MdVideoLibrary className="text-xl text-purple-500" />
                                        <span className="text-sm font-medium">Video Gallery</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <input
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder={chatData?.isBlocked ? "Chat is blocked" : "Type a message"}
                        disabled={chatData?.isBlocked}
                        className="flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-pink-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />

                    <button type="submit" disabled={!text.trim() || uploading || chatData?.isBlocked} className="p-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        <MdSend className="text-2xl" />
                    </button>
                </form>
            </div>
        </div>
    )
}
