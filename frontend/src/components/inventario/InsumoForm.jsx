import { useForm } from 'react-hook-form';
import { UNIDADES } from '../../constants';
import { useEffect, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';

export const InsumoForm = ({ onSubmit, defaultValues = null, isLoading = false }) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: defaultValues || {
      nombre: '',
      unidad_compra: UNIDADES.KILOGRAMOS,
      unidad_base: UNIDADES.GRAMOS,
      factor_conversion: 1000,
      costo_unidad_compra: 0,
      porcentaje_rendimiento: 100,
      cantidad_actual_base: 0,
      umbral_minimo: 0,
      dias_alerta_caducidad: 7
    }
  });

  const unidadCompra = watch('unidad_compra');
  const unidadBase = watch('unidad_base');
  
  // Estados
  const [bloquearReceta, setBloquearReceta] = useState(true);

  // Auto-seleccionar unidad base recomendada
  useEffect(() => {
    if (!bloquearReceta) return;

    let recomendada = UNIDADES.GRAMOS;
    switch (unidadCompra) {
      case UNIDADES.KILOGRAMOS:
      case UNIDADES.GRAMOS:
        recomendada = UNIDADES.GRAMOS;
        break;
      case UNIDADES.LITROS:
      case UNIDADES.MILILITROS:
        recomendada = UNIDADES.MILILITROS;
        break;
      case UNIDADES.PIEZAS:
      case UNIDADES.PAQUETES:
      case UNIDADES.CAJAS:
      case UNIDADES.LATAS:
      case UNIDADES.BOTELLAS:
        recomendada = UNIDADES.PIEZAS;
        break;
      default:
        recomendada = UNIDADES.GRAMOS;
    }
    
    if (unidadBase !== recomendada) {
      setValue('unidad_base', recomendada);
    }
  }, [unidadCompra, bloquearReceta, unidadBase, setValue]);

  // Auto-calcular factor de conversión
  useEffect(() => {
    if (unidadCompra === unidadBase) {
      setValue('factor_conversion', 1);
    } else {
      // Combinaciones comunes simples
      if (unidadCompra === UNIDADES.KILOGRAMOS && unidadBase === UNIDADES.GRAMOS) {
        setValue('factor_conversion', 1000);
      } else if (unidadCompra === UNIDADES.LITROS && unidadBase === UNIDADES.MILILITROS) {
        setValue('factor_conversion', 1000);
      }
    }
  }, [unidadCompra, unidadBase, setValue]);

  const mismaUnidad = unidadCompra === unidadBase;

  const handleFormSubmit = (data) => {
    // Si es misma unidad forzamos 1
    if (data.unidad_compra === data.unidad_base) {
      data.factor_conversion = 1;
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Insumo</label>
        <input
          {...register('nombre', { required: 'El nombre es requerido' })}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          placeholder="Ej. Leche Entera"
        />
        {errors.nombre && <span className="text-red-500 text-xs font-medium mt-1 block">{errors.nombre.message}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Unidad de Compra */}
        <div className="flex flex-col">
          <label className="block text-sm font-bold text-slate-700 mb-1">Presentación de Compra</label>
          <span className="text-[11px] text-slate-500 block mb-2 font-medium leading-tight">¿Cómo se lo compras al proveedor?</span>
          <select
            {...register('unidad_compra')}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-800"
          >
            {Object.values(UNIDADES).map(u => (
              <option key={`compra-${u}`} value={u}>{u.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Unidad de Uso */}
        <div className="flex flex-col">
          <div className="flex justify-between items-start mb-1 gap-2">
            <div>
              <label className="block text-sm font-bold text-slate-700">Unidad de Receta</label>
            </div>
            <button 
              type="button" 
              onClick={() => setBloquearReceta(!bloquearReceta)}
              className={`shrink-0 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest transition-colors cursor-pointer px-2 py-1.5 rounded border ${bloquearReceta ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
              title={bloquearReceta ? "Desbloquear para cambiar manualmente" : "Bloquear (Auto-selección)"}
            >
              {bloquearReceta ? <Lock size={12} /> : <Unlock size={12} />}
              <span>{bloquearReceta ? 'Auto' : 'Manual'}</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-500 block mb-2 font-medium leading-tight">¿Cómo lo mides para cocinar?</span>
          <select
            {...register('unidad_base')}
            disabled={bloquearReceta}
            className={`w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium ${bloquearReceta ? 'bg-slate-100 text-slate-500 cursor-not-allowed opacity-80' : 'bg-white text-slate-800'}`}
          >
            {Object.values(UNIDADES).map(u => (
              <option key={`uso-${u}`} value={u}>{u.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Factor de Conversión */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
        <h3 className="font-bold text-slate-800 mb-4 text-sm flex justify-between items-center">
          <span>Factor de Conversión</span>
          {mismaUnidad && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold">Unidad Directa</span>
          )}
        </h3>

        {mismaUnidad ? (
          <div className="text-sm text-slate-500 bg-white p-4 rounded-xl border border-slate-100">
            Como compras y usas el insumo en la misma unidad (<span className="font-bold text-slate-700">{unidadBase}</span>), el factor de conversión es automáticamente <span className="font-black text-blue-600">1</span>. No necesitas configurar nada más.
          </div>
        ) : (
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              ¿A cuántos {unidadBase} equivale 1 {unidadCompra}?
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                {...register('factor_conversion', { required: true, min: 0.01 })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 text-base"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm pointer-events-none">
                {unidadBase} / {unidadCompra}
              </div>
            </div>
            <span className="text-[11px] text-slate-500 block mt-2 font-medium leading-tight">
              Calcula el total de la unidad base por empaque. Por ejemplo, si 1 Caja trae 10 litros y usas ml, pon 10000.
            </span>
          </div>
        )}
      </div>

      {/* Rendimiento y Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            % Rendimiento (Mermas)
          </label>
          <span className="text-[11px] text-slate-500 block mb-2 font-medium">Ej. 85 para descartar 15%</span>
          <div className="relative">
            <input
              type="number"
              {...register('porcentaje_rendimiento', { required: true, min: 1, max: 100 })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold pointer-events-none">%</div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Alerta de Stock Mínimo
          </label>
          <span className="text-[11px] text-slate-500 block mb-2 font-medium">En {unidadBase}</span>
          <input
            type="number"
            {...register('umbral_minimo', { required: true, min: 0 })}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Alerta de Caducidad
          </label>
          <span className="text-[11px] text-slate-500 block mb-2 font-medium">Días de anticipación</span>
          <div className="relative">
            <input
              type="number"
              {...register('dias_alerta_caducidad', { required: true, min: 1 })}
              defaultValue={7}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold pointer-events-none text-sm">días</div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-6 border-t border-slate-200 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-md active:scale-95"
        >
          {isLoading ? 'Guardando...' : 'Guardar Insumo'}
        </button>
      </div>
    </form>
  );
};
