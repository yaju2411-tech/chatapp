import { GlobalPage } from './page/GlobalPage'
import { LoginForm } from '../src/components/HomeComponent/LoginForm'
import { SignupForm } from './components/HomeComponent/SignupForm'
import HomePage from './page/HomePage'
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from '../src/components/HomeComponent/ProtectedRoute';
import { AuthSuccess } from '../src/page/AuthAccess';
import { VerifyByOtp } from './page/VerifyByOtp';
import { ForgotPassword } from './page/ForgotPassword';
import AdminDashboardPage from './page/AdminDashboard';
import { AdminRoute } from './components/adminComponent/AdminProtectedRoute';
import { SuperAdminRoute } from './components/adminComponent/SuperAdminRoute';
import { JoinGroup } from './page/JoinGroup';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<GlobalPage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/verify-otp" element={<VerifyByOtp/>}/>
        <Route path="/auth-success" element={<AuthSuccess/>}/>
        <Route path="/forgotPassword" element={<ForgotPassword/>}/>
        <Route path="/home" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }/>
        <Route path='/admin' element={
          <AdminRoute>
            <AdminDashboardPage /> 
          </AdminRoute>
        }/>
        <Route path='/superadmin' element={
          <SuperAdminRoute>
            <AdminDashboardPage /> 
          </SuperAdminRoute>
        }/>
        <Route path="/group/join/:inviteCode" element={
          <ProtectedRoute>
            <JoinGroup />
          </ProtectedRoute>
        } />
        <Route path='/friends'/>
      </Routes>
    </>
  )
}

export default App
