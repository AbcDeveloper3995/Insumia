import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth/authService';
import toast from 'react-hot-toast';
import { Store, Plus, LogOut, X, Edit2, Trash2, AlertTriangle, ChefHat, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SeleccionRestaurante = () => {
  const { session, restaurants, selectRestaurant, refreshRestaurants } = useAuth();
  const navigate = useNavigate();
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session) {
      navigate('/login');
    }
  }, [session, navigate]);

  const handleSeleccionar = (restaurante) => {
    selectRestaurant(restaurante);
    navigate('/');
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const nombre = e.target.nombre.value;

    try {
      const res = await authService.createRestaurant(nombre);
      await refreshRestaurants();
      
      toast.success('Restaurante creado exitosamente');
      setCreando(false);
      
      selectRestaurant({ id: res.restaurante_id, nombre });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al crear restaurante');
    } finally {
      setLoading(false);
    }
  };

  const handleEditarSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const nombre = e.target.nombre.value;

    try {
      await authService.updateRestaurant(editando.id, nombre);
      await refreshRestaurants();
      toast.success('Restaurante actualizado exitosamente');
      setEditando(null);
    } catch (err) {
      setError(err.message || 'Error al actualizar restaurante');
    } finally {
      setLoading(false);
    }
  };

  const confirmEliminar = async () => {
    if (!eliminando) return;
    setLoading(true);
    try {
      await authService.deleteRestaurant(eliminando.id);
      await refreshRestaurants();
      toast.success('Restaurante eliminado exitosamente');
      setEliminando(null);
    } catch (err) {
      toast.error('Error al eliminar restaurante');
    } finally {
      setLoading(false);
    }
  };

  // Variantes de animación
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-blue-200">
      
      {/* Banner Principal - Azul Primario, Degradado, Menos Alto */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white px-8 py-8 shadow-md relative overflow-hidden">
        {/* Patrón sutil de fondo */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto w-full relative z-10 flex justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              <ChefHat size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-0.5">
                Tus Restaurantes
              </h1>
              <p className="text-blue-100 text-sm font-medium">Selecciona o administra tus espacios de trabajo</p>
            </div>
          </div>
          
          <button
            onClick={() => authService.signOut()}
            className="flex items-center gap-2 text-blue-50 hover:text-white transition-all font-bold cursor-pointer bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-lg border border-white/20 backdrop-blur-sm active:scale-95 text-sm"
          >
            <LogOut size={16} strokeWidth={2.5} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Contenedor Principal (Caja Blanca Abajo) */}
      <div className="flex-1 p-6 md:p-8">
        <div className="max-w-6xl mx-auto w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-10">
          
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Locales Disponibles</h2>
            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
              {restaurants?.length || 0} Registrados
            </span>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Tarjetas de Restaurantes con Layout Horizontal/Redistribuido */}
            {restaurants && restaurants.map(rest => (
              <motion.div variants={itemVariants} key={rest.id}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 group flex flex-col h-full overflow-hidden cursor-pointer"
                     onClick={() => handleSeleccionar(rest)}>
                  
                  {/* Cuerpo de la Card */}
                  <div className="p-6 flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                      <Store size={26} className="text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center pt-1 min-w-0">
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                        Restaurante
                      </span>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight truncate group-hover:text-blue-600 transition-colors">
                        {rest.nombre}
                      </h3>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                       <ArrowRight size={16} />
                    </div>
                  </div>

                  {/* Footer de Acciones - Claramente separado del contenido */}
                  <div className="bg-slate-50/80 border-t border-slate-100 px-5 py-3 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="text-xs text-slate-500 font-semibold">Administrar local</span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditando(rest); }}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                        title="Editar"
                      >
                        <Edit2 size={14} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEliminando(rest); }}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                        title="Eliminar"
                      >
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            ))}

            {/* Tarjeta de Agregar Nuevo */}
            <motion.div variants={itemVariants}>
              <button
                onClick={() => setCreando(true)}
                className="w-full h-full min-h-[140px] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100 group-hover:bg-blue-500 group-hover:border-blue-500 transition-colors">
                  <Plus size={24} className="text-slate-400 group-hover:text-white transition-colors" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                  Añadir Restaurante
                </span>
              </button>
            </motion.div>

          </motion.div>
        </div>
      </div>

      {/* Modales */}
      <AnimatePresence>
        {/* Modal Crear/Editar */}
        {(creando || editando) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => { setCreando(false); setEditando(null); setError(null); }}
            />
            <motion.div 
              variants={modalVariants} initial="hidden" animate="visible" exit="exit"
              className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden relative z-10"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                      {editando ? 'Editar Restaurante' : 'Nuevo Restaurante'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium">
                      {editando ? 'Actualiza la información del local' : 'Crea un nuevo espacio de trabajo'}
                    </p>
                  </div>
                  <button
                    onClick={() => { setCreando(false); setEditando(null); setError(null); }}
                    className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-full cursor-pointer"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100 flex items-center gap-3">
                    <AlertTriangle size={18} />
                    {error}
                  </div>
                )}

                <form onSubmit={editando ? handleEditarSubmit : handleCrear} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
                      Nombre del Restaurante
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      defaultValue={editando ? editando.nombre : ''}
                      required
                      autoFocus
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 text-lg"
                      placeholder="Ej. El Buen Comer"
                    />
                  </div>
                  
                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setCreando(false); setEditando(null); setError(null); }}
                      className="flex-1 bg-white border-2 border-slate-100 text-slate-600 py-4 rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white py-4 rounded-2xl hover:bg-blue-700 transition-all font-bold disabled:opacity-50 cursor-pointer shadow-[0_8px_20px_rgb(37,99,235,0.25)] hover:shadow-[0_12px_25px_rgb(37,99,235,0.35)] active:scale-95 flex items-center justify-center"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        editando ? 'Guardar Cambios' : 'Crear Restaurante'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de Confirmación de Eliminación */}
        {eliminando && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => !loading && setEliminando(null)}
            />
            <motion.div 
              variants={modalVariants} initial="hidden" animate="visible" exit="exit"
              className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full overflow-hidden relative z-10 text-center p-8"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
                <AlertTriangle size={36} strokeWidth={2.5} />
              </div>
              
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                ¿Eliminar Restaurante?
              </h2>
              
              <p className="text-slate-500 font-medium leading-relaxed mb-1">
                Estás a punto de borrar <span className="font-bold text-slate-800">"{eliminando.nombre}"</span>.
              </p>
              <p className="text-sm text-slate-400 mb-8 px-4">
                Esta acción es irreversible y eliminará todas sus ventas, insumos, compras y configuraciones asociadas.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmEliminar}
                  disabled={loading}
                  className="w-full bg-red-500 text-white py-4 rounded-2xl hover:bg-red-600 transition-all font-bold disabled:opacity-50 cursor-pointer shadow-[0_8px_20px_rgb(239,68,68,0.25)] hover:shadow-[0_12px_25px_rgb(239,68,68,0.35)] active:scale-95 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Sí, eliminar definitivamente'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEliminando(null)}
                  disabled={loading}
                  className="w-full bg-transparent text-slate-500 py-3 rounded-2xl hover:bg-slate-50 hover:text-slate-700 transition-all font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
