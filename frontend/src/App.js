import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import TenantLayout from './layouts/TenantLayout';
import AdminBilling from './pages/AdminBilling';

// 🚀 Pages
import Login from './pages/login';
import Register from './pages/Register';
import TenantDashboard from './pages/TenantDashboard.jsx';
import BillingView from './pages/BillingView';
import MaintenanceView from './pages/MaintenanceView';

// 🛠️ Caretaker Pages
import CaretakerTickets from './pages/CaretakerTickets';
import CaretakerUtilities from './pages/CaretakerUtilities';
import CaretakerAnnouncements from './pages/CaretakerAnnouncements';
import CaretakerExpenses from './pages/CaretakerExpenses';
import CaretakerLayout from './layouts/CaretakerLayout';
import CaretakerUtilitiesPage from './pages/CaretakerUtilitiesPage';

// 🏢 Admin Pages
import AdminPendingQueue from './pages/AdminPendingQueue';
import AdminInvitePage from './pages/AdminInvitePage';
import AdminPropertiesPage from './pages/AdminPropertiesPage';
import AdminLayout from './layouts/AdminLayout';
import AdminUsersPage from './pages/AdminUsersPage';
import UnitsPage from './pages/UnitsPage';
import StaffProvisioning from './pages/StaffProvisioning';
import EstateOverviewPage from './pages/EstateOverviewPage';
import BillingGeneration from './pages/admin/BillingGeneration';


import TenantChatPage from './pages/TenantChatPage';
import CaretakerChatPage from './pages/CaretakerChatPage';
import AdminChatPage from './pages/AdminChatPage';

import UpdatePassword from './pages/UpdatePassword';

import TenantBroadcasts from './pages/tenant/TenantBroadcasts';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid #333' } }}
        />

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 🔒 Shielded Tenant Ecosystem Portal */}
          <Route element={<ProtectedRoute allowedRoles={['Tenant']} />}>
            <Route path="/portal" element={<TenantLayout />}>
              <Route index element={<Navigate to="/portal/dashboard" replace />} />
              <Route path="dashboard" element={<TenantDashboard />} />
              <Route path="billing" element={<BillingView />} />
              <Route path="maintenance" element={<MaintenanceView />} />
              <Route path="chat" element={<TenantChatPage />} />
              <Route path="password" element={<UpdatePassword />} />
              <Route path="broadcasts" element={<TenantBroadcasts />} />
            </Route>
          </Route>

          {/* 🔒 Shielded Caretaker Ecosystem Portal */}
          <Route element={<ProtectedRoute allowedRoles={['Caretaker']} />}>
            <Route path="/caretaker" element={<CaretakerLayout />}>
              <Route index element={<Navigate to="/caretaker/tickets" replace />} />
              <Route path="tickets" element={<CaretakerTickets />} />
              <Route path="announcements" element={<CaretakerAnnouncements />} />
              <Route path="expenses" element={<CaretakerExpenses />} />
              <Route path="invite" element={<AdminInvitePage />} />
              <Route path="chat" element={<CaretakerChatPage />} />
              <Route path="new-utility-page" element={<CaretakerUtilitiesPage />} />
              {/* NEW PASSWORD ROUTE */}
              <Route path="password" element={<UpdatePassword />} />
            </Route>
          </Route>

          {/* 🔒 Shielded Admin Command Center Portal */}
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/overview" replace />} />
              <Route path="overview" element={<EstateOverviewPage />} />
              <Route path="queue" element={<AdminPendingQueue />} />
              <Route path="invites" element={<AdminInvitePage />} />
              <Route path="properties" element={<AdminPropertiesPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="units" element={<UnitsPage />} />
              <Route path="provisioning" element={<StaffProvisioning />} />
              <Route path="billing" element={<AdminBilling />} />
              <Route path="chat" element={<AdminChatPage />} />
              <Route path="billing-generation" element={<BillingGeneration />} />
              {/* NEW PASSWORD ROUTE */}
              <Route path="password" element={<UpdatePassword />} />

              <Route path="settings" element={
                <div className="p-12 text-slate-400 font-mono text-xs tracking-wider animate-pulse">
                  [ ADMINISTRATIVE CORE: BUILDING OUT SYSTEM SETTINGS CORE... ]
                </div>
              } />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;