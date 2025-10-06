import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './styles/compact.css'
import { useAuth } from './context/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import MobileBottomBar from './components/MobileBottomBar.jsx'
import MessageNotificationBanner from './components/MessageNotificationBanner.jsx'
import SignupPage from './pages/SignupPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import WaitingApprovalPage from './pages/WaitingApprovalPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ProfileViewPage from './pages/ProfileViewPage.jsx'
import EditProfilePage from './pages/EditProfilePage.jsx'
import ForgetPasswordPage from './pages/ForgetPasswordPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import PremiumPage from './pages/PremiumPage.jsx'
import AdminPanelPage from './pages/AdminPanelPage.jsx'
import BlockedUsersPage from './pages/BlockedUsersPage.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage.jsx'

function PrivateRoute({ children, allowPending = false, adminOnly = false, noAdmin = false }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (!allowPending && user?.status === 'pending') return <Navigate to="/waiting" replace />
  
  // Redirect admins away from user-only routes
  if (noAdmin && user?.isAdmin) return <Navigate to="/admin" replace />
  
  // Redirect non-admins away from admin-only routes
  if (adminOnly && !user?.isAdmin) return <Navigate to="/dashboard" replace />
  
  return children
}

export default function App() {
  const { token, user } = useAuth()
  
  // Determine default route based on user type
  const getDefaultRoute = () => {
    if (!user) return "/login"
    if (user.isAdmin) return "/admin"
    return "/dashboard"
  }
  
  return (
    <div className="min-h-screen app-blue app-compact">
      {token && <Navbar />}
      {token && <div className="h-16 md:h-20" />}
      {token && <MessageNotificationBanner />}
      {token && <MobileBottomBar />}
      {/* Bottom spacer for mobile bottom bar */}
      {token && <div className="h-14 md:h-0" />}
      <ToastContainer position="top-center" autoClose={2500} hideProgressBar closeOnClick pauseOnHover={false} theme="colored" />
      <Routes>
        <Route path="/" element={<Navigate to={getDefaultRoute()} />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forget-password" element={<ForgetPasswordPage />} />
        <Route path="/waiting" element={<PrivateRoute allowPending={true}><WaitingApprovalPage /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute noAdmin={true}><DashboardPage /></PrivateRoute>} />
        <Route path="/profile/:id" element={<PrivateRoute><ProfileViewPage /></PrivateRoute>} />
        <Route path="/profile/edit" element={<PrivateRoute><EditProfilePage /></PrivateRoute>} />
        <Route path="/chat/:chatId" element={<PrivateRoute noAdmin={true}><ChatPage /></PrivateRoute>} />
        <Route path="/premium" element={<PrivateRoute noAdmin={true}><PremiumPage /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute adminOnly={true}><AdminPanelPage /></PrivateRoute>} />
        <Route path="/blocked-users" element={<PrivateRoute><BlockedUsersPage /></PrivateRoute>} />
      </Routes>
    </div>
  )
}
