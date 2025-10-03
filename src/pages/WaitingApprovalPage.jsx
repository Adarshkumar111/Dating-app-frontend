import React from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function WaitingApprovalPage(){
  const { user, logout } = useAuth()
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 animate-fade-in">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-premium-gradient rounded-full flex items-center justify-center mb-6 animate-pulse-glow">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Account Under Review</h1>
          <p className="text-gray-600">Your profile is being reviewed by our team</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 transform hover:scale-105 transition-all duration-300">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-blue-800 mb-3">Hello {user?.name || 'User'}! 👋</h2>
            <p className="text-gray-600 mb-6">Your account is pending admin approval. This process usually takes up to 24 hours.</p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-amber-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
              <span className="mr-2">⏰</span>
              What happens next?
            </h3>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start">
                <span className="mr-2 mt-1">✓</span>
                Our admin team will review your profile and documents
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">✓</span>
                You'll receive approval within 24 hours
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">✓</span>
                Once approved, you can start discovering matches
              </li>
            </ul>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              Need help? Contact our support team
            </p>
            <button 
              onClick={logout}
              className="btn-primary"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Thank you for your patience. We'll notify you once your account is approved.
          </p>
        </div>
      </div>
    </div>
  )
}
