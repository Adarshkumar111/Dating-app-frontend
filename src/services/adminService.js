import api from './http.js'

export const listUsers = async () => (await api.get('/admin/users')).data
export const approveUser = async (userId) => (await api.post('/admin/approve', { userId })).data
export const deleteUser = async (userId) => (await api.post('/admin/delete', { userId })).data
export const searchUsers = async (query) => (await api.get(`/admin/search?q=${encodeURIComponent(query)}`)).data
export const getSpammers = async () => (await api.get('/admin/spammers')).data
export const getUserChatHistory = async (userId) => (await api.get(`/admin/user/${userId}/chats`)).data
export const adminBlockUser = async (userId) => (await api.post('/admin/block-user', { userId })).data
export const adminUnblockUser = async (userId) => (await api.post('/admin/unblock-user', { userId })).data

// Settings
export const getSettings = async () => (await api.get('/admin/settings')).data
export const updateSettings = async (settings) => (await api.post('/admin/settings', settings)).data

// Premium Plans
export const getPremiumPlans = async () => (await api.get('/admin/premium-plans')).data
export const createPremiumPlan = async (plan) => (await api.post('/admin/premium-plans', plan)).data
export const updatePremiumPlan = async (planId, plan) => (await api.put(`/admin/premium-plans/${planId}`, plan)).data
export const deletePremiumPlan = async (planId) => (await api.delete(`/admin/premium-plans/${planId}`)).data

// Initialize defaults (settings and premium plans)
export const initializeDefaultData = async () => (await api.post('/admin/initialize')).data

// Payments stats
export const getPaymentStats = async () => (await api.get('/admin/payments/stats')).data

// App Settings (comprehensive)
export const getAppSettings = async () => (await api.get('/admin/app-settings')).data
export const updateAppSettings = async (settings) => (await api.put('/admin/app-settings', settings)).data
export const uploadPreAuthBanner = async (file) => {
  const fd = new FormData()
  fd.append('image', file)
  return (await api.post('/admin/preauth-banner', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data
}

export const uploadOnboardingSlides = async (files) => {
  const fd = new FormData()
  ;(files || []).forEach(f => fd.append('images', f))
  return (await api.post('/admin/onboarding-slides', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data
}

// Profile Edit Approval
export const getPendingProfileEdits = async () => (await api.get('/admin/pending-edits')).data
export const approveProfileEditApi = async (userId) => (await api.post('/admin/approve-edit', { userId })).data
export const rejectProfileEditApi = async (userId, reason) => (await api.post('/admin/reject-edit', { userId, reason })).data

// User Priority (Pin to Top)
export const setUserPriority = async (userId, priority) => (await api.post('/admin/user-priority', { userId, priority })).data
