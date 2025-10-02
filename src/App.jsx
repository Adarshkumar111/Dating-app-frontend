import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { fetchCurrentUser } from './store/slices/authSlice'

// Components
import Navbar from './components/Navbar.jsx'

// Pages
import SignupPage from './pages/SignupPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import WaitingApprovalPage from './pages/WaitingApprovalPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ProfileViewPage from './pages/ProfileViewPage.jsx'
import EditProfilePage from './pages/EditProfilePage.jsx'
import ForgetPasswordPage from './pages/ForgetPasswordPage.jsx'
import ChatPageRedux from './pages/ChatPageRedux.jsx'
import PremiumPage from './pages/PremiumPage.jsx'
import AdminPanelPage from './pages/AdminPanelPage.jsx'

function PrivateRoute({ children, allowPending = false }) {
  const { isAuthenticated, user, loading } = useAppSelector(state => state.auth)
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!allowPending && user?.status === 'pending') return <Navigate to="/waiting" replace />
  return children
}

export default function App() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, loading, token, user } = useAppSelector(state => state.auth)

  useEffect(() => {
    // Fetch user data if we have a token but no user
    const storedToken = localStorage.getItem('token')
    if (storedToken && !user) {
      dispatch(fetchCurrentUser())
    }
  }, [dispatch, user])

  // Show loading only during initial auth check
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
          path="/signup" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />} 
        />
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        <Route path="/forget-password" element={<ForgetPasswordPage />} />
        
        {/* Protected Routes */}
        <Route 
          path="/waiting" 
          element={<PrivateRoute allowPending={true}><WaitingApprovalPage /></PrivateRoute>} 
        />
        <Route 
          path="/dashboard" 
          element={<PrivateRoute><DashboardPage /></PrivateRoute>} 
        />
        <Route 
          path="/profile/:id" 
          element={<PrivateRoute><ProfileViewPage /></PrivateRoute>} 
        />
        <Route 
          path="/profile/edit" 
          element={<PrivateRoute><EditProfilePage /></PrivateRoute>} 
        />
        <Route 
          path="/chat/:chatId" 
          element={<PrivateRoute><ChatPageRedux /></PrivateRoute>} 
        />
        <Route 
          path="/premium" 
          element={<PrivateRoute><PremiumPage /></PrivateRoute>} 
        />
        <Route 
          path="/admin" 
          element={<PrivateRoute><AdminPanelPage /></PrivateRoute>} 
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
