import axios from 'axios'

const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
  timeout: 10000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      console.error('❌ Backend server is not running. Please start the server with: cd server && npm start')
    }
    return Promise.reject(error)
  }
)

export default api
