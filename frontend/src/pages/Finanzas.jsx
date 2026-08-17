import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { cajaService } from '../services/api/caja';
import { motion } from 'framer-motion';
import { Building, AlertTriangle, ShoppingCart, ArrowRightLeft, Clock, DollarSign, TrendingDown, TrendingUp, CalendarDays, CheckCircle2, Wallet, CreditCard, Banknote, Info } from 'lucide-react';
import { supabase } from '../services/api/client';
import { LoadingSpinner } from '../components/ui/Loading';
import { useTour } from '../context/TourContext';

export const Finanzas = () => {
  const { session, currentRestaurant } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [cajaActiva, setCajaActiva] = useState(null);
  const [movimientosActivos, setMovimientosActivos] = useState([]);
  const [cajasHistoricas, setCajasHistoricas] = useState([]);
  const [stats, setStats] = useState({
    cuentasPorPagar: 0,
    descuadreHistorico: 0,
    inversionTotal: 0
  });

  const loadData = async () => {
    try {
      setLoading(true);
      if (!session?.user?.id) return;
      
      const restauranteId = currentRestaurant?.id;
      if (!restauranteId) return;

      // 1. Cargar Caja Activa y sus movimientos
      const caja = await cajaService.getCajaAbierta(restauranteId);
      setCajaActiva(caja);
      if (caja) {
        const movs = await cajaService.getMovimientos(caja.id);
        setMovimientosActivos(movs || []);
      } else {
        setMovimientosActivos([]);
      }

      // 2. Cargar KPIs Globales (Compras)
      const { data: comprasData } = await supabase.from('compras').select('total, estado').eq('restaurante_id', restauranteId);
      
      let cuentasPorPagar = 0;
      let inversionTotal = 0;
      comprasData?.forEach(c => {
         const tot = Number(c.total) || 0;
         inversionTotal += tot;
         if (c.estado === 'pendiente') {
            cuentasPorPagar += tot;
         }
      });

      // 3. Cargar Histórico de Turnos (Cajas cerradas y en curso)
      const { data: cajasData } = await supabase.from('cajas').select('*').eq('restaurante_id', restauranteId).order('created_at', { ascending: false }).limit(30);
      
      let descuadre = 0;
      cajasData?.forEach(c => {
          if (c.estado === 'cerrada') {
              descuadre += (Number(c.monto_final_real) || 0) - (Number(c.monto_final_esperado) || 0);
          }
      });

      setCajasHistoricas(cajasData || []);
      setStats({ cuentasPorPagar, descuadreHistorico: descuadre, inversionTotal });

    } catch (error) {
      console.error('Error al cargar finanzas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) loadData();
  }, [session?.user?.id]);

  const { registerPageTour } = useTour();

  useEffect(() => {
    registerPageTour('finanzas', [
      {
        target: '.tour-finanzas-kpis',
        content: 'Aquí verás un resumen de tu inversión en compras, las deudas pendientes a proveedores y el acumulado de dinero perdido por descuadres en la caja.',
        disableBeacon: true,
      },
      {
        target: '.tour-finanzas-vivo',
        content: 'Monitorea en tiempo real el turno del Punto de Venta actual para saber exactamente cuánto dinero debería haber físicamente en caja.',
      },
      {
        target: '.tour-finanzas-auditoria',
        content: 'Historial de auditoría. Revisa todos los cierres pasados y detecta al instante si hubo faltantes (descuadres) de efectivo.',
      }
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cálculos para la caja activa (si existe)
  const totalesActivos = movimientosActivos.reduce((acc, curr) => {
      const metodo = (curr.metodo_pago || 'efectivo').toLowerCase().trim();
      const tipo = (curr.tipo || '').toLowerCase().trim();

      if (tipo === 'egreso') acc.gastos += Number(curr.monto);

      if (metodo === 'efectivo') {
          if (tipo === 'ingreso') {
              acc.disponibilidad_efectivo += Number(curr.monto);
              if (curr.concepto !== 'Fondo de Caja Inicial') acc.ventas_efectivo += Number(curr.monto);
          }
          if (tipo === 'egreso') acc.disponibilidad_efectivo -= Number(curr.monto);
      }
      if (metodo === 'tarjeta') {
          if (tipo === 'ingreso') {
              acc.ventas_tarjeta += Number(curr.monto);
              acc.disponibilidad_tarjeta += Number(curr.monto);
          }
          if (tipo === 'egreso') acc.disponibilidad_tarjeta -= Number(curr.monto);
      }
      return acc;
  }, { disponibilidad_efectivo: 0, ventas_efectivo: 0, ventas_tarjeta: 0, disponibilidad_tarjeta: 0, gastos: 0 });

  const balanceTotal = totalesActivos.disponibilidad_efectivo + totalesActivos.disponibilidad_tarjeta;
  const montoInicial = cajaActiva ? Number(cajaActiva.monto_inicial) : 0;
  const isPerdida = balanceTotal < montoInicial;

  if (loading) return <LoadingSpinner text="Analizando salud financiera..." />;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex h-full w-full bg-slate-50/50 overflow-hidden rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex-1 overflow-y-auto p-8 lg:p-10">
        
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Finanzas y Tesorería</h1>
            <p className="text-slate-500 mt-1 text-sm">Monitorización en tiempo real del turno actual, compras y desempeño histórico.</p>
          </div>
        </div>

        {/* Global KPIs for Finanzas */}
        <div className="tour-finanzas-kpis grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex items-center justify-between group">
              <div>
                 <div className="flex items-center gap-1.5 mb-1">
                   <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Gastos en Compras</p>
                 </div>
                 <h3 className="text-3xl font-black text-slate-800 tracking-tighter truncate" title={`$${stats.inversionTotal.toFixed(2)}`}>
                    ${stats.inversionTotal.toFixed(2)}
                 </h3>
                 <p className="text-xs font-semibold text-slate-400 mt-1">Total invertido en inventario</p>
              </div>
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl shadow-sm flex-shrink-0">
                 <ShoppingCart size={24} strokeWidth={2.5} />
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex items-center justify-between group">
              <div>
                 <div className="flex items-center gap-1.5 mb-1">
                   <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Cuentas por Pagar</p>
                 </div>
                 <h3 className="text-3xl font-black text-rose-600 tracking-tighter truncate" title={`$${stats.cuentasPorPagar.toFixed(2)}`}>
                    ${stats.cuentasPorPagar.toFixed(2)}
                 </h3>
                 <p className="text-xs font-semibold text-slate-400 mt-1">Deuda acumulada a proveedores</p>
              </div>
              <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl shadow-sm flex-shrink-0">
                 <Building size={24} strokeWidth={2.5} />
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex items-center justify-between group">
              <div>
                 <div className="flex items-center gap-1.5 mb-1">
                   <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Descuadre Acumulado</p>
                 </div>
                 <h3 className={`text-3xl font-black tracking-tighter truncate ${stats.descuadreHistorico < 0 ? 'text-red-600' : stats.descuadreHistorico > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                    ${Math.abs(stats.descuadreHistorico).toFixed(2)}
                 </h3>
                 <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md inline-flex">
                    <AlertTriangle size={12} /> Descuadre de los turnos cerrados.
                 </div>
              </div>
              <div className="p-3.5 bg-slate-50 text-slate-600 rounded-2xl shadow-sm flex-shrink-0">
                 <ArrowRightLeft size={24} strokeWidth={2.5} />
              </div>
            </div>
        </div>

        {/* MÉTRICAS EN VIVO DEL TURNO ACTUAL */}
        {cajaActiva ? (
            <div className="tour-finanzas-vivo mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <h2 className="text-lg font-bold text-slate-800">Turno en Progreso (Métricas en Vivo)</h2>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Fondo Inicial</p>
                            <Clock size={14} className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">${montoInicial.toFixed(2)}</h3>
                    </div>
                    
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Ventas Efectivo</p>
                            <DollarSign size={14} className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">${totalesActivos.ventas_efectivo.toFixed(2)}</h3>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Ventas Tarjeta</p>
                            <CheckCircle2 size={14} className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">${totalesActivos.ventas_tarjeta.toFixed(2)}</h3>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-bold text-[#D32F2F]/80 tracking-widest uppercase">Retiros / Gastos</p>
                            <TrendingDown size={14} className="text-[#D32F2F]/80" />
                        </div>
                        <h3 className="text-xl font-black text-[#D32F2F]">${totalesActivos.gastos.toFixed(2)}</h3>
                    </div>
                    
                    <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase">Efec. Físico Esperado</p>
                            <Wallet size={14} className="text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-black text-emerald-700">${totalesActivos.disponibilidad_efectivo.toFixed(2)}</h3>
                    </div>

                    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Disp. Tarjeta</p>
                            <CheckCircle2 size={14} className="text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-black text-blue-700">${totalesActivos.disponibilidad_tarjeta.toFixed(2)}</h3>
                    </div>
                    
                    <div className={`p-5 rounded-2xl flex flex-col justify-between col-span-2 lg:col-span-2 transition-all ${isPerdida ? 'bg-[#D32F2F] shadow-[0_8px_16px_rgb(211,47,47,0.3)]' : 'bg-slate-800 shadow-[0_8px_16px_rgb(30,41,59,0.3)]'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className={`text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 ${isPerdida ? 'text-white/90' : 'text-slate-300'}`}>
                                Balance Neto del Día
                                <div className="relative flex items-center group/tooltip">
                                    <Info size={12} className="cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-black text-white text-[10px] rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 text-center pointer-events-none shadow-xl normal-case font-normal leading-tight">
                                        Ventas Totales (Efec + Tarjeta) menos Gastos.
                                    </div>
                                </div>
                            </div>
                            <DollarSign size={14} className={isPerdida ? 'text-white/90' : 'text-slate-300'} />
                        </div>
                        <h3 className="text-3xl font-black text-white">${balanceTotal.toFixed(2)}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Movimientos Registrados Hoy</h2>
                    </div>
                    <div className="overflow-x-auto max-h-64">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-slate-100">
                                {movimientosActivos.length === 0 ? (
                                    <tr>
                                        <td className="py-8 text-center text-slate-400 text-sm">No hay movimientos aún.</td>
                                    </tr>
                                ) : (
                                    movimientosActivos.map(mov => (
                                        <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-6 text-xs text-slate-500 w-24">{new Date(mov.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                            <td className="py-3 px-6 text-sm font-semibold text-slate-800">{mov.concepto}</td>
                                            <td className="py-3 px-6 w-32">
                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                                                    {(mov.metodo_pago || 'efectivo').toLowerCase().trim() === 'tarjeta' ? <CreditCard size={12} className="text-yellow-500" /> : <Banknote size={12} className="text-emerald-500" />}
                                                    {(mov.metodo_pago || 'efectivo').trim()}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 text-right w-32">
                                                <span className={`text-sm font-bold flex items-center justify-end gap-1 ${(mov.tipo || '').toLowerCase().trim() === 'ingreso' ? 'text-emerald-600' : 'text-[#D32F2F]'}`}>
                                                    {(mov.tipo || '').toLowerCase().trim() === 'ingreso' ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                                                    ${Number(mov.monto).toFixed(2)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        ) : (
            <div className="tour-finanzas-vivo mb-10 bg-slate-100 rounded-3xl p-6 text-center border-2 border-dashed border-slate-200">
                <p className="text-slate-500 font-semibold flex items-center justify-center gap-2">
                   <Clock size={18} /> No hay ningún turno operativo abierto en este momento.
                </p>
            </div>
        )}

        {/* HISTÓRICO DE TURNOS */}
        <div className="tour-finanzas-auditoria bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Historial de Turnos (Auditoría)</h2>
                    <p className="text-sm text-slate-500">Últimos 30 turnos de venta operados en el mostrador.</p>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Estado / Fecha</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Fondo Inicial</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Efec. Esperado</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Efec. Real</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase text-right">Diferencia</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {cajasHistoricas.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-12 text-center text-slate-400 text-sm">No se han registrado turnos operativos aún.</td>
                            </tr>
                        ) : (
                            cajasHistoricas.map(turno => {
                                const diff = turno.estado === 'cerrada' 
                                    ? (Number(turno.monto_final_real) - Number(turno.monto_final_esperado)) 
                                    : null;
                                
                                return (
                                <tr key={turno.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-6 text-sm">
                                        <div className="flex items-center gap-2 mb-1">
                                            {turno.estado === 'abierta' ? (
                                                <span className="bg-blue-100 text-blue-700 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                    <Clock size={10} /> En curso
                                                </span>
                                            ) : (
                                                <span className="bg-slate-200 text-slate-700 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                    <CalendarDays size={10} /> Cerrado
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-slate-800 font-bold">{new Date(turno.created_at).toLocaleDateString()}</div>
                                        <div className="text-slate-500 text-xs">{turno.notas || 'Sin concepto'}</div>
                                    </td>
                                    <td className="py-4 px-6 text-sm font-semibold text-slate-600">
                                        ${Number(turno.monto_inicial).toFixed(2)}
                                    </td>
                                    <td className="py-4 px-6 text-sm font-semibold text-slate-800">
                                        {turno.estado === 'cerrada' ? `$${Number(turno.monto_final_esperado).toFixed(2)}` : '--'}
                                    </td>
                                    <td className="py-4 px-6 text-sm font-semibold text-slate-800">
                                        {turno.estado === 'cerrada' ? `$${Number(turno.monto_final_real).toFixed(2)}` : '--'}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        {turno.estado === 'cerrada' && diff !== null ? (
                                            <span className={`text-sm font-bold flex items-center justify-end gap-1 ${diff < 0 ? 'text-[#D32F2F]' : diff > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {diff < 0 ? <TrendingDown size={14}/> : diff > 0 ? <TrendingUp size={14}/> : null}
                                                ${Math.abs(diff).toFixed(2)}
                                                {diff === 0 && ' (Exacto)'}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-sm">--</span>
                                        )}
                                    </td>
                                </tr>
                            )})
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </motion.div>
  );
};
