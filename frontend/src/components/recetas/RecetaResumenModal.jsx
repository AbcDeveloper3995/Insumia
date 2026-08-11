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
      <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.2 }} className="bg-slate-50 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-white/20">
        
        {/* Header Compacto */}
        <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shadow-sm border border-blue-100">
               <PieChart size={18} />
             </div>
             <div>
               <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                 Resumen Financiero: {receta.nombre}
                 <div className="relative flex items-center group/tooltip">
                     <Info size={16} className="cursor-help text-blue-400 hover:text-blue-600 transition-colors" />
                     <div className="absolute top-full left-0 md:left-auto md:right-0 mt-2 w-[280px] sm:w-[380px] max-h-[60vh] overflow-y-auto p-4 bg-slate-800 border border-slate-700 text-slate-300 text-[11px] rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-[60] shadow-2xl pointer-events-none font-normal leading-relaxed text-left custom-scrollbar">
                         <p className="font-bold text-white mb-2 border-b border-slate-700 pb-2 text-sm flex items-center gap-2"><Lightbulb size={14} className="text-amber-400"/> Ganancia Proporcional</p>
                         <p className="mb-2">La <strong className="text-emerald-400">Ganancia Generada</strong> se calcula exactamente con el mismo porcentaje que el ingrediente representa en tu costo total.</p>
                         <p className="mb-2">Es decir: si la carne representa el 50% de lo que te cuesta armar la hamburguesa, entonces se asume que la carne es responsable de "generar" el 50% de tu ganancia libre.</p>
                         <div className="bg-slate-900 p-2 rounded-lg border border-slate-700 mt-2">
                           <p className="text-[10px] font-mono text-slate-400">Ganancia Aportada = Ganancia Total × % de Impacto en Costo</p>
                         </div>
                     </div>
                 </div>
               </h2>
             </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/80 custom-scrollbar">
            
            {/* KPIs Globales - Mini Cards */}
            <div className={`grid ${(!isSubreceta || precioVenta > 0) ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'} gap-3 mb-6`}>
                   
                   <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                          <Calculator size={12} /> <span className="text-[9px] font-bold uppercase tracking-widest">{isSubreceta ? 'Costo (1 un.)' : 'Costo Total'}</span>
                          {isSubreceta && <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-bold ml-auto text-slate-500">Lote: ${costoTotalCalculado.toFixed(2)}</span>}
                      </div>
                      <h3 className="text-lg font-black text-rose-500 tracking-tight">${costoUnitarioCalculado.toFixed(2)}</h3>
                   </div>

                   {(!isSubreceta || precioVenta > 0) && (
                     <>
                       <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 flex flex-col justify-center">
                          <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                              <DollarSign size={12} /> <span className="text-[9px] font-bold uppercase tracking-widest">Precio Venta</span>
                          </div>
                          <h3 className="text-lg font-black text-slate-800 tracking-tight">${precioVenta.toFixed(2)}</h3>
                       </div>

                       <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 flex flex-col justify-center">
                          <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                              <TrendingUp size={12} /> <span className="text-[9px] font-bold uppercase tracking-widest">Ganancia Neta</span>
                          </div>
                          <h3 className="text-lg font-black text-emerald-600 tracking-tight">${gananciaTotal.toFixed(2)}</h3>
                       </div>

                       <div className={`border shadow-sm rounded-xl p-3 flex flex-col justify-center ${isRentable ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                          <div className={`flex items-center gap-1.5 mb-1 ${isRentable ? 'text-emerald-600' : 'text-red-600'}`}>
                              <PieChart size={12} /> <span className="text-[9px] font-bold uppercase tracking-widest">Margen (FC)</span>
                          </div>
                          <h3 className={`text-lg font-black tracking-tight ${isRentable ? 'text-emerald-700' : 'text-red-700'}`}>{margenTotal.toFixed(1)}%</h3>
                       </div>
                     </>
                   )}
            </div>

            {/* Header Lista */}
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ChefHat size={14} className="text-slate-400" /> Desglose Analítico por Insumo
              </h3>
            </div>
            
            {/* Lista Minimalista de Insumos */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {desgloseIngredientes.map((item, idx) => {
                    const participacionCosto = costoTotalCalculado > 0 ? (item.costo / costoTotalCalculado) : 0;
                    const gananciaAportada = gananciaTotal * participacionCosto;

                    return (
                        <div key={idx} className="p-4 sm:p-5 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row items-center gap-4 md:gap-8 group">
                            
                            {/* Info */}
                            <div className="flex-1 w-full flex flex-col justify-center">
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
                                  {item.insumo.nombre}
                                  {item.isSubreceta && <span className="text-[8px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Subreceta</span>}
                                </h4>
                                <div className="text-[11px] font-medium text-slate-400">
                                    <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 text-slate-500 group-hover:bg-white transition-colors">Cantidad: {item.cantidad} {item.insumo.unidad_base}</span>
                                </div>
                            </div>

                            {/* Barras Financieras */}
                            <div className="flex flex-col sm:flex-row items-center gap-5 w-full md:w-auto">
                                
                                {/* Impacto Costo */}
                                <div className="w-full sm:w-36 flex flex-col items-end">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 w-full text-right">Costo / Impacto</span>
                                    <div className="flex items-end justify-end gap-2 w-full">
                                        <span className="text-[11px] font-bold text-slate-400">{(participacionCosto * 100).toFixed(1)}%</span>
                                        <span className="text-sm font-black text-rose-500">${item.costo.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5 flex justify-end overflow-hidden">
                                        <motion.div 
                                          initial={{ width: 0 }} 
                                          animate={{ width: `${Math.min(participacionCosto * 100, 100)}%` }} 
                                          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                                          className="bg-rose-400 h-full rounded-full" 
                                        />
                                    </div>
                                </div>

                                {/* Ganancia */}
                                {(!isSubreceta || precioVenta > 0) && (
                                    <div className="w-full sm:w-36 flex flex-col items-end">
                                        <span className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-widest mb-1 w-full text-right">Ganancia Generada</span>
                                        <div className="flex items-end justify-end gap-2 w-full">
                                            <span className="text-[11px] font-bold text-emerald-400">aporta</span>
                                            <span className="text-sm font-black text-emerald-600">${gananciaAportada.toFixed(2)}</span>
                                        </div>
                                        <div className="w-full bg-emerald-50 rounded-full h-1 mt-1.5 flex justify-end overflow-hidden">
                                            <motion.div 
                                              initial={{ width: 0 }} 
                                              animate={{ width: `${Math.min(participacionCosto * 100, 100)}%` }} 
                                              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                                              className="bg-emerald-500 h-full rounded-full" 
                                            />
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    );
                })}

                {desgloseIngredientes.length === 0 && (
                    <div className="text-center p-8 text-slate-400 text-sm bg-slate-50/50 flex flex-col items-center">
                        <ChefHat size={32} className="mb-2 opacity-50" />
                        <p>Esta receta no tiene ingredientes configurados.</p>
                    </div>
                )}
            </div>
        </div>
      </motion.div>
    </div>
  );
};

