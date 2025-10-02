import React from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function WaitingApprovalPage(){
  const { user, logout } = useAuth()
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-purple-200">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center max-w-md">
        <div className="mb-6">
          <svg className="w-24 h-24 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Waiting For Approval</h2>
        <p className="text-gray-600 mb-2">Hello {user?.name || 'User'},</p>
        <p className="text-gray-600 mb-6">Your account is pending admin approval. This usually takes up to 24 hours.</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>What happens next?</strong><br/>
            Our admin team will review your profile and approve it shortly. You'll be able to access the platform once approved.
          </p>
        </div>
        <button 
          onClick={logout}
          className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
