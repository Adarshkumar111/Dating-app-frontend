import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as authService from '../../services/authService.js'

// Async thunks
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const data = await authService.login(credentials)
    localStorage.setItem('token', data.token)
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed')
  }
})

export const signup = createAsyncThunk('auth/signup', async (userData, { rejectWithValue }) => {
  try {
    const data = await authService.signup(userData)
    localStorage.setItem('token', data.token)
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Signup failed')
  }
})

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const data = await authService.me()
    return data.user
  } catch (error) {
    localStorage.removeItem('token')
    return rejectWithValue(error.response?.data?.message || 'Session expired')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    loading: !!localStorage.getItem('token'), // Start loading if token exists
    error: null
  },
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.loading = false
      localStorage.removeItem('token')
    },
    clearError: (state) => {
      state.error = null
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Signup
      .addCase(signup.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload
        state.token = localStorage.getItem('token')
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.error = action.payload
        localStorage.removeItem('token')
      })
  }
})

export const { logout, clearError, updateUser } = authSlice.actions
export default authSlice.reducer
