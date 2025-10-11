import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe } from '../services/userService.js'
import { updateProfile, changePassword, deleteGalleryImage } from '../services/profileService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { MdPerson } from 'react-icons/md'
import { toast } from 'react-toastify'
import { getAppSettings } from '../services/adminService.js'

export default function EditProfilePage() {
  const nav = useNavigate()
  const { user: currentUser, setUser } = useAuth()
  const [form, setForm] = useState({
    name: '', fatherName: '', motherName: '', age: '', dateOfBirth: '', maritalStatus: '', disability: '', countryOfOrigin: '',
    state: '', district: '', city: '', area: '', location: '', education: '', occupation: '', languagesKnown: '', numberOfSiblings: '',
    lookingFor: '', about: '', gender: '',
    isPublic: false
  })
  const [readonlyInfo, setReadonlyInfo] = useState({ email: '', contact: '', itNumber: '' })
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null)
  const [slotFiles, setSlotFiles] = useState(Array(8).fill(null))
  const [existingGallery, setExistingGallery] = useState([])
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState('')
  const [tab, setTab] = useState('profile')
  const [globalVisibilityMode, setGlobalVisibilityMode] = useState('public')

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
      const [data, appSettings] = await Promise.all([getMe(), getAppSettings()])
      setGlobalVisibilityMode(appSettings?.profileIdVisibilityMode || 'public')
      setForm({
        name: data.name || '',
        fatherName: data.fatherName || '',
        motherName: data.motherName || '',
        age: data.age || '',
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().slice(0,10) : '',
        maritalStatus: data.maritalStatus || '',
        disability: data.disability || '',
        countryOfOrigin: data.countryOfOrigin || '',
        state: data.state || '',
        district: data.district || '',
        city: data.city || '',
        area: data.area || '',
        location: data.location || '',
        education: data.education || '',
        occupation: data.occupation || '',
        languagesKnown: Array.isArray(data.languagesKnown) ? data.languagesKnown.join(', ') : (data.languagesKnown || ''),
        numberOfSiblings: (data.numberOfSiblings ?? '') + '',
        lookingFor: data.lookingFor || '',
        about: data.about || '',
        gender: data.gender || '',
        isPublic: !!data.isPublic
      })
      setReadonlyInfo({ email: data.email || '', contact: data.contact || '', itNumber: data.itNumber || '' })
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
      // Prepare languagesKnown as array and number fields
      const payload = { ...form }
      if (payload.languagesKnown && typeof payload.languagesKnown === 'string') {
        payload.languagesKnown = payload.languagesKnown.split(',').map(s => s.trim()).filter(Boolean)
      }
      if (payload.numberOfSiblings !== '') payload.numberOfSiblings = Number(payload.numberOfSiblings)
      // Append to FormData
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') fd.append(k, v)
      })
      // Always include visibility flag explicitly
      fd.set('isPublic', form.isPublic ? 'true' : 'false')
      if (profilePhoto) fd.append('profilePhoto', profilePhoto)
      slotFiles.forEach(f => { if (f) fd.append('galleryImages', f) })
      fd.append('replaceGallery', 'true')
      
      const res = await updateProfile(fd)
      toast.success('✅ Changes submitted. Waiting for approval.', {
        position: 'top-center',
        autoClose: 4000
      })
      setInfo(res?.message || 'Waiting for approval')
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
    <div className="min-h-screen bg-[#FFF8E7] flex items-center justify-center p-4 pb-24 md:pb-4">
      <div className="w-full max-w-sm md:max-w-2xl lg:max-w-3xl">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <button onClick={() => nav(-1)} className="text-amber-600">
            </button>
            <h1 className="text-lg font-bold text-amber-600">PROFILE</h1>
            <button className="text-gray-500">
            </button>
          </div>

          {/* Profile Section */}
          <div className="px-6 py-8 text-center">
            {/* Profile Photo with Upload */}
            <div className="mb-4">
              <label className="cursor-pointer">
                <div className="w-24 h-24 mx-auto bg-yellow-200 rounded-full flex items-center justify-center overflow-hidden">
                  {displayPhoto ? (
                    <img src={displayPhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-amber-600">{firstLetter}</span>
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
            <h2 className="text-xl font-bold text-amber-600 mb-6">{currentUser?.name || 'John Doe'}</h2>

            {/* Read-only identifiers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 text-left">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input value={readonlyInfo.email} disabled className="w-full border border-yellow-300 rounded-lg p-2 text-sm bg-gray-100 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Contact</label>
                <input value={readonlyInfo.contact} disabled className="w-full border border-yellow-300 rounded-lg p-2 text-sm bg-gray-100 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">IT Number</label>
                <input value={readonlyInfo.itNumber} disabled className="w-full border border-yellow-300 rounded-lg p-2 text-sm bg-gray-100 cursor-not-allowed" />
              </div>
            </div>

            {info && <div className="mb-4 p-3 bg-yellow-50 text-amber-700 rounded-lg text-sm">{info}</div>}

            {/* Privacy Section */}
            <div className="border border-yellow-300 rounded-xl p-4 mb-6 text-left">
              <h3 className="text-amber-600 font-semibold mb-3">PROFILE VISIBILITY</h3>
              {globalVisibilityMode === 'public' ? (
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!form.isPublic}
                    onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">
                    Make my profile <span className="font-semibold">Public</span> (others can view all photos and details without connection. Chat still requires mutual follow.)
                  </span>
                </label>
              ) : (
                <div className="text-sm text-gray-600 italic">
                  ℹ️ Admin enforced: All profiles are <span className="font-semibold">Private</span>. Users must connect to view details.
                </div>
              )}
            </div>

            {/* Photos Section */}
            <div className="border border-yellow-300 rounded-xl p-4 mb-6">
              <h3 className="text-left text-amber-600 font-semibold mb-3">PHOTOS</h3>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => {
                  const item = slotViews[i]
                  return (
                    <div key={i} className="relative group">
                      <label className="block w-full aspect-square rounded-lg overflow-hidden border border-yellow-200 bg-yellow-50 cursor-pointer">
                        {item ? (
                          <img src={item.kind === 'existing' ? item.url : item.previewUrl} alt={`photo-${i+1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-yellow-100"></div>
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
                <input name='name' placeholder='Full Name' value={form.name} onChange={onChange} className="w-full border border-yellow-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-yellow-50" />
                <input name='fatherName' placeholder='Father Name' value={form.fatherName} onChange={onChange} className="w-full border border-yellow-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-yellow-50" />
                <input name='motherName' placeholder='Mother Name' value={form.motherName} onChange={onChange} className="w-full border border-yellow-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-yellow-50" />
                <input name='age' placeholder='Age' value={form.age} onChange={onChange} className="w-full border border-yellow-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-yellow-50" />
                <input name='location' placeholder='Location' value={form.location} onChange={onChange} className="w-full border border-yellow-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-yellow-50" />
                <input name='education' placeholder='Education' value={form.education} onChange={onChange} className="w-full border border-yellow-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-yellow-50" />
                <input name='occupation' placeholder='Occupation' value={form.occupation} onChange={onChange} className="w-full border border-yellow-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-yellow-50" />
                <textarea name='about' placeholder='About yourself' value={form.about} onChange={onChange} className="w-full border border-yellow-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-yellow-50 resize-none h-20" />

                <button disabled={loading} type='submit' className={`w-full bg-amber-600 text-white font-semibold py-3 rounded-lg hover:bg-amber-700 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
                  className="w-full border border-yellow-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-yellow-50"
                />
                <input
                  type='password'
                  name='newPassword'
                  placeholder='New Password'
                  value={passwordForm.newPassword}
                  onChange={onPasswordChange}
                  className="w-full border border-yellow-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-yellow-50"
                />
                <input
                  type='password'
                  name='confirmPassword'
                  placeholder='Confirm New Password'
                  value={passwordForm.confirmPassword}
                  onChange={onPasswordChange}
                  className="w-full border border-yellow-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-yellow-50"
                />
                <button disabled={loading} type='submit' className={`w-full bg-amber-600 text-white font-semibold py-3 rounded-lg hover:bg-amber-700 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
