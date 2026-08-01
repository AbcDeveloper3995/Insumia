import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ChefHat, 
  ShoppingCart,
  Menu,
  ChevronLeft,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth/authService';

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
    { to: '/inventario', icon: <Package size={20} />, label: 'Insumos' },
    { to: '/recetas', icon: <ChefHat size={20} />, label: 'Recetas' },
    { to: '/ventas', icon: <ShoppingCart size={20} />, label: 'Punto de Venta' },
  ];

  return (
    <div className={`relative flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-20'}`}>
      {/* Header / Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
        <div className={`font-bold text-xl text-blue-600 transition-opacity duration-300 ${!isExpanded && 'opacity-0 hidden'}`}>
          Insumia
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer ml-auto"
        >
          {isExpanded ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center px-3 py-2.5 rounded-lg transition-colors cursor-pointer group
              ${isActive 
                ? 'bg-blue-50 text-blue-600 font-medium' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }
            `}
          >
            <div className="flex-shrink-0">{item.icon}</div>
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
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center space-x-3 mb-4 overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
            {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className={`transition-all duration-300 ${!isExpanded ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
            <p className="text-sm font-medium text-slate-800 truncate">Administrador</p>
            <p className="text-xs text-slate-500 truncate" title={session?.user?.email}>
              {session?.user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center px-3 py-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors cursor-pointer ${!isExpanded && 'justify-center'}`}
          title="Cerrar Sesión"
        >
          <LogOut size={20} />
          <span className={`ml-3 transition-all duration-300 ${!isExpanded ? 'hidden' : 'block'}`}>
            Salir
          </span>
        </button>
      </div>
    </div>
  );
};
