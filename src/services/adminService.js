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
