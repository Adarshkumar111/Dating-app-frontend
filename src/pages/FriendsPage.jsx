import React, { useEffect, useState } from 'react'
import { getFriends } from '../services/userService.js'
import { Link, useNavigate } from 'react-router-dom'
import { BsChatDots } from 'react-icons/bs'
import { MdBlock } from 'react-icons/md'

export default function FriendsPage() {
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadFriends = async () => {
    try {
      const data = await getFriends()
      setFriends(data.friends || [])
      setLoading(false)
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFriends()
    // Refresh every 10 seconds to update unread counts
    const interval = setInterval(loadFriends, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="text-center mt-10">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto mt-6 p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Friends</h2>
        <div className="text-sm text-gray-600">{friends.length} friends</div>
      </div>

      {friends.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Friends Yet</h3>
          <p className="text-gray-500">Start following people from the Discover page!</p>
          <Link 
            to="/dashboard" 
            className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-orange-600 transition"
          >
            Discover People
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {friends.map((friend) => (
            <div 
              key={friend._id} 
              className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition ${
                friend.isBlocked ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center p-4">
                {/* Profile Photo */}
                <Link to={`/profile/${friend._id}`} className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                    {friend.profilePhoto ? (
                      <img 
                        src={friend.profilePhoto} 
                        alt={friend.name} 
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      friend.name?.[0]?.toUpperCase() || '?'
                    )}
                  </div>
                </Link>

                {/* Friend Info */}
                <div className="ml-4 flex-1 min-w-0">
                  <Link 
                    to={`/profile/${friend._id}`}
                    className="font-bold text-lg text-gray-900 hover:text-pink-600 transition truncate block"
                  >
                    {friend.name}
                  </Link>
                  {friend.age && friend.location && (
                    <p className="text-sm text-gray-600">{friend.age} • {friend.location}</p>
                  )}
                  {friend.about && (
                    <p className="text-sm text-gray-500 truncate mt-1">{friend.about}</p>
                  )}
                  
                  {friend.isBlocked && (
                    <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                      <MdBlock />
                      <span>
                        {String(friend.blockedBy) === String(friend._id) 
                          ? 'They blocked you' 
                          : 'You blocked them'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Message Button with Counter */}
                {!friend.isBlocked && (
                  <button
                    onClick={() => navigate(`/chat/${friend._id}`)}
                    className="ml-4 relative p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition shadow-md"
                    title="Open chat"
                  >
                    <BsChatDots className="text-xl" />
                    {friend.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                        {friend.unreadCount > 9 ? '9+' : friend.unreadCount}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
