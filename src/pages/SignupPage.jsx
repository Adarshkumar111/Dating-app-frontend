import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signup } from '../services/authService.js'
import { toast } from 'react-toastify'

export default function SignupPage() {
  const nav = useNavigate()
  const [form, setForm] = useState({
    name: '', fatherName: '', motherName: '', age: '', itNumber: '', gender: 'male',
    location: '', contact: '', email: '', password: '', education: '', occupation: '', about: ''
  })
  const [itCardPhoto, setItCardPhoto] = useState(null)
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (itCardPhoto) fd.append('itCardPhoto', itCardPhoto)
      if (profilePhoto) fd.append('profilePhoto', profilePhoto)
      await signup(fd)
      setLoading(false)
      toast.success('OTP sent on your mail')
      nav('/verify-email', { state: { email: form.email } })
    } catch (error) {
      setLoading(false)
      alert(error.response?.data?.message || 'Signup failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-premium-gradient rounded-full flex items-center justify-center mb-6 animate-pulse-glow">
            <span className="text-2xl font-bold text-white">M</span>
          </div>
          <h2 className="text-3xl font-bold text-blue-800 mb-2">Join M Nikah</h2>
          <p className="text-gray-600">Create your profile and find your perfect match</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 transform hover:scale-105 transition-all duration-300">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-800 border-b border-gray-200 pb-2">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Full Name *</label>
                  <input name='name' placeholder='Enter your full name' value={form.name} onChange={onChange} required className="input-premium w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Age</label>
                  <input name='age' type='number' placeholder='Your age' value={form.age} onChange={onChange} className="input-premium w-full" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Father's Name</label>
                  <input name='fatherName' placeholder="Father's name" value={form.fatherName} onChange={onChange} className="input-premium w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Mother's Name</label>
                  <input name='motherName' placeholder="Mother's name" value={form.motherName} onChange={onChange} className="input-premium w-full" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Gender *</label>
                  <select name='gender' value={form.gender} onChange={onChange} required className="input-premium w-full">
                    <option value='male'>Male</option>
                    <option value='female'>Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Location</label>
                  <input name='location' placeholder='Your location' value={form.location} onChange={onChange} className="input-premium w-full" />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-800 border-b border-gray-200 pb-2">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Email *</label>
                  <input name='email' type='email' placeholder='Your email address' value={form.email} onChange={onChange} required className="input-premium w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Contact Number *</label>
                  <input name='contact' placeholder='Your phone number' value={form.contact} onChange={onChange} required className="input-premium w-full" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">Password *</label>
                <input type='password' name='password' placeholder='Create a strong password' value={form.password} onChange={onChange} required className="input-premium w-full" />
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-800 border-b border-gray-200 pb-2">Professional Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Education</label>
                  <input name='education' placeholder='Your education background' value={form.education} onChange={onChange} className="input-premium w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Occupation</label>
                  <input name='occupation' placeholder='Your profession' value={form.occupation} onChange={onChange} className="input-premium w-full" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">IT Number</label>
                <input name='itNumber' placeholder='Your IT number (if applicable)' value={form.itNumber} onChange={onChange} className="input-premium w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">About Yourself</label>
                <textarea name='about' placeholder='Tell us about yourself...' value={form.about} onChange={onChange} rows={4} className="input-premium w-full resize-none" />
              </div>
            </div>

            {/* Photo Uploads */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-800 border-b border-gray-200 pb-2">Photo Uploads</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">IT Card Photo</label>
                  <label className="flex items-center justify-between border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-all duration-300">
                    <span className="text-sm text-gray-600">{itCardPhoto ? itCardPhoto.name : "Choose ID card photo"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => setItCardPhoto(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <span className="bg-pink-500 text-white px-3 py-1 rounded-lg text-sm font-semibold">Browse</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Profile Photo</label>
                  <label className="flex items-center justify-between border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-all duration-300">
                    <span className="text-sm text-gray-600">{profilePhoto ? profilePhoto.name : "Choose profile photo"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <span className="bg-pink-500 text-white px-3 py-1 rounded-lg text-sm font-semibold">Browse</span>
                  </label>
                </div>
              </div>
            </div>

            <button 
              disabled={loading} 
              type='submit' 
              className={`btn-accent w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create My Account'
              )}
            </button>
          </form>

          <div className="text-center border-t border-gray-200 pt-6">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link 
                to='/login' 
                className="text-pink-500 font-semibold hover:text-pink-600 transition-colors duration-300"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
