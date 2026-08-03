import { useForm } from 'react-hook-form';
import { UNIDADES } from '../../constants';
import { useEffect } from 'react';

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
      umbral_minimo: 0
    }
  });

  const unidadCompra = watch('unidad_compra');
  const unidadBase = watch('unidad_base');

  // Auto-calcular factor de conversión para combinaciones comunes
  useEffect(() => {
    if (unidadCompra === UNIDADES.KILOGRAMOS && unidadBase === UNIDADES.GRAMOS) {
      setValue('factor_conversion', 1000);
    } else if (unidadCompra === UNIDADES.LITROS && unidadBase === UNIDADES.MILILITROS) {
      setValue('factor_conversion', 1000);
    } else if (unidadCompra === unidadBase) {
      setValue('factor_conversion', 1);
    }
  }, [unidadCompra, unidadBase, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Insumo</label>
        <input
          {...register('nombre', { required: 'El nombre es requerido' })}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Ej. Tomate Bola"
        />
        {errors.nombre && <span className="text-red-500 text-xs">{errors.nombre.message}</span>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Unidad de Compra */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Se compra en:</label>
          <select
            {...register('unidad_compra')}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            {Object.values(UNIDADES).map(u => (
              <option key={`compra-${u}`} value={u}>{u.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Unidad de Uso */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Se usa en recetas en:</label>
          <select
            {...register('unidad_base')}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            {Object.values(UNIDADES).map(u => (
              <option key={`uso-${u}`} value={u}>{u.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Factor y Rendimiento */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Factor de Conversión
          </label>
          <input
            type="number"
            step="0.01"
            {...register('factor_conversion', { required: true, min: 0.01 })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <span className="text-xs text-slate-500 mt-1 block">
            ¿Cuántos {unidadBase} hay en un {unidadCompra}?
          </span>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            % Rendimiento
          </label>
          <input
            type="number"
            {...register('porcentaje_rendimiento', { required: true, min: 1, max: 100 })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <span className="text-xs text-slate-500 mt-1 block">
            Ej. 85 para mermar 15%
          </span>
        </div>
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Stock Mínimo para Alerta ({unidadBase.toUpperCase()})
          </label>
          <input
            type="number"
            {...register('umbral_minimo', { required: true, min: 0 })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <span className="text-xs text-slate-500 mt-1 block">
            Te avisaremos cuando el inventario caiga por debajo de esta cantidad.
          </span>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-4 border-t border-slate-200 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? 'Guardando...' : 'Guardar Insumo'}
        </button>
      </div>
    </form>
  );
};
