import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signupStep2, getSignupStatus } from '../../services/authService'
import { toast } from 'react-toastify'

export default function Step2Personal() {
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name:'', fatherName:'', motherName:'', dateOfBirth:'', gender:'male', maritalStatus:'', disability:'' })
  const [profilePhoto, setProfilePhoto] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('signupToken')
    if (!token) { nav('/signup/step-1'); return }
    // optional: ensure order
    getSignupStatus(token).catch(()=>{})
  }, [nav])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onNext = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('signupToken')
    if (!token) { toast.error('Session expired. Start again.'); nav('/signup/step-1'); return }
    try {
      setLoading(true)
      const fd = new FormData()
      Object.entries(form).forEach(([k,v])=> fd.append(k, v))
      if (profilePhoto) fd.append('profilePhoto', profilePhoto)
      await signupStep2(fd, token)
      toast.success('Saved. Continue to Step 3')
      nav('/signup/step-3')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-sm md:max-w-md lg:max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border" style={{borderColor:'#D4AF37'}}>
          <div className="px-6 py-6">
            <h2 className="text-lg font-bold mb-4" style={{color:'#B8860B'}}>Step 2: Personal Information</h2>
            <form onSubmit={onNext} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Profile Photo (Private & Secure)</label>
                <label className="flex items-center justify-between border-2 border-dashed rounded-xl p-3 cursor-pointer" style={{borderColor:'#D4AF37'}}>
                  <span className="text-sm text-gray-600">{profilePhoto ? profilePhoto.name : 'Choose profile photo'}</span>
                  <input type="file" accept="image/*" onChange={(e)=> setProfilePhoto(e.target.files?.[0]||null)} className="hidden" />
                  <span className="text-white px-3 py-1 rounded-lg text-sm font-semibold" style={{backgroundColor:'#B8860B'}}>Browse</span>
                </label>
              </div>
              <input name='name' placeholder='Full Name' value={form.name} onChange={onChange} required className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input name='fatherName' placeholder="Father's Name" value={form.fatherName} onChange={onChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input name='motherName' placeholder="Mother's Name" value={form.motherName} onChange={onChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">DOB</label>
                  <input type='date' name='dateOfBirth' value={form.dateOfBirth} onChange={onChange} required className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select name='gender' value={form.gender} onChange={onChange} required className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value='male'>Male</option>
                    <option value='female'>Female</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Marital Status</label>
                  <select name='maritalStatus' value={form.maritalStatus} onChange={onChange} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value=''>Select</option>
                    <option value='never_married'>Never Married</option>
                    <option value='divorced'>Divorced</option>
                    <option value='widowed'>Widowed</option>
                  </select>
                </div>
                <input name='disability' placeholder='Any Disability' value={form.disability} onChange={onChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <button disabled={loading} type='submit' className={`w-full py-3 text-white font-semibold rounded-xl mt-2 ${loading?'opacity-50':''}`} style={{backgroundColor:'#B8860B'}}>
                {loading ? 'Saving...' : 'Next'}
              </button>
            </form>
            <div className="flex items-center justify-between mt-4 text-sm">
              <Link to='/signup/step-1' className="text-gray-600">New Register</Link>
              <Link to='/login' className="font-semibold" style={{color:'#B8860B'}}>Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
