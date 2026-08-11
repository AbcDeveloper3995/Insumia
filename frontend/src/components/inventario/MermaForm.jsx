import { useState, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Plus, Trash2, X, Calculator, Info, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { CustomSelect } from '../ui/CustomSelect';

export const MermaForm = ({ insumos, recetas, onClose, onSubmit, isLoading = false }) => {
  const [costoCalculado, setCostoCalculado] = useState(0);

  // Combinar insumos y subrecetas para el selector
  const availableItems = useMemo(() => {
    const items = [];
    
    // Insumos crudos
    insumos.forEach(i => {
      items.push({
        id: `insumo_${i.id}`,
        realId: i.id,
        nombre: i.nombre,
        tipo: 'insumo',
        unidad: i.unidad_base,
        // Calcular costo exacto de la unidad base (ej: 1 kg)
        costoBase: (Number(i.costo_unidad_compra) / Number(i.factor_conversion)) / (Number(i.porcentaje_rendimiento) / 100)
      });
    });

    // Recetas / Subrecetas
    recetas.forEach(r => {
      items.push({
        id: `receta_${r.id}`,
        realId: r.id,
        nombre: r.nombre,
        tipo: 'receta',
        unidad: 'unid.',
        // El costo unitario de la receta
        costoBase: (Number(r.costo_total) || 0) / (Number(r.rendimiento) || 1)
      });
    });

    // Ordenar alfabéticamente
    return items.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [insumos, recetas]);

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      notas: '',
      detalles: [{ item_id: '', cantidad: '', motivo: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'detalles'
  });

  const watchDetalles = watch('detalles');

  // Recalcular el costo total de la pérdida
  const calcularPerdida = () => {
    let total = 0;
    (watchDetalles || []).forEach(det => {
      if (det.item_id && det.cantidad) {
        const item = availableItems.find(i => i.id === det.item_id);
        if (item) {
          total += (item.costoBase * Number(det.cantidad));
        }
      }
    });
    return total;
  };

  const totalPerdida = calcularPerdida();

  const handleFormSubmit = (data) => {
    // Formatear los detalles para la API
    const detallesFormateados = data.detalles.map(det => {
      const item = availableItems.find(i => i.id === det.item_id);
      return {
        item_id: item.realId,
        tipo_item: item.tipo,
        cantidad: Number(det.cantidad),
        motivo: det.motivo
      };
    });

    onSubmit({
      detalles: detallesFormateados,
      notas: data.notas
    });
  };

  const motivosGenerales = [
    'Se quemó / Exceso de cocción',
    'Caducidad / Fecha vencida',
    'Error en la preparación',
    'Contaminación cruzada',
    'Caída al piso',
    'Degustación / Consumo Personal',
    'Defecto de proveedor'
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="px-8 py-6 flex justify-between items-center border-b border-slate-100 bg-rose-50/50 rounded-t-3xl shrink-0">
          <div>
            <h2 className="text-2xl font-black text-rose-600 flex items-center gap-2">
              <AlertTriangle size={24} />
              Registrar Merma
            </h2>
            <p className="text-sm font-medium text-rose-500/70 mt-1">Declara insumos o preparaciones desperdiciadas</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form id="merma-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">Ítems Desperdiciados</h3>
                <button
                  type="button"
                  onClick={() => append({ item_id: '', cantidad: '', motivo: '' })}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 text-blue-600 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Añadir Ítem</span>
                </button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => {
                  const currentItemId = watchDetalles[index]?.item_id;
                  const selectedItem = availableItems.find(i => i.id === currentItemId);

                  return (
                    <div key={field.id} className="flex gap-3 items-start bg-white p-3 rounded-lg border border-slate-200 relative group">
                      
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Insumo o Subreceta</label>
                        <Controller
                          name={`detalles.${index}.item_id`}
                          control={control}
                          rules={{ required: 'Requerido' }}
                          render={({ field }) => (
                            <CustomSelect
                              {...field}
                              options={availableItems.map(item => ({
                                value: item.id,
                                label: `${item.nombre} ${item.tipo === 'receta' ? '(Subreceta)' : ''}`
                              }))}
                            />
                          )}
                        />
                        {errors.detalles?.[index]?.item_id && <span className="text-red-500 text-xs mt-1 block">Requerido</span>}
                      </div>

                      <div className="w-32">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Cantidad</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            {...register(`detalles.${index}.cantidad`, { required: 'Requerido', min: 0.01 })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder="0.00"
                          />
                          {selectedItem && (
                            <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold uppercase mt-0.5">
                              {selectedItem.unidad}
                            </span>
                          )}
                        </div>
                        {errors.detalles?.[index]?.cantidad && <span className="text-red-500 text-xs mt-1 block">Requerido</span>}
                      </div>

                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Motivo</label>
                        <input
                          type="text"
                          list="motivos-list"
                          {...register(`detalles.${index}.motivo`, { required: 'Requerido' })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          placeholder="Ej: Se quemó..."
                        />
                        <datalist id="motivos-list">
                          {motivosGenerales.map((m, i) => <option key={i} value={m} />)}
                        </datalist>
                        {errors.detalles?.[index]?.motivo && <span className="text-red-500 text-xs mt-1 block">Requerido</span>}
                      </div>

                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="mt-6 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notas Adicionales (Opcional)</label>
              <textarea
                {...register('notas')}
                rows="2"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Detalles sobre quién lo reportó o información extra..."
              ></textarea>
            </div>

          </form>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-between items-center shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium uppercase tracking-widest mb-1">
               <Calculator size={14} /> Pérdida Financiera Calculada
            </div>
            <p className="text-3xl font-black text-rose-600 leading-none">
              ${totalPerdida.toFixed(2)}
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              form="merma-form"
              type="submit"
              disabled={isLoading || watchDetalles.length === 0}
              className="px-6 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-sm shadow-rose-200 flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? 'Registrando...' : 'Registrar Merma'}
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
