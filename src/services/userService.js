import api from './http.js'

export const getMe = async () => (await api.get('/user/me')).data
export const listOpposite = async (params = {}) => (await api.get('/user/list', { params })).data
export const getFriends = async () => (await api.get('/user/friends')).data
export const getProfile = async (id) => (await api.get(`/user/${id}`)).data
export const rejectUser = async (userId) => (await api.post('/user/reject', { userId })).data
export const blockUser = async (userId) => (await api.post('/user/block', { userId })).data
export const unblockUser = async (userId) => (await api.post('/user/unblock', { userId })).data
export const getBlockedUsers = async () => (await api.get('/user/blocked')).data
export const deleteChatsWithUser = async (userId) => (await api.post('/user/delete-chats', { userId })).data
