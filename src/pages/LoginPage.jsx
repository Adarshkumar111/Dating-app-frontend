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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Blue Header with Large M */}
          <div className="bg-blue-500 h-40 flex items-center justify-center">
            <span className="text-7xl font-bold text-white">M</span>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-6">
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <input 
                  name='email' 
                  type='email'
                  placeholder='johndoe@mail.com' 
                  value={form.email} 
                  onChange={onChange}
                  required
                  className="w-full px-5 py-3 border-2 border-gray-300 rounded-full focus:outline-none focus:border-blue-500 transition-colors text-gray-700 placeholder-gray-400"
                />
              </div>
              
              <div>
                <input 
                  type='password' 
                  name='password' 
                  placeholder='••••••••' 
                  value={form.password} 
                  onChange={onChange}
                  required
                  className="w-full px-5 py-3 border-2 border-gray-300 rounded-full focus:outline-none focus:border-blue-500 transition-colors text-gray-700 placeholder-gray-400"
                />
              </div>

              <div className="text-center py-2">
                <div className="inline-block w-12 h-1 bg-blue-300 rounded-full"></div>
              </div>

              <button 
                disabled={loading} 
                type='submit'
                className="w-full py-3 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border-2 border-blue-500"
              >
                {loading ? 'Signing in...' : 'Log In'}
              </button>

              <button 
                type='button'
                onClick={() => nav('/forget-password')}
                className="w-full py-3 bg-white text-blue-500 font-semibold rounded-full hover:bg-blue-50 transition-colors border-2 border-blue-500"
              >
                Forget Password?
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <Link 
                  to='/signup' 
                  className="text-blue-500 font-semibold hover:text-blue-600 transition-colors"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
