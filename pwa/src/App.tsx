import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import PlanningPage from './pages/PlanningPage';
import CartePage from './pages/CartePage';
import ProfilPage from './pages/ProfilPage';
import BottomNav from './components/BottomNav';

export default function App() {
  const { user } = useAuth();

  if (!user) return <LoginPage />;

  return (
    <div className="h-screen flex flex-col bg-neutral overflow-hidden">
      <div className="flex-1 overflow-auto pb-20">
        <Routes>
          <Route path="/" element={<Navigate to="/planning" replace />} />
          <Route path="/planning" element={<PlanningPage />} />
          <Route path="/carte" element={<CartePage />} />
          <Route path="/profil" element={<ProfilPage />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}
