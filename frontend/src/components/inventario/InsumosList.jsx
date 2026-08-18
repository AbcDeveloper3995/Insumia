import { Edit2, Trash2, ArrowRightLeft, PackageOpen, Plus, Activity, RefreshCw, Package, Info, Lightbulb, ChefHat, TrendingDown, ShoppingCart, Archive, AlertTriangle } from 'lucide-react';

export const InsumosList = ({ insumos, onEdit, onDelete, onRestore, onViewKardex }) => {
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

        {/* Tip (Cálculos) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start space-x-4 mt-6">
          <div className="p-2 bg-blue-50 text-blue-500 rounded-lg shrink-0">
            <Info size={24} />
          </div>
          <div>
            <h4 className="text-slate-800 font-bold">¿Cómo calcula Insumia tus costos?</h4>
            <p className="text-slate-500 text-sm mt-1">
              El costo por unidad base (ej. 1 gramo) se calcula tomando el precio de compra y dividiéndolo entre tu conversión y rendimiento. ¡Da clic en el botón <strong>Kardex</strong> de cualquier insumo para auditar dónde se gastó y cuánta ganancia generó!
            </p>
          </div>
        </div>

        {/* Tip (Lotes) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start space-x-4 mt-6">
          <div className="p-2 bg-rose-50 text-rose-500 rounded-lg shrink-0">
            <Package size={24} />
          </div>
          <div>
            <h4 className="text-slate-800 font-bold">Nuevo: Rastreo por Lotes y Caducidad</h4>
            <p className="text-slate-500 text-sm mt-1">
              Al registrar una compra, puedes ingresar la fecha de caducidad. Insumia creará lotes separados y, al vender, descontará automáticamente usando el método FIFO (los que caducan primero se gastan primero). ¡Incluso verás alertas cuando estén por vencer!
            </p>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {insumos.map((insumo) => {
        const stockActual = Number(insumo.cantidad_actual_base || 0);
        const costo = Number(insumo.costo_unidad_compra || 0);
        const umbral = Number(insumo.umbral_minimo || 0);
        const isInactive = insumo.activo === false;
        
        const needsPurchase = stockActual === 0 && costo === 0 && !isInactive;
        const isBajoUmbral = stockActual <= umbral && !needsPurchase && !isInactive;
        
        return (
          <div 
            key={insumo.id} 
            className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col relative
              ${isInactive ? 'opacity-70 grayscale-[0.3]' : ''}
              ${needsPurchase ? 'border-2 border-rose-200' : (isBajoUmbral ? 'border-2 border-red-500 animate-alert-border' : 'border border-slate-200')}
            `}
          >
            {isInactive && (
              <div className="bg-slate-200 border-b border-slate-300 px-3 py-1.5 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Archive size={14} className="text-slate-600" />
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Archivado (Inactivo)</span>
                </div>
              </div>
            )}
            {needsPurchase && !isInactive && (
              <div className="bg-rose-50 border-b border-rose-100 px-3 py-1.5 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-600" />
                <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wide">Falta configurar costo</span>
              </div>
            )}
            {isBajoUmbral && !isInactive && (
              <div className="bg-red-50 border-b border-red-200 px-3 py-1.5 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-red-600 animate-pulse" />
                <span className="text-[11px] font-bold text-red-600 uppercase tracking-wide">Stock Bajo</span>
              </div>
            )}
            
            {/* Cabecera Tarjeta */}
            <div className={`p-3 border-b ${needsPurchase ? 'border-rose-100' : (isBajoUmbral ? 'border-red-100' : 'border-slate-100')} flex justify-between items-start`}>
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-lg 
                  ${needsPurchase ? 'bg-rose-100 text-rose-600' : (isBajoUmbral ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600')}`}
                >
                  <Package size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 line-clamp-1 leading-tight" title={insumo.nombre}>
                    {insumo.nombre}
                  </h3>
                  <div className="flex items-center text-[10px] text-slate-500 mt-1">
                    <span className="bg-slate-100 px-1 py-0.5 rounded font-bold">{insumo.unidad_compra}</span>
                    <span className="mx-1 font-bold">→</span>
                    <span className="bg-slate-100 px-1 py-0.5 rounded font-bold">{insumo.unidad_base}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido / Stock Principal */}
            <div className="p-3 flex-1 relative flex flex-col justify-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Stock Actual</p>
              <div className="flex items-baseline">
                <span className={`text-xl font-black leading-none
                  ${needsPurchase ? 'text-slate-300' : (isBajoUmbral ? 'text-red-600' : 'text-emerald-600')}
                `}>
                  {Number(stockActual).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
                <span className="ml-1 text-slate-500 font-bold text-xs">{insumo.unidad_base}</span>
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1 mb-0.5">
                    <p className="text-[9px] uppercase font-bold text-slate-400">C. Compra</p>
                  </div>
                  <span className={`inline-block text-xs font-bold ${needsPurchase ? 'text-rose-600' : 'text-slate-700'}`}>
                    ${Number(insumo.costo_unidad_compra || 0).toFixed(2)}
                  </span>
                </div>
                <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-1 mb-0.5">
                    <p className="text-[9px] uppercase font-bold text-blue-400">Rendim.</p>
                  </div>
                  <span className="inline-block text-blue-700 text-xs font-bold">
                    {insumo.porcentaje_rendimiento}%
                  </span>
                </div>
              </div>
              
              {/* Blur Overlay for incomplete items */}
              {needsPurchase && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center p-4">
                  
                </div>
              )}
            </div>

            {/* Botones de Acción */}
            <div className={`px-2 py-2 border-t flex items-center justify-between shrink-0
              ${needsPurchase ? 'bg-rose-50 border-rose-100' : 'bg-slate-50/50 border-slate-100'}
            `}>
                <div className="w-full flex justify-end space-x-1">
                  <button 
                    onClick={() => onViewKardex && onViewKardex(insumo)}
                    className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold py-1 px-2 rounded-md text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer mr-1 shadow-sm"
                    title="Ver Detalles / Historial"
                  >
                    <Info size={12} className="text-slate-400" />
                    Kardex
                  </button>
                  {isInactive ? (
                    <button 
                      onClick={() => onRestore && onRestore(insumo)}
                      className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                      title="Restaurar Insumo"
                    >
                      <RefreshCw size={14} />
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => onEdit(insumo)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        title="Editar Insumo"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => onDelete(insumo)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title="Eliminar Insumo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
