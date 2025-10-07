import React, { useState, useEffect, useRef } from 'react'
import { requestHelp, getHelpStatus } from '../services/helpService.js'
import { MdHelp, MdClose } from 'react-icons/md'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

export default function HelpDropdown({ isMobileSheet, onClose }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [helpStatus, setHelpStatus] = useState({ state: 'none', adminId: null })
  const [issueType, setIssueType] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const loadHelpStatus = async () => {
    try {
      const data = await getHelpStatus()
      if (data?.status) {
        setHelpStatus({ state: data.status, adminId: data.adminId || null })
      }
    } catch (err) {
      console.error('Failed to load help status:', err)
    }
  }

  useEffect(() => {
    loadHelpStatus()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!issueType) {
      toast.error('Please select an issue type')
      return
    }
    
    setLoading(true)
    try {
      await requestHelp(issueType, issueDescription)
      setHelpStatus({ state: 'pending', adminId: null })
      toast.success('Help request sent to admin successfully!')
      setIssueType('')
      setIssueDescription('')
      setIsOpen(false)
      if (onClose) onClose()
      await loadHelpStatus()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send help request')
    } finally {
      setLoading(false)
    }
  }

  const handleChatAdmin = () => {
    if (helpStatus.state === 'approved' && helpStatus.adminId) {
      navigate(`/chat/${helpStatus.adminId}`)
      setIsOpen(false)
      if (onClose) onClose()
    }
  }

  // Mobile sheet view
  if (isMobileSheet) {
    return (
      <div className="w-full">
        {helpStatus.state === 'approved' ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Help Request Approved</h3>
            <p className="text-sm text-gray-600 mb-4">You can now chat with admin</p>
            <button
              onClick={handleChatAdmin}
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition font-semibold"
            >
              Chat with Admin
            </button>
          </div>
        ) : helpStatus.state === 'pending' ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">⏳</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Help Request Pending</h3>
            <p className="text-sm text-gray-600">Admin will respond to your request soon</p>
          </div>
        ) : (
          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Issue Type *
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                >
                  <option value="">-- Select Issue --</option>
                  <option value="profile_issue">Profile Issue</option>
                  <option value="payment_issue">Payment Issue</option>
                  <option value="technical_issue">Technical Issue</option>
                  <option value="account_issue">Account Issue</option>
                  <option value="chat_issue">Chat Issue</option>
                  <option value="report_user">Report a User</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Submit Help Request'}
              </button>
            </form>
          </div>
        )}
      </div>
    )
  }

  // Desktop dropdown view
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Help Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-black hover:bg-opacity-10 rounded-full transition-all duration-300"
        style={{color: '#B8860B'}}
        title={
          helpStatus.state === 'approved' ? 'Chat with Admin' :
          helpStatus.state === 'pending' ? 'Help Request Pending' :
          'Get Help'
        }
      >
        <MdHelp className="w-6 h-6" />
        {helpStatus.state === 'pending' && (
          <span className="absolute top-0 right-0 bg-yellow-500 text-white text-xs rounded-full w-2 h-2 animate-pulse"></span>
        )}
        {helpStatus.state === 'approved' && (
          <span className="absolute top-0 right-0 bg-green-500 text-white text-xs rounded-full w-2 h-2"></span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <MdHelp className="text-blue-500" />
              Help & Support
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {helpStatus.state === 'approved' ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Help Request Approved</h3>
                <p className="text-sm text-gray-600 mb-4">You can now chat with admin</p>
                <button
                  onClick={handleChatAdmin}
                  className="w-full bg-green-500 text-white py-2.5 rounded-lg hover:bg-green-600 transition font-semibold"
                >
                  Chat with Admin
                </button>
              </div>
            ) : helpStatus.state === 'pending' ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">⏳</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Help Request Pending</h3>
                <p className="text-sm text-gray-600">Admin will respond to your request soon</p>
              </div>
            ) : (
              <div className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Issue Type *
                    </label>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">-- Select Issue --</option>
                      <option value="profile_issue">Profile Issue</option>
                      <option value="payment_issue">Payment Issue</option>
                      <option value="technical_issue">Technical Issue</option>
                      <option value="account_issue">Account Issue</option>
                      <option value="chat_issue">Chat Issue</option>
                      <option value="report_user">Report a User</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      placeholder="Describe your issue..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-2.5 rounded-lg hover:bg-blue-600 transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Submit Help Request'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
