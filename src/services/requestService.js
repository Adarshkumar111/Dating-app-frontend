import api from './http.js'

export const sendRequest = async (body) => (await api.post('/request/send', body)).data
export const getIncoming = async () => (await api.get('/request/incoming')).data
export const respondToRequest = async (body) => (await api.post('/request/respond', body)).data
export const unfollow = async (userId) => (await api.post('/request/unfollow', { userId })).data
export const cancelRequest = async (userId) => (await api.post('/request/cancel', { userId })).data
