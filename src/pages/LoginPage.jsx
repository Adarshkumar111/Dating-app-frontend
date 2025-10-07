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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{border: '2px solid #D4AF37'}}>
          {/* Golden Header with Large M */}
          <div className="h-40 flex items-center justify-center" style={{backgroundColor: '#B8860B'}}>
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
                  className="w-full px-5 py-3 border-2 rounded-full focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                  style={{borderColor: '#D4AF37'}}
                  onFocus={(e) => e.target.style.borderColor = '#B8860B'}
                  onBlur={(e) => e.target.style.borderColor = '#D4AF37'}
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
                  className="w-full px-5 py-3 border-2 rounded-full focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                  style={{borderColor: '#D4AF37'}}
                  onFocus={(e) => e.target.style.borderColor = '#B8860B'}
                  onBlur={(e) => e.target.style.borderColor = '#D4AF37'}
                />
              </div>

              <div className="text-center py-2">
                <div className="inline-block w-12 h-1 rounded-full" style={{backgroundColor: '#DAA520'}}></div>
              </div>

              <button 
                disabled={loading} 
                type='submit'
                className="w-full py-3 text-white font-semibold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border-2"
                style={{backgroundColor: '#B8860B', borderColor: '#B8860B'}}
              >
                {loading ? 'Signing in...' : 'Log In'}
              </button>

              <button 
                type='button'
                onClick={() => nav('/forget-password')}
                className="w-full py-3 bg-white font-semibold rounded-full transition-colors border-2"
                style={{color: '#B8860B', borderColor: '#B8860B'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F5F5DC'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                Forget Password?
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <Link 
                  to='/signup' 
                  className="font-semibold transition-colors"
                  style={{color: '#B8860B'}}
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
