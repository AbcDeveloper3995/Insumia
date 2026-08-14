import { ChefHat, Edit, Trash2, TrendingUp, AlertTriangle, Info, Calculator, Percent, PlusCircle, Layers, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RecetasList = ({ recetas, onEdit, onDelete, onViewResumen, onPrepareLote }) => {
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
              Como estándar en la industria, el costo de tus ingredientes <strong>nunca debe superar el 50%</strong> del precio de venta (Margen mayor a 50%). Si te pasas de ese límite, verás una alerta roja en tus tarjetas de receta, avisándote que podrías estar perdiendo dinero operativo.
            </p>
          </div>
        </div>

        {/* Tip (Subrecetas y Rendimiento) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start space-x-4 mt-6">
          <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg shrink-0">
            <ChefHat size={24} />
          </div>
          <div>
            <h4 className="text-slate-800 font-bold">Nuevo: Preparaciones en Lote (Subrecetas)</h4>
            <p className="text-slate-500 text-sm mt-1">
              ¿Preparas masa para 20 hotcakes de una vez? Selecciona el tipo <strong>Sub-receta</strong> y pon un <strong>Rendimiento de 20</strong>. Luego, podrás usar esa "Masa" como un ingrediente dentro de otros platillos. Insumia dividirá el costo y los ingredientes automáticamente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Banner General de Información Financiera */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 flex items-start space-x-3 shadow-sm">
        <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg shrink-0">
          <Calculator size={18} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-700">Entendiendo el Costo FC (Food Cost)</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            El <strong>Costo FC</strong> es la suma del costo real de todos los ingredientes que componen un platillo. Como regla de oro, este costo <strong>no debe superar el 50%</strong> del precio de venta para asegurar que tu restaurante sea rentable. Si el margen cae por debajo del 50%, la tarjeta te alertará en rojo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {recetas.map((receta) => {
        // Cálculos de márgenes (basados en Costo Unitario)
        const isSubreceta = receta.tipo === 'subreceta';
        const rendimiento = Number(receta.rendimiento) || 1;
        const costoTotal = Number(receta.costo_total) || 0;
        const costoUnitario = costoTotal / rendimiento;
        const precio = Number(receta.precio_venta) || 0;
        const ganancia = precio - costoUnitario;
        const margen = precio > 0 ? (ganancia / precio) * 100 : 0;
        
        // Regla general de restaurantes: Food Cost debe ser maximo 50% (Margen 50%+)
        const alertaMargen = precio > 0 && margen < 50;

        return (
          <div 
            key={receta.id} 
            className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 flex flex-col relative group hover:-translate-y-0.5"
          >
            {/* Imagen Placeholder Pequeña */}
            <div className={`h-16 relative flex items-center justify-center shrink-0 rounded-t-xl overflow-hidden ${isSubreceta ? 'bg-gradient-to-br from-indigo-50 to-indigo-100' : 'bg-gradient-to-br from-slate-100 to-slate-200'}`}>
              {isSubreceta ? (
                <Layers size={24} className="text-indigo-300 group-hover:scale-110 transition-transform duration-300" />
              ) : (
                <ChefHat size={24} className="text-slate-300 group-hover:scale-110 transition-transform duration-300" />
              )}
              {alertaMargen && !isSubreceta && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  Alerta
                </div>
              )}
              {/* Badge de Stock Actual */}
              <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                Stock: {Number(receta.stock_actual || 0)}
              </div>
            </div>

            {/* Contenido Ultra Compacto */}
            <div className="p-3 flex-1 flex flex-col">
              <div className="mb-2 flex flex-col gap-1">
                <h3 className="font-bold text-sm text-slate-800 line-clamp-1 leading-tight w-full" title={receta.nombre}>
                  {receta.nombre}
                </h3>
                {isSubreceta && (
                  <span className="self-start text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-bold inline-block">
                    Rinde: {rendimiento} unid.
                  </span>
                )}
              </div>

              {/* Bloque Financiero - Bento Pequeño */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 relative">
                  <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5" title="Food Cost Unitario">
                    {isSubreceta ? '1 Unid (FC)' : 'Costo FC'}
                  </p>
                  <p className="text-sm font-bold text-rose-500 leading-none">${costoUnitario.toFixed(2)}</p>
                  {isSubreceta && (
                    <p className="text-[8px] text-slate-400 mt-1 leading-none">Lote: ${costoTotal.toFixed(2)}</p>
                  )}
                </div>
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                  <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Venta</p>
                  <p className="text-sm font-bold text-slate-800 leading-none">${precio.toFixed(2)}</p>
                </div>
              </div>
              
              {/* Rentabilidad */}
              {precio > 0 ? (
                <div className={`mt-auto p-2 rounded-lg border flex justify-between items-center ${alertaMargen ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <div>
                    <p className={`text-[9px] font-bold uppercase mb-0.5 ${alertaMargen ? 'text-red-500' : 'text-emerald-600'}`}>
                      Ganancia
                    </p>
                    <p className={`font-black text-sm leading-none ${alertaMargen ? 'text-red-600' : 'text-emerald-700'}`}>
                      ${ganancia.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[9px] font-bold uppercase mb-0.5 ${alertaMargen ? 'text-red-400' : 'text-emerald-500'}`}>
                      Margen
                    </p>
                    <p className={`text-sm font-black leading-none ${alertaMargen ? 'text-red-600' : 'text-emerald-700'}`}>
                      {margen.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-auto p-2 rounded-lg border bg-slate-50 border-slate-100 flex items-center justify-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Uso Interno (Sin Venta)</p>
                </div>
              )}
            </div>

            {/* Footer Acciones Pequeño */}
            <div className={`px-3 py-2 flex justify-between items-center shrink-0 rounded-b-xl border-t ${isSubreceta ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
              <span className={`text-[9px] border px-1.5 py-0.5 rounded font-bold uppercase tracking-widest ${isSubreceta ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                {isSubreceta ? 'SUBRECETA' : 'PLATILLO'}
              </span>
              <div className="flex space-x-1">
                <button 
                  onClick={() => onPrepareLote && onPrepareLote(receta)}
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold py-1 px-2 rounded-md text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
                  title="Preparar lote de esta receta"
                >
                  <ArrowUpRight size={12} />
                  Preparar
                </button>
                <button 
                  onClick={() => onViewResumen && onViewResumen(receta)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold py-1 px-2 rounded-md text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
                  title="Ver Desglose de Costo y Ganancia"
                >
                  <Calculator size={12} className="text-blue-500" />
                </button>
                <button 
                  onClick={() => onEdit(receta)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                  title="Editar Receta"
                >
                  <Edit size={14} />
                </button>
                <button 
                  onClick={() => onDelete(receta.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                  title="Eliminar Receta"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
};
