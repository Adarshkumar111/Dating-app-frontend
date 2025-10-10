import React from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function WaitingApprovalPage(){
  const { user, logout } = useAuth()
  
  return (
    <div className="min-h-screen bg-[#FFF8E7] flex items-center justify-center p-4 waiting-approval">
      <div className="w-full max-w-sm md:max-w-md lg:max-w-lg">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Geometric Pattern Header */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-12 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-2 w-24 h-24">
              {/* Top Left - Blue Square */}
              <div className="bg-blue-500 rounded-lg"></div>
              {/* Top Right - Light Blue Circle */}
              <div className="bg-blue-200 rounded-full"></div>
              {/* Bottom Left - Light Blue Circle */}
              <div className="bg-blue-200 rounded-full"></div>
              {/* Bottom Right - Blue Square */}
              <div className="bg-blue-500 rounded-lg"></div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-8 text-center space-y-4">
            <div>
              <h1 className="text-xl font-bold text-blue-500 mb-2">Waiting for Approval</h1>
              <p className="text-xs text-blue-400 leading-relaxed">
                Ut labore et dolore roipit mana aliqua. Enim adesp minim veeniam nostruklad
              </p>
            </div>

            <div className="pt-2">
              <h2 className="text-base font-semibold text-gray-800 mb-2">Hello {user?.name || 'User'}! 👋</h2>
              <p className="text-gray-600 text-sm mb-4">
                Your account is pending. Waiting for approval (up to 24 hours).
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 text-left">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center text-sm">
                <span className="mr-2">⏰</span>
                What happens next?
              </h3>
              <ul className="text-xs text-gray-700 space-y-1.5">
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5 text-blue-500">✓</span>
                  Your profile and documents will be reviewed shortly
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5 text-blue-500">✓</span>
                  You should receive approval within 24 hours
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5 text-blue-500">✓</span>
                  Once approved, you can start discovering matches
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-3">
                Need help? Contact our support team
              </p>
              <button 
                onClick={logout}
                className="w-full py-2.5 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors shadow-lg text-sm"
              >
                Logout
              </button>
            </div>

            <div className="pt-2">
              <p className="text-xs text-gray-400">
                Thank you for your patience. We’ll notify you as soon as your account is approved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
