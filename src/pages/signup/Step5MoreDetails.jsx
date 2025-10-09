import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signupStep5, getSignupStatus } from '../../services/authService'
import { toast } from 'react-toastify'

export default function Step5MoreDetails(){
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ education:'', occupation:'', languagesKnown:'', numberOfSiblings:'', about:'', lookingFor:'' })

  useEffect(()=>{
    const token = localStorage.getItem('signupToken')
    if (!token) { nav('/signup/step-1'); return }
    getSignupStatus(token).catch(()=>{})
  },[nav])

  const onChange = (e)=> setForm({ ...form, [e.target.name]: e.target.value })

  const onNext = async (e)=>{
    e.preventDefault()
    const token = localStorage.getItem('signupToken')
    if (!token){ toast.error('Session expired. Start again.'); nav('/signup/step-1'); return }
    try{
      setLoading(true)
      const payload = {
        ...form,
        languagesKnown: form.languagesKnown // csv; backend splits
      }
      const res = await signupStep5(payload, token)
      toast.success('Signup complete. Verify your email to continue.')
      let emailForVerify = ''
      try {
        const status = await getSignupStatus(token)
        emailForVerify = status?.email || ''
      } catch {}
      // Clear signup token after reading status
      localStorage.removeItem('signupToken')
      if (res.verifyEmail && emailForVerify) {
        nav('/verify-email', { state: { email: emailForVerify } })
      } else {
        nav('/login')
      }
    } catch(e){
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
            <h2 className="text-lg font-bold mb-4" style={{color:'#B8860B'}}>Step 5: More Details</h2>
            <form onSubmit={onNext} className="space-y-3">
              <input name='education' placeholder='Highest Education' value={form.education} onChange={onChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input name='occupation' placeholder='Occupation / Profession' value={form.occupation} onChange={onChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input name='languagesKnown' placeholder='Languages Known (comma separated)' value={form.languagesKnown} onChange={onChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type='number' name='numberOfSiblings' placeholder='Number of Siblings' value={form.numberOfSiblings} onChange={onChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <textarea name='about' placeholder='About Yourself (Short Bio)' value={form.about} onChange={onChange} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <textarea name='lookingFor' placeholder='What Are You Looking For in a Partner?' value={form.lookingFor} onChange={onChange} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <button disabled={loading} type='submit' className={`w-full py-3 text-white font-semibold rounded-xl mt-2 ${loading?'opacity-50':''}`} style={{backgroundColor:'#B8860B'}}>
                {loading ? 'Finishing...' : 'Finish & Send OTP'}
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
