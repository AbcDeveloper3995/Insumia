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
  Truck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth/authService';
import { NotificationBell } from './NotificationBell';

export const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { session } = useAuth();

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/caja', icon: <Wallet size={20} />, label: 'Caja' },
    { to: '/inventario', icon: <Package size={20} />, label: 'Insumos' },
    { to: '/compras', icon: <Truck size={20} />, label: 'Compras' },
    { to: '/recetas', icon: <ChefHat size={20} />, label: 'Recetas' },
    { to: '/ventas', icon: <ShoppingCart size={20} />, label: 'Punto de Venta' },
    { to: '/informes', icon: <BarChart3 size={20} />, label: 'Informes' },
  ];

  return (
    <div className={`relative flex flex-col bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) z-50 ${isExpanded ? 'w-64' : 'w-20'}`}>
      {/* Header / Logo */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-slate-100/50">
        <div className={`font-black tracking-tight text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent transition-opacity duration-300 ${!isExpanded && 'opacity-0 hidden'}`}>
          Insumia.
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100/80 transition-all cursor-pointer ml-auto active:scale-95"
        >
          {isExpanded ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer group relative overflow-hidden
              ${isActive 
                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20 translate-x-1' 
                : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
              }
            `}
          >
            <div className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110`}>{item.icon}</div>
            <span 
              className={`ml-3 whitespace-nowrap transition-all duration-300
                ${!isExpanded ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}
              `}
            >
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="border-t border-slate-100/50 p-4 bg-slate-50/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 overflow-hidden px-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0 shadow-inner">
              {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className={`transition-all duration-300 ${!isExpanded ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
              <p className="text-sm font-bold text-slate-800 truncate tracking-tight">Administrador</p>
              <p className="text-xs text-slate-400 truncate font-medium" title={session?.user?.email}>
                {session?.user?.email}
              </p>
            </div>
          </div>
          <div className={`transition-all duration-300 ${!isExpanded ? 'hidden' : 'block'}`}>
            <NotificationBell isSidebarExpanded={isExpanded} />
          </div>
        </div>
        
        {/* En vista contraída, mostrar la campana sola arriba del botón salir */}
        {!isExpanded && (
           <div className="mb-4 flex justify-center">
             <NotificationBell isSidebarExpanded={isExpanded} />
           </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center px-3 py-2.5 text-slate-400 font-medium hover:bg-red-50 hover:text-red-600 rounded-xl transition-all cursor-pointer active:scale-95 ${!isExpanded && 'justify-center'}`}
          title="Cerrar Sesión"
        >
          <LogOut size={18} />
          <span className={`ml-3 transition-all duration-300 ${!isExpanded ? 'hidden' : 'block'}`}>
            Cerrar sesión
          </span>
        </button>
      </div>
    </div>
  );
};
