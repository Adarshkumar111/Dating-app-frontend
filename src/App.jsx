import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
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

function PrivateRoute({ children, allowPending = false }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (!allowPending && user?.status === 'pending') return <Navigate to="/waiting" replace />
  return children
}

export default function App() {
  const { token } = useAuth()
  
  return (
    <>
      {token && <Navbar />}
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forget-password" element={<ForgetPasswordPage />} />
        <Route path="/waiting" element={<PrivateRoute allowPending={true}><WaitingApprovalPage /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/profile/:id" element={<PrivateRoute><ProfileViewPage /></PrivateRoute>} />
        <Route path="/profile/edit" element={<PrivateRoute><EditProfilePage /></PrivateRoute>} />
        <Route path="/chat/:chatId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/premium" element={<PrivateRoute><PremiumPage /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminPanelPage /></PrivateRoute>} />
      </Routes>
    </>
  )
}
