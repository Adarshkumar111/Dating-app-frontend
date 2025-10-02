import React, { createContext, useContext, useEffect, useState } from 'react'
import * as auth from '../services/authService.js'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  })

  useEffect(() => {
    if (token) localStorage.setItem('token', token); else localStorage.removeItem('token')
    if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user')
  }, [token, user])

  const login = async (payload) => {
    const res = await auth.login(payload)
    setToken(res.token)
    setUser({ ...res.user, status: res.status })
  }

  const logout = () => { setToken(null); setUser(null) }

  const value = { token, user, login, logout, setUser }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
