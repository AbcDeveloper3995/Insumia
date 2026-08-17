import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { insumosService } from '../services/api/insumos';
import { comprasService } from '../services/api/compras';
import { cajaService } from '../services/api/caja';
import { Modal } from '../components/common/Modal';
import { InsumoForm } from '../components/inventario/InsumoForm';
import { InsumosList } from '../components/inventario/InsumosList';
import { InsumoCompraInicial } from '../components/inventario/InsumoCompraInicial';
import { KardexModal } from '../components/inventario/KardexModal';
import { MermasList } from '../components/inventario/MermasList';
import { MermaForm } from '../components/inventario/MermaForm';
import { mermasService } from '../services/api/mermas';
import { recetasService } from '../services/api/recetas';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/Loading';
import { supabase } from '../services/api/client';
import { useTour } from '../context/TourContext';

export const Inventario = () => {
  const { session, currentRestaurant } = useAuth();
  const [insumos, setInsumos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [cajaActiva, setCajaActiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' o 'mermas'
  const [mermas, setMermas] = useState([]);
  const [recetas, setRecetas] = useState([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMermaModalOpen, setIsMermaModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1 = form insumo, 2 = compra inicial
  const [editingInsumo, setEditingInsumo] = useState(null);
  const [createdInsumo, setCreatedInsumo] = useState(null);
  const [eliminandoInsumo, setEliminandoInsumo] = useState(null);
  const [selectedKardexInsumo, setSelectedKardexInsumo] = useState(null);
  
  const [errorCarga, setErrorCarga] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorCarga(null);
      
      const insumosData = currentRestaurant?.id ? await insumosService.getInsumos(currentRestaurant?.id) : [];
      setInsumos(insumosData || []);
      
      if (session?.user?.id) {
         if (currentRestaurant?.id) {
            const provsData = await comprasService.getProveedores(currentRestaurant?.id);
            setProveedores(provsData || []);
            
            const caja = await cajaService.getCajaAbierta(currentRestaurant?.id);
            setCajaActiva(caja);

            const mermasData = await mermasService.getMermas(currentRestaurant?.id);
            setMermas(mermasData || []);

            const recetasData = await recetasService.getRecetas(currentRestaurant?.id);
            setRecetas(recetasData || []);
         }
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setErrorCarga(import.meta.env.DEV ? error.message : 'Error inesperado al cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const { registerPageTour } = useTour();

  useEffect(() => {
    registerPageTour('inventario', [
      {
        target: '.tour-inventario-tabs',
        content: 'Aquí puedes cambiar entre el Kardex general y el registro de Mermas para el control de desperdicios.',
        disableBeacon: true,
      },
      {
        target: '.tour-inventario-add',
        content: 'Usa este botón para crear nuevos insumos. Recuerda definir bien tu Unidad Base (ej. gramos) y Unidad de Compra (ej. Kilos).',
      },
      {
        target: '.tour-inventario-lista',
        content: 'Aquí verás las tarjetas de todos tus insumos en tiempo real. Haz clic en el botón de "Detalles" (Kardex) de cada tarjeta para ver su historial completo de entradas, salidas y ajustes.',
        placement: 'center',
      }
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenModal = (insumo = null) => {
    setEditingInsumo(insumo);
    setCreatedInsumo(null);
    setModalStep(1);
    setIsModalOpen(true);
  };

  const handleOpenCompraInicial = (insumo) => {
    setEditingInsumo(null);
    setCreatedInsumo(insumo);
    setModalStep(2);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingInsumo(null);
    setCreatedInsumo(null);
    setModalStep(1);
    setIsModalOpen(false);
  };

  // Paso 1: Crear Insumo
  const handleInsumoSubmit = async (formData) => {
    try {
      const insumoData = {
        ...formData,
        restaurante_id: currentRestaurant?.id
      };

      if (editingInsumo) {
        await insumosService.updateInsumo(editingInsumo.id, insumoData);
        toast.success('¡Insumo actualizado correctamente!');
        handleCloseModal();
        await loadData();
      } else {
        const newInsumo = await insumosService.createInsumo(insumoData);
        toast.success('¡Insumo creado correctamente!');
        
        // Pasamos al paso 2
        setCreatedInsumo(newInsumo);
        setModalStep(2);
        // Recargamos silenciosamente los insumos para que la tabla de fondo se actualice
        const insumosList = currentRestaurant?.id ? await insumosService.getInsumos(currentRestaurant?.id) : [];
        setInsumos(insumosList || []);
      }
      
    } catch (error) {
      console.error('Error guardando insumo:', error);
      toast.error('Hubo un error al guardar el insumo.');
    }
  };

  // Acción en Paso 2: Crear proveedor al vuelo
  const handleAddProveedor = async (nombre) => {
      try {
          const newProv = await comprasService.createProveedor(currentRestaurant?.id, { nombre: nombre.trim() });
          
          // Actualizamos la lista local
          const provsData = await comprasService.getProveedores(currentRestaurant?.id);
          setProveedores(provsData || []);
          
          toast.success('Proveedor creado');
          return newProv;
      } catch (err) {
          toast.error('Error al crear proveedor');
          throw err;
      }
  };

  // Paso 2: Registrar compra inicial
  const handleCompraInicialSubmit = async ({ proveedor_id, cantidad, costo_total, fecha_caducidad, pagarDeCaja }) => {
      try {
          const detalles = [{
              insumo_id: createdInsumo.id,
              cantidad: cantidad,
              precio_unitario: costo_total / cantidad,
              fecha_caducidad: fecha_caducidad
          }];
          
          const estadoCompra = (pagarDeCaja && cajaActiva) ? 'pagada' : 'pendiente';
          const cajaId = (pagarDeCaja && cajaActiva) ? cajaActiva.id : null;
          
          await comprasService.registrarCompra(currentRestaurant?.id, proveedor_id, estadoCompra, detalles, cajaId);
          
          toast.success('Compra inicial registrada');
          handleCloseModal();
          await loadData();
      } catch (err) {
          console.error(err);
          toast.error('Error al registrar compra inicial');
      }
  };

  const confirmEliminarInsumo = async () => {
    if (!eliminandoInsumo) return;
    try {
      const res = await insumosService.deleteInsumo(eliminandoInsumo.id);
      if (res?.action === 'archived') {
        toast.success('Insumo archivado. (Aún forma parte del historial o recetas)');
      } else {
        toast.success('Insumo eliminado por completo');
      }
      setEliminandoInsumo(null);
      await loadData();
    } catch (error) {
      console.error('Error eliminando:', error);
      toast.error('Error al eliminar el insumo');
    }
  };

  const handleDelete = (insumo) => {
    setEliminandoInsumo(insumo);
  };

  const handleRestore = async (insumo) => {
    try {
      await insumosService.restoreInsumo(insumo.id);
      toast.success('Insumo restaurado');
      await loadData();
    } catch (error) {
      console.error('Error restaurando:', error);
      toast.error('Error al restaurar el insumo');
    }
  };

  const handleMermaSubmit = async (formData) => {
    try {
      await mermasService.registrarMerma(currentRestaurant.id, formData.detalles, formData.notas);
      toast.success('¡Merma registrada exitosamente!');
      setIsMermaModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Error registrando merma:', error);
      toast.error('Error al registrar la merma');
    }
  };

  const filteredInsumos = useMemo(() => {
    if (!searchTerm) return insumos;
    return insumos.filter(insumo => 
      insumo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [insumos, searchTerm]);

  // UI del Stepper para el Modal
  const modalTitle = (
    <div className="flex items-center gap-3 text-sm select-none">
      <div className={`flex items-center gap-2 ${modalStep === 1 ? 'text-blue-700 font-bold' : 'text-emerald-600 font-medium'}`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${modalStep === 1 ? 'bg-blue-600 text-white shadow-sm' : 'bg-emerald-100 text-emerald-700'}`}>
          {modalStep === 1 ? '1' : '✓'}
        </div>
        Datos Base
      </div>
      
      <div className={`w-8 h-[2px] rounded-full ${modalStep === 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
      
      <div className={`flex items-center gap-2 ${modalStep === 2 ? 'text-blue-700 font-bold' : 'text-slate-400 font-medium'}`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${modalStep === 2 ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
          2
        </div>
        Compra Inicial
      </div>
    </div>
  );

  // Variantes de animación
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
  };

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm">
      <div className="flex-1 flex flex-col h-full bg-slate-50/50">
        
        <div className="px-8 py-6 bg-white border-b border-slate-100 shrink-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Inventario e Insumos</h1>
            <p className="text-slate-500 text-sm mt-1">Gestiona tu materia prima, costos y mermas.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar insumo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-medium text-slate-700"
              />
            </div>

            {activeTab === 'stock' && (
              <button
                onClick={() => handleOpenModal()}
                className="tour-inventario-add flex justify-center items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <Plus size={18} />
                <span>Nuevo Insumo</span>
              </button>
            )}
          </div>
        </div>

        {/* Pestañas */}
        <div className="tour-inventario-tabs px-8 bg-white border-b border-slate-100 flex gap-6 shrink-0">
          <button
            onClick={() => setActiveTab('stock')}
            className={`py-4 font-bold text-sm border-b-2 transition-colors ${
              activeTab === 'stock' 
                ? 'border-blue-600 text-blue-700' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Stock Crudo e Insumos
          </button>
          <button
            onClick={() => setActiveTab('mermas')}
            className={`py-4 font-bold text-sm border-b-2 transition-colors ${
              activeTab === 'mermas' 
                ? 'border-rose-500 text-rose-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Control de Mermas
          </button>
        </div>

        <div className="tour-inventario-lista flex-1 overflow-y-auto p-8">
            {errorCarga && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium">
                <strong>Error de carga:</strong> {errorCarga}
              </div>
            )}

            {loading ? (
              <LoadingSpinner text="Cargando..." />
            ) : (
              activeTab === 'stock' ? (
                <InsumosList 
                  insumos={filteredInsumos} 
                  onEdit={handleOpenModal} 
                  onDelete={handleDelete} 
                  onRestore={handleRestore}
                  onInitialPurchase={handleOpenCompraInicial}
                  onViewKardex={setSelectedKardexInsumo}
                />
              ) : (
                <MermasList 
                  mermas={mermas} 
                  insumos={insumos}
                  recetas={recetas}
                  onNewMerma={() => setIsMermaModalOpen(true)}
                />
              )
            )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={modalStep === 2 ? null : handleCloseModal} // Prevenir cierre fácil en paso 2 sin skipear
        title={editingInsumo ? 'Editar Insumo' : modalTitle}
        maxWidth="max-w-3xl"
      >
        {modalStep === 1 ? (
            <InsumoForm
              onSubmit={handleInsumoSubmit}
              defaultValues={editingInsumo}
            />
        ) : (
            <InsumoCompraInicial
              insumo={createdInsumo}
              proveedores={proveedores}
              cajaActiva={cajaActiva}
              onAddProveedor={handleAddProveedor}
              onSubmit={handleCompraInicialSubmit}
              onSkip={() => handleCloseModal()}
            />
        )}
      </Modal>

      {selectedKardexInsumo && (
        <KardexModal 
          insumo={selectedKardexInsumo} 
          onClose={() => setSelectedKardexInsumo(null)} 
        />
      )}

      {isMermaModalOpen && (
        <MermaForm
          insumos={insumos.filter(i => i.activo !== false)}
          recetas={recetas}
          onClose={() => setIsMermaModalOpen(false)}
          onSubmit={handleMermaSubmit}
        />
      )}

      {/* Modal de Confirmación de Eliminación */}
      <AnimatePresence>
        {eliminandoInsumo && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setEliminandoInsumo(null)}
            />
            <motion.div 
              variants={modalVariants} initial="hidden" animate="visible" exit="exit"
              className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full overflow-hidden relative z-10 text-center p-8"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
                <AlertTriangle size={36} strokeWidth={2.5} />
              </div>
              
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                ¿Eliminar Insumo?
              </h2>
              
              <p className="text-slate-500 font-medium leading-relaxed mb-1">
                Estás a punto de borrar <span className="font-bold text-slate-800">"{eliminandoInsumo.nombre}"</span>.
              </p>
              <p className="text-sm text-slate-400 mb-8 px-4">
                ADVERTENCIA CRÍTICA: Si este insumo forma parte de alguna receta, será eliminado de la misma automáticamente y podría afectar los costos de tus platillos.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmEliminarInsumo}
                  className="w-full bg-red-500 text-white py-4 rounded-2xl hover:bg-red-600 transition-all font-bold cursor-pointer shadow-[0_8px_20px_rgb(239,68,68,0.25)] hover:shadow-[0_12px_25px_rgb(239,68,68,0.35)] active:scale-95 flex items-center justify-center"
                >
                  Sí, eliminar definitivamente
                </button>
                <button
                  type="button"
                  onClick={() => setEliminandoInsumo(null)}
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
