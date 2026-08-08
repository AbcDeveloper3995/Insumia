import { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, Receipt, Info, PlusCircle, CreditCard, ChevronRight, Image as ImageIcon, Wallet, X, DollarSign, Utensils } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { recetasService } from '../services/api/recetas';
import { ventasService } from '../services/api/ventas';
import { cajaService } from '../services/api/caja';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/api/client';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/Loading';

export const PuntoVenta = () => {
  const { session, currentRestaurant } = useAuth();
  const navigate = useNavigate();

  const [recetas, setRecetas] = useState([]);
  const [cajaActiva, setCajaActiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [carrito, setCarrito] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ventaExitosa, setVentaExitosa] = useState(false);
  
  // Modal de Pago
  const [modalPago, setModalPago] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        if (session?.user?.id) {
          const restauranteId = currentRestaurant?.id;
          if (!restauranteId) return;

          const caja = await cajaService.getCajaAbierta(restauranteId);
          setCajaActiva(caja);

          const data = await recetasService.getRecetas();
          const platillos = data?.filter(r => !r.es_subreceta && Number(r.precio_venta) > 0) || [];
          setRecetas(platillos);
        }
      } catch (error) {
        console.error('Error cargando catálogo POS:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [session?.user?.id]);

  const platillosFiltrados = useMemo(() => {
    if (!searchTerm) return recetas;
    return recetas.filter(r => r.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [recetas, searchTerm]);

  const agregarAlCarrito = (receta) => {
    setVentaExitosa(false);
    setCarrito(prev => {
      const existe = prev.find(item => item.receta.id === receta.id);
      if (existe) {
        return prev.map(item => 
          item.receta.id === receta.id 
            ? { ...item, cantidad: item.cantidad + 1, total: (item.cantidad + 1) * Number(receta.precio_venta) }
            : item
        );
      }
      return [...prev, { receta, cantidad: 1, total: Number(receta.precio_venta) }];
    });
  };

  const modificarCantidad = (recetaId, delta) => {
    setCarrito(prev => {
      return prev.map(item => {
        if (item.receta.id === recetaId) {
          const nuevaCant = Math.max(1, item.cantidad + delta);
          return { ...item, cantidad: nuevaCant, total: nuevaCant * Number(item.receta.precio_venta) };
        }
        return item;
      });
    });
  };

  const eliminarDelCarrito = (recetaId) => {
    setCarrito(prev => prev.filter(item => item.receta.id !== recetaId));
  };

  const totalCuenta = carrito.reduce((acc, item) => acc + item.total, 0);
  const cantArticulos = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  const initCobro = () => {
    if (carrito.length === 0) return;
    setMetodoPago('efectivo');
    setModalPago(true);
  };

  const procesarVenta = async () => {
    try {
      setIsProcessing(true);
      const restauranteId = currentRestaurant?.id;

      const articulosParaDB = carrito.map(item => ({
        receta_id: item.receta.id,
        cantidad: item.cantidad
      }));

      await ventasService.registrarVenta(restauranteId, articulosParaDB, cajaActiva.id, metodoPago);
      
      setCarrito([]);
      setModalPago(false);
      setVentaExitosa(true);
      setTimeout(() => setVentaExitosa(false), 4000);
    } catch (error) {
      console.error('Error procesando venta:', error);
      toast.error('Hubo un error al procesar el cobro.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // VISTA VACÍA (NO HAY CAJA ABIERTA)
  // ==========================================
  if (!loading && !cajaActiva) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center h-full text-center">
        <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
          <Wallet size={48} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-4">La Caja está Cerrada</h1>
        <p className="text-slate-500 max-w-lg mb-8 text-lg">
          Por razones de seguridad y control financiero, no puedes registrar ventas en el Punto de Venta sin antes iniciar un turno de caja.
        </p>
        <button 
          onClick={() => navigate('/caja')}
          className="bg-blue-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-lg"
        >
          Ir al módulo de Caja
        </button>
      </div>
    );
  }

  // ==========================================
  // VISTA VACÍA (SIN RECETAS)
  // ==========================================
  if (!loading && recetas.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Punto de Venta (POS)</h1>
          <p className="text-slate-500 mt-1">Registra órdenes y descuenta el inventario de forma automática.</p>
        </div>
        <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-r-xl">
          <div className="flex">
            <Info className="h-5 w-5 text-purple-600 shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-purple-800">Menú Vacío</h3>
              <p className="mt-1 text-sm text-purple-700">Aún no has creado platillos con precio de venta en el módulo de Recetas.</p>
            </div>
          </div>
        </div>
        <button onClick={() => navigate('/recetas')} className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl">Crear Recetas</button>
      </div>
    );
  }

  // ==========================================
  // VISTA PRINCIPAL (POS INTERFACE)
  // ==========================================
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 25 } } };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex h-full w-full bg-slate-50/50 overflow-hidden rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      
      {/* Panel Izquierdo: Catálogo del Menú */}
      <div className="flex-1 flex flex-col h-full bg-transparent">
        <div className="px-8 py-8 bg-white/60 backdrop-blur-md border-b border-slate-100 shrink-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Punto de Venta</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Terminal rápida táctil | Turno activo</p>
          </div>
          <div className="relative w-full sm:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input type="text" placeholder="Buscar platillo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/60 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700 shadow-sm" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 lg:p-10">
          {loading ? (
            <LoadingSpinner text="Cargando catálogo..." />
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
              {platillosFiltrados.map(platillo => (
                <motion.button 
                  variants={itemVariants} 
                  whileTap={{ scale: 0.95 }} 
                  key={platillo.id} 
                  onClick={() => agregarAlCarrito(platillo)} 
                  className="group bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 text-left flex flex-col justify-between cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute -right-6 -top-6 text-slate-50/50 group-hover:text-blue-50/50 transition-colors duration-500 z-0 transform group-hover:scale-110">
                     <Utensils size={120} strokeWidth={1} />
                  </div>
                  
                  <div className="relative z-10 w-full mb-6 flex justify-between items-start">
                     <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shadow-sm">
                       <Utensils size={28} strokeWidth={2} />
                     </div>
                     <span className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border border-slate-100">{platillo.categoria || 'Menú'}</span>
                  </div>
                  
                  <div className="relative z-10 w-full">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-2 tracking-tight group-hover:text-blue-600 transition-colors mb-1">{platillo.nombre}</h3>
                    <p className="text-xs font-semibold text-slate-400 mb-4 line-clamp-1">Listo para preparar</p>
                    <div className="flex items-end justify-between w-full mt-4 border-t border-slate-50 pt-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Precio</p>
                        <span className="text-2xl font-black text-slate-900 tracking-tighter">${Number(platillo.precio_venta).toFixed(2)}</span>
                      </div>
                      <div className="h-12 w-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md transform group-hover:scale-105">
                        <Plus size={24} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Panel Derecho: Carrito Claro Premium */}
      <div className="w-full md:w-[420px] bg-white/90 backdrop-blur-2xl flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.04)] z-20 shrink-0 h-full border-l border-slate-200/50">
        <div className="px-8 py-8 shrink-0 border-b border-slate-100 bg-transparent">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center"><ShoppingCart className="mr-3 text-blue-600" size={24} strokeWidth={2.5} />Ticket</h2>
            <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">{cantArticulos} {cantArticulos === 1 ? 'art' : 'arts'}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-transparent">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-50">
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center"><Receipt size={32} className="text-slate-300" strokeWidth={1.5} /></div>
              <p className="font-semibold text-sm tracking-wide">Toca un platillo para agregarlo.</p>
            </div>
          ) : (
            <AnimatePresence>
              {carrito.map(item => (
                <motion.div initial={{ opacity: 0, x: 20, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -20, scale: 0.9 }} key={item.receta.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:border-blue-100 transition-colors group/item">
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-bold text-slate-800 text-[15px] leading-tight pr-4 tracking-tight">{item.receta.nombre}</span>
                    <span className="font-black text-slate-900 text-lg tracking-tight">${item.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1 bg-slate-50 rounded-xl p-1 border border-slate-200/60">
                      <button onClick={() => modificarCantidad(item.receta.id, -1)} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg shadow-sm transition-all"><Minus size={16} strokeWidth={2.5} /></button>
                      <span className="font-bold w-10 text-center text-base text-slate-800">{item.cantidad}</span>
                      <button onClick={() => modificarCantidad(item.receta.id, 1)} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg shadow-sm transition-all"><Plus size={16} strokeWidth={2.5} /></button>
                    </div>
                    <button onClick={() => eliminarDelCarrito(item.receta.id)} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover/item:opacity-100"><Trash2 size={18} /></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="p-8 bg-white border-t border-slate-100 shrink-0 shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.05)] rounded-tl-[2rem]">
          <div className="flex justify-between items-end mb-6">
            <span className="text-slate-400 font-bold text-sm tracking-widest uppercase">Total a Pagar</span>
            <span className="text-5xl font-black text-slate-900 tracking-tighter">${totalCuenta.toFixed(2)}</span>
          </div>
          <AnimatePresence>
            {ventaExitosa && (
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="mb-5 bg-emerald-50 text-emerald-600 px-4 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center border border-emerald-100 shadow-sm">
                ¡Cobro Exitoso y Descontado!
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={initCobro} disabled={carrito.length === 0} className={`w-full py-5 rounded-2xl flex items-center justify-center text-lg font-black transition-all duration-300 ${carrito.length === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:scale-95'}`}>
            Proceder al Pago
          </button>
        </div>
      </div>

      {/* Modal de Pago */}
      {modalPago && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Completar Pago</h2>
              <button onClick={() => setModalPago(false)} className="text-slate-400 hover:text-rose-500 cursor-pointer"><X size={24} /></button>
            </div>

            <div className="mb-8 text-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Monto a Cobrar</p>
              <p className="text-5xl font-black text-slate-900">${totalCuenta.toFixed(2)}</p>
            </div>

            <h3 className="font-bold text-slate-700 mb-3">Método de Pago</h3>
            <div className="grid grid-cols-2 gap-3 mb-8">
              <button onClick={() => setMetodoPago('efectivo')} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${metodoPago === 'efectivo' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}>
                <DollarSign size={28} />
                <span className="font-bold text-sm">Efectivo</span>
              </button>
              <button onClick={() => setMetodoPago('tarjeta')} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${metodoPago === 'tarjeta' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}>
                <CreditCard size={28} />
                <span className="font-bold text-sm">Tarjeta</span>
              </button>
            </div>

            <button onClick={procesarVenta} disabled={isProcessing} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg transition-colors flex justify-center items-center cursor-pointer">
              {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
            </button>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
};
