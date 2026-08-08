import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { recetasService } from '../services/api/recetas';
import { insumosService } from '../services/api/insumos';
import { RecetasList } from '../components/recetas/RecetasList';
import { Modal } from '../components/common/Modal';
import { RecetaForm } from '../components/recetas/RecetaForm';
import { RecetaResumenModal } from '../components/recetas/RecetaResumenModal';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/Loading';

export const Recetas = () => {
  const { session, currentRestaurant } = useAuth();
  const [recetas, setRecetas] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReceta, setEditingReceta] = useState(null);
  
  // Estado para modal de confirmación de eliminación
  // Estado para modal de confirmación de eliminación
  const [recetaToDelete, setRecetaToDelete] = useState(null);
  const [selectedResumenReceta, setSelectedResumenReceta] = useState(null);


  const loadRecetas = async () => {
    try {
      setLoading(true);
      const [dataRecetas, dataInsumos] = await Promise.all([
        recetasService.getRecetas(),
        insumosService.getInsumos()
      ]);
      setRecetas(dataRecetas || []);
      setInsumos(dataInsumos || []);
    } catch (error) {
      console.error('Error cargando recetas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecetas();
  }, []);

  const handleOpenModal = async (receta = null) => {
    if (receta) {
      // Necesitamos cargar los ingredientes completos antes de abrir
      try {
        const fullReceta = await recetasService.getRecetaConIngredientes(receta.id);
        setEditingReceta(fullReceta);
      } catch (error) {
        console.error('Error cargando detalles:', error);
        toast.error('No se pudieron cargar los detalles de la receta.');
        return;
      }
    } else {
      setEditingReceta(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingReceta(null);
    setIsModalOpen(false);
  };

  const handleOpenResumen = async (receta) => {
    try {
      const fullReceta = await recetasService.getRecetaConIngredientes(receta.id);
      setSelectedResumenReceta(fullReceta);
    } catch (error) {
      console.error('Error cargando detalles:', error);
      toast.error('No se pudieron cargar los detalles para el resumen.');
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const { supabase } = await import('../services/api/client');
      if (editingReceta) {
        await recetasService.updateRecetaConIngredientes(editingReceta.id, formData, formData.ingredientes);
        toast.success('¡Receta actualizada con éxito!');
      } else {
        await recetasService.createRecetaConIngredientes(currentRestaurant?.id, formData, formData.ingredientes);
        toast.success('¡Receta creada con éxito!');
      }
      
      handleCloseModal();
      await loadRecetas();
      
    } catch (error) {
      console.error('Error guardando receta:', error);
      toast.error('Error al guardar la receta');
    }
  };

  const handleDeleteRequest = (recetaId) => {
    // Buscar la receta completa para mostrar el nombre en el modal
    const receta = recetas.find(r => r.id === recetaId);
    if (receta) {
      setRecetaToDelete(receta);
    }
  };

  const confirmDelete = async () => {
    if (!recetaToDelete) return;
    
    try {
      await recetasService.deleteReceta(recetaToDelete.id);
      toast.success(`¡Receta "${recetaToDelete.nombre}" eliminada correctamente!`);
      loadRecetas();
    } catch (error) {
      console.error('Error eliminando receta:', error);
      toast.error('Ocurrió un error al intentar eliminar la receta.');
    } finally {
      setRecetaToDelete(null);
    }
  };

  // Filtrar recetas localmente
  const filteredRecetas = useMemo(() => {
    if (!searchTerm) return recetas;
    return recetas.filter(receta => 
      receta.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recetas, searchTerm]);

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm">
      <div className="flex-1 flex flex-col h-full bg-slate-50/50">
        
        {/* Header Premium Estándar */}
        <div className="px-8 py-6 bg-white border-b border-slate-100 shrink-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Recetas y Platillos</h1>
            <p className="text-slate-500 text-sm mt-1">Diseña tu menú y controla tus márgenes de ganancia.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Buscador Estándar */}
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar receta..."
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
              <span>Nueva Receta</span>
            </button>
          </div>
        </div>

        {/* Área de Contenido */}
        <div className="flex-1 overflow-y-auto p-8">

        {loading ? (
          <LoadingSpinner text="Cargando recetario..." />
        ) : (
          <RecetasList 
            recetas={filteredRecetas} 
            onEdit={handleOpenModal}
            onDelete={handleDeleteRequest} 
            onViewResumen={handleOpenResumen}
          />
        )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          <div className="flex items-center gap-2">
            <span>{editingReceta ? 'Editar Receta' : 'Diseñar Nueva Receta'}</span>
            <div className="relative flex items-center group/tooltip cursor-help">
              <Info size={20} className="text-blue-500 hover:text-blue-600 transition-colors" />
              <div className="absolute top-full left-0 mt-2 w-80 p-4 bg-slate-800 text-white text-xs rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-[100] shadow-xl border border-slate-700 font-normal normal-case pointer-events-none">
                <p className="font-bold text-sm mb-2 text-blue-300">¿Qué es el Rendimiento (Lotes)?</p>
                <p className="mb-2 text-slate-300">
                  El campo <strong>Rendimiento</strong> te permite crear preparaciones en grandes cantidades para luego usarlas como ingredientes en otros platillos.
                </p>
                <p className="font-bold mt-3 mb-1 text-slate-200">¿Cuándo usar Lotes (Subrecetas)?</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-300 mb-2">
                  <li>Creas una Sub-receta "Masa para Hotcakes" que lleva 1kg de Harina y 10 Huevos.</li>
                  <li>Le pones un <strong>Rendimiento de 20 Unidades</strong>.</li>
                  <li>Luego, al crear el platillo "Desayuno Hotcake", agregas la "Masa" como ingrediente. Insumia dividirá automáticamente el costo y descontará la fracción exacta del inventario.</li>
                </ul>
                <div className="bg-blue-900/50 p-2 rounded text-blue-200 mt-3 border border-blue-800/50">
                  <strong>Regla fácil:</strong> Si la receta es un platillo final o individual (ej. 1 Hamburguesa), deja el rendimiento en <strong>1</strong>.
                </div>
              </div>
            </div>
          </div>
        }
        maxWidth="max-w-3xl"
      >
        <RecetaForm
          onSubmit={handleSubmit}
          defaultValues={editingReceta ? {
            nombre: editingReceta.nombre || '',
            tipo: editingReceta.tipo || 'platillo',
            precio_venta: editingReceta.precio_venta || 0,
            costo_total: editingReceta.costo_total || 0,
            ingredientes: (editingReceta.ingredientes || []).map(ing => ({
              insumo_id: ing.insumo_id,
              cantidad_uso: ing.cantidad_uso
            }))
          } : null}
        />
      </Modal>

      {/* Modal de Confirmación de Eliminación en Cascada */}
      <Modal
        isOpen={!!recetaToDelete}
        onClose={() => setRecetaToDelete(null)}
        title="⚠️ Confirmar Eliminación Permanente"
        maxWidth="max-w-md"
      >
        {recetaToDelete && (
          <div className="text-slate-700">
            <p className="mb-4">
              Estás a punto de eliminar la receta <strong>{recetaToDelete.nombre}</strong>.
            </p>
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 text-sm">
              <p className="font-bold mb-2">🚨 Consecuencias en Cascada:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>La receta desaparecerá del catálogo.</li>
                <li>Se eliminará la lista de ingredientes de esta receta (Tus insumos/materias primas globales del inventario <strong>NO</strong> se borrarán, seguirán intactos).</li>
                <li>Se eliminará del <strong>historial de ventas</strong> (venta_detalles) si alguna vez fue cobrada.</li>
              </ul>
              <p className="mt-3 font-medium">Esta acción NO se puede deshacer.</p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setRecetaToDelete(null)}
                className="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm hover:shadow-md cursor-pointer"
              >
                Sí, Eliminar Permanentemente
              </button>
            </div>
          </div>
        )}
      </Modal>

      {selectedResumenReceta && (
        <RecetaResumenModal 
          receta={selectedResumenReceta}
          insumos={insumos}
          recetas={recetas}
          onClose={() => setSelectedResumenReceta(null)}
        />
      )}
    </div>
  );
};
