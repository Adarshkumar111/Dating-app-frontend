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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-pink-100 to-orange-200 font-sans">
      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">M Nikah - Sign Up</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input name='name' placeholder='Full Name' value={form.name} onChange={onChange} className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <input name='fatherName' placeholder='Father Name' value={form.fatherName} onChange={onChange} className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <input name='motherName' placeholder='Mother Name' value={form.motherName} onChange={onChange} className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <input name='age' placeholder='Age' value={form.age} onChange={onChange} className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <input name='itNumber' placeholder='IT Number' value={form.itNumber} onChange={onChange} className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <select name='gender' value={form.gender} onChange={onChange} className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400">
            <option value='male'>Male</option>
            <option value='female'>Female</option>
          </select>
          <input name='location' placeholder='Location' value={form.location} onChange={onChange} className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <input name='contact' placeholder='Contact (phone)' value={form.contact} onChange={onChange} className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <input name='email' placeholder='Email (required)' value={form.email} onChange={onChange} required className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <input type='password' name='password' placeholder='Password' value={form.password} onChange={onChange} className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <input name='education' placeholder='Education' value={form.education} onChange={onChange} className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <input name='occupation' placeholder='Occupation' value={form.occupation} onChange={onChange} className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <textarea name='about' placeholder='About' value={form.about} onChange={onChange} className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none" />

          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-700">IT Card Photo:</label>
            <label className="flex items-center justify-between border border-gray-300 rounded-lg p-3 cursor-pointer hover:border-pink-500 focus-within:ring-2 focus-within:ring-pink-400">
              <span className="text-sm">{itCardPhoto ? itCardPhoto.name : "Choose file (jpg, png, webp)"}</span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => setItCardPhoto(e.target.files?.[0] || null)}
                className="hidden"
              />
              <span className="text-pink-500 font-semibold">Browse</span>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-700">Profile Photo:</label>
            <label className="flex items-center justify-between border border-gray-300 rounded-lg p-3 cursor-pointer hover:border-pink-500 focus-within:ring-2 focus-within:ring-pink-400">
              <span className="text-sm">{profilePhoto ? profilePhoto.name : "Choose file (jpg, png, webp)"}</span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
                className="hidden"
              />
              <span className="text-pink-500 font-semibold">Browse</span>
            </label>
          </div>


          <button disabled={loading} type='submit' className={`bg-pink-500 text-white font-semibold py-3 rounded-lg hover:bg-pink-600 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {loading ? 'Submitting...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  )
}
