import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, AlertTriangle, AlertCircle, Building, X, Package, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/api/client';
import { insumosService } from '../../services/api/insumos';
import { recetasService } from '../../services/api/recetas';

export const NotificationBell = ({ isSidebarExpanded }) => {
  const { currentRestaurant } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState({
    stock: [],
    recetas: [],
    deudas: [],
    descuadreCaja: 0
  });
  
  const popoverRef = useRef(null);

  const fetchAlertas = async () => {
    try {
      setLoading(true);
      const sessionRes = await supabase.auth.getSession();
      const user = sessionRes.data?.session?.user;
      if (!user) return;
      
      const restauranteId = currentRestaurant?.id;

      // 1. Alertas de Stock
      const insumos = await insumosService.getInsumos();
      const stockAlerts = insumos?.filter(i => i.cantidad_actual_base <= i.umbral_minimo) || [];

      // 2. Alertas de Recetas (Margen < 50%)
      const recetas = await recetasService.getRecetas();
      const recetasAlerts = (recetas || []).filter(r => {
        const costo = (Number(r.costo_total) || 0) / (Number(r.rendimiento) || 1);
        const precio = Number(r.precio_venta) || 0;
        if (precio <= 0 || r.es_subreceta) return false;
        const margen = ((precio - costo) / precio) * 100;
        return margen < 50;
      });

      // 3. Deudas por Pagar
      const { data: comprasData } = await supabase
        .from('compras')
        .select('*')
        .eq('restaurante_id', restauranteId)
        .eq('estado', 'pendiente');
      
      // 4. Descuadres de Caja (Faltante de dinero)
      const { data: cajasData } = await supabase
        .from('cajas')
        .select('*')
        .eq('restaurante_id', restauranteId)
        .eq('estado', 'cerrada');
        
      let totalDescuadre = 0;
      cajasData?.forEach(c => {
         const esperado = Number(c.monto_final_esperado) || 0;
         const real = Number(c.monto_final_real) || 0;
         totalDescuadre += (real - esperado);
      });
      
      setAlertas({
        stock: stockAlerts,
        recetas: recetasAlerts,
        deudas: comprasData || [],
        descuadreCaja: totalDescuadre < 0 ? Math.abs(totalDescuadre) : 0
      });

    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertas();
    
    // Listener global para refrescar alertas desde otros componentes
    const handleRefreshAlerts = () => fetchAlertas();
    window.addEventListener('refreshAlerts', handleRefreshAlerts);
    
    // Configurar listener para clics fuera del popover
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('refreshAlerts', handleRefreshAlerts);
    };
  }, []);

  const totalAlerts = alertas.stock.length + alertas.recetas.length + alertas.deudas.length + (alertas.descuadreCaja > 0 ? 1 : 0);

  return (
    <div className="relative" ref={popoverRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all cursor-pointer ${isOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100/80'} ${!isSidebarExpanded ? 'mx-auto block' : ''}`}
        title="Notificaciones"
      >
        <Bell size={20} className={totalAlerts > 0 && !isOpen ? 'animate-pulse' : ''} />
        {totalAlerts > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-[100] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden flex flex-col
              ${isSidebarExpanded ? 'bottom-full left-0 mb-4 w-80' : 'left-full bottom-0 ml-4 w-80'}
            `}
          >
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center">
                Centro de Alertas
                {totalAlerts > 0 && <span className="ml-2 bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full">{totalAlerts}</span>}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[60vh] p-3 space-y-3">
              {loading ? (
                <div className="text-center py-8 text-sm text-slate-400">Consultando sistemas...</div>
              ) : totalAlerts === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400 flex flex-col items-center">
                  <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                  </div>
                  Todo en orden. No tienes alertas pendientes.
                </div>
              ) : (
                <>
                  {/* Deudas por Pagar */}
                  {alertas.deudas.length > 0 && (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Building size={16} className="text-rose-500" />
                        <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider">Deudas Pendientes</h4>
                      </div>
                      <p className="text-sm text-rose-700 mb-2">Tienes <strong>{alertas.deudas.length}</strong> facturas de compras sin pagar a proveedores.</p>
                      <Link to="/compras" onClick={() => setIsOpen(false)} className="text-xs font-bold text-rose-600 hover:text-rose-500 flex items-center">
                        Ir a Compras <ArrowRight size={12} className="ml-1" />
                      </Link>
                    </div>
                  )}

                  {/* Descuadre en Caja */}
                  {alertas.descuadreCaja > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={16} className="text-red-500" />
                        <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider">Faltante en Caja</h4>
                      </div>
                      <p className="text-sm text-red-700 mb-2">
                        Hay un faltante histórico acumulado de <strong>${alertas.descuadreCaja.toFixed(2)}</strong> en los cortes de caja (el dinero real fue menor al esperado por el sistema).
                      </p>
                      <Link to="/informes" onClick={() => setIsOpen(false)} className="text-xs font-bold text-red-600 hover:text-red-500 flex items-center">
                        Ver Informes <ArrowRight size={12} className="ml-1" />
                      </Link>
                    </div>
                  )}

                  {/* Recetas No Viables (Inflación) */}
                  {alertas.recetas.length > 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={16} className="text-amber-500" />
                        <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Viabilidad de Recetas</h4>
                      </div>
                      <p className="text-sm text-amber-700 mb-2">
                        Hay <strong>{alertas.recetas.length}</strong> platillos con margen rojo (&lt;50%). Considera revisar sus precios o insumos por inflación.
                      </p>
                      <Link to="/recetas" onClick={() => setIsOpen(false)} className="text-xs font-bold text-amber-600 hover:text-amber-500 flex items-center">
                        Ir a Recetas <ArrowRight size={12} className="ml-1" />
                      </Link>
                    </div>
                  )}

                  {/* Stock Crítico */}
                  {alertas.stock.length > 0 && (
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Package size={16} className="text-orange-500" />
                        <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider">Stock Crítico</h4>
                      </div>
                      <p className="text-sm text-orange-700 mb-2">
                        Tienes <strong>{alertas.stock.length}</strong> insumos en números rojos.
                      </p>
                      <Link to="/inventario" onClick={() => setIsOpen(false)} className="text-xs font-bold text-orange-600 hover:text-orange-500 flex items-center">
                        Revisar Inventario <ArrowRight size={12} className="ml-1" />
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
