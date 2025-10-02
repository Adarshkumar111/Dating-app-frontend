import api from './http.js'

export const sendRequest = async (payload) => (await api.post('/request/send', payload)).data
export const getIncoming = async () => (await api.get('/request/incoming')).data
export const respond = async (payload) => (await api.post('/request/respond', payload)).data
export const unfollow = async (userId) => (await api.post('/request/unfollow', { userId })).data
