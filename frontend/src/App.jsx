// App.jsx — Add Master Child Routes
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }       from './context/AuthContext';
import { LoadingProvider }    from './context/LoadingContext';
import ProtectedRoute         from './components/ProtectedRoute';
import AppLayout              from './components/Layout/AppLayout';
import NavigationLoader       from './components/NavigationLoader';

// Pages
import Login           from './pages/Login';
import Dashboard       from './pages/Dashboard';
import Locations       from './pages/Locations';
import SetPassword     from './pages/SetPassword';
import LocationsDetail from './pages/LocationsDetail';
import Activities      from './pages/Activities';
import ActivityDetail  from './pages/ActivityDetail';
import UploadPage      from './pages/UploadPage';
import Users           from './pages/Users';
import Reports         from './pages/Reports';
import Evidence        from './pages/Evidence';
import Notifications   from './pages/Notifications';
import ResetPassword   from './pages/ResetPassword';
// import Masters         from './pages/Masters';

import MasterCategory  from './pages/MasterCategory';
import AssignWorkers   from './pages/AssignWorkers';
import Profile from './pages/Profile';

import WorkerDetail from './pages/WorkerDetail';
import WorkersList from './pages/WorkersList';


function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <NavigationLoader />
        <Routes>

          {/* Public Routes */}
          <Route path="/login"                   element={<Login />} />
          <Route path="/set-password"            element={<SetPassword />} />
          <Route path="/reset-password/:token"   element={<ResetPassword />} />
          <Route path="/"                        element={<Navigate to="/login" />} />

          {/* ── Admin Routes ──────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index                 element={<Navigate to="dashboard" />} />
            <Route path="dashboard"      element={<Dashboard />} />
            <Route path="locations"      element={<Locations />} />
            <Route path="locations/:id"  element={<LocationsDetail />} />
            <Route path="activities"     element={<Activities />} />
            <Route path="activities/:id" element={<ActivityDetail />} />
            <Route path="upload"         element={<UploadPage />} />
            <Route path="users"          element={<Users />} />
            <Route path="reports"        element={<Reports />} />
            <Route path="evidence"       element={<Evidence />} />
            <Route path="notifications"  element={<Notifications />} />
            <Route path="profile" element={<Profile />} />


            {/* ✅ LINE 2 — ADD THIS ROUTE (only new line in admin section) */}
            <Route path="assign-workers" element={<AssignWorkers />} />

            {/* ✅ Masters Routes — UNCHANGED */}
            <Route path="masters">
              <Route
                index
                element={<Navigate to="location-type" replace />}
              />
              <Route path="location-type"  element={<MasterCategory category="location_type"  />} />
              <Route path="phase-type"     element={<MasterCategory category="phase_type"     />} />
              <Route path="vendor-type"    element={<MasterCategory category="vendor_type"    />} />
              <Route path="activity-type"  element={<MasterCategory category="activity_type"  />} />
              <Route path="priority"       element={<MasterCategory category="priority"       />} />
              <Route path="zone"           element={<MasterCategory category="zone"           />} />
              <Route path="status"         element={<MasterCategory category="status"         />} />
              <Route path="category"       element={<MasterCategory category="category"       />} />
            </Route>
          </Route>

          {/* ── Supervisor Routes — UNCHANGED ─────────────── */}
          <Route
            path="/supervisor"
            element={
              <ProtectedRoute allowedRoles={['Supervisor']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index                 element={<Navigate to="dashboard" />} />
            <Route path="dashboard"      element={<Dashboard />} />
            <Route path="locations"      element={<Locations />} />
            <Route path="locations/:id"  element={<LocationsDetail />} />
            <Route path="activities"     element={<Activities />} />
            <Route path="activities/:id" element={<ActivityDetail />} />
            <Route path="reports"        element={<Reports />} />
            <Route path="evidence"       element={<Evidence />} />
            <Route path="notifications"  element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="workers"        element={<WorkersList />} />   
            <Route path="workers/:id"    element={<WorkerDetail />} />

          </Route>

          {/* ── Worker Routes — UNCHANGED ─────────────────── */}
          <Route
            path="/worker"
            element={
              <ProtectedRoute allowedRoles={['Worker']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index                 element={<Navigate to="dashboard" />} />
            <Route path="dashboard"      element={<Dashboard />} />
            <Route path="tasks"          element={<Activities />} />
            <Route path="tasks/:id"      element={<ActivityDetail />} />
            <Route path="evidence"       element={<Evidence />} />
            <Route path="notifications"  element={<Notifications />} />
            <Route path="profile" element={<Profile />} />

          </Route>

          {/* 404 — UNCHANGED */}
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center h-screen">
                <p className="text-slate-400">404 - Not Found</p>
              </div>
            }
          />

        </Routes>
      </AuthProvider>
    </LoadingProvider>
  );
}

export default App;