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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-premium-gradient rounded-full flex items-center justify-center mb-6 animate-pulse-glow">
            <span className="text-2xl font-bold text-white">M</span>
          </div>
          <h2 className="text-3xl font-bold text-blue-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your M Nikah account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 transform hover:scale-105 transition-all duration-300">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">Email</label>
                <input 
                  name='email' 
                  type='email'
                  placeholder='Enter your email' 
                  value={form.email} 
                  onChange={onChange} 
                  className="input-premium w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">Contact (Alternative)</label>
                <input 
                  name='contact' 
                  placeholder='Enter your contact number' 
                  value={form.contact} 
                  onChange={onChange} 
                  className="input-premium w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">Password</label>
                <input 
                  type='password' 
                  name='password' 
                  placeholder='Enter your password' 
                  value={form.password} 
                  onChange={onChange} 
                  className="input-premium w-full"
                />
              </div>
            </div>

            <button 
              disabled={loading} 
              type='submit'
              className={`btn-primary w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="text-center space-y-4">
            <Link 
              to='/forget-password' 
              className="text-sm text-pink-500 hover:text-pink-600 font-medium transition-colors duration-300"
            >
              Forgot your password?
            </Link>
            
            <div className="border-t border-gray-200 pt-4">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <Link 
                  to='/signup' 
                  className="text-pink-500 font-semibold hover:text-pink-600 transition-colors duration-300"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
