import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingDown, TrendingUp, Package, Clock, Info, Lightbulb } from 'lucide-react';
import { insumosService } from '../../services/api/insumos';
import { LoadingSpinner } from '../ui/Loading';

export const KardexModal = ({ insumo, onClose }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const gananciaGenerada = movimientos.filter(m => m.tipo === 'venta').reduce((acc, m) => acc + Number(m.ingreso_generado || 0), 0);
  
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
               <h2 className="text-2xl font-black text-slate-800">Kardex: {insumo.nombre}</h2>
               <p className="text-sm font-medium text-slate-500">Auditoría detallada de entradas, salidas y ganancias.</p>
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
                              <span className="text-xs font-bold text-slate-500 uppercase">Costo por 1 {insumo.unidad_base}:</span>
                              <span className="text-sm font-black text-blue-700">${costoGramo.toFixed(4)}</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Bloque 2: Ganancia Proporcional */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 relative overflow-hidden group">
                  <div className="flex items-start gap-3 relative z-10">
                      <Lightbulb className="text-indigo-500 mt-1 shrink-0" size={20} />
                      <div>
                          <h4 className="text-indigo-900 font-bold mb-1">2. ¿Qué es la Ganancia Generada?</h4>
                          <p className="text-indigo-800/80 text-sm leading-relaxed">
                              Es una <strong>distribución proporcional</strong>. Si en una hamburguesa el Tomate representa el <strong>10% del costo total</strong> de hacerla, entonces cuando vendas esa hamburguesa, diremos que el Tomate "aportó" el <strong>10% del dinero de esa venta</strong>. Así descubres qué ingredientes te hacen ganar más dinero.
                          </p>
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
                                    <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Valor / Ganancia</th>
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
                                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Aportó</span>
                                                        <span className="text-sm font-black text-sky-600">+${Number(mov.ingreso_generado || 0).toFixed(2)}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Costó</span>
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
    </div>
  );
};
