import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ChefHat, 
  ShoppingCart, 
  BarChart3,
  Menu,
  ChevronLeft,
  LogOut,
  Wallet,
  Truck,
  Store,
  Building,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTour } from '../../context/TourContext';
import { authService } from '../../services/auth/authService';
import { NotificationBell } from './NotificationBell';
import { useCaja } from '../../context/CajaContext';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export const Sidebar = ({ isMobileOpen, setIsMobileMenuOpen }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { session } = useAuth();
  const { startActivePageTour, hasActiveTour } = useTour();
  const { cajaActiva, isLoadingCaja } = useCaja();

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard', requireCaja: true },
    { to: '/compras', icon: <Truck size={20} />, label: 'Compras', requireCaja: true },
    { to: '/inventario', icon: <Package size={20} />, label: 'Inventario', requireCaja: true },
    { to: '/recetas', icon: <ChefHat size={20} />, label: 'Recetas', requireCaja: true },
    { to: '/ventas', icon: <ShoppingCart size={20} />, label: 'Punto de Venta', requireCaja: false },
    { to: '/informes', icon: <BarChart3 size={20} />, label: 'Informes', requireCaja: true },
    { to: '/finanzas', icon: <Building size={20} />, label: 'Finanzas', requireCaja: true },
    { to: '/seleccionar-restaurante', icon: <Store size={20} />, label: 'Mis Restaurantes', requireCaja: false },
  ];

  return (
    <>
      {/* Overlay Móvil */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 md:relative flex flex-col bg-white/95 md:bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-400 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isExpanded ? 'w-72 md:w-64' : 'w-72 md:w-20'}
      `}>
        {/* Header / Logo */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-slate-100/50">
          <div className={`font-black tracking-tight text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent transition-opacity duration-300 ${!isExpanded && 'md:opacity-0 md:hidden'}`}>
            Insumia.
          </div>
          
          <button 
            onClick={() => {
              if (window.innerWidth < 768) {
                setIsMobileMenuOpen(false);
              } else {
                setIsExpanded(!isExpanded);
              }
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100/80 transition-all cursor-pointer ml-auto active:scale-95"
          >
            {isExpanded ? <ChevronLeft size={20} className="hidden md:block" /> : <Menu size={20} className="hidden md:block" />}
            <ChevronLeft size={24} className="md:hidden" />
          </button>
        </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        {navItems.map((item) => {
          const isLocked = item.requireCaja && !cajaActiva && !isLoadingCaja;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={(e) => {
                if (isLocked) {
                  e.preventDefault();
                  toast('Debes abrir el turno en el Punto de Venta primero.', {
                    icon: '🔒',
                    style: {
                      borderRadius: '10px',
                      background: '#fff3cd',
                      color: '#856404',
                    },
                  });
                } else {
                  if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
                }
              }}
              className={({ isActive }) => `
                flex items-center px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                ${isLocked ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400' : 'cursor-pointer'}
                ${isActive && !isLocked
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20 translate-x-1' 
                  : !isLocked ? 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 font-medium' : ''
                }
                ${item.to === '/ventas' && !cajaActiva && !isLoadingCaja ? 'ring-2 ring-blue-500/50 bg-blue-50 text-blue-700 font-bold animate-pulse' : ''}
              `}
            >
              <div className={`flex-shrink-0 transition-transform duration-200 ${!isLocked && 'group-hover:scale-110'}`}>{item.icon}</div>
              <span 
                className={`ml-3 whitespace-nowrap transition-all duration-300 flex-1
                  ${!isExpanded ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}
                `}
              >
                {item.label}
              </span>
              {isLocked && isExpanded && <Lock size={14} className="ml-auto text-slate-400" />}
              {isLocked && !isExpanded && (
                <div className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-sm">
                  <Lock size={10} className="text-slate-400" />
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="border-t border-slate-100/50 p-4 bg-slate-50/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 overflow-hidden px-1 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0 shadow-inner">
              {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className={`transition-all duration-300 flex-1 min-w-0 ${!isExpanded ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
              <p className="text-sm font-bold text-slate-800 truncate tracking-tight">Administrador</p>
              <p className="text-xs text-slate-400 truncate font-medium" title={session?.user?.email}>
                {session?.user?.email}
              </p>
            </div>
          </div>
          <div className={`transition-all duration-300 flex items-center gap-2 shrink-0 ${!isExpanded ? 'hidden' : 'block'}`}>
            {hasActiveTour && (
              <button 
                onClick={startActivePageTour} 
                className="group flex items-center justify-center p-2 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-300 shadow-sm relative overflow-hidden" 
                title="Iniciar Tour Guiado"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <HelpCircle size={20} className="relative z-10" />
                {/* Ping animation to draw attention gently */}
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              </button>
            )}
            <NotificationBell isSidebarExpanded={isExpanded} />
          </div>
        </div>
        
        {/* En vista contraída, mostrar iconos sueltos arriba del botón salir */}
        {!isExpanded && (
           <div className="mb-4 flex flex-col items-center gap-3">
             {hasActiveTour && (
               <button 
                 onClick={startActivePageTour} 
                 className="group flex items-center justify-center p-2 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-300 shadow-sm relative overflow-hidden w-full" 
                 title="Iniciar Tour Guiado"
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 <HelpCircle size={20} className="relative z-10" />
                 <span className="absolute top-1 right-1 flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                 </span>
               </button>
             )}
             <NotificationBell isSidebarExpanded={isExpanded} />
           </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center px-3 py-2.5 text-slate-400 font-medium hover:bg-red-50 hover:text-red-600 rounded-xl transition-all cursor-pointer active:scale-95 ${!isExpanded && 'justify-center'}`}
          title="Cerrar Sesión"
        >
          <LogOut size={18} />
          <span className={`ml-3 transition-all duration-300 ${!isExpanded ? 'md:hidden' : 'block'}`}>
            Cerrar sesión
          </span>
        </button>
      </div>
      </div>
    </>
  );
};
