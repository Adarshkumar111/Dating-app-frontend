import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '../services/authService.js'
import { toast } from 'react-toastify'
import { MdPerson } from 'react-icons/md'

export default function SignupPage() {
  const nav = useNavigate()
  
  // Golden theme input style
  const inputStyle = {
    backgroundColor: 'white',
    borderColor: '#D4AF37'
  }
  
  const [form, setForm] = useState({
    name: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    age: '',
    gender: 'male',
    maritalStatus: '',
    disability: '',
    countryOfOrigin: '',
    location: '',
    education: '',
    occupation: '',
    languagesKnown: '',
    numberOfSiblings: '',
    about: '',
    lookingFor: '',
    itNumber: '',
    contact: '',
    email: '',
    password: ''
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
      toast.success('OTP sent to your email')
      nav('/verify-email', { state: { email: form.email } })
    } catch (error) {
      setLoading(false)
      toast.error(error.response?.data?.message || 'Signup failed')
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-sm md:max-w-2xl lg:max-w-3xl">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{border: '2px solid #D4AF37'}}>
          {/* Profile Icon Header */}
          <div className="bg-white pt-6 pb-3 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2" style={{backgroundColor: 'white', border: '2px solid #D4AF37'}}>
              <MdPerson className="text-3xl" style={{color: '#B8860B'}} />
            </div>
            <h2 className="text-lg font-bold" style={{color: '#B8860B'}}>Create Your Profile</h2>
          </div>

          {/* Form Content */}
          <div className="px-6 md:px-12 pb-6 space-y-3">
            <form onSubmit={onSubmit} className="space-y-3">
              {/* Profile Photo Upload */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{color: '#B8860B'}}>Profile Photo (Private & Secure Upload)</label>
                <label className="flex items-center justify-between border-2 border-dashed rounded-xl p-3 cursor-pointer transition-all" style={{borderColor: '#D4AF37'}}>
                  <span className="text-sm text-gray-600">{profilePhoto ? profilePhoto.name : "Choose profile photo"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <span className="text-white px-3 py-1 rounded-lg text-sm font-semibold" style={{backgroundColor: '#B8860B'}}>Browse</span>
                </label>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium mb-1 text-golden">Full Name *</label>
                <input 
                  name='name' 
                  placeholder='John Doe' 
                  value={form.name} 
                  onChange={onChange} 
                  required 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm placeholder-gray-400"
                  style={{backgroundColor: 'white', borderColor: '#D4AF37'}}
                  onFocus={(e) => e.target.style.borderColor = '#B8860B'}
                  onBlur={(e) => e.target.style.borderColor = '#D4AF37'}
                />
              </div>

              {/* Father's Name */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">Father's Name</label>
                <input 
                  name='fatherName' 
                  placeholder="Father's name" 
                  value={form.fatherName} 
                  onChange={onChange}
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm placeholder-gray-400"
                />
              </div>

              {/* Mother's Name */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">Mother's Name</label>
                <input 
                  name='motherName' 
                  placeholder="Mother's name" 
                  value={form.motherName} 
                  onChange={onChange}
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm placeholder-gray-400"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">Date of Birth (DOB) *</label>
                <input 
                  name='dateOfBirth' 
                  type='date'
                  value={form.dateOfBirth} 
                  onChange={onChange}
                  required
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">Gender *</label>
                <select 
                  name='gender' 
                  value={form.gender} 
                  onChange={onChange} 
                  required
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm"
                >
                  <option value='male'>Male</option>
                  <option value='female'>Female</option>
                </select>
              </div>

              {/* Marital Status */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">Marital Status</label>
                <select 
                  name='maritalStatus' 
                  value={form.maritalStatus} 
                  onChange={onChange}
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm"
                >
                  <option value=''>Select status</option>
                  <option value='never_married'>Never Married</option>
                  <option value='divorced'>Divorced</option>
                  <option value='widowed'>Widowed</option>
                </select>
              </div>

              {/* Any Disability */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">Any Disability</label>
                <input 
                  name='disability' 
                  placeholder='None or specify' 
                  value={form.disability} 
                  onChange={onChange}
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm placeholder-gray-400"
                />
              </div>

              {/* Country of Origin */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">Country of Origin</label>
                <input 
                  name='countryOfOrigin' 
                  placeholder='Your country of origin' 
                  value={form.countryOfOrigin} 
                  onChange={onChange}
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm placeholder-gray-400"
                />
              </div>

              {/* Current Location */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">Current Location/City You Live In *</label>
                <input 
                  name='location' 
                  placeholder='Your current city' 
                  value={form.location} 
                  onChange={onChange}
                  required
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm placeholder-gray-400"
                />
              </div>

              {/* Highest Education */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">Highest Education</label>
                <input 
                  name='education' 
                  placeholder='Your education background' 
                  value={form.education} 
                  onChange={onChange}
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm placeholder-gray-400"
                />
              </div>

              {/* Occupation/Profession */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">Occupation/Profession</label>
                <input 
                  name='occupation' 
                  placeholder='Your profession' 
                  value={form.occupation} 
                  onChange={onChange}
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm placeholder-gray-400"
                />
              </div>

              {/* Languages Known */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">Languages Known</label>
                <input 
                  name='languagesKnown' 
                  placeholder='e.g., English, Hindi, Urdu' 
                  value={form.languagesKnown} 
                  onChange={onChange}
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm placeholder-gray-400"
                />
              </div>

              {/* Number of Siblings */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">Number of Siblings</label>
                <input 
                  name='numberOfSiblings' 
                  type='number'
                  placeholder='0' 
                  value={form.numberOfSiblings} 
                  onChange={onChange}
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm placeholder-gray-400"
                />
              </div>

              {/* About Yourself */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">About Yourself (Short Bio)</label>
                <textarea 
                  name='about' 
                  placeholder='Tell us about yourself...' 
                  value={form.about} 
                  onChange={onChange} 
                  rows={3}
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm placeholder-gray-400 resize-none"
                />
              </div>

              {/* What Are You Looking For */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">What Are You Looking For in a Partner</label>
                <textarea 
                  name='lookingFor' 
                  placeholder='Describe your ideal partner...' 
                  value={form.lookingFor} 
                  onChange={onChange} 
                  rows={3}
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm placeholder-gray-400 resize-none"
                />
              </div>

              {/* IT Number */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">IT Number * (Required for Verification)</label>
                <input 
                  name='itNumber' 
                  placeholder='Your IT number' 
                  value={form.itNumber} 
                  onChange={onChange}
                  required
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">Verification is done through IT number. Please ensure it's correct.</p>
              </div>

              {/* IT Card Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">IT Card Photo (For Verification)</label>
                <label className="flex items-center justify-between border-2 border-dashed rounded-xl p-3 cursor-pointer transition-all" style={{borderColor: '#D4AF37'}}>
                  <span className="text-sm text-gray-600">{itCardPhoto ? itCardPhoto.name : "Upload IT card photo"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => setItCardPhoto(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <span className="text-white px-3 py-1 rounded-lg text-sm font-semibold" style={{backgroundColor: '#B8860B'}}>Browse</span>
                </label>
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">Contact Number *</label>
                <input 
                  name='contact' 
                  placeholder='Your phone number' 
                  value={form.contact} 
                  onChange={onChange} 
                  required
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm placeholder-gray-400"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">Email Address *</label>
                <input 
                  name='email' 
                  type='email' 
                  placeholder='johndoe@mail.com' 
                  value={form.email} 
                  onChange={onChange} 
                  required
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm placeholder-gray-400"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-golden mb-1">Password (for account login) *</label>
                <input 
                  type='password' 
                  name='password' 
                  placeholder='••••••••' 
                  value={form.password} 
                  onChange={onChange} 
                  required
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none transition-colors text-gray-700 text-sm placeholder-gray-400"
                />
              </div>

              <button 
                disabled={loading} 
                type='submit' 
                className="w-full py-3 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-6"
                style={{backgroundColor: '#B8860B'}}
              >
                {loading ? 'Creating Account...' : 'SIGN UP'}
              </button>
            </form>

            <div className="text-center pt-4 border-t border-gray-200 mt-6">
              <p className="text-gray-600 text-sm">
                Already have an account?{' '}
                <Link 
                  to='/login' 
                  className="font-semibold transition-colors"
                  style={{color: '#B8860B'}}
                >
                  Log In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
