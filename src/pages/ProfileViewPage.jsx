import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProfile } from '../services/userService.js'
import { sendRequest, unfollow } from '../services/requestService.js'
import { useAppSelector } from '../store/hooks'

export default function ProfileViewPage() {
  const { id } = useParams()
  const { user: currentUser } = useAppSelector(state => state.auth)
  const nav = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [info, setInfo] = useState('')

  const loadProfile = async () => {
    try {
      const data = await getProfile(id)
      setProfile(data)
      setLoading(false)
    } catch (e) {
      setInfo(e.response?.data?.message || 'Error loading profile')
      setLoading(false)
    }
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

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg font-sans">
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
            <span className="text-6xl font-bold text-white">{profile.name}</span>
          </div>
        )}
        
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{profile.name}</h2>
        {profile.location && <p className="text-gray-500 mb-4">{profile.location}</p>}
        
        {/* Action Buttons */}
        {!isOwnProfile && (
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
      {profile.isConnected || isOwnProfile ? (
        <>
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
