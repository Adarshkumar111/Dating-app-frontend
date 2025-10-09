import api from './http.js'

export async function signup(formData) {
  const res = await api.post('/auth/signup', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // Signup may take longer in production due to image upload/email
    timeout: 60000
  })
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

// ===== Multi-step signup services =====
export async function signupStep1(payload) {
  const res = await api.post('/auth/signup/step-1', payload)
  return res.data
}

export async function getSignupStatus(signupToken) {
  const res = await api.get('/auth/signup/status', { headers: { 'x-signup-token': signupToken } })
  return res.data
}

export async function signupStep2(formData, signupToken) {
  const res = await api.post('/auth/signup/step-2', formData, {
    headers: { 'Content-Type': 'multipart/form-data', 'x-signup-token': signupToken }
  })
  return res.data
}

export async function signupStep3(payload, signupToken) {
  const res = await api.post('/auth/signup/step-3', payload, { headers: { 'x-signup-token': signupToken } })
  return res.data
}

export async function signupStep4(formData, signupToken) {
  const res = await api.post('/auth/signup/step-4', formData, { headers: { 'Content-Type': 'multipart/form-data', 'x-signup-token': signupToken } })
  return res.data
}

export async function signupStep5(payload, signupToken) {
  const res = await api.post('/auth/signup/step-5', payload, { headers: { 'x-signup-token': signupToken } })
  return res.data
}
