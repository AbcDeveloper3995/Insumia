import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Plus, Trash2, Calculator, Info } from 'lucide-react';
import { insumosService } from '../../services/api/insumos';
import { recetasService } from '../../services/api/recetas';
import { useAuth } from '../../context/AuthContext';
import { CustomSelect } from '../ui/CustomSelect';

export const RecetaForm = ({ onSubmit, defaultValues = null, isLoading = false }) => {
  const { currentRestaurant } = useAuth();
  const [insumos, setInsumos] = useState([]);
  const [subrecetas, setSubrecetas] = useState([]);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [costoCalculado, setCostoCalculado] = useState(0);

  const { register, control, handleSubmit, watch, setValue, getValues, formState: { errors, isValid } } = useForm({
    defaultValues: defaultValues || {
      nombre: '',
      tipo: 'platillo',
      rendimiento: 1,
      precio_venta: '',
      costo_total: 0,
      ingredientes: []
    },
    mode: 'onChange'
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredientes'
  });

  const formValues = watch();
  const watchIngredientes = formValues.ingredientes || [];
  const watchPrecioVenta = Number(formValues.precio_venta) || 0;
  const watchRendimiento = Number(formValues.rendimiento) || 1;

  const watchTipo = formValues.tipo || 'platillo';

  useEffect(() => {
    if (watchTipo === 'subreceta') {
      setValue('precio_venta', 0);
    }
  }, [watchTipo, setValue]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingDatos(true);
        const [insumosData, recetasData] = await Promise.all([
          currentRestaurant?.id ? insumosService.getInsumos(currentRestaurant.id) : [],
          currentRestaurant?.id ? recetasService.getRecetas(currentRestaurant.id) : []
        ]);
        setInsumos(insumosData || []);
        
        // Excluimos la receta actual si estamos editando para evitar recursividad infinita
        const currentId = defaultValues?.id;
        const sub = (recetasData || []).filter(r => r.tipo === 'subreceta' && r.id !== currentId);
        setSubrecetas(sub);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoadingDatos(false);
      }
    };
    fetchData();
  }, [defaultValues?.id]);

  const calcularCostoItem = (itemId, cantidad) => {
    if (!itemId || !cantidad) return 0;
    
    if (itemId.startsWith('subreceta_')) {
      const id = itemId.replace('subreceta_', '');
      const sub = subrecetas.find(s => s.id === id);
      if (!sub) return 0;
      const costoUnitario = Number(sub.costo_total) / (Number(sub.rendimiento) || 1);
      return costoUnitario * Number(cantidad);
    } else {
      const id = itemId.replace('insumo_', '');
      const insumoRef = insumos.find(i => i.id === id);
      if (!insumoRef) return 0;
      const costoBase = Number(insumoRef.costo_unidad_compra) / Number(insumoRef.factor_conversion);
      const costoReal = costoBase / (Number(insumoRef.porcentaje_rendimiento) / 100);
      return costoReal * Number(cantidad);
    }
  };

  const obtenerCostoBaseItem = (itemId) => {
    if (!itemId) return 0;
    if (itemId.startsWith('subreceta_')) {
      const id = itemId.replace('subreceta_', '');
      const sub = subrecetas.find(s => s.id === id);
      if (!sub) return 0;
      return Number(sub.costo_total) / (Number(sub.rendimiento) || 1);
    } else {
      const id = itemId.replace('insumo_', '');
      const insumoRef = insumos.find(i => i.id === id);
      if (!insumoRef) return 0;
      const costoBase = Number(insumoRef.costo_unidad_compra) / Number(insumoRef.factor_conversion);
      return costoBase / (Number(insumoRef.porcentaje_rendimiento) / 100);
    }
  };

  const recalcularCostoTotal = () => {
    if (!insumos.length && !subrecetas.length) return;
    
    const ingredientesActuales = getValues('ingredientes') || [];
    let costoTotal = 0;
    
    ingredientesActuales.forEach(ing => {
      costoTotal += calcularCostoItem(ing.item_id, ing.cantidad_uso);
    });

    setCostoCalculado(costoTotal);
    setValue('costo_total', costoTotal);
  };

  useEffect(() => {
    recalcularCostoTotal();
  }, [watchIngredientes.length, insumos, subrecetas, setValue]); 

  // Calculamos el costo unitario basado en el rendimiento
  const costoUnitarioCalculado = costoCalculado / watchRendimiento;
  const margen = watchPrecioVenta > 0 ? ((watchPrecioVenta - costoUnitarioCalculado) / watchPrecioVenta) * 100 : 0;

  if (loadingDatos) {
    return <div className="p-8 text-center text-slate-500">Cargando constructor...</div>;
  }

  const isFormValid = Boolean(
    isValid && watchIngredientes.length > 0
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
          <input
            {...register('nombre', { required: 'Requerido' })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ej. Hamburguesa Clásica"
          />
          {errors.nombre && <span className="text-red-500 text-xs">{errors.nombre.message}</span>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <CustomSelect
                {...field}
                options={[
                  { value: 'platillo', label: 'Platillo Final (Venta)' },
                  { value: 'subreceta', label: 'Sub-receta (Preparación Base)' }
                ]}
              />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Rendimiento (Lote)</label>
          <div className="relative">
            <input
              type="number"
              step="1"
              min="1"
              {...register('rendimiento', { 
                required: 'Requerido', 
                min: { value: 1, message: 'Min 1' },
                onBlur: recalcularCostoTotal
              })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-14"
              placeholder="1"
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold uppercase">
              Unid.
            </span>
          </div>
          {errors.rendimiento && <span className="text-red-500 text-xs">{errors.rendimiento.message}</span>}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Ingredientes de la Receta</h3>
          <button
            type="button"
            onClick={() => append({ item_id: '', cantidad_uso: '' })}
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
          <div className="flex flex-col gap-2">
            {fields.map((field, index) => {
              const currentItemId = watchIngredientes[index]?.item_id;
              const currentCantidad = watchIngredientes[index]?.cantidad_uso;
              
              let unidadVisual = '-';
              if (currentItemId?.startsWith('insumo_')) {
                 const id = currentItemId.replace('insumo_', '');
                 const ins = insumos.find(i => i.id === id);
                 if (ins) unidadVisual = ins.unidad_base;
              } else if (currentItemId?.startsWith('subreceta_')) {
                 unidadVisual = 'unid.';
              }
              
              const costoDesglose = calcularCostoItem(currentItemId, currentCantidad);

              return (
                <div key={field.id} className="flex flex-col gap-2 bg-white p-3 border border-slate-200 rounded-xl shadow-sm relative group hover:border-blue-300 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 w-full sm:w-auto">
                      <Controller
                        name={`ingredientes.${index}.item_id`}
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => {
                          const ingredientOptions = [];
                          if (insumos.length > 0) {
                            ingredientOptions.push({
                              label: 'Insumos Crudos',
                              options: insumos
                                .filter(i => i.activo !== false || watchIngredientes.some(ing => ing.item_id === `insumo_${i.id}`))
                                .map(insumo => ({
                                  value: `insumo_${insumo.id}`,
                                  label: `${insumo.nombre} ${insumo.activo === false ? '(Archivado)' : ''} (usa ${insumo.unidad_base})`
                                }))
                            });
                          }
                          if (subrecetas.length > 0) {
                            ingredientOptions.push({
                              label: 'Subrecetas (Lotes/Preparaciones)',
                              options: subrecetas.map(sub => ({
                                value: `subreceta_${sub.id}`,
                                label: `${sub.nombre} (Produce ${sub.rendimiento} u.)`
                              }))
                            });
                          }

                          return (
                            <CustomSelect
                              {...field}
                              onChange={(val) => {
                                field.onChange(val);
                                setTimeout(recalcularCostoTotal, 0);
                              }}
                              options={ingredientOptions}
                              placeholder="Selecciona un ingrediente..."
                            />
                          );
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="w-24 relative shrink-0">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Cant."
                          {...register(`ingredientes.${index}.cantidad_uso`, { 
                            required: true, 
                            min: 0.01,
                            onBlur: recalcularCostoTotal
                          })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm pr-10 bg-white"
                        />
                        <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold uppercase">
                          {unidadVisual}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          remove(index);
                          setTimeout(recalcularCostoTotal, 50); 
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0 ml-auto sm:ml-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {currentItemId && (
                    <div className="flex items-center text-xs justify-end pr-10 pt-1 mt-1 border-t border-slate-100">
                      <span className="text-slate-400 mr-3 flex items-center gap-1">
                          Costo Base: 
                          <span className="font-semibold text-slate-500">
                            ${obtenerCostoBaseItem(currentItemId).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / {unidadVisual}
                          </span>
                      </span>
                      <span className="text-slate-500 mr-2 flex items-center gap-1">
                          Subtotal:
                          <div className="relative flex items-center group/tooltip">
                            <Info size={12} className="text-slate-400 hover:text-blue-500 cursor-help" />
                            <div className="absolute bottom-full right-0 mb-1.5 w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-[100] text-left pointer-events-none shadow-lg normal-case font-normal leading-tight">
                                {currentItemId.startsWith('subreceta_') 
                                  ? 'Cálculo: (Costo Total de la Subreceta ÷ Su Rendimiento) × Cantidad usada.'
                                  : 'Cálculo: (Costo Base ÷ % Rendimiento Mermas) × Cantidad usada. (Ya asume el costo de la merma).'}
                            </div>
                          </div>
                      </span>
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
          Análisis de Costos y Rentabilidad
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-slate-400 text-xs">Costo Total (Lote)</p>
              <div className="relative flex items-center group/tooltip">
                <Info size={12} className="text-slate-500 hover:text-slate-300 cursor-help transition-colors" />
                <div className="absolute bottom-full left-0 mb-1.5 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-[100] text-center pointer-events-none shadow-lg normal-case font-normal leading-tight">
                    Costo de todos los ingredientes sumados (para fabricar la preparación completa).
                </div>
              </div>
            </div>
            <p className="text-xl font-bold text-slate-200">${costoCalculado.toFixed(2)}</p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-slate-400 text-xs">Costo Unitario</p>
              <div className="relative flex items-center group/tooltip">
                <Info size={12} className="text-slate-500 hover:text-slate-300 cursor-help transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-[100] text-center pointer-events-none shadow-lg normal-case font-normal leading-tight">
                    Costo exacto para fabricar 1 sola unidad (Costo Total ÷ {watchRendimiento}). Este es tu valor base.
                </div>
              </div>
            </div>
            <p className="text-xl font-bold text-rose-400">${costoUnitarioCalculado.toFixed(2)}</p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-slate-400 text-xs">Precio de Venta</p>
              <div className="relative flex items-center group/tooltip">
                <Info size={12} className="text-slate-500 hover:text-slate-300 cursor-help transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-[100] text-center pointer-events-none shadow-lg normal-case font-normal leading-tight">
                    El precio al que venderás 1 unidad. Te sugerimos multiplicarlo por 3 (Costo × 3) para garantizar un margen saludable (~66%) que cubra tus gastos operativos y deje ganancia.
                </div>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-2 top-1 text-slate-400 font-bold">$</span>
              <input
                type="number"
                step="0.5"
                readOnly={watchTipo === 'subreceta'}
                {...register('precio_venta', { required: 'Requerido', min: { value: 0, message: 'Min 0' } })}
                className={`w-full pl-6 pr-2 py-1 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white text-lg font-bold ${watchTipo === 'subreceta' ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
            {errors.precio_venta && <span className="text-red-400 text-xs mt-1 block">{errors.precio_venta.message}</span>}
            {watchTipo !== 'subreceta' && (
              <div 
                  className="text-[10px] font-bold text-emerald-400/80 mt-1.5 cursor-pointer hover:text-emerald-400 transition-colors flex justify-between"
                  onClick={() => setValue('precio_venta', (costoUnitarioCalculado * 3).toFixed(2), { shouldValidate: true })}
                  title="Haz clic para aplicar el precio sugerido automáticamente"
              >
                  <span>Sugerido (3x):</span>
                  <span>${(costoUnitarioCalculado * 3).toFixed(2)}</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-slate-400 text-xs">Margen Bruto</p>
              <div className="relative flex items-center group/tooltip">
                <Info size={12} className="text-slate-500 hover:text-slate-300 cursor-help transition-colors" />
                <div className="absolute bottom-full right-0 mb-1.5 w-52 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-[100] text-center pointer-events-none shadow-lg normal-case font-normal leading-tight">
                    Lo ideal es estar por encima del 65% para cubrir costos operativos (luz, gas, sueldos) y dejar ganancia.
                </div>
              </div>
            </div>
            <p className={`text-xl font-bold ${margen >= 65 ? 'text-emerald-400' : margen >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {margen.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Guardando...' : 'Guardar Receta'}
        </button>
      </div>
    </form>
  );
};
