import api from './http.js'

export const getMe = async () => (await api.get('/user/me')).data
export const listOpposite = async (page=1) => (await api.get('/user/list', { params: { page } })).data
export const getProfile = async (id) => (await api.get(`/user/${id}`)).data
export const rejectUser = async (userId) => (await api.post('/user/reject', { userId })).data
