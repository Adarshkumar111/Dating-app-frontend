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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-premium-gradient rounded-full flex items-center justify-center mb-6 animate-pulse-glow">
            <span className="text-2xl font-bold text-white">🔑</span>
          </div>
          <h2 className="text-3xl font-bold text-blue-800 mb-2">Reset Password</h2>
          <p className="text-gray-600">
            {step === 1 ? "Enter your email to receive a reset code" : "Enter the code and your new password"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 transform hover:scale-105 transition-all duration-300">
          {info && (
            <div className={`p-4 rounded-lg text-sm ${
              info.includes('successful') || info.includes('sent') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {info}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">Email Address</label>
                <input
                  name='email'
                  type='email'
                  placeholder='Enter your email address'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-premium w-full"
                  required
                />
              </div>
              
              <button
                disabled={loading}
                type='submit'
                className={`btn-primary w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending Code...
                  </div>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">Verification Code</label>
                <input
                  name='otp'
                  placeholder='Enter 6-digit code'
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-premium w-full text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">New Password</label>
                <input
                  type='password'
                  name='newPassword'
                  placeholder='Enter new password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-premium w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">Confirm New Password</label>
                <input
                  type='password'
                  name='confirmPassword'
                  placeholder='Confirm new password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-premium w-full"
                  required
                />
              </div>
              
              <button
                disabled={loading}
                type='submit'
                className={`btn-accent w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Resetting Password...
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>
              
              <button
                type='button'
                onClick={() => {
                  setStep(1)
                  setInfo('')
                  setOtp('')
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="w-full text-pink-500 hover:text-pink-600 font-medium transition-colors duration-300 text-sm"
              >
                ← Back to email entry
              </button>
            </form>
          )}

          <div className="text-center border-t border-gray-200 pt-6">
            <p className="text-gray-600 text-sm">
              Remember your password?{' '}
              <Link 
                to='/login' 
                className="text-pink-500 font-semibold hover:text-pink-600 transition-colors duration-300"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            The reset code will expire in 15 minutes
          </p>
        </div>
      </div>
    </div>
  )
}
