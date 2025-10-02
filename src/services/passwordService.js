import api from './http.js'

export const requestPasswordReset = async (payload) => (await api.post('/password/request-reset', payload)).data

export const resetPassword = async (payload) => (await api.post('/password/reset', payload)).data
