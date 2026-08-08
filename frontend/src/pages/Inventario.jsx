import { useState, useEffect, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { insumosService } from '../services/api/insumos';
import { comprasService } from '../services/api/compras';
import { cajaService } from '../services/api/caja';
import { Modal } from '../components/common/Modal';
import { InsumoForm } from '../components/inventario/InsumoForm';
import { InsumosList } from '../components/inventario/InsumosList';
import { InsumoCompraInicial } from '../components/inventario/InsumoCompraInicial';
import { KardexModal } from '../components/inventario/KardexModal';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/Loading';
import { supabase } from '../services/api/client';

export const Inventario = () => {
  const { session, currentRestaurant } = useAuth();
  const [insumos, setInsumos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [cajaActiva, setCajaActiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1 = form insumo, 2 = compra inicial
  const [editingInsumo, setEditingInsumo] = useState(null);
  const [createdInsumo, setCreatedInsumo] = useState(null);
  const [selectedKardexInsumo, setSelectedKardexInsumo] = useState(null);
  
  const [errorCarga, setErrorCarga] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorCarga(null);
      
      const insumosData = await insumosService.getInsumos();
      setInsumos(insumosData || []);
      
      if (session?.user?.id) {
         if (currentRestaurant?.id) {
            const provsData = await comprasService.getProveedores(currentRestaurant?.id);
            setProveedores(provsData || []);
            
            const caja = await cajaService.getCajaAbierta(currentRestaurant?.id);
            setCajaActiva(caja);
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
        const insumosList = await insumosService.getInsumos();
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

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este insumo?')) {
      try {
        await insumosService.deleteInsumo(id);
        toast.success('Insumo eliminado');
        loadData();
      } catch (error) {
        console.error('Error eliminando:', error);
        toast.error('Error al eliminar');
      }
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

            <button
              onClick={() => handleOpenModal()}
              className="flex justify-center items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Plus size={18} />
              <span>Nuevo Insumo</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
            {errorCarga && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium">
                <strong>Error de carga:</strong> {errorCarga}
              </div>
            )}

            {loading ? (
              <LoadingSpinner text="Cargando catálogo..." />
            ) : (
              <InsumosList 
                insumos={filteredInsumos} 
                onEdit={handleOpenModal} 
                onDelete={handleDelete} 
                onInitialPurchase={handleOpenCompraInicial}
                onViewKardex={setSelectedKardexInsumo}
              />
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
    </div>
  );
};
