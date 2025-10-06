import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe } from '../services/userService.js'
import { updateProfile, changePassword, deleteGalleryImage } from '../services/profileService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { MdPerson } from 'react-icons/md'
import { toast } from 'react-toastify'

export default function EditProfilePage() {
  const nav = useNavigate()
  const { user: currentUser, setUser } = useAuth()
  const [form, setForm] = useState({
    name: '', fatherName: '', motherName: '', age: '', location: '', education: '', occupation: '', about: ''
  })
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null)
  const [slotFiles, setSlotFiles] = useState(Array(8).fill(null))
  const [existingGallery, setExistingGallery] = useState([])
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState('')
  const [tab, setTab] = useState('profile')

  const handleSelectSlot = (idx, file) => {
    setSlotFiles(prev => {
      const next = [...prev]
      next[idx] = file || null
      return next
    })
  }
  const clearSlot = (idx) => handleSelectSlot(idx, null)

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

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfilePhoto(file)
      setProfilePhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (profilePhoto) fd.append('profilePhoto', profilePhoto)
      slotFiles.forEach(f => { if (f) fd.append('galleryImages', f) })
      fd.append('replaceGallery', 'true')
      
      const res = await updateProfile(fd)
      toast.success('✅ Your profile changes have been submitted for admin approval!', {
        position: 'top-center',
        autoClose: 4000
      })
      setInfo(res?.message || 'Edits submitted for admin approval')
      setLoading(false)
    } catch (error) {
      setLoading(false)
      const errorMsg = error.response?.data?.message || 'Update failed'
      toast.error(errorMsg, {
        position: 'top-center',
        autoClose: 3000
      })
      setInfo(errorMsg)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match', {
        position: 'top-center',
        autoClose: 3000
      })
      setInfo('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      toast.success('🔐 Password changed successfully!', {
        position: 'top-center',
        autoClose: 3000
      })
      setInfo('Password changed successfully!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setLoading(false)
    } catch (error) {
      setLoading(false)
      const errorMsg = error.response?.data?.message || 'Password change failed'
      toast.error(errorMsg, {
        position: 'top-center',
        autoClose: 3000
      })
      setInfo(errorMsg)
    }
  }

  const handleDeleteImage = async (imageUrl) => {
    try {
      await deleteGalleryImage(imageUrl)
      setExistingGallery(existingGallery.filter(img => img !== imageUrl))
      toast.success('🗑️ Image deleted successfully', {
        position: 'top-center',
        autoClose: 2000
      })
      setInfo('Image deleted')
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Delete failed'
      toast.error(errorMsg, {
        position: 'top-center',
        autoClose: 3000
      })
      setInfo(errorMsg)
    }
  }

  const displayPhoto = profilePhotoPreview || currentUser?.profilePhoto
  const firstLetter = currentUser?.name?.[0]?.toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm md:max-w-2xl lg:max-w-3xl">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <button onClick={() => nav(-1)} className="text-blue-500">
            </button>
            <h1 className="text-lg font-bold text-blue-500">PROFILE</h1>
            <button className="text-gray-500">
            </button>
          </div>

          {/* Profile Section */}
          <div className="px-6 py-8 text-center">
            {/* Profile Photo with Upload */}
            <div className="mb-4">
              <label className="cursor-pointer">
                <div className="w-24 h-24 mx-auto bg-blue-200 rounded-full flex items-center justify-center overflow-hidden">
                  {displayPhoto ? (
                    <img src={displayPhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-blue-500">{firstLetter}</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleProfilePhotoChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Name */}
            <h2 className="text-xl font-bold text-blue-500 mb-6">{currentUser?.name || 'John Doe'}</h2>

            {info && <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">{info}</div>}

            {/* Photos Section */}
            <div className="border border-blue-200 rounded-xl p-4 mb-6">
              <h3 className="text-left text-blue-500 font-semibold mb-3">PHOTOS</h3>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => {
                  const item = slotViews[i]
                  return (
                    <div key={i} className="relative group">
                      <label className="block w-full aspect-square rounded-lg overflow-hidden border border-blue-100 bg-blue-50 cursor-pointer">
                        {item ? (
                          <img src={item.kind === 'existing' ? item.url : item.previewUrl} alt={`photo-${i+1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-100"></div>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => handleSelectSlot(i, e.target.files?.[0] || null)}
                        />
                      </label>
                      {item && (
                        <button
                          type="button"
                          onClick={() => (item.kind === 'existing' ? handleDeleteImage(item.url) : clearSlot(i))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600"
                          title="Remove"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Edit Form */}
            {tab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-3 text-left">
                <input name='name' placeholder='Full Name' value={form.name} onChange={onChange} className="w-full border border-blue-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50" />
                <input name='fatherName' placeholder='Father Name' value={form.fatherName} onChange={onChange} className="w-full border border-blue-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50" />
                <input name='motherName' placeholder='Mother Name' value={form.motherName} onChange={onChange} className="w-full border border-blue-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50" />
                <input name='age' placeholder='Age' value={form.age} onChange={onChange} className="w-full border border-blue-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50" />
                <input name='location' placeholder='Location' value={form.location} onChange={onChange} className="w-full border border-blue-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50" />
                <input name='education' placeholder='Education' value={form.education} onChange={onChange} className="w-full border border-blue-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50" />
                <input name='occupation' placeholder='Occupation' value={form.occupation} onChange={onChange} className="w-full border border-blue-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50" />
                <textarea name='about' placeholder='About yourself' value={form.about} onChange={onChange} className="w-full border border-blue-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50 resize-none h-20" />

                <button disabled={loading} type='submit' className={`w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {loading ? 'Updating...' : 'Save Changes'}
                </button>

                <button 
                  type="button"
                  onClick={() => setTab('password')}
                  className="w-full bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  Change Password
                </button>
              </form>
            )}

            {/* Password Tab */}
            {tab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-3 text-left">
                <input
                  type='password'
                  name='currentPassword'
                  placeholder='Current Password'
                  value={passwordForm.currentPassword}
                  onChange={onPasswordChange}
                  className="w-full border border-blue-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
                />
                <input
                  type='password'
                  name='newPassword'
                  placeholder='New Password'
                  value={passwordForm.newPassword}
                  onChange={onPasswordChange}
                  className="w-full border border-blue-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
                />
                <input
                  type='password'
                  name='confirmPassword'
                  placeholder='Confirm New Password'
                  value={passwordForm.confirmPassword}
                  onChange={onPasswordChange}
                  className="w-full border border-blue-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
                />
                <button disabled={loading} type='submit' className={`w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
                <button 
                  type="button"
                  onClick={() => setTab('profile')}
                  className="w-full bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  Back to Profile
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
