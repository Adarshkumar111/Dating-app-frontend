import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { fetchCurrentUser } from './store/slices/authSlice'

// Components
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

// Pages
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ProfileViewPage from './pages/ProfileViewPage.jsx'
import ChatPageRedux from './pages/ChatPageRedux.jsx'

export default function App() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, loading } = useAppSelector(state => state.auth)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      dispatch(fetchCurrentUser())
    }
  }, [dispatch])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {isAuthenticated && <Navbar />}
      
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        <Route 
          path="/signup" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />} 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile/:userId" 
          element={
            <ProtectedRoute>
              <ProfileViewPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chat/:chatId" 
          element={
            <ProtectedRoute>
              <ChatPageRedux />
            </ProtectedRoute>
          } 
        />
        
        {/* Default Route */}
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
        />
        <Route 
          path="*" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </>
  )
}
