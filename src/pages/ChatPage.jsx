import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import { getChatWithUser, sendMessage as sendMsg, deleteMessage as delMsg, addReaction as addReact, uploadMedia } from '../services/chatService.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function ChatPage() {
  const { chatId: userIdParam } = useParams() // This is actually userId, not chatId
  const { user: currentUser } = useAuth()
  const [chatData, setChatData] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [contextMenu, setContextMenu] = useState(null)
  const [reactionMenu, setReactionMenu] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const chatEndRef = useRef(null)
  const socketRef = useRef(null)
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const recordingIntervalRef = useRef(null)

  const loadChat = async () => {
    try {
      const data = await getChatWithUser(userIdParam)
      setChatData(data)
      setMessages(data.messages || [])
      setLoading(false)
      
      // Connect socket
      if (!socketRef.current) {
        socketRef.current = io('http://localhost:5000', { 
          transports: ['websocket'],
          auth: { token: localStorage.getItem('token') }
        })
        
        socketRef.current.emit('join', data.chatId)
        
        socketRef.current.on('message', (m) => {
          setMessages(prev => [...prev, {
            _id: m._id,
            text: m.text,
            sender: m.sender,
            sentAt: m.sentAt,
            fromSelf: String(m.sender) === String(currentUser.id)
          }])
        })

        socketRef.current.on('messageDeleted', ({ messageId, deleteType }) => {
          if (deleteType === 'forEveryone') {
            setMessages(prev => prev.filter(m => String(m._id) !== String(messageId)))
          }
        })

        socketRef.current.on('reactionUpdated', ({ messageId, reactions }) => {
          setMessages(prev => prev.map(m => 
            String(m._id) === String(messageId) ? { ...m, reactions } : m
          ))
        })
      }
    } catch (e) {
      console.error('Load chat error:', e)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChat()
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [userIdParam])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const onSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || !chatData) return
    
    try {
      await sendMsg(chatData.chatId, { messageText: text, messageType: 'text' })
      setText('')
    } catch (e) {
      console.error('Send error:', e)
    }
  }

  const handleFileUpload = async (file, type) => {
    if (!chatData) return
    
    // Validate video duration (max 2 minutes)
    if (type === 'video') {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = async () => {
        window.URL.revokeObjectURL(video.src)
        if (video.duration > 120) {
          alert('Video must be less than 2 minutes')
          return
        }
        await uploadAndSend(file, type, video.duration)
      }
      video.src = URL.createObjectURL(file)
    } else {
      await uploadAndSend(file, type)
    }
  }

  const uploadAndSend = async (file, type, duration = null) => {
    setUploading(true)
    try {
      const { mediaUrl } = await uploadMedia(chatData.chatId, file)
      await sendMsg(chatData.chatId, {
        messageText: '',
        messageType: type,
        mediaUrl,
        mediaDuration: duration
      })
    } catch (e) {
      alert('Upload failed: ' + (e.response?.data?.message || e.message))
    }
    setUploading(false)
  }

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        await uploadAndSend(file, 'voice', recordingTime)
        stream.getTracks().forEach(track => track.stop())
        setRecordingTime(0)
      }

      recorder.start()
      setMediaRecorder(recorder)
      setRecording(true)

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (e) {
      alert('Microphone access denied')
    }
  }

  const stopVoiceRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setMediaRecorder(null)
      setRecording(false)
      clearInterval(recordingIntervalRef.current)
    }
  }

  const handleReaction = async (messageId, emoji) => {
    try {
      await addReact(chatData.chatId, messageId, emoji)
      setReactionMenu(null)
    } catch (e) {
      console.error('Reaction error:', e)
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

  const handleContextMenu = (e, message) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, message })
    setReactionMenu(null)
  }

  const handleReactionClick = (e, message) => {
    e.stopPropagation()
    setReactionMenu({ x: e.clientX, y: e.clientY, message })
    setContextMenu(null)
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderMessage = (m) => {
    if (m.messageType === 'image') {
      return (
        <div className="relative">
          <img src={m.mediaUrl} alt="shared" className="max-w-full rounded-lg max-h-64 object-cover" />
          {m.text && <div className="mt-2">{m.text}</div>}
        </div>
      )
    }
    
    if (m.messageType === 'video') {
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
    
    if (m.messageType === 'voice') {
      return (
        <div className="flex items-center gap-2">
          <audio controls className="max-w-full">
            <source src={m.mediaUrl} type="audio/webm" />
          </audio>
          {m.mediaDuration && (
            <span className="text-xs">{formatDuration(Math.floor(m.mediaDuration))}</span>
          )}
        </div>
      )
    }
    
    return <div>{m.text}</div>
  }

  const getOtherUser = () => {
    if (!chatData?.users) return null
    return chatData.users.find(u => String(u._id) !== String(currentUser.id))
  }

  if (loading) return <div className="text-center mt-20">Loading chat...</div>
  if (!chatData) return <div className="text-center mt-20">Chat not found</div>

  const otherUser = getOtherUser()

  return (
    <div className="max-w-2xl mx-auto my-5 h-[80vh] flex flex-col bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
      
      {/* Header with User Info */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-pink-500 to-orange-500 text-white">
        <Link to={`/profile/${otherUser?._id}`} className="flex items-center gap-3 hover:opacity-80 transition">
          {otherUser?.profilePhoto ? (
            <img src={otherUser.profilePhoto} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white text-pink-500 flex items-center justify-center font-bold">
              {otherUser?.name?.charAt(0) || 'U'}
            </div>
          )}
          <div>
            <div className="font-semibold text-lg">{otherUser?.name || 'User'}</div>
            <div className="text-xs text-pink-100">Click to view profile</div>
          </div>
        </Link>
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
            
            {/* Reactions */}
            {m.reactions && m.reactions.length > 0 && (
              <div className="absolute -bottom-2 right-2 flex gap-1 bg-white rounded-full px-2 py-0.5 shadow-md border border-gray-200">
                {m.reactions.map((r, idx) => (
                  <span key={idx} className="text-sm">{r.emoji}</span>
                ))}
              </div>
            )}
            
            {/* Reaction Button */}
            <button
              onClick={(e) => handleReactionClick(e, m)}
              className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 bg-white rounded-full p-1 shadow-md border border-gray-200 hover:scale-110 transition"
            >
              😊
            </button>
            
            <div className={`text-xs mt-1 ${m.fromSelf ? 'text-pink-100' : 'text-gray-500'}`}>
              {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Context Menu for Delete */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
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
          <div className="fixed inset-0 z-40" onClick={() => setReactionMenu(null)} />
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

      {/* Input */}
      <div className="p-3 border-t border-gray-200 bg-white">
        {uploading && (
          <div className="mb-2 text-sm text-blue-600">Uploading...</div>
        )}
        
        {recording && (
          <div className="mb-2 flex items-center gap-3 bg-red-50 p-3 rounded-lg">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-600 font-semibold">Recording: {formatDuration(recordingTime)}</span>
            <button
              onClick={stopVoiceRecording}
              className="ml-auto bg-red-500 text-white px-4 py-1 rounded-full hover:bg-red-600"
            >
              Stop & Send
            </button>
          </div>
        )}
        
        <form onSubmit={onSend} className="flex gap-2 items-center">
          {/* Media Buttons */}
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
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
            title="Send Image"
          >
            📷
          </button>
          
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
            title="Send Video (max 2 min)"
          >
            🎥
          </button>
          
          <button
            type="button"
            onClick={recording ? stopVoiceRecording : startVoiceRecording}
            className={`p-2 hover:bg-gray-100 rounded-full transition ${recording ? 'text-red-500' : 'text-gray-600'}`}
            title="Voice Note"
          >
            🎤
          </button>
          
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message"
            className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          
          <button
            type="submit"
            disabled={!text.trim() || uploading || recording}
            className="px-5 py-2 bg-pink-500 text-white font-semibold rounded-full hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
