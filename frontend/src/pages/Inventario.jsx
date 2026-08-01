import { useState, useEffect, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { insumosService } from '../services/api/insumos';
import { Modal } from '../components/common/Modal';
import { InsumoForm } from '../components/inventario/InsumoForm';
import { InsumosList } from '../components/inventario/InsumosList';

export const Inventario = () => {
  const { session } = useAuth();
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState(null);
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorCarga, setErrorCarga] = useState(null);
  
  const restauranteId = session?.user?.user_metadata?.restaurante_id || session?.user?.id;
  // Nota: En un caso real, el restauranteId vendría del perfil del usuario (auth.obtener_restaurante_id).
  // Como estamos usando RLS, el backend filtrará los registros del usuario actual automáticamente,
  // pero necesitamos enviar el restaurante_id al insertar.
  // Para este MVP (1 a 1), podemos buscar el restaurante_id real o usar una función RPC.
  // Sin embargo, podemos extraerlo llamando a la BD. Por simplicidad, asumimos que se inyectará.

  // Fetch Insumos
  const loadInsumos = async () => {
    try {
      setLoading(true);
      setErrorCarga(null);
      const data = await insumosService.getInsumos();
      setInsumos(data || []);
    } catch (error) {
      console.error('Error cargando insumos:', error);
      setErrorCarga(error.message || 'Error desconocido al cargar insumos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsumos();
  }, []);

  const handleOpenModal = (insumo = null) => {
    setEditingInsumo(insumo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingInsumo(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (formData) => {
    try {
      // Necesitamos el restaurante_id para insertar
      // Lo obtenemos de los datos del usuario actual (en un flujo real, del AuthContext)
      // Por ahora pasamos un query a `usuarios` para sacarlo
      
      const { supabase } = await import('../services/api/client');
      const { data: userData } = await supabase
        .from('usuarios')
        .select('restaurante_id')
        .eq('id', session.user.id)
        .single();

      const insumoData = {
        ...formData,
        restaurante_id: userData.restaurante_id
      };

      if (editingInsumo) {
        await insumosService.updateInsumo(editingInsumo.id, insumoData);
        setMensajeExito('¡Insumo actualizado correctamente!');
      } else {
        await insumosService.createInsumo(insumoData);
        setMensajeExito('¡Insumo creado correctamente!');
      }
      
      handleCloseModal();
      await loadInsumos(); // Recargar lista y esperar
      
      // Ocultar mensaje después de 3s
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (error) {
      console.error('Error guardando insumo:', error);
      alert('Hubo un error al guardar el insumo.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este insumo?')) {
      try {
        await insumosService.deleteInsumo(id);
        loadInsumos();
      } catch (error) {
        console.error('Error eliminando:', error);
      }
    }
  };

  // Filtrar insumos localmente
  const filteredInsumos = useMemo(() => {
    if (!searchTerm) return insumos;
    return insumos.filter(insumo => 
      insumo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [insumos, searchTerm]);

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm">
      <div className="flex-1 flex flex-col h-full bg-slate-50/50">
        
        {/* Header Premium Estándar */}
        <div className="px-8 py-6 bg-white border-b border-slate-100 shrink-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Inventario e Insumos</h1>
            <p className="text-slate-500 text-sm mt-1">Gestiona tu materia prima, costos y mermas.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Buscador Estándar */}
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

        {/* Área de Contenido */}
        <div className="flex-1 overflow-y-auto p-8">

        {mensajeExito && (
          <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-medium flex items-center shadow-sm">
            {mensajeExito}
          </div>
        )}

        {errorCarga && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium">
            <strong>Error de carga:</strong> {errorCarga}
            <br/><span className="text-sm">Por favor, compártele este error a Antigravity.</span>
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-500 py-12">Cargando catálogo...</div>
        ) : (
          <InsumosList 
            insumos={filteredInsumos} 
            onEdit={handleOpenModal} 
            onDelete={handleDelete} 
          />
        )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingInsumo ? 'Editar Insumo' : 'Registrar Nuevo Insumo'}
      >
        <InsumoForm
          onSubmit={handleSubmit}
          defaultValues={editingInsumo}
        />
      </Modal>
    </div>
  );
};
