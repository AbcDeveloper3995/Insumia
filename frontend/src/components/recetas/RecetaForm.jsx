import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { insumosService } from '../../services/api/insumos';

export const RecetaForm = ({ onSubmit, defaultValues = null, isLoading = false }) => {
  const [insumos, setInsumos] = useState([]);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [costoCalculado, setCostoCalculado] = useState(0);

  const { register, control, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm({
    defaultValues: defaultValues || {
      nombre: '',
      tipo: 'platillo',
      precio_venta: 0,
      costo_total: 0,
      ingredientes: []
    },
    mode: 'onBlur' // Dispara validación y updates al perder el foco
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredientes'
  });

  // Observamos todo para asegurar renderizados
  const formValues = watch();
  const watchIngredientes = formValues.ingredientes || [];
  const watchPrecioVenta = formValues.precio_venta || 0;

  useEffect(() => {
    const fetchInsumos = async () => {
      try {
        setLoadingDatos(true);
        const insumosData = await insumosService.getInsumos();
        setInsumos(insumosData || []);
      } catch (error) {
        console.error('Error cargando insumos:', error);
      } finally {
        setLoadingDatos(false);
      }
    };
    fetchInsumos();
  }, []);

  // Función para calcular costo de un solo ingrediente
  const calcularCostoIngrediente = (insumoId, cantidad) => {
    if (!insumoId || !cantidad || !insumos.length) return 0;
    const insumoRef = insumos.find(i => i.id === insumoId);
    if (!insumoRef) return 0;
    
    const costoBase = Number(insumoRef.costo_unidad_compra) / Number(insumoRef.factor_conversion);
    const costoReal = costoBase / (Number(insumoRef.porcentaje_rendimiento) / 100);
    return costoReal * Number(cantidad);
  };

  // Función principal de recálculo (ejecutada en onBlur y useEffect)
  const recalcularCostoTotal = () => {
    if (!insumos.length) return;
    
    // Obtenemos los valores frescos directamente
    const ingredientesActuales = getValues('ingredientes') || [];
    let costoTotal = 0;
    
    ingredientesActuales.forEach(ing => {
      costoTotal += calcularCostoIngrediente(ing.insumo_id, ing.cantidad_uso);
    });

    setCostoCalculado(costoTotal);
    setValue('costo_total', costoTotal);
  };

  // Motor de Cálculo automático ante cambios grandes
  useEffect(() => {
    recalcularCostoTotal();
  }, [watchIngredientes.length, insumos, setValue]); 
  // Nota: solo dependemos del length aquí para evitar ciclos, el recálculo fino se hace en onBlur

  const margen = watchPrecioVenta > 0 ? ((watchPrecioVenta - costoCalculado) / watchPrecioVenta) * 100 : 0;

  if (loadingDatos) {
    return <div className="p-8 text-center text-slate-500">Cargando constructor...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Platillo</label>
          <input
            {...register('nombre', { required: 'Requerido' })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ej. Hamburguesa Clásica"
          />
          {errors.nombre && <span className="text-red-500 text-xs">{errors.nombre.message}</span>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
          <select
            {...register('tipo')}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="platillo">Platillo Final (Venta)</option>
            <option value="subreceta">Sub-receta (Preparación Base)</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Ingredientes</h3>
          <button
            type="button"
            onClick={() => append({ insumo_id: '', cantidad_uso: 0 })}
            className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 text-blue-600 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium cursor-pointer"
          >
            <Plus size={16} />
            <span>Agregar</span>
          </button>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg bg-white">
            No has agregado ningún ingrediente.
          </div>
        ) : (
          <div className="space-y-4 max-h-[22rem] overflow-y-auto pr-2">
            {fields.map((field, index) => {
              const currentInsumoId = watchIngredientes[index]?.insumo_id;
              const currentCantidad = watchIngredientes[index]?.cantidad_uso;
              const selectedInsumo = insumos.find(i => i.id === currentInsumoId);
              
              const costoDesglose = calcularCostoIngrediente(currentInsumoId, currentCantidad);

              return (
                <div key={field.id} className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
                  <div className="flex items-start space-x-3 mb-2">
                    <div className="flex-1">
                      <select
                        {...register(`ingredientes.${index}.insumo_id`, { 
                          required: true,
                          onChange: recalcularCostoTotal 
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                      >
                        <option value="">Selecciona un insumo...</option>
                        {insumos.map(insumo => (
                          <option key={insumo.id} value={insumo.id}>
                            {insumo.nombre} (usa {insumo.unidad_base})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="w-32 relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Cant."
                        {...register(`ingredientes.${index}.cantidad_uso`, { 
                          required: true, 
                          min: 0.01,
                          onBlur: recalcularCostoTotal
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm pr-10"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">
                        {selectedInsumo ? selectedInsumo.unidad_base : '-'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        remove(index);
                        setTimeout(recalcularCostoTotal, 50); // Recalcular después de que react-hook-form elimine el campo
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  {/* Desglose visual del costo por ingrediente */}
                  {selectedInsumo && (
                    <div className="flex items-center text-xs justify-end pr-12">
                      <span className="text-slate-500 mr-2">Costo (inc. merma):</span>
                      <span className="font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">
                        ${costoDesglose.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tarjeta de Finanzas y Costeo */}
      <div className="bg-slate-800 rounded-xl shadow-inner p-5 text-white mb-6">
        <h2 className="flex items-center text-sm font-bold mb-4 text-slate-200">
          <Calculator size={16} className="mr-2" />
          Análisis de Costos (Food Cost)
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-slate-400 text-xs mb-1">Costo Total</p>
            <p className="text-2xl font-bold text-rose-400">${costoCalculado.toFixed(2)}</p>
          </div>

          <div>
            <p className="text-slate-400 text-xs mb-1">Precio de Venta</p>
            <div className="relative">
              <span className="absolute left-2 top-1 text-slate-400 font-bold">$</span>
              <input
                type="number"
                step="0.5"
                {...register('precio_venta', { min: 0 })}
                className="w-full pl-6 pr-2 py-1 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white text-lg font-bold"
              />
            </div>
          </div>

          <div>
            <p className="text-slate-400 text-xs mb-1">Margen</p>
            <p className={`text-2xl font-bold ${margen >= 65 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {margen.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer disabled:opacity-50"
        >
          {isLoading ? 'Guardando...' : 'Guardar Receta'}
        </button>
      </div>
    </form>
  );
};
