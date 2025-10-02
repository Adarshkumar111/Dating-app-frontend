import React, { useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useAppDispatch, useAppSelector } from '../store/hooks.js'
import {
  fetchChatWithUser,
  sendMessage,
  deleteMessage as deleteMsg,
  addReaction as addReact,
  uploadMedia as uploadMediaAction,
  addMessageRealtime,
  deleteMessageRealtime,
  updateReactionRealtime,
  clearNewMessageFlag,
  clearChat
} from '../store/slices/chatSlice.js'
import {
  toggleMediaMenu,
  closeMediaMenu,
  openCameraModal,
  closeCameraModal,
  setZoomedImage,
  setContextMenu,
  setReactionMenu,
  closeAllMenus,
  setRecordingVideo
} from '../store/slices/uiSlice.js'
import { IoMdAdd, IoMdClose, IoMdNotifications } from 'react-icons/io'
import { MdImage, MdVideocam, MdCamera, MdPhotoLibrary, MdVideoLibrary, MdSend } from 'react-icons/md'
import { BsEmojiSmile } from 'react-icons/bs'

export default function ChatPageRedux() {
  const { chatId: userIdParam } = useParams()
  const dispatch = useAppDispatch()
  
  // Redux state
  const { user: currentUser } = useAppSelector(state => state.auth)
  const { currentChat, messages, loading, uploading, hasNewMessage } = useAppSelector(state => state.chat)
  const {
    showMediaMenu,
    showCameraModal,
    cameraMode,
    zoomedImage,
    contextMenu,
    reactionMenu,
    isRecordingVideo
  } = useAppSelector(state => state.ui)
  
  // Local state for text input
  const [text, setText] = React.useState('')
  const [cameraStream, setCameraStream] = React.useState(null)
  
  // Refs
  const chatEndRef = useRef(null)
  const socketRef = useRef(null)
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const videoRecorderRef = useRef(null)

  // Load chat on mount
  useEffect(() => {
    dispatch(fetchChatWithUser(userIdParam))
    
    return () => {
      dispatch(clearChat())
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [userIdParam, dispatch])

  // Setup socket connection
  useEffect(() => {
    if (currentChat && !socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        transports: ['websocket'],
        auth: { token: localStorage.getItem('token') }
      })
      
      socketRef.current.emit('join', currentChat.chatId)
      
      socketRef.current.on('message', (m) => {
        dispatch(addMessageRealtime({
          ...m,
          fromSelf: String(m.sender) === String(currentUser.id)
        }))
      })

      socketRef.current.on('messageDeleted', ({ messageId, deleteType }) => {
        dispatch(deleteMessageRealtime({ messageId, deleteType }))
      })

      socketRef.current.on('reactionUpdated', ({ messageId, reactions }) => {
        dispatch(updateReactionRealtime({ messageId, reactions }))
      })
    }
  }, [currentChat, dispatch, currentUser])

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (hasNewMessage) {
      setTimeout(() => dispatch(clearNewMessageFlag()), 3000)
    }
  }, [messages, hasNewMessage, dispatch])

  // Handlers
  const onSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || !currentChat) return
    
    await dispatch(sendMessage({
      chatId: currentChat.chatId,
      payload: { messageText: text, messageType: 'text' }
    }))
    setText('')
  }

  const handleFileUpload = async (file, type) => {
    if (!currentChat) return
    
    if (type === 'video') {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = async () => {
        window.URL.revokeObjectURL(video.src)
        if (video.duration > 120) {
          alert('Video must be less than 2 minutes')
          return
        }
        await dispatch(uploadMediaAction({ chatId: currentChat.chatId, file }))
      }
      video.src = URL.createObjectURL(file)
    } else {
      await dispatch(uploadMediaAction({ chatId: currentChat.chatId, file }))
    }
    dispatch(closeMediaMenu())
  }

  const openCamera = async (mode) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: mode === 'video' 
      })
      setCameraStream(stream)
      dispatch(openCameraModal(mode))
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 100)
    } catch (e) {
      alert('Camera access denied: ' + e.message)
    }
  }

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    if (videoRecorderRef.current) {
      videoRecorderRef.current.stop()
    }
    dispatch(closeCameraModal())
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    
    canvas.toBlob(async (blob) => {
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
      closeCamera()
      await dispatch(uploadMediaAction({ chatId: currentChat.chatId, file }))
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
      
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = async () => {
        window.URL.revokeObjectURL(video.src)
        if (video.duration > 120) {
          alert('Video must be less than 2 minutes')
          return
        }
        closeCamera()
        await dispatch(uploadMediaAction({ chatId: currentChat.chatId, file }))
      }
      video.src = URL.createObjectURL(blob)
    }
    
    recorder.start()
    videoRecorderRef.current = recorder
    dispatch(setRecordingVideo(true))
    
    setTimeout(() => {
      if (videoRecorderRef.current && videoRecorderRef.current.state === 'recording') {
        stopVideoRecording()
      }
    }, 120000)
  }

  const stopVideoRecording = () => {
    if (videoRecorderRef.current) {
      videoRecorderRef.current.stop()
      dispatch(setRecordingVideo(false))
    }
  }

  const handleDeleteMessage = async (messageId, deleteType) => {
    await dispatch(deleteMsg({ chatId: currentChat.chatId, messageId, deleteType }))
    dispatch(closeAllMenus())
  }

  const handleReaction = async (messageId, emoji) => {
    await dispatch(addReact({ chatId: currentChat.chatId, messageId, emoji }))
    dispatch(closeAllMenus())
  }

  const handleContextMenu = (e, message) => {
    e.preventDefault()
    dispatch(setContextMenu({ x: e.clientX, y: e.clientY, message }))
  }

  const handleReactionClick = (e, message) => {
    e.stopPropagation()
    dispatch(setReactionMenu({ x: e.clientX, y: e.clientY, message }))
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderMessage = (m) => {
    if (m.deletedForEveryone) {
      return (
        <div className="flex items-center gap-2 text-gray-500 italic">
          <span>🚫</span>
          <span>This message was deleted</span>
        </div>
      )
    }
    
    if (m.messageType === 'image' && m.mediaUrl) {
      return (
        <div className="relative">
          <img 
            src={m.mediaUrl} 
            alt="shared" 
            className="max-w-full rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-90 transition"
            onClick={() => dispatch(setZoomedImage(m.mediaUrl))}
          />
          {m.text && <div className="mt-2">{m.text}</div>}
        </div>
      )
    }
    
    if (m.messageType === 'video' && m.mediaUrl) {
      return (
        <div className="relative">
          <video controls className="max-w-full rounded-lg max-h-64">
            <source src={m.mediaUrl} type="video/mp4" />
          </video>
          {m.mediaDuration && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              {formatDuration(Math.floor(m.mediaDuration))}
            </div>
          )}
          {m.text && <div className="mt-2">{m.text}</div>}
        </div>
      )
    }
    
    return <div>{m.text || 'Message'}</div>
  }

  const getOtherUser = () => {
    if (!currentChat?.users) return null
    return currentChat.users.find(u => String(u._id) !== String(currentUser.id))
  }

  if (loading) return <div className="text-center mt-20">Loading chat...</div>
  if (!currentChat) return <div className="text-center mt-20">Chat not found</div>

  const otherUser = getOtherUser()

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-orange-400 text-white p-4 flex items-center gap-3 shadow-md relative">
        <Link to={`/profile/${otherUser?._id}`} className="flex items-center gap-3 hover:opacity-90 transition flex-1">
          <div className="w-12 h-12 rounded-full bg-white text-pink-500 flex items-center justify-center font-bold text-xl">
            {otherUser?.profilePhoto ? (
              <img src={otherUser.profilePhoto} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              otherUser?.name?.[0]?.toUpperCase() || '?'
            )}
          </div>
          <div>
            <div className="font-semibold text-lg">{otherUser?.name || 'Chat'}</div>
            <div className="text-sm text-pink-100">Click to view profile</div>
          </div>
        </Link>
        
        {hasNewMessage && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-bounce">
            <IoMdNotifications className="text-yellow-300 text-3xl drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2 bg-gray-50">
        {messages.map((m) => (
          <div
            key={m._id}
            onContextMenu={(e) => handleContextMenu(e, m)}
            className={`max-w-[70%] p-3 px-4 rounded-2xl break-words cursor-pointer relative group ${
              m.fromSelf ? 'self-end bg-pink-400 text-white' : 'self-start bg-white text-gray-900 border border-gray-200'
            }`}
          >
            {renderMessage(m)}
            
            {!m.deletedForEveryone && m.reactions && m.reactions.length > 0 && (
              <div className="absolute -bottom-2 right-2 flex gap-1 bg-white rounded-full px-2 py-0.5 shadow-md border border-gray-200">
                {m.reactions.map((r, idx) => (
                  <span key={idx} className="text-sm">{r.emoji}</span>
                ))}
              </div>
            )}
            
            {!m.deletedForEveryone && (
              <button
                onClick={(e) => handleReactionClick(e, m)}
                className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 bg-white rounded-full p-1 shadow-md border border-gray-200 hover:scale-110 transition"
              >
                😊
              </button>
            )}
            
            <div className={`text-xs mt-1 ${m.fromSelf ? 'text-pink-100' : 'text-gray-500'}`}>
              {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => dispatch(closeAllMenus())} />
          <div
            className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl py-2 min-w-[180px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={() => handleDeleteMessage(contextMenu.message._id, 'forMe')}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
            >
              Delete for Me
            </button>
            {contextMenu.message.fromSelf && (
              <button
                onClick={() => handleDeleteMessage(contextMenu.message._id, 'forEveryone')}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
              >
                Delete for Everyone
              </button>
            )}
          </div>
        </>
      )}

      {/* Reaction Menu */}
      {reactionMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => dispatch(closeAllMenus())} />
          <div
            className="fixed z-50 bg-white border border-gray-300 rounded-full shadow-xl px-3 py-2 flex gap-2"
            style={{ top: reactionMenu.y - 50, left: reactionMenu.x - 100 }}
          >
            {['❤️', '😂', '😮', '😢', '🙏', '👍'].map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReaction(reactionMenu.message._id, emoji)}
                className="text-2xl hover:scale-125 transition"
              >
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
                  <button
                    onClick={capturePhoto}
                    className="bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
                  >
                    📸 Capture Photo
                  </button>
                  <button
                    onClick={closeCamera}
                    className="bg-red-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-600 transition"
                  >
                    ✕ Cancel
                  </button>
                </>
              ) : (
                <>
                  {!isRecordingVideo ? (
                    <button
                      onClick={startVideoRecording}
                      className="bg-red-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-600 transition"
                    >
                      ⏺ Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopVideoRecording}
                      className="bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition animate-pulse"
                    >
                      ⏹ Stop & Send
                    </button>
                  )}
                  <button
                    onClick={closeCamera}
                    className="bg-gray-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-600 transition"
                  >
                    ✕ Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
          onClick={() => dispatch(setZoomedImage(null))}
        >
          <button
            onClick={() => dispatch(setZoomedImage(null))}
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition"
          >
            <IoMdClose className="text-3xl" />
          </button>
          <img 
            src={zoomedImage} 
            alt="Zoomed" 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-200 bg-white">
        {uploading && (
          <div className="mb-2 text-sm text-blue-600 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Uploading...
          </div>
        )}
        
        <form onSubmit={onSend} className="flex gap-2 items-center relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'video')}
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => {}}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
            title="Emoji"
          >
            <BsEmojiSmile className="text-2xl" />
          </button>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
            title="Send Image"
          >
            <MdImage className="text-2xl" />
          </button>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => dispatch(toggleMediaMenu())}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
              title="More options"
            >
              <IoMdAdd className="text-2xl" />
            </button>
            
            {showMediaMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => dispatch(closeMediaMenu())} />
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] z-40">
                  <button
                    onClick={() => openCamera('photo')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-left"
                  >
                    <MdCamera className="text-xl text-blue-500" />
                    <span className="text-sm font-medium">Take Photo</span>
                  </button>
                  
                  <button
                    onClick={() => { fileInputRef.current?.click(); dispatch(closeMediaMenu()) }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-left"
                  >
                    <MdPhotoLibrary className="text-xl text-green-500" />
                    <span className="text-sm font-medium">Photo Gallery</span>
                  </button>
                  
                  <button
                    onClick={() => openCamera('video')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-left"
                  >
                    <MdVideocam className="text-xl text-red-500" />
                    <span className="text-sm font-medium">Record Video</span>
                  </button>
                  
                  <button
                    onClick={() => { videoInputRef.current?.click(); dispatch(closeMediaMenu()) }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition text-left"
                  >
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
            placeholder="Type a message"
            className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          
          <button
            type="submit"
            disabled={!text.trim() || uploading}
            className="p-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send"
          >
            <MdSend className="text-2xl" />
          </button>
        </form>
      </div>
    </div>
  )
}
