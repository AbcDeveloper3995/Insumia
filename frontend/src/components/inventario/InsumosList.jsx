import { AlertTriangle, Edit, Trash2, Package, Info, Lightbulb, ChefHat, TrendingDown } from 'lucide-react';

export const InsumosList = ({ insumos, onEdit, onDelete }) => {
  if (!insumos || insumos.length === 0) {
    return (
      <div className="space-y-6">
        {/* Banner de Bienvenida / Alerta Principal */}
        <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-xl">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Bienvenido al Catálogo de Insumos</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Aún no tienes materia prima registrada. Los <strong>Insumos</strong> son el corazón de tu restaurante; son todos los ingredientes que compras para preparar tus platillos (Tomates, Queso, Carne, etc.).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas Explicativas (Onboarding) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Registro */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full mb-4">
              <Package size={28} />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">1. Registra tus Ingredientes</h4>
            <p className="text-sm text-slate-500 mb-4">
              Añade todo lo que compras. Define cómo lo compras (ej. Kilos) y cómo lo usas en la cocina (ej. Gramos).
            </p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Paso Inicial
            </span>
          </div>

          {/* Card 2: Recetas */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full mb-4">
              <ChefHat size={28} />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">2. Crea tus Recetas</h4>
            <p className="text-sm text-slate-500 mb-4">
              Una vez creados los insumos, podrás combinarlos para crear sub-recetas y platillos finales con costos exactos.
            </p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              Siguiente Módulo
            </span>
          </div>

          {/* Card 3: Control Automático */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-full mb-4">
              <TrendingDown size={28} />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">3. Descuento Automático</h4>
            <p className="text-sm text-slate-500 mb-4">
              Al registrar una venta, Insumia calculará la receta y descontará los gramos exactos de tu inventario.
            </p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Magia
            </span>
          </div>
        </div>

        {/* Tip (Mermas) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start space-x-4">
          <div className="p-2 bg-amber-50 text-amber-500 rounded-lg shrink-0">
            <Lightbulb size={24} />
          </div>
          <div>
            <h4 className="text-slate-800 font-bold">Concepto Clave: Rendimiento y Mermas</h4>
            <p className="text-slate-500 text-sm mt-1">
              Cuando registres un insumo (como una Piña), recuerda que tiene desperdicio (la cáscara). Usa el campo <strong>% Rendimiento</strong> (ej. 60%) para que el sistema sepa que por cada Kilo que compras, solo puedes usar 600 gramos en tus recetas.
            </p>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {insumos.map((insumo) => {
        const isBajoUmbral = insumo.cantidad_actual_base <= insumo.umbral_minimo;
        
        return (
          <div 
            key={insumo.id} 
            className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col"
          >
            {/* Cabecera Tarjeta */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isBajoUmbral ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                  {isBajoUmbral ? <AlertTriangle size={24} /> : <Package size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 line-clamp-1" title={insumo.nombre}>
                    {insumo.nombre}
                  </h3>
                  <div className="flex items-center text-xs text-slate-500 mt-1">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">{insumo.unidad_compra}</span>
                    <span className="mx-1">→</span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">{insumo.unidad_base}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido / Stock Principal */}
            <div className="p-5 flex-1">
              <p className="text-sm text-slate-500 mb-1">Stock Actual</p>
              <div className="flex items-baseline">
                <span className={`text-3xl font-bold ${isBajoUmbral ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {insumo.cantidad_actual_base}
                </span>
                <span className="ml-2 text-slate-500 font-medium">{insumo.unidad_base}</span>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Rendimiento</p>
                  <p className="text-sm font-medium text-slate-700">{insumo.porcentaje_rendimiento}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Costo ({insumo.unidad_compra})</p>
                  <p className="text-sm font-medium text-slate-700">${Number(insumo.costo_unidad_compra).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
              <button 
                onClick={() => onEdit(insumo)}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                title="Editar Insumo"
              >
                <Edit size={18} />
              </button>
              <button 
                onClick={() => onDelete(insumo.id)}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Eliminar Insumo"
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
