import { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, Receipt, Info, PlusCircle, CreditCard, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { recetasService } from '../services/api/recetas';
import { ventasService } from '../services/api/ventas';

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
  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm">
      
      {/* Panel Izquierdo: Catálogo del Menú */}
      <div className="flex-1 flex flex-col h-full bg-slate-50/50">
        
        {/* Header Claro Premium */}
        <div className="px-8 py-6 bg-white border-b border-slate-100 shrink-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Punto de Venta</h1>
            <p className="text-slate-500 text-sm mt-1">Terminal rápida de órdenes</p>
          </div>
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar platillo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-medium text-slate-700"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              <div className="animate-pulse flex items-center">
                <div className="h-2 w-2 bg-slate-400 rounded-full mr-2"></div>
                Sincronizando menú...
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
              {platillosFiltrados.map(platillo => (
                <button
                  key={platillo.id}
                  onClick={() => agregarAlCarrito(platillo)}
                  className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 text-left flex flex-col justify-between aspect-square cursor-pointer"
                >
                  <h3 className="font-bold text-slate-700 text-lg leading-tight line-clamp-3 group-hover:text-blue-600 transition-colors">
                    {platillo.nombre}
                  </h3>
                  
                  <div className="mt-auto flex items-end justify-between w-full">
                    <div>
                      <span className="text-2xl font-black text-slate-900 tracking-tight">
                        ${Number(platillo.precio_venta).toFixed(2)}
                      </span>
                    </div>
                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                      <Plus size={20} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panel Derecho: Carrito Claro Premium */}
      <div className="w-full md:w-[380px] bg-white flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] z-20 shrink-0 h-full border-l border-slate-100">
        
        {/* Cabecera Cuenta */}
        <div className="px-6 py-6 shrink-0 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <ShoppingCart className="mr-2 text-blue-600" size={20} />
              Orden Actual
            </h2>
            <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
              {cantArticulos} {cantArticulos === 1 ? 'art' : 'arts'}
            </div>
          </div>
        </div>

        {/* Lista de Artículos */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-slate-50/30">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                <Receipt size={28} className="text-slate-300" />
              </div>
              <p className="font-medium text-sm">Escanea o selecciona platillos.</p>
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.receta.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-slate-700 text-sm leading-tight pr-4">{item.receta.nombre}</span>
                  <span className="font-bold text-slate-900">${item.total.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center space-x-1 bg-slate-50 rounded-lg p-1 border border-slate-100">
                    <button 
                      onClick={() => modificarCantidad(item.receta.id, -1)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-md shadow-sm transition-all cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-bold w-8 text-center text-sm text-slate-700">{item.cantidad}</span>
                    <button 
                      onClick={() => modificarCantidad(item.receta.id, 1)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-md shadow-sm transition-all cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button 
                    onClick={() => eliminarDelCarrito(item.receta.id)}
                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Footer */}
        <div className="p-6 bg-white border-t border-slate-100 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.02)]">
          
          <div className="flex justify-between items-end mb-5">
            <span className="text-slate-500 font-semibold text-sm">Total a Pagar</span>
            <span className="text-4xl font-black text-slate-900 tracking-tight">
              ${totalCuenta.toFixed(2)}
            </span>
          </div>

          {ventaExitosa && (
            <div className="mb-4 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center border border-emerald-100">
              ¡Cobro Exitoso!
            </div>
          )}

          <button
            onClick={handleCobrar}
            disabled={carrito.length === 0 || isProcessing}
            className={`w-full py-4 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-200 ${
              carrito.length === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 cursor-pointer'
            }`}
          >
            {isProcessing ? (
              <span className="animate-pulse">Procesando...</span>
            ) : (
              <>
                <span className="mr-2">Cobrar Orden</span>
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
