import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listUsers, approveUser, deleteUser, searchUsers, getSpammers, getSettings, updateSettings, getPremiumPlans, createPremiumPlan, updatePremiumPlan, deletePremiumPlan, initializeDefaultData } from '../services/adminService.js'
import { MdWarning, MdSearch, MdVisibility, MdDelete, MdCheckCircle, MdSettings, MdStar, MdAdd, MdEdit } from 'react-icons/md'

export default function AdminPanelPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [spammers, setSpammers] = useState([])
  const [tab, setTab] = useState('users')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Settings state
  const [settings, setSettings] = useState({
    freeUserRequestLimit: 2,
    premiumUserRequestLimit: 20
  })
  
  // Premium plans state
  const [premiumPlans, setPremiumPlans] = useState([])
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [planForm, setPlanForm] = useState({
    name: '',
    duration: 1,
    price: 0,
    discount: 0,
    requestLimit: 50,
    features: []
  })

  useEffect(() => {
    if (tab === 'users') loadUsers()
    if (tab === 'spammers') loadSpammers()
    if (tab === 'settings') loadSettings()
    if (tab === 'premium') loadPremiumPlans()
  }, [tab])

  const loadSettings = async () => {
    try {
      const data = await getSettings()
      setSettings(data)
    } catch (e) {
      setInfo('Failed to load settings')
    }
  }

  const loadPremiumPlans = async () => {
    try {
      const data = await getPremiumPlans()
      setPremiumPlans(data)
    } catch (e) {
      setInfo('Failed to load premium plans')
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    const data = await listUsers()
    setUsers(data)
    setLoading(false)
  }

  const loadSpammers = async () => {
    setLoading(true)
    const data = await getSpammers()
    setSpammers(data)
    setLoading(false)
  }

  const onApprove = async (userId) => {
    await approveUser(userId)
    setInfo('User approved')
    loadUsers()
  }

  const onDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    await deleteUser(userId)
    setInfo('User deleted successfully')
    if (tab === 'users') loadUsers()
    if (tab === 'spammers') loadSpammers()
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }
    setLoading(true)
    const results = await searchUsers(searchTerm)
    setSearchResults(results)
    setLoading(false)
  }

  const viewProfile = (userId) => {
    navigate(`/profile/${userId}`)
  }

  const handleSettingsUpdate = async () => {
    try {
      await updateSettings(settings)
      setInfo('Settings updated successfully')
    } catch (e) {
      setInfo('Failed to update settings')
    }
  }

  const handleCreatePlan = async () => {
    try {
      await createPremiumPlan(planForm)
      setInfo('Premium plan created successfully')
      setShowPlanModal(false)
      setPlanForm({ name: '', duration: 1, price: 0, discount: 0, requestLimit: 50, features: [] })
      loadPremiumPlans()
    } catch (e) {
      setInfo('Failed to create premium plan')
    }
  }

  const handleUpdatePlan = async () => {
    try {
      await updatePremiumPlan(editingPlan._id, planForm)
      setInfo('Premium plan updated successfully')
      setShowPlanModal(false)
      setEditingPlan(null)
      setPlanForm({ name: '', duration: 1, price: 0, discount: 0, requestLimit: 50, features: [] })
      loadPremiumPlans()
    } catch (e) {
      setInfo('Failed to update premium plan')
    }
  }

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to deactivate this plan?')) return
    try {
      await deletePremiumPlan(planId)
      setInfo('Premium plan deactivated successfully')
      loadPremiumPlans()
    } catch (e) {
      setInfo('Failed to deactivate premium plan')
    }
  }

  const openEditPlan = (plan) => {
    setEditingPlan(plan)
    setPlanForm({
      name: plan.name,
      duration: plan.duration,
      price: plan.price,
      discount: plan.discount,
      requestLimit: plan.requestLimit,
      features: plan.features || []
    })
    setShowPlanModal(true)
  }

  const handleInitializeData = async () => {
    if (!confirm('This will create default premium plans and settings. Continue?')) return
    try {
      const result = await initializeDefaultData()
      setInfo(result.message)
      if (tab === 'settings') loadSettings()
      if (tab === 'premium') loadPremiumPlans()
    } catch (e) {
      setInfo('Failed to initialize data: ' + (e.response?.data?.message || e.message))
    }
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-bold text-gray-800">🛡️ Admin Panel</h2>
        <button
          onClick={handleInitializeData}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center gap-2"
        >
          <MdSettings /> Initialize Default Data
        </button>
      </div>
      
      {info && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
          {info}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6 bg-white rounded-xl shadow-md p-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Search Users</h3>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name, email, or contact..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
          >
            <MdSearch /> Search
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <h4 className="font-semibold mb-2 text-gray-700">Search Results ({searchResults.length})</h4>
            <div className="space-y-2">
              {searchResults.map(user => (
                <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {user.profilePhoto ? (
                        <img src={user.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        user.name?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email || user.contact}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                  <button
                    onClick={() => viewProfile(user._id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                  >
                    <MdVisibility /> View Profile
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setTab('users')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            tab === 'users' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Users ({users.length})
        </button>
        <button
          onClick={() => setTab('spammers')}
          className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
            tab === 'spammers' ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <MdWarning /> Potential Spammers ({spammers.length})
        </button>
        <button
          onClick={() => setTab('settings')}
          className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
            tab === 'settings' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <MdSettings /> Settings
        </button>
        <button
          onClick={() => setTab('premium')}
          className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
            tab === 'premium' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <MdStar /> Premium Plans ({premiumPlans.length})
        </button>
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u._id} className="border-b hover:bg-blue-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{u.email || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{u.gender}</td>
                      <td className="px-4 py-3 text-gray-600">{u.contact}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => viewProfile(u._id)}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            title="View Profile"
                          >
                            <MdVisibility />
                          </button>
                          {u.status === 'pending' && (
                            <button
                              onClick={() => onApprove(u._id)}
                              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                              title="Approve"
                            >
                              <MdCheckCircle />
                            </button>
                          )}
                          <button
                            onClick={() => onDelete(u._id)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            title="Delete"
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Spammers Tab */}
      {tab === 'spammers' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
              <MdWarning className="text-xl" />
              Potential Spammers
            </div>
            <p className="text-sm text-red-600">
              These users have been blocked by 8 or more people. Review their profiles and take appropriate action.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading...</div>
          ) : spammers.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              ✅ No potential spammers detected
            </div>
          ) : (
            <div className="space-y-4">
              {spammers.map(user => (
                <div key={user._id} className="border border-red-200 rounded-lg p-4 bg-red-50 hover:bg-red-100 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white font-bold text-2xl">
                        {user.profilePhoto ? (
                          <img src={user.profilePhoto} alt="" className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                          user.name?.[0]?.toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-gray-800">{user.name}</h4>
                        <p className="text-sm text-gray-600">{user.email || user.contact}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-red-200 text-red-700 rounded-full font-semibold">
                            🚫 Blocked by {user.blockedByCount} users
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full">
                            {user.gender}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewProfile(user._id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                      >
                        <MdVisibility /> View
                      </button>
                      <button
                        onClick={() => onDelete(user._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <MdDelete /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <MdSettings /> Request Limit Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Free User Daily Request Limit
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.freeUserRequestLimit}
                onChange={(e) => setSettings({...settings, freeUserRequestLimit: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Number of follow requests free users can send per day
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Premium User Daily Request Limit
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={settings.premiumUserRequestLimit}
                onChange={(e) => setSettings({...settings, premiumUserRequestLimit: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Number of follow requests premium users can send per day
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSettingsUpdate}
            className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
          >
            Save Settings
          </button>
        </div>
      )}

      {/* Premium Plans Tab */}
      {tab === 'premium' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <MdStar /> Premium Plans Management
            </h3>
            <button
              onClick={() => {
                setPlanForm({ name: '', duration: 1, price: 0, discount: 0, requestLimit: 50, features: [] })
                setEditingPlan(null)
                setShowPlanModal(true)
              }}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center gap-2"
            >
              <MdAdd /> Create New Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumPlans.map(plan => (
              <div key={plan._id} className="bg-white rounded-xl shadow-md p-6 border-2 border-purple-100">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl font-bold text-gray-800">{plan.name}</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditPlan(plan)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <MdEdit />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <MdDelete />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-gray-600">Duration: <span className="font-semibold">{plan.duration} month(s)</span></p>
                  <p className="text-gray-600">Price: <span className="font-semibold text-green-600">${plan.price}</span></p>
                  {plan.discount > 0 && (
                    <p className="text-gray-600">Discount: <span className="font-semibold text-orange-600">{plan.discount}%</span></p>
                  )}
                  <p className="text-gray-600">Daily Requests: <span className="font-semibold text-purple-600">{plan.requestLimit}</span></p>
                </div>
                
                {plan.features && plan.features.length > 0 && (
                  <div>
                    <p className="font-semibold text-gray-700 mb-2">Features:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {premiumPlans.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <MdStar className="text-6xl mx-auto mb-4 text-gray-300" />
              <p className="text-xl">No premium plans created yet</p>
              <p>Create your first premium plan to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">
                {editingPlan ? 'Edit Premium Plan' : 'Create New Premium Plan'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Name</label>
                  <input
                    type="text"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                    placeholder="e.g., 1 Month Premium"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (months)</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={planForm.duration}
                      onChange={(e) => setPlanForm({...planForm, duration: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={planForm.price}
                      onChange={(e) => setPlanForm({...planForm, price: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={planForm.discount}
                      onChange={(e) => setPlanForm({...planForm, discount: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Daily Request Limit</label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={planForm.requestLimit}
                      onChange={(e) => setPlanForm({...planForm, requestLimit: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Features (one per line)</label>
                  <textarea
                    value={planForm.features.join('\n')}
                    onChange={(e) => setPlanForm({...planForm, features: e.target.value.split('\n').filter(f => f.trim())})}
                    placeholder="Unlimited messages&#10;Priority support&#10;Advanced search filters"
                    rows="4"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={editingPlan ? handleUpdatePlan : handleCreatePlan}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                >
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
