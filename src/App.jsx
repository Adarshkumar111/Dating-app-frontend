import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './styles/compact.css'
import { useAuth } from './context/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import MobileBottomBar from './components/MobileBottomBar.jsx'
import MessageNotificationBanner from './components/MessageNotificationBanner.jsx'
import SignupPage from './pages/SignupPage.jsx'
import Step1Account from './pages/signup/Step1Account.jsx'
import Step2Personal from './pages/signup/Step2Personal.jsx'
import Step3Location from './pages/signup/Step3Location.jsx'
import Step4Photos from './pages/signup/Step4Photos.jsx'
import Step5MoreDetails from './pages/signup/Step5MoreDetails.jsx'
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
  const location = useLocation()
  const isDashboardRoute = (location.pathname || '').startsWith('/dashboard')
  const path = (location.pathname || '')
  const isNoNavPadRoute = (
    isDashboardRoute ||
    path === '/login' ||
    path === '/signup' ||
    path === '/waiting' ||
    path === '/verify-email' ||
    path === '/forget-password'
  )
  
  // Determine default route based on user type
  const getDefaultRoute = () => {
    if (!user) return "/login"
    if (user.isAdmin) return "/admin"
    return "/dashboard"
  }
  
  return (
    <div className={`min-h-screen app-compact ${isNoNavPadRoute ? 'no-nav-pad' : ''} ${isDashboardRoute ? 'overflow-hidden' : ''}`} style={{ backgroundColor: '#FFF8E7' }}>
      {token && <Navbar />}
      {/* Top spacer for all non-dashboard routes to offset fixed navbar height */}
      {token && !isDashboardRoute && (
        <div className="" />
      )}
      {token && <MessageNotificationBanner />}
      {token && <MobileBottomBar />}
      {/* Bottom spacer for mobile bottom bar - hidden on chat routes */}
      {token && location.pathname && !location.pathname.startsWith('/chat/') && <div  />}
      <ToastContainer position="top-center" autoClose={2500} hideProgressBar closeOnClick pauseOnHover={false} theme="colored" limit={1} />
    <Routes>
      <Route path="/" element={<Navigate to={getDefaultRoute()} />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<Navigate to="/signup/step-1" replace />} />
      <Route path="/signup/step-1" element={<Step1Account />} />
      <Route path="/signup/step-2" element={<Step2Personal />} />
      <Route path="/signup/step-3" element={<Step3Location />} />
      <Route path="/signup/step-4" element={<Step4Photos />} />
      <Route path="/signup/step-5" element={<Step5MoreDetails />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forget-password" element={<ForgetPasswordPage />} />
      <Route path="/waiting" element={<PrivateRoute allowPending={true}><WaitingApprovalPage /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute noAdmin={true}><DashboardPage /></PrivateRoute>} />
      <Route path="/profile/:id" element={<PrivateRoute><ProfileViewPage /></PrivateRoute>} />
      <Route path="/profile/edit" element={<PrivateRoute><EditProfilePage /></PrivateRoute>} />
      <Route path="/chat/:chatId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
      <Route path="/premium" element={<PrivateRoute noAdmin={true}><PremiumPage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute adminOnly={true}><AdminPanelPage /></PrivateRoute>} />
      <Route path="/blocked-users" element={<PrivateRoute><BlockedUsersPage /></PrivateRoute>} />
    </Routes>
    </div>
  )
}
