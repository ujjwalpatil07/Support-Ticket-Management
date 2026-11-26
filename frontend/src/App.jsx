import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { GuestRoute } from './routes/GuestRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { UserDashboardPage } from './pages/user/UserDashboardPage';
import { UserTicketsPage } from './pages/user/UserTicketsPage';
import { CreateTicketPage } from './pages/user/CreateTicketPage';
import { UserTicketDetailsPage } from './pages/user/UserTicketDetailsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminTicketsPage } from './pages/admin/AdminTicketsPage';
import { AdminTicketDetailsPage } from './pages/admin/AdminTicketDetailsPage';
import { NotificationsPage } from './pages/shared/NotificationsPage';
import { ProfilePage } from './pages/shared/ProfilePage';
import { ROLES } from './utils/constants';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Guest Routes */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* User Routes */}
            <Route element={<ProtectedRoute allowedRoles={[ROLES.USER]} />}>
              <Route path="/dashboard" element={<UserDashboardPage />} />
              <Route path="/tickets" element={<UserTicketsPage />} />
              <Route path="/tickets/new" element={<CreateTicketPage />} />
              <Route path="/tickets/:id" element={<UserTicketDetailsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/tickets" element={<AdminTicketsPage />} />
              <Route path="/admin/tickets/:id" element={<AdminTicketDetailsPage />} />
              <Route path="/admin/notifications" element={<NotificationsPage />} />
              <Route path="/admin/profile" element={<ProfilePage />} />
            </Route>

            {/* Fallback */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
