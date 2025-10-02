import api from './http.js'

export async function signup(formData) {
  const res = await api.post('/auth/signup', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data
}

export async function login(payload) {
  const res = await api.post('/auth/login', payload)
  return res.data
}
