import api from './http.js'

export async function signup(formData) {
  const res = await api.post('/auth/signup', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data
}

export async function login(payload) {
  const res = await api.post('/auth/login', payload)
  return res.data
}

export async function me() {
  const res = await api.get('/auth/me')
  return res.data
}

export async function requestLoginOtp(email) {
  const res = await api.post('/auth/request-login-otp', { email })
  return res.data
}

export async function verifyLoginOtp(email, otp) {
  const res = await api.post('/auth/verify-login-otp', { email, otp })
  return res.data
}

export async function verifyEmailOtp(email, otp) {
  const res = await api.post('/auth/verify-email-otp', { email, otp })
  return res.data
}

export async function resendEmailOtp(email) {
  const res = await api.post('/auth/resend-email-otp', { email })
  return res.data
}
