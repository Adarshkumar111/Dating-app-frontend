import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { requestPasswordReset, resetPassword } from '../services/passwordService.js'

export default function ForgetPasswordPage() {
  const nav = useNavigate()
  const [step, setStep] = useState(1) // 1: request OTP, 2: verify OTP & reset
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState('')

  const handleRequestOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await requestPasswordReset({ email })
      setInfo(`OTP sent to ${email}`)
      setStep(2)
      setLoading(false)
    } catch (error) {
      setLoading(false)
      setInfo(error.response?.data?.message || 'Failed to send OTP')
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setInfo('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await resetPassword({ email, otp, newPassword })
      setInfo('Password reset successful! Redirecting to login...')
      setLoading(false)
      setTimeout(() => nav('/login'), 2000)
    } catch (error) {
      setLoading(false)
      setInfo(error.response?.data?.message || 'Password reset failed')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-purple-200">
      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Forget Password</h2>
        
        {info && <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">{info}</div>}

        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <p className="text-gray-600 text-sm mb-4">Enter your email to receive an OTP</p>
            <input
              name='email'
              type='email'
              placeholder='Email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <button
              disabled={loading}
              type='submit'
              className={`w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-gray-600 text-sm mb-4">Enter the OTP and your new password</p>
            <input
              name='otp'
              placeholder='Enter OTP'
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <input
              type='password'
              name='newPassword'
              placeholder='New Password'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <input
              type='password'
              name='confirmPassword'
              placeholder='Confirm Password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <button
              disabled={loading}
              type='submit'
              className={`w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button
              type='button'
              onClick={() => setStep(1)}
              className="w-full text-blue-600 hover:underline text-sm"
            >
              ← Back to request OTP
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-gray-600 text-sm">
          Remember your password? <Link to='/login' className="text-blue-500 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}
