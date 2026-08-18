import { useForm, Controller } from 'react-hook-form';
import { UNIDADES } from '../../constants';
import { useEffect, useState } from 'react';
import { Lock, Unlock, ShoppingCart, Plus } from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';

export const InsumoForm = ({ onSubmit, defaultValues = null, isLoading = false, proveedores = [], cajaActiva = null, onAddProveedor = null }) => {
  const { register, control, handleSubmit, watch, setValue, formState: { errors, isValid } } = useForm({
    mode: 'onChange',
    defaultValues: defaultValues || {
      nombre: '',
      unidad_compra: UNIDADES.KILOGRAMOS,
      unidad_base: UNIDADES.GRAMOS,
      factor_conversion: 1000,
      costo_unidad_compra: '',
      porcentaje_rendimiento: 100,
      cantidad_actual_base: '',
      umbral_minimo: '',
      dias_alerta_caducidad: 7
    }
  });

  const unidadCompra = watch('unidad_compra');
  const unidadBase = watch('unidad_base');
  
  // Estados
  const [bloquearReceta, setBloquearReceta] = useState(true);
  
  // Compra Inicial es obligatoria si es nuevo insumo
  const registrarCompra = !defaultValues;
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);
  const [nuevoProveedorNombre, setNuevoProveedorNombre] = useState('');

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
    // Convert empty strings to null and parse numbers to prevent Postgres 22P02 error
    const numericFields = [
      'factor_conversion',
      'costo_unidad_compra',
      'porcentaje_rendimiento',
      'cantidad_actual_base',
      'umbral_minimo',
      'dias_alerta_caducidad'
    ];
    
    numericFields.forEach(field => {
      if (data[field] === '' || data[field] === null || data[field] === undefined) {
        data[field] = 0;
      } else {
        data[field] = Number(data[field]);
      }
    });

    // Si es misma unidad forzamos 1
    if (data.unidad_compra === data.unidad_base) {
      data.factor_conversion = 1;
    }

    // Datos Base del Insumo
    const insumoData = {
      nombre: data.nombre,
      unidad_compra: data.unidad_compra,
      unidad_base: data.unidad_base,
      factor_conversion: data.factor_conversion,
      porcentaje_rendimiento: data.porcentaje_rendimiento,
      umbral_minimo: data.umbral_minimo,
      dias_alerta_caducidad: data.dias_alerta_caducidad
    };

    let compraData = null;
    if (registrarCompra) {
      compraData = {
        proveedor_id: data.proveedor_id,
        cantidad: Number(data.cantidad_compra),
        costo_total: Number(data.costo_total_compra),
        fecha_caducidad: data.fecha_caducidad_compra || null,
        pagarDeCaja: data.pagar_de_caja || false
      };
      // Validation for required purchase fields
      if (!compraData.proveedor_id) return alert('Selecciona un proveedor para la compra inicial.');
      if (!compraData.cantidad || compraData.cantidad <= 0) return alert('Ingresa una cantidad comprada válida.');
      if (!compraData.costo_total || compraData.costo_total < 0) return alert('Ingresa un costo de compra válido.');
    }

    onSubmit({ insumoData, compraData });
  };

  const handleSaveNuevoProveedor = async () => {
    if (!nuevoProveedorNombre.trim() || !onAddProveedor) return;
    try {
      const newProv = await onAddProveedor(nuevoProveedorNombre);
      if (newProv) {
        setValue('proveedor_id', newProv.id, { shouldValidate: true });
        setIsCreatingProvider(false);
        setNuevoProveedorNombre('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Watch for dynamic calculation
  const watchCantidadCompra = watch('cantidad_compra');
  const watchCostoTotalCompra = watch('costo_total_compra');

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* SECCIÓN 1: DATOS BÁSICOS */}
      <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
          <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
          Identificación y Medidas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-12">
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Insumo</label>
            <input
              {...register('nombre', { required: 'El nombre es requerido' })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              placeholder="Ej. Leche Entera"
            />
            {errors.nombre && <span className="text-red-500 text-xs font-medium mt-1 block">{errors.nombre.message}</span>}
          </div>

          <div className="md:col-span-6">
            <label className="block text-xs font-bold text-slate-700 mb-1">Presentación de Compra</label>
            <span className="text-[10px] text-slate-500 block mb-1.5 leading-tight">¿Cómo se lo compras al proveedor?</span>
            <Controller
              name="unidad_compra"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  {...field}
                  options={Object.values(UNIDADES).map(u => ({ value: u, label: u.toUpperCase() }))}
                />
              )}
            />
          </div>

          <div className="md:col-span-6">
            <div className="flex justify-between items-start mb-1 gap-2">
              <label className="block text-xs font-bold text-slate-700">Unidad de Receta</label>
              <button 
                type="button" 
                onClick={() => setBloquearReceta(!bloquearReceta)}
                className={`shrink-0 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest transition-colors cursor-pointer px-1.5 py-0.5 rounded border ${bloquearReceta ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                title={bloquearReceta ? "Desbloquear para cambiar manualmente" : "Bloquear (Auto-selección)"}
              >
                {bloquearReceta ? <Lock size={10} /> : <Unlock size={10} />}
                <span>{bloquearReceta ? 'Auto' : 'Manual'}</span>
              </button>
            </div>
            <span className="text-[10px] text-slate-500 block mb-1.5 leading-tight">¿Cómo lo mides para cocinar?</span>
            <Controller
              name="unidad_base"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  {...field}
                  disabled={bloquearReceta}
                  options={Object.values(UNIDADES).map(u => ({ value: u, label: u.toUpperCase() }))}
                />
              )}
            />
          </div>

          {/* Factor de Conversión Integrado */}
          <div className="md:col-span-12 mt-2">
            {mismaUnidad ? (
              <div className="text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>Compra y uso en misma unidad (<span className="font-bold">{unidadBase}</span>). Factor: <span className="font-black text-blue-600">1</span></span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-bold">Directo</span>
              </div>
            ) : (
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ¿A cuántos {unidadBase} equivale 1 {unidadCompra}?
                  </label>
                  <span className="text-[10px] text-slate-500 block leading-tight">Ej. Si 1 Caja = 10 Litros y usas Ml, pon 10000.</span>
                </div>
                <div className="relative w-40 shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    {...register('factor_conversion', { required: true, min: 0.01 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 text-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs pointer-events-none">
                    {unidadBase}/{unidadCompra}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: CONTROL Y COMPRA INICIAL */}
      <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-800 text-base flex items-center gap-3 border-b border-slate-200 pb-3">
          <span className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
          {registrarCompra ? 'Primera Compra y Control de Stock' : 'Parámetros de Control'}
        </h3>

        {/* Compra Inicial Obligatoria */}
        {registrarCompra && (
          <div className="space-y-6 pt-2">
            {/* Proveedor */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">¿A quién le compraste este primer lote?</label>
              {isCreatingProvider ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Nombre del proveedor..."
                    value={nuevoProveedorNombre}
                    onChange={e => setNuevoProveedorNombre(e.target.value)}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base"
                  />
                  <button 
                    type="button" 
                    onClick={handleSaveNuevoProveedor}
                    disabled={!nuevoProveedorNombre.trim()}
                    className="bg-emerald-100 text-emerald-700 px-5 py-3 rounded-xl font-bold text-sm hover:bg-emerald-200 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Guardar
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsCreatingProvider(false)}
                    className="bg-slate-100 text-slate-600 px-5 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <Controller
                  name="proveedor_id"
                  control={control}
                  rules={{ required: 'Obligatorio' }}
                  render={({ field }) => (
                    <CustomSelect
                      {...field}
                      onChange={(val) => {
                        if (val === 'NEW') {
                          setIsCreatingProvider(true);
                          field.onChange('');
                        } else {
                          field.onChange(val);
                        }
                      }}
                      options={[
                        { value: '', label: '-- Seleccionar Proveedor --' },
                        ...proveedores.map(p => ({ value: p.id, label: p.nombre })),
                        { value: 'NEW', label: '+ Añadir nuevo proveedor...' }
                      ]}
                    />
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Cantidad Comprada</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register('cantidad_compra', { required: true })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none pr-16 text-base font-bold text-slate-800"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 uppercase pointer-events-none">
                    {unidadCompra}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Costo Total ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('costo_total_compra', { required: true })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Caducidad (Opcional)</label>
                <input
                  type="date"
                  {...register('fecha_caducidad_compra')}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base text-slate-700 font-medium"
                />
              </div>
            </div>

            {watchCantidadCompra && watchCostoTotalCompra && (
              <div className="bg-white px-4 py-3 border border-slate-200 rounded-xl text-slate-600 inline-flex items-center gap-2 w-full text-sm">
                <Calculator size={16} className="text-blue-500 shrink-0" />
                Costo calculado: <span className="font-bold text-slate-800 text-base">${(Number(watchCostoTotalCompra)/Number(watchCantidadCompra)).toFixed(2)}</span> / {unidadCompra}
              </div>
            )}
          </div>
        )}

        {/* Separador solo si hay compra inicial */}
        {registrarCompra && <div className="border-t border-slate-200 my-6" />}

        {/* Alertas y Rendimiento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">% Rendimiento (Mermas)</label>
            <div className="relative">
              <input
                type="number"
                {...register('porcentaje_rendimiento', { required: true, min: 1, max: 100 })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 text-base"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">%</div>
            </div>
            <span className="text-[11px] text-slate-500 mt-1.5 block font-medium">Útil tras limpiar desperdicios</span>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Alerta Stock Mínimo</label>
            <div className="relative">
              <input
                type="number"
                {...register('umbral_minimo', { required: true, min: 0 })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 text-base"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[11px] pointer-events-none uppercase">{unidadBase}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Aviso Caducidad</label>
            <div className="relative">
              <input
                type="number"
                {...register('dias_alerta_caducidad', { required: true, min: 1 })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 text-base"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold pointer-events-none text-sm">días antes</div>
            </div>
          </div>
        </div>

        {/* Switch de pago movido al final */}
        {registrarCompra && (
          <div className="pt-2">
            <div className={`w-full p-4 rounded-xl flex items-center justify-between gap-4 border ${!cajaActiva ? 'bg-slate-50 border-slate-200' : 'bg-blue-50/50 border-blue-200'}`}>
              <div>
                <p className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  Pagar Inmediatamente (Opcional)
                  {!cajaActiva && <span className="bg-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-widest">Caja Cerrada</span>}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {cajaActiva ? 'Se descontará el dinero de la caja activa. Si lo dejas apagado, se guardará como Cuenta por Pagar.' : 'No puedes pagar porque la caja está cerrada. Se guardará como Cuenta por Pagar.'}
                </p>
              </div>
              <label className={`relative inline-flex items-center shrink-0 ${!cajaActiva ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                <input type="checkbox" disabled={!cajaActiva} {...register('pagar_de_caja')} className="sr-only peer" />
                <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="pt-6 flex justify-end">
        <button
          type="submit"
          disabled={isLoading || !isValid}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
        >
          {registrarCompra ? <ShoppingCart size={18} /> : null}
          {isLoading ? 'Guardando...' : (registrarCompra ? 'Crear Insumo y Comprar' : 'Actualizar Insumo')}
        </button>
      </div>
    </form>
  );
};
