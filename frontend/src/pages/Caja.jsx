import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { cajaService } from '../services/api/caja';
import { motion } from 'framer-motion';
import { Wallet, LogIn, LogOut, ArrowRightLeft, DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle2, CreditCard, Banknote, Building, AlertTriangle, Info, ShoppingCart } from 'lucide-react';
import { supabase } from '../services/api/client';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/Loading';

export const Caja = () => {
  const { session, currentRestaurant } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [cajaActiva, setCajaActiva] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [showModal, setShowModal] = useState(null); // 'abrir', 'cerrar', 'movimiento'
  const [formData, setFormData] = useState({ monto: '', concepto: '', metodoPago: 'efectivo' });
  const [errorMsg, setErrorMsg] = useState('');
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

      const caja = await cajaService.getCajaAbierta(restauranteId);
      setCajaActiva(caja);
      if (caja) {
        const movs = await cajaService.getMovimientos(caja.id);
        setMovimientos(movs);
      }

      // Cargar KPIs de Caja
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

      const { data: cajasData } = await supabase.from('cajas').select('monto_final_esperado, monto_final_real').eq('restaurante_id', restauranteId).eq('estado', 'cerrada');
      let descuadre = 0;
      cajasData?.forEach(c => {
          descuadre += (Number(c.monto_final_real) || 0) - (Number(c.monto_final_esperado) || 0);
      });

      setStats({ cuentasPorPagar, descuadreHistorico: descuadre, inversionTotal });

    } catch (error) {
      console.error('Error al cargar caja:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) loadData();
  }, [session?.user?.id]);

  const handleAction = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const restauranteId = currentRestaurant?.id;

      if (showModal === 'abrir') {
        await cajaService.abrirCaja(restauranteId, Number(formData.monto), formData.concepto);
        toast.success('Turno de caja abierto con éxito');
      } else if (showModal === 'cerrar') {
        await cajaService.cerrarCaja(cajaActiva.id, Number(formData.monto), formData.concepto);
        toast.success('Turno de caja cerrado con éxito');
      } else if (showModal === 'movimiento') {
        await cajaService.agregarMovimiento(cajaActiva.id, formData.tipo, Number(formData.monto), formData.concepto, 'efectivo');
        toast.success('Movimiento registrado con éxito');
      }
      setShowModal(null);
      setFormData({ monto: '', concepto: '', metodoPago: 'efectivo' });
      loadData();
    } catch (error) {
      setErrorMsg(error.message || 'Error al procesar la solicitud');
      toast.error('Ocurrió un error');
    }
  };

  const totales = movimientos.reduce((acc, curr) => {
      const metodo = (curr.metodo_pago || 'efectivo').toLowerCase().trim();
      const tipo = (curr.tipo || '').toLowerCase().trim();

      if (tipo === 'egreso') {
          acc.gastos += Number(curr.monto);
      }

      if (metodo === 'efectivo') {
          if (tipo === 'ingreso') {
              acc.disponibilidad_efectivo += Number(curr.monto);
              if (curr.concepto !== 'Fondo de Caja Inicial') {
                 acc.ventas_efectivo += Number(curr.monto);
              }
          }
          if (tipo === 'egreso') acc.disponibilidad_efectivo -= Number(curr.monto);
      }
      if (metodo === 'tarjeta') {
          if (tipo === 'ingreso') {
              acc.ventas_tarjeta += Number(curr.monto);
              acc.disponibilidad_tarjeta += Number(curr.monto);
          }
          if (tipo === 'egreso') {
              acc.disponibilidad_tarjeta -= Number(curr.monto);
          }
      }
      return acc;
  }, { disponibilidad_efectivo: 0, ventas_efectivo: 0, ventas_tarjeta: 0, disponibilidad_tarjeta: 0, gastos: 0 });

  const balanceTotal = totales.disponibilidad_efectivo + totales.disponibilidad_tarjeta;
  const montoInicial = cajaActiva ? Number(cajaActiva.monto_inicial) : 0;
  const isPerdida = balanceTotal < montoInicial;

  if (loading) return <LoadingSpinner text="Sincronizando información de caja..." />;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex h-full w-full bg-slate-50/50 overflow-hidden rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex-1 overflow-y-auto p-8 lg:p-10">
        
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Caja y Jornadas</h1>
            <p className="text-slate-500 mt-1 text-sm">Control financiero del dinero en efectivo.</p>
          </div>
          <div className="flex items-center gap-3">
             {cajaActiva ? (
               <>
                 <button onClick={() => { setFormData({...formData, tipo: 'egreso'}); setShowModal('movimiento'); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
                   <ArrowRightLeft size={18} /> Nuevo Movimiento
                 </button>
                 <button onClick={() => setShowModal('cerrar')} className="flex items-center gap-2 bg-[#D32F2F] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#C62828] transition-colors shadow-sm cursor-pointer">
                   <LogOut size={18} /> Cerrar Jornada
                 </button>
               </>
             ) : (
               <button onClick={() => setShowModal('abrir')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
                 <LogIn size={18} /> Abrir Jornada
               </button>
             )}
          </div>
        </div>

        {/* Global KPIs for Caja */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* KPI Inversión Total */}
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex items-center justify-between group">
              <div>
                 <div className="flex items-center gap-1.5 mb-1">
                   <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Gastos en Compras</p>
                 </div>
                 <h3 className="text-3xl font-black text-slate-800 tracking-tighter truncate" title={`$${stats.inversionTotal.toFixed(2)}`}>
                    ${stats.inversionTotal.toFixed(2)}
                 </h3>
                 <p className="text-xs font-semibold text-slate-400 mt-1">Total invertido en insumos</p>
              </div>
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl shadow-sm flex-shrink-0">
                 <ShoppingCart size={24} strokeWidth={2.5} />
              </div>
            </div>

            {/* KPI Cuentas por Pagar */}
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

            {/* KPI Descuadre Histórico */}
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex items-center justify-between group">
              <div>
                 <div className="flex items-center gap-1.5 mb-1">
                   <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Descuadre Histórico</p>
                 </div>
                 <h3 className={`text-3xl font-black tracking-tighter truncate ${stats.descuadreHistorico < 0 ? 'text-red-600' : stats.descuadreHistorico > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                    ${Math.abs(stats.descuadreHistorico).toFixed(2)}
                 </h3>
                 <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md inline-flex">
                    <AlertTriangle size={12} /> Cierra la jornada actual para evaluar si hoy hubo pérdidas o ganancias.
                 </div>
              </div>
              <div className="p-3.5 bg-slate-50 text-slate-600 rounded-2xl shadow-sm flex-shrink-0">
                 <ArrowRightLeft size={24} strokeWidth={2.5} />
              </div>
            </div>
        </div>

        {!cajaActiva ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-6 lg:p-8 flex flex-col items-center shadow-sm">
             <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <Wallet size={32} strokeWidth={1.5} />
             </div>
             <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Jornada de Caja Cerrada</h2>
             <p className="text-slate-500 text-base max-w-2xl mb-8 text-center leading-relaxed">
                El control de efectivo es el corazón financiero de tu restaurante. Insumia te ayuda a evitar fugas de dinero obligando a llevar un registro estricto de cada centavo que entra o sale de la registradora.
             </p>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-8">
               <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                 <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl mb-3"><LogIn size={20} /></div>
                 <h4 className="font-bold text-slate-800 mb-1">1. Fondo Inicial</h4>
                 <p className="text-xs text-slate-500">Comienza tu día declarando con cuánto efectivo físico arranca tu caja registradora para dar cambio.</p>
               </div>
               <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                 <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl mb-3"><TrendingUp size={20} /></div>
                 <h4 className="font-bold text-slate-800 mb-1">2. Autopiloto</h4>
                 <p className="text-xs text-slate-500">Al vender en Efectivo en el POS o pagar a proveedores, Insumia sumará o restará el dinero automáticamente de tu jornada.</p>
               </div>
               <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                 <div className="p-2.5 bg-[#D32F2F]/10 text-[#D32F2F] rounded-xl mb-3"><LogOut size={20} /></div>
                 <h4 className="font-bold text-slate-800 mb-1">3. Cierre Exacto</h4>
                 <p className="text-xs text-slate-500">Al finalizar el día, te diremos exactamente cuánto dinero físico debe haber. ¡No más cuentas a ciegas!</p>
               </div>
             </div>

             <button onClick={() => setShowModal('abrir')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-base shadow-[0_8px_16px_rgb(37,99,235,0.2)] hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2 cursor-pointer">
                <Wallet size={20} /> Declarar Fondo y Abrir Caja
             </button>
          </div>
        ) : (
          <>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
               <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                     <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Fondo Inicial</p>
                     <Clock size={14} className="text-slate-400" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800">${Number(cajaActiva.monto_inicial).toFixed(2)}</h3>
               </div>
               
               <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                     <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Ventas Efectivo</p>
                     <DollarSign size={14} className="text-slate-400" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800">${totales.ventas_efectivo.toFixed(2)}</h3>
               </div>

               <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                     <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Ventas Tarjeta</p>
                     <CheckCircle2 size={14} className="text-slate-400" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800">${totales.ventas_tarjeta.toFixed(2)}</h3>
               </div>

               <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                     <p className="text-[10px] font-bold text-[#D32F2F]/80 tracking-widest uppercase">Gastos</p>
                     <TrendingDown size={14} className="text-[#D32F2F]/80" />
                  </div>
                  <h3 className="text-xl font-black text-[#D32F2F]">${totales.gastos.toFixed(2)}</h3>
               </div>
               
               <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                     <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Disp. Efectivo</p>
                     <Wallet size={14} className="text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-black text-blue-700">${totales.disponibilidad_efectivo.toFixed(2)}</h3>
               </div>

               <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                     <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Disp. Tarjeta</p>
                     <CheckCircle2 size={14} className="text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-black text-blue-700">${totales.disponibilidad_tarjeta.toFixed(2)}</h3>
               </div>
               
               <div className={`p-5 rounded-2xl flex flex-col justify-between col-span-2 lg:col-span-2 transition-all ${isPerdida ? 'bg-[#D32F2F] shadow-[0_8px_16px_rgb(211,47,47,0.3)]' : 'bg-blue-600 shadow-[0_8px_16px_rgb(37,99,235,0.2)]'}`}>
                  <div className="flex justify-between items-start mb-2">
                     <div className={`text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 ${isPerdida ? 'text-white/90' : 'text-blue-200'}`}>
                        Balance Total de la Jornada
                        <div className="relative flex items-center group/tooltip">
                            <Info size={12} className="cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 text-center pointer-events-none shadow-xl normal-case font-normal leading-tight">
                                Calculado como: Ventas (Efectivo y Tarjeta) - Gastos. Representa el resultado financiero del día.
                            </div>
                        </div>
                     </div>
                     <DollarSign size={14} className={isPerdida ? 'text-white/90' : 'text-blue-200'} />
                  </div>
                  <h3 className="text-3xl font-black text-white">${balanceTotal.toFixed(2)}</h3>
               </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">Movimientos de la Jornada</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Hora</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Concepto</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Método</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {movimientos.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center text-slate-400 text-sm">No hay movimientos aún.</td>
                                </tr>
                            ) : (
                                movimientos.map(mov => (
                                    <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-6 text-sm text-slate-500">{new Date(mov.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                        <td className="py-4 px-6 text-sm font-semibold text-slate-800">{mov.concepto}</td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                                                {(mov.metodo_pago || 'efectivo').toLowerCase().trim() === 'tarjeta' ? <CreditCard size={14} className="text-yellow-500" /> : <Banknote size={14} className="text-emerald-500" />}
                                                {(mov.metodo_pago || 'efectivo').trim()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className={`text-sm font-bold flex items-center justify-end gap-1 ${(mov.tipo || '').toLowerCase().trim() === 'ingreso' ? 'text-emerald-600' : 'text-[#D32F2F]'}`}>
                                                {(mov.tipo || '').toLowerCase().trim() === 'ingreso' ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
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
          </>
        )}
      </div>

      {/* Modales */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
               {showModal === 'abrir' ? 'Abrir Jornada' : showModal === 'cerrar' ? 'Cerrar Jornada' : 'Registrar Movimiento Manual'}
            </h2>
            
            {errorMsg && <div className="mb-4 p-3 bg-[#D32F2F]/10 text-[#D32F2F] text-sm font-semibold rounded-xl">{errorMsg}</div>}
            
            <form onSubmit={handleAction} className="space-y-4">
               {showModal === 'cerrar' && (
                   <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-center">
                       <p className="text-sm font-semibold text-blue-600 mb-1">Debes tener en efectivo físico:</p>
                       <p className="text-3xl font-black text-blue-800">${totales.disponibilidad_efectivo.toFixed(2)}</p>
                   </div>
               )}

               {showModal === 'movimiento' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Movimiento</label>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setFormData({...formData, tipo: 'ingreso'})} className={`flex-1 py-2 rounded-xl text-sm font-bold border ${formData.tipo === 'ingreso' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}>Ingreso</button>
                        <button type="button" onClick={() => setFormData({...formData, tipo: 'egreso'})} className={`flex-1 py-2 rounded-xl text-sm font-bold border ${formData.tipo === 'egreso' ? 'bg-[#D32F2F]/10 border-[#D32F2F]/20 text-[#D32F2F]' : 'bg-white border-slate-200 text-slate-500'}`}>Egreso (Retiro)</button>
                    </div>
                  </div>
               )}

               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                      {showModal === 'abrir' ? 'Fondo Inicial ($)' : showModal === 'cerrar' ? 'Efectivo Real en Caja ($)' : 'Monto ($)'}
                  </label>
                  <input type="number" step="0.01" min="0" required value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
               </div>

               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                      {showModal === 'cerrar' ? 'Notas / Discrepancias' : 'Concepto'}
                  </label>
                  <input type="text" required={showModal === 'movimiento'} value={formData.concepto} onChange={e => setFormData({...formData, concepto: e.target.value})} placeholder={showModal === 'abrir' ? 'Ej. Jornada Matutina' : ''} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
               </div>

               <div className="flex items-center gap-3 mt-8">
                  <button type="button" onClick={() => setShowModal(null)} className="flex-1 bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors cursor-pointer">Cancelar</button>
                  <button type="submit" className={`flex-1 text-white px-4 py-3 rounded-xl font-bold shadow-md transition-colors cursor-pointer ${showModal === 'cerrar' ? 'bg-[#D32F2F] hover:bg-[#C62828]' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {showModal === 'abrir' ? 'Abrir Caja' : showModal === 'cerrar' ? 'Confirmar Cierre' : 'Guardar'}
                  </button>
               </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
