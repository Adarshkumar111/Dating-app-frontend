import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { verifyEmailOtp, resendEmailOtp } from '../services/authService.js'
import { toast } from 'react-toastify'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    // Get email from navigation state or redirect to signup
    const emailFromState = location.state?.email
    if (!emailFromState) {
      toast.error('Please signup first')
      navigate('/signup')
      return
    }
    setEmail(emailFromState)
  }, [location.state, navigate])

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otp.trim()) {
      toast.error('Please enter OTP')
      return
    }

    setLoading(true)
    try {
      await verifyEmailOtp(email, otp)
      toast.success('Email verified successfully!')
      navigate('/login')
    } catch (error) {
      toast.error('Wrong OTP')
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    try {
      await resendEmailOtp(email)
      toast.success('New OTP sent to your email')
    } catch (error) {
      toast.error('Failed to resend OTP')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-premium-gradient rounded-full flex items-center justify-center mb-6 animate-pulse-glow">
            <span className="text-2xl font-bold text-white">✓</span>
          </div>
          <h2 className="text-3xl font-bold text-blue-800 mb-2">Verify Your Email</h2>
          <p className="text-gray-600">We've sent a verification code to your email</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 transform hover:scale-105 transition-all duration-300">
          <div className="bg-gradient-to-r from-blue-50 to-pink-50 p-4 rounded-lg text-center border border-blue-200">
            <p className="text-sm text-blue-800 mb-1">OTP sent to:</p>
            <p className="font-semibold text-blue-900">{email}</p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-3 text-center">
                Enter the 6-digit verification code
              </label>
              
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 text-center text-3xl tracking-[0.5em] font-bold text-blue-800 transition-all duration-300"
                maxLength={6}
                required
              />
              
              <div className="flex justify-center mt-2">
                <div className="flex space-x-1">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-1 rounded-full transition-all duration-300 ${
                        i < otp.length ? 'bg-pink-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <button
              disabled={loading || otp.length !== 6}
              type="submit"
              className={`btn-primary w-full ${loading || otp.length !== 6 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          <div className="text-center space-y-4">
            <button
              onClick={handleResendOtp}
              className="text-pink-500 hover:text-pink-600 font-medium transition-colors duration-300 text-sm"
            >
              Didn't receive the code? Resend OTP
            </button>
            
            <div className="border-t border-gray-200 pt-4">
              <p className="text-gray-600 text-sm">
                Already verified?{' '}
                <Link 
                  to='/login' 
                  className="text-pink-500 font-semibold hover:text-pink-600 transition-colors duration-300"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            The verification code will expire in 15 minutes
          </p>
        </div>
      </div>
    </div>
  )
}
