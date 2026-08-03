import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { cajaService } from '../services/api/caja';
import { motion } from 'framer-motion';
import { Wallet, LogIn, LogOut, ArrowRightLeft, DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../services/api/client';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/Loading';

export const Caja = () => {
  const { session } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [cajaActiva, setCajaActiva] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [showModal, setShowModal] = useState(null); // 'abrir', 'cerrar', 'movimiento'
  const [formData, setFormData] = useState({ monto: '', concepto: '', metodoPago: 'efectivo' });
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      if (!session?.user?.id) return;
      
      const { data: userData } = await supabase
        .from('usuarios')
        .select('restaurante_id')
        .eq('id', session.user.id)
        .single();
        
      const restauranteId = userData.restaurante_id;
      if (!restauranteId) return;

      const caja = await cajaService.getCajaAbierta(restauranteId);
      setCajaActiva(caja);
      if (caja) {
        const movs = await cajaService.getMovimientos(caja.id);
        setMovimientos(movs);
      }
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
      const { data: userData } = await supabase
        .from('usuarios')
        .select('restaurante_id')
        .eq('id', session.user.id)
        .single();
      const restauranteId = userData.restaurante_id;

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
      if (curr.metodo_pago === 'efectivo') {
          if (curr.tipo === 'ingreso') acc.efectivo_esperado += Number(curr.monto);
          if (curr.tipo === 'egreso') acc.efectivo_esperado -= Number(curr.monto);
      }
      if (curr.metodo_pago === 'tarjeta' && curr.tipo === 'ingreso') {
          acc.tarjeta += Number(curr.monto);
      }
      return acc;
  }, { efectivo_esperado: 0, tarjeta: 0 });

  if (loading) return <LoadingSpinner text="Sincronizando información de caja..." />;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex h-full w-full bg-slate-50/50 overflow-hidden rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex-1 overflow-y-auto p-8 lg:p-10">
        
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Caja y Turnos</h1>
            <p className="text-slate-500 mt-1 text-sm">Control financiero del dinero en efectivo.</p>
          </div>
          <div className="flex items-center gap-3">
             {cajaActiva ? (
               <button onClick={() => setShowModal('cerrar')} className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors shadow-sm cursor-pointer">
                 <LogOut size={18} /> Cerrar Turno
               </button>
             ) : (
               <button onClick={() => setShowModal('abrir')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
                 <LogIn size={18} /> Abrir Turno
               </button>
             )}
          </div>
        </div>

        {!cajaActiva ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-6 lg:p-8 flex flex-col items-center shadow-sm">
             <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <Wallet size={32} strokeWidth={1.5} />
             </div>
             <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Turno de Caja Cerrado</h2>
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
                 <p className="text-xs text-slate-500">Al vender en Efectivo en el POS o pagar a proveedores, Insumia sumará o restará el dinero automáticamente de tu turno.</p>
               </div>
               <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                 <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl mb-3"><LogOut size={20} /></div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
               <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                     <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Fondo Inicial</p>
                     <Clock size={16} className="text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800">${Number(cajaActiva.monto_inicial).toFixed(2)}</h3>
               </div>
               
               <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                     <p className="text-xs font-bold text-blue-400 tracking-widest uppercase">Efectivo Esperado</p>
                     <DollarSign size={16} className="text-blue-500" />
                  </div>
                  <h3 className="text-3xl font-black text-blue-700">${totales.efectivo_esperado.toFixed(2)}</h3>
               </div>

               <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                     <p className="text-xs font-bold text-purple-400 tracking-widest uppercase">Ventas con Tarjeta</p>
                     <CheckCircle2 size={16} className="text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-black text-purple-700">${totales.tarjeta.toFixed(2)}</h3>
               </div>
               
               <div className="bg-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-center items-center cursor-pointer hover:bg-slate-700 transition-colors" onClick={() => { setFormData({...formData, tipo: 'egreso'}); setShowModal('movimiento'); }}>
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3">
                     <ArrowRightLeft size={24} className="text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-widest uppercase">Nuevo Movimiento Manual</h3>
               </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">Movimientos del Turno</h2>
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
                                            <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{mov.metodo_pago}</span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className={`text-sm font-bold flex items-center justify-end gap-1 ${mov.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {mov.tipo === 'ingreso' ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
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
               {showModal === 'abrir' ? 'Abrir Turno' : showModal === 'cerrar' ? 'Cerrar Turno' : 'Registrar Movimiento Manual'}
            </h2>
            
            {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-xl">{errorMsg}</div>}
            
            <form onSubmit={handleAction} className="space-y-4">
               {showModal === 'cerrar' && (
                   <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-center">
                       <p className="text-sm font-semibold text-blue-600 mb-1">Debes tener en efectivo físico:</p>
                       <p className="text-3xl font-black text-blue-800">${totales.efectivo_esperado.toFixed(2)}</p>
                   </div>
               )}

               {showModal === 'movimiento' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Movimiento</label>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setFormData({...formData, tipo: 'ingreso'})} className={`flex-1 py-2 rounded-xl text-sm font-bold border ${formData.tipo === 'ingreso' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}>Ingreso</button>
                        <button type="button" onClick={() => setFormData({...formData, tipo: 'egreso'})} className={`flex-1 py-2 rounded-xl text-sm font-bold border ${formData.tipo === 'egreso' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-500'}`}>Egreso (Retiro)</button>
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
                  <input type="text" required={showModal === 'movimiento'} value={formData.concepto} onChange={e => setFormData({...formData, concepto: e.target.value})} placeholder={showModal === 'abrir' ? 'Ej. Turno Matutino' : ''} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
               </div>

               <div className="flex items-center gap-3 mt-8">
                  <button type="button" onClick={() => setShowModal(null)} className="flex-1 bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors cursor-pointer">Cancelar</button>
                  <button type="submit" className={`flex-1 text-white px-4 py-3 rounded-xl font-bold shadow-md transition-colors cursor-pointer ${showModal === 'cerrar' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
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
