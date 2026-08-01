import { ChefHat, Edit, Trash2, TrendingUp, AlertTriangle, Info, Calculator, Percent, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RecetasList = ({ recetas, onEdit, onDelete }) => {
  if (!recetas || recetas.length === 0) {
    return (
      <div className="space-y-6">
        {/* Banner de Bienvenida / Alerta Principal */}
        <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-xl">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-emerald-800">Bienvenido al Diseñador de Menú</h3>
              <div className="mt-2 text-sm text-emerald-700">
                <p>
                  Aún no tienes recetas creadas. En Insumia, una <strong>Receta</strong> es la combinación inteligente de tus insumos. Aquí es donde descubres exactamente cuánto te cuesta cada platillo.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas Explicativas (Onboarding) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Combinar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-4">
              <PlusCircle size={28} />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">1. Arma tu Platillo</h4>
            <p className="text-sm text-slate-500 mb-4">
              Agrega los insumos que ya registraste (ej. Pan, Carne, Queso) y define los gramos o piezas exactas que usa la receta.
            </p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Paso 1
            </span>
          </div>

          {/* Card 2: Costeo Mágico */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-rose-50 text-rose-500 rounded-full mb-4">
              <Calculator size={28} />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">2. Costeo Automático</h4>
            <p className="text-sm text-slate-500 mb-4">
              El motor de Insumia calculará el costo real al centavo, tomando en cuenta lo que pagas al proveedor y las mermas.
            </p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
              Paso 2
            </span>
          </div>

          {/* Card 3: Food Cost */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-amber-50 text-amber-500 rounded-full mb-4">
              <Percent size={28} />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">3. Define tu Ganancia</h4>
            <p className="text-sm text-slate-500 mb-4">
              Asigna un Precio de Venta y descubre tu margen real (Food Cost). Si el costo es muy alto, el sistema te alertará.
            </p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              Paso 3
            </span>
          </div>
        </div>

        {/* Tip (Regla del 33%) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start space-x-4">
          <div className="p-2 bg-slate-50 text-slate-500 rounded-lg shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <h4 className="text-slate-800 font-bold">La Regla de Oro del Restaurante (Food Cost)</h4>
            <p className="text-slate-500 text-sm mt-1">
              Como estándar en la industria, el costo de tus ingredientes <strong>nunca debe superar el 33%</strong> del precio de venta (Margen mayor a 65%). Si te pasas de ese límite, verás una alerta naranja en tus tarjetas de receta, avisándote que podrías estar perdiendo dinero operativo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recetas.map((receta) => {
        // Cálculos de márgenes
        const costo = Number(receta.costo_total) || 0;
        const precio = Number(receta.precio_venta) || 0;
        const ganancia = precio - costo;
        const margen = precio > 0 ? (ganancia / precio) * 100 : 0;
        
        // Regla general de restaurantes: Food Cost debe ser maximo 33% (Margen 67%+)
        const alertaMargen = precio > 0 && margen < 65;

        return (
          <div 
            key={receta.id} 
            className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col relative"
          >
            {/* Cabecera Tarjeta */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <ChefHat size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 line-clamp-1" title={receta.nombre}>
                    {receta.nombre}
                  </h3>
                  <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded capitalize">
                    {receta.tipo}
                  </span>
                </div>
              </div>
            </div>

            {/* Contenido / Finanzas */}
            <div className="p-5 flex-1">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Precio Venta</p>
                  <p className="text-2xl font-bold text-slate-800">${precio.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 mb-1">Costo</p>
                  <p className="text-lg font-bold text-rose-500">${costo.toFixed(2)}</p>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg border flex justify-between items-center ${alertaMargen ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="flex items-center space-x-2">
                  <TrendingUp size={16} className={alertaMargen ? 'text-amber-600' : 'text-emerald-600'} />
                  <span className={`text-sm font-medium ${alertaMargen ? 'text-amber-700' : 'text-emerald-700'}`}>
                    Margen
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`font-bold ${alertaMargen ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {margen.toFixed(1)}%
                  </span>
                  {alertaMargen && <AlertTriangle size={16} className="text-amber-600" title="Margen muy bajo (Sugerido: >65%)" />}
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
              <button 
                onClick={() => onEdit(receta)}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                title="Editar Receta"
              >
                <Edit size={18} />
              </button>
              <button 
                onClick={() => onDelete(receta.id)}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Eliminar Receta"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
