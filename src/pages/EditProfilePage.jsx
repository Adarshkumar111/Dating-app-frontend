import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe } from '../services/userService.js'
import { updateProfile, changePassword, deleteGalleryImage } from '../services/profileService.js'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { updateUser } from '../store/slices/authSlice'

export default function EditProfilePage() {
  const nav = useNavigate()
  const dispatch = useAppDispatch()
  const { user: currentUser } = useAppSelector(state => state.auth)
  const [form, setForm] = useState({
    name: '', fatherName: '', motherName: '', age: '', location: '', education: '', occupation: '', about: ''
  })
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [galleryImages, setGalleryImages] = useState([])
  const [existingGallery, setExistingGallery] = useState([])
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState('')
  const [tab, setTab] = useState('profile')

  useEffect(() => {
    (async () => {
      const data = await getMe()
      setForm({
        name: data.name || '',
        fatherName: data.fatherName || '',
        motherName: data.motherName || '',
        age: data.age || '',
        location: data.location || '',
        education: data.education || '',
        occupation: data.occupation || '',
        about: data.about || ''
      })
      setExistingGallery(data.galleryImages || [])
    })()
  }, [])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const onPasswordChange = (e) => setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value })

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (profilePhoto) fd.append('profilePhoto', profilePhoto)
      galleryImages.forEach(img => fd.append('galleryImages', img))
      
      const res = await updateProfile(fd)
      setInfo('Profile updated successfully!')
      dispatch(updateUser(res.user))
      setLoading(false)
      setTimeout(() => nav(`/profile/${currentUser.id}`), 1500)
    } catch (error) {
      setLoading(false)
      setInfo(error.response?.data?.message || 'Update failed')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setInfo('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      setInfo('Password changed successfully!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setLoading(false)
    } catch (error) {
      setLoading(false)
      setInfo(error.response?.data?.message || 'Password change failed')
    }
  }

  const handleDeleteImage = async (imageUrl) => {
    try {
      await deleteGalleryImage(imageUrl)
      setExistingGallery(existingGallery.filter(img => img !== imageUrl))
      setInfo('Image deleted')
    } catch (error) {
      setInfo(error.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Edit Profile</h2>
      
      {info && <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg">{info}</div>}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setTab('profile')}
          className={`pb-2 px-4 font-semibold ${tab === 'profile' ? 'border-b-2 border-pink-500 text-pink-500' : 'text-gray-500'}`}
        >
          Profile Info
        </button>
        <button
          onClick={() => setTab('password')}
          className={`pb-2 px-4 font-semibold ${tab === 'password' ? 'border-b-2 border-pink-500 text-pink-500' : 'text-gray-500'}`}
        >
          Change Password
        </button>
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <input name='name' placeholder='Full Name' value={form.name} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <input name='fatherName' placeholder='Father Name' value={form.fatherName} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <input name='motherName' placeholder='Mother Name' value={form.motherName} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <input name='age' placeholder='Age' value={form.age} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <input name='location' placeholder='Location' value={form.location} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <input name='education' placeholder='Education' value={form.education} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <input name='occupation' placeholder='Occupation' value={form.occupation} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <textarea name='about' placeholder='About yourself' value={form.about} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none h-24" />

          <div>
            <label className="font-medium text-gray-700 block mb-2">Profile Photo:</label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded-lg p-3"
            />
          </div>

          <div>
            <label className="font-medium text-gray-700 block mb-2">Gallery Images (up to 8):</label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={(e) => setGalleryImages(Array.from(e.target.files || []).slice(0, 8))}
              className="w-full border border-gray-300 rounded-lg p-3"
            />
            <p className="text-sm text-gray-500 mt-1">Selected: {galleryImages.length} images</p>
          </div>

          {/* Existing Gallery */}
          {existingGallery.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Current Gallery:</h3>
              <div className="grid grid-cols-3 gap-3">
                {existingGallery.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img} alt={`gallery-${idx}`} className="w-full h-24 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button disabled={loading} type='submit' className={`w-full bg-pink-500 text-white font-semibold py-3 rounded-lg hover:bg-pink-600 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      )}

      {/* Password Tab */}
      {tab === 'password' && (
        <form onSubmit={handleChangePassword} className="space-y-4">
          <input
            type='password'
            name='currentPassword'
            placeholder='Current Password'
            value={passwordForm.currentPassword}
            onChange={onPasswordChange}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <input
            type='password'
            name='newPassword'
            placeholder='New Password'
            value={passwordForm.newPassword}
            onChange={onPasswordChange}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <input
            type='password'
            name='confirmPassword'
            placeholder='Confirm New Password'
            value={passwordForm.confirmPassword}
            onChange={onPasswordChange}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <button disabled={loading} type='submit' className={`w-full bg-pink-500 text-white font-semibold py-3 rounded-lg hover:bg-pink-600 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      )}
    </div>
  )
}
