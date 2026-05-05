import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import VisitsPage from './pages/VisitsPage';
import MapPage from './pages/MapPage';
import UsersPage from './pages/UsersPage';
import Layout from './components/Layout';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            <span className="text-primary">Soin</span>
            <span className="text-accent">Go</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/patients"  element={<PatientsPage />} />
        <Route path="/visits"    element={<VisitsPage />} />
        <Route path="/map"       element={<MapPage />} />
        <Route path="/users"     element={<UsersPage />} />
      </Routes>
    </Layout>
  );
}
