import { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, Receipt, Info, CreditCard, DollarSign, Utensils, Wallet, LogIn, LogOut, ArrowRightLeft, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { recetasService } from '../services/api/recetas';
import { ventasService } from '../services/api/ventas';
import { cajaService } from '../services/api/caja';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/api/client';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/Loading';
import { useTour } from '../context/TourContext';

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

  // Control de Turno
  const [movimientos, setMovimientos] = useState([]);
  const [showTurnoModal, setShowTurnoModal] = useState(null); // 'abrir', 'cerrar', 'movimiento'
  const [turnoFormData, setTurnoFormData] = useState({ monto: '', concepto: '', tipo: 'ingreso' });
  const [turnoErrorMsg, setTurnoErrorMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      if (session?.user?.id) {
        const restauranteId = currentRestaurant?.id;
        if (!restauranteId) return;

        const caja = await cajaService.getCajaAbierta(restauranteId);
        setCajaActiva(caja);
        if (caja) {
           const movs = await cajaService.getMovimientos(caja.id);
           setMovimientos(movs);
        } else {
           setMovimientos([]);
        }

        const data = await recetasService.getRecetas(restauranteId);
        const platillos = data?.filter(r => !r.es_subreceta && Number(r.precio_venta) > 0) || [];
        setRecetas(platillos);
      }
    } catch (error) {
      console.error('Error cargando catálogo POS:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session?.user?.id]);

  const { registerPageTour } = useTour();

  useEffect(() => {
    registerPageTour('punto_venta', [
      {
        target: '.tour-pos-acciones',
        content: 'Desde aquí puedes registrar movimientos manuales de dinero (como propinas) o realizar tu Cierre de Turno (Arqueo Ciego).',
        disableBeacon: true,
      },
      {
        target: '.tour-pos-catalogo',
        content: 'Toca los platillos para agregarlos a la venta. Si un platillo no tiene stock preparado, no podrás venderlo.',
        placement: 'right'
      },
      {
        target: '.tour-pos-ticket',
        content: 'Aquí verás el resumen de la compra. Al Proceder al Pago, el dinero se sumará a la caja y el stock se descontará automáticamente.',
        placement: 'left'
      }
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalesTurno = movimientos.reduce((acc, curr) => {
    const metodo = (curr.metodo_pago || 'efectivo').toLowerCase().trim();
    const tipo = (curr.tipo || '').toLowerCase().trim();

    if (tipo === 'egreso') {
        acc.gastos += Number(curr.monto);
    }

    if (metodo === 'efectivo') {
        if (tipo === 'ingreso') acc.disponibilidad_efectivo += Number(curr.monto);
        if (tipo === 'egreso') acc.disponibilidad_efectivo -= Number(curr.monto);
    }
    return acc;
  }, { disponibilidad_efectivo: 0, gastos: 0 });

  const handleTurnoAction = async (e) => {
    e.preventDefault();
    setTurnoErrorMsg('');
    try {
      const restauranteId = currentRestaurant?.id;

      if (showTurnoModal === 'abrir') {
        await cajaService.abrirCaja(restauranteId, Number(turnoFormData.monto), turnoFormData.concepto);
        toast.success('Turno abierto con éxito');
      } else if (showTurnoModal === 'cerrar') {
        await cajaService.cerrarCaja(cajaActiva.id, Number(turnoFormData.monto), turnoFormData.concepto);
        toast.success('Turno cerrado con éxito');
      } else if (showTurnoModal === 'movimiento') {
        await cajaService.agregarMovimiento(cajaActiva.id, turnoFormData.tipo, Number(turnoFormData.monto), turnoFormData.concepto, 'efectivo');
        toast.success('Movimiento registrado con éxito');
      }
      setShowTurnoModal(null);
      setTurnoFormData({ monto: '', concepto: '', tipo: 'ingreso' });
      loadData();
    } catch (error) {
      setTurnoErrorMsg(error.message || 'Error al procesar la solicitud');
      toast.error('Ocurrió un error');
    }
  };

  const platillosFiltrados = useMemo(() => {
    if (!searchTerm) return recetas;
    return recetas.filter(r => r.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [recetas, searchTerm]);

  const agregarAlCarrito = (receta) => {
    const stock = Number(receta.stock_actual || 0);
    
    if (stock <= 0) {
      toast.error(`No hay unidades preparadas de ${receta.nombre}`);
      return;
    }

    setVentaExitosa(false);
    setCarrito(prev => {
      const existe = prev.find(item => item.receta.id === receta.id);
      if (existe) {
        if (existe.cantidad >= stock) {
          toast.error(`Solo tienes ${stock} preparadas de ${receta.nombre}`);
          return prev;
        }
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
          let nuevaCant = item.cantidad + delta;
          const stock = Number(item.receta.stock_actual || 0);
          
          if (nuevaCant > stock) {
            toast.error(`Solo tienes ${stock} unidades de ${item.receta.nombre}`);
            nuevaCant = stock;
          }
          
          nuevaCant = Math.max(1, nuevaCant);
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
      
      // Recargar catálogo y movimientos para actualizar stock
      await loadData();

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
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Turno Cerrado</h1>
        <p className="text-slate-500 max-w-lg mb-8 text-lg">
          Por razones de control financiero, no puedes registrar ventas en el Punto de Venta sin antes iniciar tu turno y declarar el fondo de la registradora.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-8">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col items-center text-center">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl mb-3"><LogIn size={20} /></div>
                <h4 className="font-bold text-slate-800 mb-1">1. Fondo Inicial</h4>
                <p className="text-xs text-slate-500">Comienza tu día declarando con cuánto efectivo físico arranca tu caja registradora para dar cambio.</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col items-center text-center">
                <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl mb-3"><Utensils size={20} /></div>
                <h4 className="font-bold text-slate-800 mb-1">2. Registra Ventas</h4>
                <p className="text-xs text-slate-500">Al vender en Efectivo en el POS, Insumia sumará el dinero automáticamente a tu jornada.</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col items-center text-center">
                <div className="p-2.5 bg-[#D32F2F]/10 text-[#D32F2F] rounded-xl mb-3"><LogOut size={20} /></div>
                <h4 className="font-bold text-slate-800 mb-1">3. Cierre Exacto</h4>
                <p className="text-xs text-slate-500">Al finalizar el día, haz el arqueo ciego. Te diremos exactamente cuánto dinero físico debe haber.</p>
            </div>
        </div>

        <button 
          onClick={() => setShowTurnoModal('abrir')}
          className="bg-blue-600 text-white font-bold px-8 py-4 rounded-xl shadow-[0_8px_16px_rgb(37,99,235,0.2)] hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2 text-lg cursor-pointer"
        >
          <Wallet size={20} /> Declarar Fondo y Abrir Turno
        </button>

        {showTurnoModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl text-left">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Abrir Turno</h2>
                {turnoErrorMsg && <div className="mb-4 p-3 bg-[#D32F2F]/10 text-[#D32F2F] text-sm font-semibold rounded-xl">{turnoErrorMsg}</div>}
                
                <form onSubmit={handleTurnoAction} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Fondo Inicial ($)</label>
                    <input type="number" step="0.01" min="0" required value={turnoFormData.monto} onChange={e => setTurnoFormData({...turnoFormData, monto: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Concepto / Turno</label>
                    <input type="text" required value={turnoFormData.concepto} onChange={e => setTurnoFormData({...turnoFormData, concepto: e.target.value})} placeholder="Ej. Turno Matutino" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-center gap-3 mt-8">
                    <button type="button" onClick={() => setShowTurnoModal(null)} className="flex-1 bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors cursor-pointer">Cancelar</button>
                    <button type="submit" disabled={!turnoFormData.monto || !turnoFormData.concepto.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        Abrir Turno
                    </button>
                </div>
                </form>
            </motion.div>
            </div>
        )}
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
          
          <div className="tour-pos-acciones flex items-center gap-3">
              <div className="relative w-64 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input type="text" placeholder="Buscar platillo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200/60 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700 shadow-sm" />
              </div>
              
              <button 
                onClick={() => { setTurnoFormData({...turnoFormData, tipo: 'egreso'}); setShowTurnoModal('movimiento'); }} 
                className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors shadow-sm cursor-pointer"
                title="Registrar Retiro o Ingreso Manual (Ej. Propinas, Hielo)"
              >
                <ArrowRightLeft size={18} />
              </button>
              
              <button 
                onClick={() => setShowTurnoModal('cerrar')} 
                className="flex items-center gap-2 bg-[#D32F2F] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#C62828] transition-colors shadow-sm cursor-pointer"
              >
                <LogOut size={18} /> Cerrar Turno
              </button>
          </div>
        </div>

        <div className="tour-pos-catalogo flex-1 overflow-y-auto p-8 lg:p-10">
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
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${Number(platillo.stock_actual) > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {Number(platillo.stock_actual || 0)} Preparados
                      </span>
                    </div>
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
      <div className="tour-pos-ticket w-full md:w-[420px] bg-white/90 backdrop-blur-2xl flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.04)] z-20 shrink-0 h-full border-l border-slate-200/50">
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

      {/* Modales de Turno (Cerrar / Movimiento Manual) */}
      {showTurnoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
               {showTurnoModal === 'cerrar' ? 'Cerrar Turno' : 'Registrar Movimiento Manual'}
            </h2>
            
            {turnoErrorMsg && <div className="mb-4 p-3 bg-[#D32F2F]/10 text-[#D32F2F] text-sm font-semibold rounded-xl">{turnoErrorMsg}</div>}
            
            <form onSubmit={handleTurnoAction} className="space-y-4">
               {showTurnoModal === 'cerrar' && (
                   <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-center">
                       <p className="text-sm font-semibold text-blue-600 mb-1">Debes tener en efectivo físico:</p>
                       <p className="text-3xl font-black text-blue-800">${totalesTurno.disponibilidad_efectivo.toFixed(2)}</p>
                   </div>
               )}

               {showTurnoModal === 'movimiento' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Movimiento</label>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setTurnoFormData({...turnoFormData, tipo: 'ingreso'})} className={`flex-1 py-2 rounded-xl text-sm font-bold border cursor-pointer ${turnoFormData.tipo === 'ingreso' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}>Ingreso a Caja</button>
                        <button type="button" onClick={() => setTurnoFormData({...turnoFormData, tipo: 'egreso'})} className={`flex-1 py-2 rounded-xl text-sm font-bold border cursor-pointer ${turnoFormData.tipo === 'egreso' ? 'bg-[#D32F2F]/10 border-[#D32F2F]/20 text-[#D32F2F]' : 'bg-white border-slate-200 text-slate-500'}`}>Retiro de Efectivo</button>
                    </div>
                  </div>
               )}

               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                      {showTurnoModal === 'cerrar' ? 'Efectivo Real en Caja ($)' : 'Monto Físico ($)'}
                  </label>
                  <input type="number" step="0.01" min="0" required value={turnoFormData.monto} onChange={e => setTurnoFormData({...turnoFormData, monto: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
               </div>

               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                      {showTurnoModal === 'cerrar' ? 'Notas / Discrepancias' : 'Motivo / Concepto'}
                  </label>
                  <input type="text" required value={turnoFormData.concepto} onChange={e => setTurnoFormData({...turnoFormData, concepto: e.target.value})} placeholder={showTurnoModal === 'movimiento' ? 'Ej. Propinas, Hielo...' : ''} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
               </div>

               <div className="flex items-center gap-3 mt-8">
                  <button type="button" onClick={() => setShowTurnoModal(null)} className="flex-1 bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors cursor-pointer">Cancelar</button>
                  <button type="submit" disabled={!turnoFormData.monto || !turnoFormData.concepto.trim()} className={`flex-1 text-white px-4 py-3 rounded-xl font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${showTurnoModal === 'cerrar' ? 'bg-[#D32F2F] hover:bg-[#C62828]' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {showTurnoModal === 'cerrar' ? 'Confirmar Cierre' : 'Guardar'}
                  </button>
               </div>
            </form>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
};
