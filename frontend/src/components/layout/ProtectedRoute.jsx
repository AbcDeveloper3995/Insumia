import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { GlobalTour } from './GlobalTour';
import { Menu } from 'lucide-react';

export const ProtectedRoute = () => {
  const { session, currentRestaurant, loading, isFetchingRestaurants } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Si está cargando auth o los restaurantes, podemos mostrar un loader o nada
  if (loading || isFetchingRestaurants) return null;

  // Si no hay sesión, redirigir al login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Si no hay restaurante seleccionado, redirigir a selección
  if (!currentRestaurant) {
    return <Navigate to="/seleccionar-restaurante" replace />;
  }

  // Si hay sesión y restaurante, renderizar el layout con el Sidebar
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden relative w-full">
      <GlobalTour />
      <Sidebar isMobileOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Encabezado Móvil (Sólo visible en móviles) */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm shrink-0 z-40">
           <div className="font-black tracking-tight text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
             Insumia.
           </div>
           <button 
             onClick={() => setIsMobileMenuOpen(true)} 
             className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
           >
             <Menu size={24} />
           </button>
        </div>

        {/* Contenedor Principal de la Página */}
        <div className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8 w-full max-w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
