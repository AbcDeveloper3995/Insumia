import { useState, useEffect, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { recetasService } from '../services/api/recetas';
import { RecetasList } from '../components/recetas/RecetasList';
import { Modal } from '../components/common/Modal';
import { RecetaForm } from '../components/recetas/RecetaForm';

export const Recetas = () => {
  const { session } = useAuth();
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReceta, setEditingReceta] = useState(null);
  const [mensajeExito, setMensajeExito] = useState('');

  const loadRecetas = async () => {
    try {
      setLoading(true);
      const data = await recetasService.getRecetas();
      setRecetas(data || []);
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

  const handleSubmit = async (formData) => {
    try {
      const { supabase } = await import('../services/api/client');
      const { data: userData } = await supabase
        .from('usuarios')
        .select('restaurante_id')
        .eq('id', session.user.id)
        .single();

      if (editingReceta) {
        await recetasService.updateRecetaConIngredientes(editingReceta.id, formData, formData.ingredientes);
        setMensajeExito('¡Receta actualizada con éxito!');
      } else {
        await recetasService.createRecetaConIngredientes(userData.restaurante_id, formData, formData.ingredientes);
        setMensajeExito('¡Receta creada con éxito!');
      }
      
      handleCloseModal();
      await loadRecetas();
      
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (error) {
      console.error('Error guardando receta:', error);
      alert('Error al guardar la receta');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta receta? Se borrarán sus ingredientes también.')) {
      try {
        await recetasService.deleteReceta(id);
        loadRecetas();
      } catch (error) {
        console.error('Error eliminando receta:', error);
      }
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

        {mensajeExito && (
          <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-medium flex items-center shadow-sm">
            {mensajeExito}
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-500 py-12">Cargando catálogo...</div>
        ) : (
          <RecetasList 
            recetas={filteredRecetas} 
            onEdit={handleOpenModal}
            onDelete={handleDelete} 
          />
        )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingReceta ? 'Editar Receta' : 'Diseñar Nueva Receta'}
        maxWidth="max-w-3xl"
      >
        <RecetaForm
          onSubmit={handleSubmit}
          defaultValues={editingReceta ? {
            nombre: editingReceta.nombre,
            tipo: editingReceta.tipo,
            precio_venta: editingReceta.precio_venta,
            costo_total: editingReceta.costo_total,
            ingredientes: editingReceta.ingredientes.map(ing => ({
              insumo_id: ing.insumo_id,
              cantidad_uso: ing.cantidad_uso
            }))
          } : null}
        />
      </Modal>
    </div>
  );
};
