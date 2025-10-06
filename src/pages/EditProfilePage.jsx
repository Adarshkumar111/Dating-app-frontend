import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe } from '../services/userService.js'
import { updateProfile, changePassword, deleteGalleryImage } from '../services/profileService.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function EditProfilePage() {
  const nav = useNavigate()
  const { user: currentUser, setUser } = useAuth()
  const [form, setForm] = useState({
    name: '', fatherName: '', motherName: '', age: '', location: '', education: '', occupation: '', about: ''
  })
  const [profilePhoto, setProfilePhoto] = useState(null)
  // 8-slot files, index = slot number (0..7)
  const [slotFiles, setSlotFiles] = useState(Array(8).fill(null))
  const [existingGallery, setExistingGallery] = useState([])
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState('')
  const [tab, setTab] = useState('profile')

  // Per-slot selection
  const handleSelectSlot = (idx, file) => {
    setSlotFiles(prev => {
      const next = [...prev]
      next[idx] = file || null
      return next
    })
  }
  const clearSlot = (idx) => handleSelectSlot(idx, null)

  // Slot data for UI: prefer selected file preview; else show existingGallery[idx]
  const slotViews = Array.from({ length: 8 }).map((_, i) => {
    const file = slotFiles[i]
    if (file) return { kind: 'new', previewUrl: URL.createObjectURL(file) }
    const url = existingGallery[i]
    if (url) return { kind: 'existing', url }
    return null
  })

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
      // Send all selected files in slot order; use replace mode
      slotFiles.forEach(f => { if (f) fd.append('galleryImages', f) })
      fd.append('replaceGallery', 'true')
      
      const res = await updateProfile(fd)
      setInfo(res?.message || 'Edits submitted for admin approval')
      setLoading(false)
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
            <label className="font-medium text-gray-700 block mb-2">Gallery Photos (8 slots):</label>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 8 }).map((_, i) => {
                const item = slotViews[i]
                const isPrimary = i === 0
                return (
                  <div key={i} className="relative group">
                    <label className="block w-full h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer">
                      {item ? (
                        <img src={item.kind === 'existing' ? item.url : item.previewUrl} alt={`slot-${i+1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Empty</div>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleSelectSlot(i, e.target.files?.[0] || null)}
                      />
                    </label>
                    <span className={`absolute top-1 left-1 text-[10px] px-2 py-0.5 rounded-full ${isPrimary ? 'bg-pink-500 text-white' : 'bg-white/90 text-gray-700'}`}>{isPrimary ? 'Primary' : `#${i+1}`}</span>
                    {item && (
                      <button
                        type="button"
                        onClick={() => (item.kind === 'existing' ? handleDeleteImage(item.url) : clearSlot(i))}
                        className="absolute top-1 right-1 bg-gray-900/70 text-white rounded-full w-6 h-6 text-xs hover:bg-black"
                        title="Remove"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded mt-2 p-2">On save, gallery will be replaced by the selected files in slot order. Leave a slot empty to omit that position.</p>
          </div>

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
