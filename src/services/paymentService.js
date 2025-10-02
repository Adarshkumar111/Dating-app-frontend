import api from './http.js'

export const subscribe = async (payload) => (await api.post('/payment/subscribe', payload)).data
