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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-purple-200">
      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Verify Your Email</h2>
        
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm text-center">
          OTP sent to: <strong>{email}</strong>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <p className="text-gray-600 text-sm mb-4">Enter the 6-digit OTP sent to your email</p>
          
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-center text-2xl tracking-widest"
            maxLength={6}
            required
          />
          
          <button
            disabled={loading || otp.length !== 6}
            type="submit"
            className={`w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition ${loading || otp.length !== 6 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={handleResendOtp}
            className="text-blue-600 hover:underline text-sm"
          >
            Didn't receive OTP? Resend
          </button>
        </div>

        <p className="mt-6 text-center text-gray-600 text-sm">
          Already verified? <Link to='/login' className="text-blue-500 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}
