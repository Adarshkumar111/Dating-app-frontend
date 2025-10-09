import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signupStep1 } from '../../services/authService'
import { toast } from 'react-toastify'
import PreAuthGate from '../../components/PreAuthGate'
import { ensurePreAuthAcknowledged } from '../../utils/preAuth'

export default function Step1Account() {
  const nav = useNavigate()
  const [form, setForm] = useState({ contact: '', email: '', itNumber: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onNext = async (e) => {
    e.preventDefault()
    const ok = await ensurePreAuthAcknowledged()
    if (!ok) {
      toast.info('Please tap Next to continue')
      return
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    try {
      setLoading(true)
      const res = await signupStep1(form)
      localStorage.setItem('signupToken', res.signupToken)
      toast.success('Account created. Continue to Step 2')
      nav('/signup/step-2')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7] flex items-center justify-center p-4 py-12">
      <PreAuthGate />
      <div className="w-full max-w-sm md:max-w-md lg:max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border" style={{borderColor:'#D4AF37'}}>
          <div className="px-6 py-6">
            <h2 className="text-lg font-bold mb-4" style={{color:'#B8860B'}}>Step 1: Account</h2>
            <form onSubmit={onNext} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Contact Number *</label>
                <input name='contact' value={form.contact} onChange={onChange} required className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email Address *</label>
                <input type='email' name='email' value={form.email} onChange={onChange} required className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">IT Number *</label>
                <input name='itNumber' value={form.itNumber} onChange={onChange} required className="w-full px-3 py-2 border rounded-lg text-sm" />
                <p className="text-xs text-gray-500 mt-1">Verification is done by IT number. Ensure it is correct.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Password *</label>
                  <input type='password' name='password' value={form.password} onChange={onChange} required className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirm Password *</label>
                  <input type='password' name='confirmPassword' value={form.confirmPassword} onChange={onChange} required className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>

              <button disabled={loading} type='submit' className={`w-full py-3 text-white font-semibold rounded-xl mt-4 ${loading?'opacity-50':''}`} style={{backgroundColor:'#B8860B'}}>
                {loading? 'Processing...' : 'Next'}
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
