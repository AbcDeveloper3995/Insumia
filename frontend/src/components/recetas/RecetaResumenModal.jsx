import { motion } from 'framer-motion';
import { X, PieChart, TrendingUp, ChefHat, DollarSign, Calculator, Info, Lightbulb } from 'lucide-react';

export const RecetaResumenModal = ({ receta, insumos, recetas = [], onClose }) => {
  if (!receta) return null;

  const precioVenta = Number(receta.precio_venta) || 0;
  
  // Calcular el costo real reconstruyéndolo desde los insumos y subrecetas actuales
  let costoTotalCalculado = 0;
  const desgloseIngredientes = (receta.ingredientes || []).map(ing => {
    if (ing.insumo_id) {
      const insumoRef = insumos.find(i => i.id === ing.insumo_id);
      if (!insumoRef) return null;

      const costoBase = Number(insumoRef.costo_unidad_compra) / Number(insumoRef.factor_conversion);
      const costoReal = costoBase / (Number(insumoRef.porcentaje_rendimiento) / 100);
      const costoAportado = costoReal * Number(ing.cantidad_uso || ing.cantidad);

      costoTotalCalculado += costoAportado;

      return {
        insumo: insumoRef,
        isSubreceta: false,
        cantidad: ing.cantidad_uso || ing.cantidad,
        costo: costoAportado
      };
    } else if (ing.subreceta_id) {
      const subRef = recetas.find(r => r.id === ing.subreceta_id);
      if (!subRef) return null;

      const rendimientoSub = Number(subRef.rendimiento) || 1;
      const costoUnitarioSub = (Number(subRef.costo_total) || 0) / rendimientoSub;
      const costoAportado = costoUnitarioSub * Number(ing.cantidad_uso || ing.cantidad);

      costoTotalCalculado += costoAportado;

      return {
        insumo: { nombre: subRef.nombre, unidad_base: 'unid.' },
        isSubreceta: true,
        cantidad: ing.cantidad_uso || ing.cantidad,
        costo: costoAportado
      };
    }
    return null;
  }).filter(Boolean);

  const isSubreceta = receta.tipo === 'subreceta';
  const rendimiento = Number(receta.rendimiento) || 1;
  const costoUnitarioCalculado = costoTotalCalculado / rendimiento;

  const gananciaTotal = precioVenta - costoUnitarioCalculado;
  const margenTotal = precioVenta > 0 ? (gananciaTotal / precioVenta) * 100 : 0;
  const isRentable = margenTotal >= 50; // Regla del 50%

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-slate-50 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-white px-8 py-6 flex justify-between items-center border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
               <PieChart size={24} />
             </div>
             <div>
               <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                 Resumen Financiero: {receta.nombre}
                 <div className="relative flex items-center group/tooltip mt-1">
                     <Info size={20} className="cursor-help text-blue-400 hover:text-blue-600 transition-colors" />
                     <div className="absolute top-full right-0 mt-2 w-[300px] sm:w-[420px] max-h-[60vh] overflow-y-auto p-5 bg-white border border-slate-200 text-slate-600 text-[13px] rounded-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-[60] shadow-2xl pointer-events-none font-normal leading-relaxed text-left custom-scrollbar">
                         <p className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 text-base flex items-center gap-2"><Lightbulb size={18} className="text-amber-500"/> Ganancia Neta vs Ingreso Bruto</p>
                         
                         <div className="space-y-2 mb-3">
                            <p><strong className="text-emerald-600">Ganancia Neta Líquida:</strong> El beneficio real obtenido. Es el ingreso bruto restándole estrictamente lo que te costó comprar este insumo.</p>
                            <p><strong className="text-blue-600">Ingreso Bruto Aportado:</strong> El dinero total cobrado al cliente por la parte proporcional de este insumo en la venta, sin descontar lo que te costó comprarlo.</p>
                         </div>

                         <p className="mb-2 text-slate-700 font-medium">Ejemplo de Referencia:</p>
                         <p className="mb-2">Imagina que un insumo cuesta $3.33 y hacer la receta completa cuesta $3.80. El insumo representa el <strong>87.7% del costo</strong>. Si vendes la receta en $10.00:</p>
                         <ul className="list-disc pl-5 mb-3 space-y-2">
                             <li><strong>Aquí en Resumen (Ganancia Neta):</strong> Vemos la <em>Ganancia Neta</em>. La ganancia total fue $6.20 ($10 - $3.80), el insumo aportó el 87.7% de esos $6.20 = <strong className="text-emerald-600">$5.44</strong>.</li>
                             <li><strong>En Detalles de Insumo (Kardex):</strong> Allá verás el <em>Ingreso Bruto</em>. El insumo aportó el 87.7% de esos $10.00 de venta = <strong className="text-blue-600">$8.77</strong>.</li>
                         </ul>
                         <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 shrink-0 mt-3">
                           <p className="text-xs text-slate-500 font-mono">Cálculo: $8.77 (Ingreso) - $3.33 (Costo) = $5.44 (Ganancia Neta)</p>
                         </div>
                     </div>
                 </div>
               </h2>
               <p className="text-sm font-medium text-slate-500">Desglose de rentabilidad por insumo.</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
            
            {/* KPIs Globales */}
            <div className={`grid grid-cols-1 md:grid-cols-${(!isSubreceta || precioVenta > 0) ? '4' : '1'} gap-4 mb-8`}>
               <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2 text-slate-500">
                      <div className="flex items-center gap-2">
                          <Calculator size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest">{isSubreceta ? 'Costo 1 Unid' : 'Costo Total'}</span>
                      </div>
                      {isSubreceta && (
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold" title="Costo total de producir el lote">Lote: ${costoTotalCalculado.toFixed(2)}</span>
                      )}
                  </div>
                  <h3 className="text-2xl font-black text-rose-500">${costoUnitarioCalculado.toFixed(2)}</h3>
               </div>

               {(!isSubreceta || precioVenta > 0) && (
                 <>
                   <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-2 mb-2 text-slate-500">
                          <DollarSign size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest">Precio Venta</span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-800">${precioVenta.toFixed(2)}</h3>
                   </div>

                   <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-2 mb-2 text-slate-500">
                          <TrendingUp size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest">Ganancia</span>
                      </div>
                      <h3 className="text-2xl font-black text-emerald-600">${gananciaTotal.toFixed(2)}</h3>
                   </div>

                   <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${isRentable ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                      <div className={`flex items-center gap-2 mb-2 ${isRentable ? 'text-emerald-700' : 'text-red-700'}`}>
                          <PieChart size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest">Margen (FC)</span>
                      </div>
                      <h3 className={`text-2xl font-black ${isRentable ? 'text-emerald-700' : 'text-red-700'}`}>{margenTotal.toFixed(1)}%</h3>
                   </div>
                 </>
               )}
            </div>

            {/* Lista Bento de Insumos */}
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ChefHat size={18} className="text-blue-600" /> Desglose de Insumos
            </h3>
            
            <div className="space-y-4">
                {desgloseIngredientes.map((item, idx) => {
                    const participacionCosto = costoTotalCalculado > 0 ? (item.costo / costoTotalCalculado) : 0;
                    const gananciaAportada = gananciaTotal * participacionCosto;

                    return (
                        <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                            
                            {/* Insumo Info */}
                            <div className="flex-1 w-full">
                                <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                                  {item.insumo.nombre}
                                  {item.isSubreceta && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Subreceta</span>}
                                </h4>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                    <span className="bg-slate-100 px-2 py-1 rounded-md">Usa: {item.cantidad} {item.insumo.unidad_base}</span>
                                </div>
                            </div>

                            {/* Contribución al Costo */}
                            <div className="w-full md:w-48 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Impacto en Costo</p>
                                <div className="flex items-end justify-between">
                                    <span className="text-lg font-black text-rose-500">${item.costo.toFixed(2)}</span>
                                    <span className="text-xs font-bold text-slate-400 mb-1">{(participacionCosto * 100).toFixed(1)}%</span>
                                </div>
                                {/* Progress bar */}
                                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                                    <div className="bg-rose-400 h-1.5 rounded-full" style={{ width: `${Math.min(participacionCosto * 100, 100)}%` }}></div>
                                </div>
                            </div>

                            {/* Contribución a Ganancia */}
                            {(!isSubreceta || precioVenta > 0) && (
                                <div className="w-full md:w-48 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                                    <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mb-1">Ganancia Generada</p>
                                    <div className="flex items-end justify-between">
                                        <span className="text-lg font-black text-emerald-600">${gananciaAportada.toFixed(2)}</span>
                                        <span className="text-xs font-bold text-emerald-500 mb-1">aporta</span>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="w-full bg-emerald-200/50 rounded-full h-1.5 mt-2 overflow-hidden">
                                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(participacionCosto * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {desgloseIngredientes.length === 0 && (
                    <div className="text-center p-10 text-slate-400 font-medium bg-white rounded-2xl border border-dashed border-slate-200">
                        Esta receta no tiene ingredientes configurados.
                    </div>
                )}
            </div>

        </div>
      </motion.div>
    </div>
  );
};
