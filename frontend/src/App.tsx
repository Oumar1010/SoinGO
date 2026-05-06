import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';
import LoginPage    from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage  from './pages/PatientsPage';
import VisitsPage    from './pages/VisitsPage';
import MapPage       from './pages/MapPage';
import UsersPage     from './pages/UsersPage';
import PlanningPage  from './pages/PlanningPage';
import Layout        from './components/Layout';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center mb-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
              <span className="text-white text-lg font-black">S</span>
            </div>
            <h1 className="text-3xl font-black">
              <span className="text-primary">Soin</span>
              <span className="text-accent">Go</span>
            </h1>
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return (
    <>
      <LoginPage />
      <Toaster position="top-right" toastOptions={{ className: 'text-sm font-medium' }} />
    </>
  );

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/"          element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/planning"  element={<PlanningPage />} />
          <Route path="/patients"  element={<PatientsPage />} />
          <Route path="/visits"    element={<VisitsPage />} />
          <Route path="/map"       element={<MapPage />} />
          <Route path="/users"     element={<UsersPage />} />
        </Routes>
      </Layout>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'text-sm font-medium shadow-lg',
          duration: 3500,
          style: { borderRadius: '12px', padding: '12px 16px' },
          success: { iconTheme: { primary: '#2ECC71', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#E74C3C', secondary: '#fff' } },
        }}
      />
    </>
  );
}
