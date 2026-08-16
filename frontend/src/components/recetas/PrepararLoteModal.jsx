import { useState } from 'react';
import { ChefHat, X, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { recetasService } from '../../services/api/recetas';
import { useAuth } from '../../context/AuthContext';

export const PrepararLoteModal = ({ receta, onClose, onSuccess }) => {
  const { currentRestaurant } = useAuth();
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cantidad || cantidad <= 0) {
      toast.error('Ingresa una cantidad válida a producir');
      return;
    }

    setLoading(true);
    try {
      await recetasService.prepararReceta(currentRestaurant.id, receta.id, cantidad);
      toast.success(`Se produjeron ${cantidad} unidades de ${receta.nombre}`);
      onSuccess();
    } catch (error) {
      console.error('Error al preparar receta:', error);
      toast.error(error.message || 'Error al preparar receta');
    } finally {
      setLoading(false);
    }
  };

  if (!receta) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ChefHat size={20} className="text-blue-500" />
            Elaborar Producción
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">{receta.nombre}</h3>
            <p className="text-sm text-slate-500 mb-4">
              Stock actual: <span className="font-bold text-emerald-600">{Number(receta.stock_actual || 0)}</span>
            </p>

            <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-xs mb-4 border border-blue-100">
              Al confirmar, los ingredientes crudos se descontarán de tu inventario y el stock de este platillo o subreceta aumentará.
            </div>

            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cantidad a producir
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0.1"
                step="0.1"
                required
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold text-lg"
              />
              <span className="text-slate-500 font-medium">unidades</span>
            </div>
            {receta.tipo === 'subreceta' && (
              <p className="text-[10px] text-slate-400 mt-1">
                Recuerda que su rendimiento base es de {receta.rendimiento} unidades por receta. El sistema calculará la porción correcta.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !cantidad || cantidad <= 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 cursor-pointer"
            >
              <ArrowUpRight size={18} />
              {loading ? 'Procesando...' : 'Elaborar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
