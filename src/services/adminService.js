import api from './http.js'

export const listUsers = async () => (await api.get('/admin/users')).data
export const approveUser = async (userId) => (await api.post('/admin/approve', { userId })).data
export const deleteUser = async (userId) => (await api.delete('/admin/delete', { data: { userId } })).data
export const listChats = async () => (await api.get('/admin/chats')).data
export const listPlans = async () => (await api.get('/admin/plans')).data
export const createPlan = async (payload) => (await api.post('/admin/plan', payload)).data
export const updatePlan = async (planId, payload) => (await api.put(`/admin/plan/${planId}`, payload)).data
