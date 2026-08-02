import { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, Receipt, Info, PlusCircle, CreditCard, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { recetasService } from '../services/api/recetas';
import { ventasService } from '../services/api/ventas';
import { motion, AnimatePresence } from 'framer-motion';

export const PuntoVenta = () => {
  const { session } = useAuth();
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado del Carrito: array de { receta, cantidad, total }
  const [carrito, setCarrito] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ventaExitosa, setVentaExitosa] = useState(false);

  useEffect(() => {
    const loadRecetas = async () => {
      try {
        setLoading(true);
        // Traer todas las recetas para mostrar en el catálogo
        const data = await recetasService.getRecetas();
        // Solo mostrar las que son platillos finales (no son subrecetas) y tienen precio de venta mayor a cero
        const platillos = data?.filter(r => !r.es_subreceta && Number(r.precio_venta) > 0) || [];
        setRecetas(platillos);
      } catch (error) {
        console.error('Error cargando catálogo POS:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRecetas();
  }, []);

  const platillosFiltrados = useMemo(() => {
    if (!searchTerm) return recetas;
    return recetas.filter(r => r.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [recetas, searchTerm]);

  // Lógica del carrito
  const agregarAlCarrito = (receta) => {
    setVentaExitosa(false); // Limpiar mensaje de éxito si hay uno
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

  const handleCobrar = async () => {
    if (carrito.length === 0) return;
    try {
      setIsProcessing(true);
      const { supabase } = await import('../services/api/client');
      const { data: userData } = await supabase
        .from('usuarios')
        .select('restaurante_id')
        .eq('id', session.user.id)
        .single();

      const articulosParaDB = carrito.map(item => ({
        receta_id: item.receta.id,
        cantidad: item.cantidad
      }));

      // Magia de Base de Datos: Registrar Venta y Descontar Inventario atómicamente
      await ventasService.registrarVenta(userData.restaurante_id, articulosParaDB);
      
      setCarrito([]);
      setVentaExitosa(true);
      setTimeout(() => setVentaExitosa(false), 4000); // Ocultar mensaje después de 4s
    } catch (error) {
      console.error('Error procesando venta:', error);
      alert('Hubo un error al procesar el cobro. Revisa tu conexión.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // VISTA VACÍA (ONBOARDING)
  // ==========================================
  if (!loading && recetas.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Cabecera Estandarizada */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Punto de Venta (POS)</h1>
          <p className="text-slate-500 mt-1">Registra órdenes y descuenta el inventario de forma automática.</p>
        </div>

        <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-r-xl">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-purple-800">Caja Registradora Inactiva</h3>
              <div className="mt-2 text-sm text-purple-700">
                <p>Aún no has creado "Platillos" con precio de venta en el módulo de Recetas. El Punto de Venta necesita un menú para poder funcionar.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-4">
              <PlusCircle size={28} />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">1. Crea Platillos</h4>
            <p className="text-sm text-slate-500">Ve a Recetas y asegúrate de asignarles un Precio de Venta mayor a cero.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-full mb-4">
              <ShoppingCart size={28} />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">2. Toma la Orden</h4>
            <p className="text-sm text-slate-500">Tus platillos aparecerán aquí listos para ser seleccionados de forma rápida (Táctil).</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full mb-4">
              <CreditCard size={28} />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">3. Cobra y Descuenta</h4>
            <p className="text-sm text-slate-500">Al cobrar, Insumia viajará a tu Inventario y descontará los gramos exactos usados.</p>
          </div>
        </div>

        {/* Alerta Informativa (Onboarding / Contexto) */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex items-start space-x-4 mt-8">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
            <Info size={24} />
          </div>
          <div>
            <h4 className="text-indigo-900 font-bold">¿Cómo funciona la Magia de Insumia?</h4>
            <p className="text-indigo-700 text-sm mt-1">
              Al darle clic al botón <strong>"Cobrar"</strong> en la cuenta, Insumia no solo registra el ingreso de dinero. El sistema automáticamente abrirá la receta de cada platillo vendido y <strong>descontará los gramos o piezas exactas</strong> de tu módulo de Inventario. ¡Operación de ciclo completo sin esfuerzo!
            </p>
          </div>
        </div>

      </div>
    );
  }

  // ==========================================
  // VISTA PRINCIPAL (POS INTERFACE)
  // ==========================================
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 25 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full w-full bg-slate-50/50 overflow-hidden rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    >
      
      {/* Panel Izquierdo: Catálogo del Menú */}
      <div className="flex-1 flex flex-col h-full bg-transparent">
        
        {/* Header Claro Premium */}
        <div className="px-8 py-8 bg-white/60 backdrop-blur-md border-b border-slate-100 shrink-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Punto de Venta</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Terminal rápida de órdenes táctil</p>
          </div>
          <div className="relative w-full sm:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar platillo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/60 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 lg:p-10">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              <div className="animate-pulse flex items-center font-medium">
                <div className="h-3 w-3 bg-blue-500 rounded-full mr-3"></div>
                Sincronizando menú táctil...
              </div>
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12"
            >
              {platillosFiltrados.map(platillo => (
                <motion.button
                  variants={itemVariants}
                  whileTap={{ scale: 0.95 }}
                  key={platillo.id}
                  onClick={() => agregarAlCarrito(platillo)}
                  className="group bg-white rounded-3xl p-3 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgb(59,130,246,0.1)] hover:border-blue-200 transition-all duration-300 text-left flex flex-col justify-between aspect-[4/5] cursor-pointer overflow-hidden relative"
                >
                  {/* Placeholder de Imagen */}
                  <div className="w-full h-3/5 bg-slate-100/80 rounded-2xl mb-4 flex items-center justify-center overflow-hidden relative">
                     <ImageIcon size={32} className="text-slate-300 opacity-50" />
                     {/* Capa de overlay en hover */}
                     <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors duration-300 flex items-center justify-center">
                        <Plus className="text-blue-600 opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300" size={32} strokeWidth={3} />
                     </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between px-2 pb-2">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-2 tracking-tight group-hover:text-blue-600 transition-colors">
                      {platillo.nombre}
                    </h3>
                    
                    <div className="mt-auto pt-2 flex items-end justify-between w-full">
                      <span className="text-2xl font-black text-slate-900 tracking-tighter">
                        ${Number(platillo.precio_venta).toFixed(2)}
                      </span>
                      <div className="h-10 w-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                        <Plus size={20} strokeWidth={2.5} />
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
        
        {/* Cabecera Cuenta */}
        <div className="px-8 py-8 shrink-0 border-b border-slate-100 bg-transparent">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center">
              <ShoppingCart className="mr-3 text-blue-600" size={24} strokeWidth={2.5} />
              Ticket
            </h2>
            <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
              {cantArticulos} {cantArticulos === 1 ? 'art' : 'arts'}
            </div>
          </div>
        </div>

        {/* Lista de Artículos */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-transparent">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-50">
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center">
                <Receipt size={32} className="text-slate-300" strokeWidth={1.5} />
              </div>
              <p className="font-semibold text-sm tracking-wide">Toca un platillo para agregarlo.</p>
            </div>
          ) : (
            <AnimatePresence>
              {carrito.map(item => (
                <motion.div 
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  key={item.receta.id} 
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:border-blue-100 transition-colors group/item"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-bold text-slate-800 text-[15px] leading-tight pr-4 tracking-tight">{item.receta.nombre}</span>
                    <span className="font-black text-slate-900 text-lg tracking-tight">${item.total.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1 bg-slate-50 rounded-xl p-1 border border-slate-200/60">
                      <button 
                        onClick={() => modificarCantidad(item.receta.id, -1)}
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg shadow-sm transition-all cursor-pointer active:scale-90"
                      >
                        <Minus size={16} strokeWidth={2.5} />
                      </button>
                      <span className="font-bold w-10 text-center text-base text-slate-800">{item.cantidad}</span>
                      <button 
                        onClick={() => modificarCantidad(item.receta.id, 1)}
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg shadow-sm transition-all cursor-pointer active:scale-90"
                      >
                        <Plus size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                    <button 
                      onClick={() => eliminarDelCarrito(item.receta.id)}
                      className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer opacity-0 group-hover/item:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Checkout Footer */}
        <div className="p-8 bg-white border-t border-slate-100 shrink-0 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.05)] rounded-tl-[2rem]">
          
          <div className="flex justify-between items-end mb-6">
            <span className="text-slate-400 font-bold text-sm tracking-widest uppercase">Total a Pagar</span>
            <span className="text-5xl font-black text-slate-900 tracking-tighter">
              ${totalCuenta.toFixed(2)}
            </span>
          </div>

          <AnimatePresence>
            {ventaExitosa && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mb-5 bg-emerald-50 text-emerald-600 px-4 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center border border-emerald-100 shadow-sm"
              >
                ¡Cobro Exitoso y Descontado!
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleCobrar}
            disabled={carrito.length === 0 || isProcessing}
            className={`w-full py-5 rounded-2xl flex items-center justify-center text-lg font-black transition-all duration-300 relative overflow-hidden group/btn ${
              carrito.length === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_10px_30px_rgb(16,185,129,0.3)] hover:shadow-[0_15px_40px_rgb(16,185,129,0.4)] hover:-translate-y-1 cursor-pointer active:scale-95'
            }`}
          >
            {isProcessing ? (
              <span className="animate-pulse flex items-center">
                 Procesando Cobro...
              </span>
            ) : (
              <>
                <span className="mr-3 text-xl tracking-tight z-10">Cobrar Orden</span>
                <ChevronRight size={24} className="z-10 opacity-70 group-hover/btn:translate-x-1 group-hover/btn:opacity-100 transition-all" strokeWidth={3} />
                
                {/* Overlay luminoso animado para el botón activo */}
                {carrito.length > 0 && (
                   <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out z-0 rounded-2xl"></div>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
