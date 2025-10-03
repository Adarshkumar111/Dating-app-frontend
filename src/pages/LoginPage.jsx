import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { toast } from 'react-toastify'

export default function LoginPage() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ contact:'', email:'', password:'' })
  const [loading, setLoading] = useState(false)
  
  const onChange = (e)=> setForm({...form,[e.target.name]: e.target.value})
  
  const onSubmit = async (e)=>{
    e.preventDefault()
    setLoading(true)
    try {
      await login(form)
      nav('/dashboard')
    } catch (error) {
      const errorData = error.response?.data
      if (errorData?.needsVerification) {
        toast.error('Please verify your email first')
        nav('/verify-email', { state: { email: errorData.email } })
      } else {
        toast.error(errorData?.message || 'Login failed. Make sure backend is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-pink-100 to-orange-200 font-sans">
      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Login - M Nikah</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input 
            name='email' 
            placeholder='Email (optional if using contact)' 
            value={form.email} 
            onChange={onChange} 
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <input 
            name='contact' 
            placeholder='Contact' 
            value={form.contact} 
            onChange={onChange} 
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <input 
            type='password' 
            name='password' 
            placeholder='Password' 
            value={form.password} 
            onChange={onChange} 
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <button 
            disabled={loading} 
            type='submit'
            className={`bg-pink-500 text-white font-semibold py-3 rounded-lg hover:bg-pink-600 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link to='/forget-password' className="text-sm text-blue-500 hover:underline">Forgot Password?</Link>
        </div>
        <p className="mt-2 text-center text-gray-600">
          New user? <Link to='/signup' className="text-pink-500 font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
