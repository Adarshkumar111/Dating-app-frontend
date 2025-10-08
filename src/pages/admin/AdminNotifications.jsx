import React, { useEffect, useState } from 'react'
import { listUsers } from '../../services/adminService.js'
import { sendAdminNotification } from '../../services/notificationService.js'
import { MdSearch, MdSend, MdCheckBox, MdCheckBoxOutlineBlank, MdSelectAll } from 'react-icons/md'
import { toast } from 'react-toastify'

export default function AdminNotifications() {
  const [mode, setMode] = useState('all') // 'all', 'specific'
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    if (mode === 'specific') {
      loadUsers()
    }
  }, [mode])

  useEffect(() => {
    if (mode === 'specific' && searchQuery) {
      const query = searchQuery.toLowerCase()
      const filtered = users.filter(user => 
        user.name?.toLowerCase().includes(query) ||
        user.fatherName?.toLowerCase().includes(query) ||
        user.itNumber?.toLowerCase().includes(query) ||
        user.contact?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchQuery, users, mode])

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const data = await listUsers()
      // Filter out admins
      const regularUsers = data.filter(u => !u.isAdmin)
      setUsers(regularUsers)
      setFilteredUsers(regularUsers)
    } catch (err) {
      toast.error('Failed to load users')
    }
    setLoadingUsers(false)
  }

  const toggleUser = (userId) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId))
    } else {
      setSelectedUserIds([...selectedUserIds, userId])
    }
  }

  const toggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(filteredUsers.map(u => u._id))
    }
  }

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    if (mode === 'specific' && selectedUserIds.length === 0) {
      toast.error('Please select at least one user')
      return
    }

    setLoading(true)
    try {
      const payload = {
        message: message.trim(),
        sendToAll: mode === 'all',
        userIds: mode === 'specific' ? selectedUserIds : []
      }
      
      const result = await sendAdminNotification(payload)
      toast.success(result.message || 'Notification sent successfully!')
      setMessage('')
      setSelectedUserIds([])
      setSearchQuery('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send notification')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl shadow p-3 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold mb-4" style={{color:'#B8860B'}}>
        📢 Send Notifications to Users
      </h2>
      
      {/* Mode Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Send To:</label>
        <div className="flex gap-3">
          <button
            onClick={() => setMode('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              mode === 'all' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Members
          </button>
          <button
            onClick={() => setMode('specific')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              mode === 'specific' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Specific Users
          </button>
        </div>
      </div>

      {/* Message Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Notification Message:</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message here..."
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows="4"
        />
        <div className="text-xs text-gray-500 mt-1">
          {message.length} characters
        </div>
      </div>

      {/* User Selection (only for specific mode) */}
      {mode === 'specific' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium">Select Users:</label>
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 transition"
            >
              <MdSelectAll className="text-lg" />
              {selectedUserIds.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-3 relative">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, father's name, IT number, contact..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Selected Count */}
          {selectedUserIds.length > 0 && (
            <div className="mb-3 p-2 bg-blue-50 rounded-lg text-sm text-blue-700 font-medium">
              {selectedUserIds.length} user(s) selected
            </div>
          )}

          {/* User List */}
          <div className="border rounded-lg max-h-96 overflow-y-auto">
            {loadingUsers ? (
              <div className="p-4 text-center text-gray-500">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? 'No users found matching your search' : 'No users available'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredUsers.map(user => {
                  const isSelected = selectedUserIds.includes(user._id)
                  return (
                    <button
                      key={user._id}
                      onClick={() => toggleUser(user._id)}
                      className={`w-full text-left p-3 hover:bg-gray-50 transition flex items-center gap-3 ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <MdCheckBox className="text-2xl text-blue-600" />
                        ) : (
                          <MdCheckBoxOutlineBlank className="text-2xl text-gray-400" />
                        )}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 truncate">
                          {user.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500 space-y-0.5">
                          {user.fatherName && (
                            <div className="truncate">Father: {user.fatherName}</div>
                          )}
                          {user.itNumber && (
                            <div>IT: {user.itNumber}</div>
                          )}
                          {user.contact && (
                            <div>Contact: {user.contact}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          user.status === 'approved' 
                            ? 'bg-green-100 text-green-700' 
                            : user.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.status}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSend}
          disabled={loading || !message.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
          style={{backgroundColor: '#B8860B'}}
        >
          <MdSend className="text-lg" />
          {loading ? 'Sending...' : 'Send Notification'}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>All Members:</strong> Sends notification to all registered users</li>
          <li>• <strong>Specific Users:</strong> Select individual users by searching and checking boxes</li>
          <li>• Users will receive notifications in their notification dropdown</li>
          <li>• Search by name, father's name, IT number, or contact number</li>
        </ul>
      </div>
    </div>
  )
}
