import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';

export const ProtectedRoute = () => {
  const { session } = useAuth();

  // Si no hay sesión, redirigir al login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Si hay sesión, renderizar el layout con el Sidebar
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden p-4">
        <Outlet />
      </main>
    </div>
  );
};
