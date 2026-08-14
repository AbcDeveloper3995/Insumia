import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingDown, TrendingUp, Package, Clock, Info, Lightbulb } from 'lucide-react';
import { insumosService } from '../../services/api/insumos';
import { LoadingSpinner } from '../ui/Loading';

export const KardexModal = ({ insumo, onClose }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMath, setSelectedMath] = useState(null);

  useEffect(() => {
    const fetchKardex = async () => {
      try {
        setLoading(true);
        const data = await insumosService.getKardex(insumo.id);
        setMovimientos(data || []);
      } catch (error) {
        console.error('Error fetching kardex:', error);
      } finally {
        setLoading(false);
      }
    };
    if (insumo?.id) fetchKardex();
  }, [insumo]);

  // KPIs
  const totalConsumido = movimientos.filter(m => m.tipo === 'venta' || m.tipo === 'merma').reduce((acc, m) => acc + Math.abs(Number(m.cantidad)), 0);
  const totalComprado = movimientos.filter(m => m.tipo === 'compra' || m.tipo === 'ajuste').reduce((acc, m) => acc + Number(m.cantidad), 0);
  
  // Costo por gramo actual (explicativo)
  const factor = Number(insumo.factor_conversion) || 1;
  const rend = Number(insumo.porcentaje_rendimiento) || 100;
  const costoGramo = (Number(insumo.costo_unidad_compra) / factor / (rend / 100));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-slate-50 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-white px-8 py-6 flex justify-between items-center border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
               <Package size={24} />
             </div>
             <div>
               <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                 Kardex: {insumo.nombre}
                 <div className="relative flex items-center group/tooltip mt-1">
                     <Info size={20} className="cursor-help text-blue-400 hover:text-blue-600 transition-colors" />
                     <div className="absolute top-full left-0 sm:left-0 mt-2 w-[300px] sm:w-[420px] max-h-[60vh] overflow-y-auto p-5 bg-white border border-slate-200 text-slate-600 text-[13px] rounded-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 shadow-2xl pointer-events-none font-normal leading-relaxed text-left custom-scrollbar">
                         <p className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 text-base flex items-center gap-2"><Lightbulb size={18} className="text-amber-500"/> Ingreso Bruto vs Ganancia Neta</p>
                         
                         <div className="space-y-2 mb-3">
                            <p><strong className="text-blue-600">Ingreso Bruto Aportado:</strong> El dinero total cobrado al cliente por la parte proporcional de este insumo en la venta, sin descontar lo que te costó comprarlo.</p>
                            <p><strong className="text-emerald-600">Ganancia Neta Líquida:</strong> El beneficio real obtenido. Es el ingreso bruto restándole estrictamente lo que te costó comprar este insumo.</p>
                         </div>

                         <p className="mb-2 text-slate-700 font-medium">Ejemplo de Referencia:</p>
                         <p className="mb-2">Imagina que un insumo cuesta $3.33 y hacer la receta completa cuesta $3.80. El insumo representa el <strong>87.7% del costo</strong>. Si vendes la receta en $10.00:</p>
                         <ul className="list-disc pl-5 mb-3 space-y-2">
                             <li><strong>Aquí en Detalles (Kardex):</strong> Vemos el <em>Ingreso Bruto</em>. El insumo aportó el 87.7% de esos $10.00 de venta = <strong className="text-blue-600">$8.77</strong>.</li>
                             <li><strong>En Resumen de Receta:</strong> Vemos la <em>Ganancia Neta</em>. La ganancia total fue $6.20 ($10 - $3.80), el insumo aportó el 87.7% de esos $6.20 = <strong className="text-emerald-600">$5.44</strong>.</li>
                         </ul>
                         <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 shrink-0 mt-3">
                           <p className="text-xs text-slate-500 font-mono">Cálculo: $8.77 (Ingreso) - $3.33 (Costo) = $5.44 (Ganancia Neta)</p>
                         </div>
                     </div>
                 </div>
               </h2>
               <p className="text-sm font-medium text-slate-500">Auditoría detallada de entradas, salidas e ingresos.</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
            {/* Explicación Matemática del Costo y Ganancia */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bloque 1: Costo */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 relative overflow-hidden group">
                  <div className="flex items-start gap-3 relative z-10">
                      <Info className="text-blue-500 mt-1 shrink-0" size={20} />
                      <div>
                          <h4 className="text-blue-900 font-bold mb-1">1. ¿Cómo se calcula el costo?</h4>
                          <p className="text-blue-800/80 text-sm leading-relaxed mb-3">
                              Tomamos el precio de compra (${Number(insumo.costo_unidad_compra).toFixed(2)} por {insumo.unidad_compra}) y lo dividimos entre tu factor de conversión ({insumo.factor_conversion}) y rendimiento ({insumo.porcentaje_rendimiento}%).
                          </p>
                          <div className="inline-flex bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-500 uppercase">Costo por 1 {insumo.unidad_base}:</span>
                                <div className="relative flex items-center group/tooltip">
                                  <Info size={14} className="text-slate-400 hover:text-blue-500 cursor-help" />
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-64 p-3 bg-slate-800 text-white text-[11px] rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 text-left pointer-events-none shadow-lg">
                                    <div className="font-bold mb-1.5 text-blue-300 border-b border-slate-600 pb-1">Desglose del Costo Real</div>
                                    <p className="mb-1">Costo Original: <strong>${(Number(insumo.costo_unidad_compra) / Math.max(Number(insumo.factor_conversion || 1), 1)).toFixed(4)}</strong> por {insumo.unidad_base}</p>
                                    <p>Ajuste por Merma ({insumo.porcentaje_rendimiento}%): <strong>${(Number(insumo.costo_unidad_compra) / Math.max(Number(insumo.factor_conversion || 1), 1) / (Math.max(Number(insumo.porcentaje_rendimiento || 100), 1) / 100)).toFixed(4)}</strong></p>
                                  </div>
                                </div>
                              </div>
                              <span className="text-sm font-black text-blue-700">${costoGramo.toFixed(4)}</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Bloque 2: Ingreso Proporcional */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 relative overflow-hidden group">
                  <div className="flex items-start gap-3 relative z-10">
                      <Lightbulb className="text-indigo-500 mt-1 shrink-0" size={20} />
                      <div>
                          <h4 className="text-indigo-900 font-bold mb-1">2. ¿De dónde sale el Ingreso Aportado?</h4>
                          <p className="text-indigo-800/80 text-sm leading-relaxed mb-3">
                              Es la parte de la venta que le corresponde a este insumo. Si la harina representa el <strong>15% del costo</strong> de cocinar un plato, entonces la harina es responsable del <strong>15% del dinero</strong> que pagó el cliente.
                          </p>
                          <div className="inline-flex bg-white px-3 py-2 rounded-lg border border-indigo-200 shadow-sm items-center gap-2">
                               <span className="text-[11px] font-bold text-slate-500 font-mono tracking-wider">FÓRMULA:</span>
                               <span className="text-[11px] font-bold text-indigo-700">(Costo del Insumo ÷ Costo de Receta) × Venta Total</span>
                          </div>
                      </div>
                  </div>
              </div>
            </div>

            {/* (KPIs removidos) */}

            {/* Tabla de Historial */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Historial de Movimientos</h3>
                </div>
                
                {loading ? (
                    <div className="h-40"><LoadingSpinner text="Cargando auditoría..." /></div>
                ) : movimientos.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 font-medium text-sm">
                        No hay movimientos registrados para este insumo.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha / Hora</th>
                                    <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detalle</th>
                                    <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Cant. ({insumo.unidad_base})</th>
                                    <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Valor / Ingreso</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {movimientos.map(mov => {
                                    const isPos = mov.cantidad > 0;
                                    return (
                                        <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                    <Clock size={12} />
                                                    {new Date(mov.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    {mov.tipo === 'venta' ? <TrendingDown size={14} className="text-blue-500 shrink-0" /> : <TrendingUp size={14} className="text-emerald-500 shrink-0" />}
                                                    <span className="text-sm font-bold text-slate-700">{mov.notas}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 block">{mov.tipo}</span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <span className={`text-base font-black ${isPos ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                    {isPos ? '+' : ''}{Number(mov.cantidad).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {mov.tipo === 'venta' ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1.5 mb-0.5">
                                                            Aportó
                                                            <Info size={13} className="text-sky-500 cursor-pointer hover:text-sky-700 transition-colors" onClick={(e) => { e.stopPropagation(); setSelectedMath(mov); }} />
                                                        </span>
                                                        <span className="text-sm font-black text-sky-600">+${Number(mov.ingreso_generado || 0).toFixed(2)}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Costó</span>
                                                        <span className="text-sm font-black text-slate-700">${Number(mov.costo_movimiento || 0).toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
      </motion.div>

      {/* Modal Matemático Explicativo */}
      {selectedMath && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedMath(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-sky-50 to-indigo-50 px-8 py-5 border-b border-sky-100 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                        <Lightbulb size={20} className="text-sky-500"/> Análisis de Ingreso Aportado
                    </h3>
                    <button onClick={() => setSelectedMath(null)} className="p-2 text-slate-400 hover:bg-white hover:shadow-sm hover:text-slate-700 rounded-full transition-all">
                        <X size={20}/>
                    </button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar text-slate-700 space-y-6">
                    {(() => {
                        let notas = selectedMath.notas || '';
                        let meta = null;
                        
                        // Parsear metadata oculta si existe
                        if (notas.includes('|META:')) {
                            try {
                                const parts = notas.split('|META:');
                                notas = parts[0];
                                meta = JSON.parse(parts[1]);
                            } catch (e) { console.error("Error parsing math meta:", e); }
                        }

                        // Extraer datos dinámicos básicos para fallback
                        let receta = 'esta receta';
                        let cant = 'varios';
                        const matchReceta = notas.match(/Consumido en \d+x (.*?)( \(incluye subrecetas\))?$/);
                        if (matchReceta) receta = matchReceta[1];
                        const matchCant = notas.match(/Consumido en (\d+)x/);
                        if (matchCant) cant = matchCant[1];

                        const costoStr = Number(selectedMath.costo_movimiento).toFixed(2);
                        const ingresoStr = Number(selectedMath.ingreso_generado).toFixed(2);

                        if (meta) {
                            // Cálculo exacto con todos los valores numéricos reales de la BD
                            const propFloat = Number(meta.costo_insumo_total) / (Number(meta.costo_receta_unitario) * Number(meta.cantidad_vendida));
                            const porcentaje = (propFloat * 100).toFixed(2);

                            return (
                                <>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-base mb-2">1. ¿Cuánto costó el insumo que va en esta orden?</h4>
                                        <p className="leading-relaxed">
                                            Sabemos que en este movimiento, el insumo representó un costo de <strong className="text-slate-800">${costoStr}</strong> para la receta de <em>{receta}</em>.
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-slate-800 text-base mb-3">2. ¿Cuál es el costo total y la proporción?</h4>
                                        <ul className="text-sm space-y-1.5 font-mono text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-3">
                                            <li>Costo de {receta} (1x): ~${Number(meta.costo_receta_unitario).toFixed(2)}</li>
                                            <li>Costo total de la orden ({cant}x): ~${(Number(meta.costo_receta_unitario) * Number(meta.cantidad_vendida)).toFixed(2)}</li>
                                            <li className="pt-2 mt-2 border-t border-slate-200 text-indigo-700 font-bold">
                                                Proporción: ${costoStr} / ${(Number(meta.costo_receta_unitario) * Number(meta.cantidad_vendida)).toFixed(2)} = {propFloat.toFixed(4)}
                                            </li>
                                        </ul>
                                        <p className="leading-relaxed">
                                            Esto significa que este insumo aporta el <strong className="text-slate-800">{porcentaje}%</strong> de la receta.
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-slate-800 text-base mb-2">3. Lo multiplicamos por la Venta Real</h4>
                                        <p className="leading-relaxed mb-3">
                                            Tú vendiste {cant} <em>{receta}</em>, cada uno a ${Number(meta.precio_venta_unitario).toFixed(2)}. Eso hizo entrar ${Number(meta.venta_total).toFixed(2)} a la caja. Como el insumo es responsable del {porcentaje}% de la receta, le damos el crédito correspondiente:
                                        </p>
                                        <div className="font-mono text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 text-center">
                                            ${Number(meta.venta_total).toFixed(2)} x {propFloat.toFixed(4)} = <strong className="text-slate-800">${ingresoStr}</strong>
                                        </div>
                                        <div>
                                            <span className="inline-flex px-3 py-1 bg-sky-100 text-sky-700 border border-sky-200 rounded-lg font-black text-sm tracking-wide">
                                                +${ingresoStr}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            );
                        }

                        // Fallback Text (Para ventas viejas que no tienen metadata guardada)
                        return (
                            <>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-base mb-2">1. ¿Cuánto costó el insumo que va en esta venta?</h4>
                                    <p className="leading-relaxed">
                                        Sabemos que en este movimiento, el insumo representó un costo exacto de <strong className="text-slate-800">${costoStr}</strong> para cocinar <strong>{cant}x {receta}</strong>. (Ese es el valor en dinero de este insumo que llevan estos platos).
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-800 text-base mb-2">2. ¿Cuál es el costo total y cómo calculamos la proporción?</h4>
                                    <p className="leading-relaxed">
                                        Para calcular el Ingreso Aportado, el sistema determinó qué porcentaje representan esos <strong className="text-slate-800">${costoStr}</strong> sobre el costo total de cocinar toda la orden de <strong>{receta}</strong>.
                                    </p>
                                    <p className="mt-2 bg-slate-50 p-3 rounded-xl text-sm border border-slate-100 text-slate-600 italic">
                                        Por ejemplo: Si el plato costara $10 y este insumo representara $2 de ese costo, significaría que el insumo aporta el 20% de la receta.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-800 text-base mb-2">3. Lo multiplicamos por la Venta Real</h4>
                                    <p className="leading-relaxed mb-3">
                                        Al tomar ese porcentaje de responsabilidad y multiplicarlo por el dinero total que cobraste por la orden, el sistema le da el crédito a este insumo por la cantidad de:
                                    </p>
                                    <div>
                                        <span className="inline-flex px-3 py-1 bg-sky-100 text-sky-700 border border-sky-200 rounded-lg font-black text-sm tracking-wide">
                                            +${ingresoStr}
                                        </span>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </motion.div>
        </div>
      )}
    </div>
  );
};
