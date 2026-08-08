import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  AlertTriangle,
  AlertCircle,
  Star,
  Frown,
  Activity,
  PieChart as PieChartIcon,
  CreditCard,
  Building,
  Wallet,
  Crown,
  PackageOpen
} from 'lucide-react';
import { LoadingSpinner } from '../components/ui/Loading';
import { ventasService } from '../services/api/ventas';
import { recetasService } from '../services/api/recetas';
import { mermasService } from '../services/api/mermas';
import { supabase } from '../services/api/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, PieChart, Pie, Legend
} from 'recharts';

export const Informes = () => {
  const { currentRestaurant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [metodosPagoData, setMetodosPagoData] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [dateFilter, setDateFilter] = useState('historico');
  
  const [totals, setTotals] = useState({
    ventasTotales: 0,
    ingresoBruto: 0,
    gananciaNeta: 0,
    perdidaMermas: 0,
    rentabilidadPromedio: 0,
    topInsumoGanancia: null,
    topInsumoUso: null
  });

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        
        let startDate = null;
        let endDate = new Date();
        const hoy = new Date();
        
        if (dateFilter === 'hoy') {
          startDate = new Date(hoy.setHours(0, 0, 0, 0));
        } else if (dateFilter === 'semana') {
          startDate = new Date(hoy.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1))); // Lunes de esta semana
          startDate.setHours(0, 0, 0, 0);
        } else if (dateFilter === 'mes') {
          startDate = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
        }

        // Obtener restaurante_id
        const sessionRes = await supabase.auth.getSession();
        const user = sessionRes.data?.session?.user;
        if (!user) return;
        
        if (currentRestaurant?.id) {
          const [productosData, recetas, mermasData] = await Promise.all([
            ventasService.getVentasReporte(startDate, dateFilter === 'historico' ? null : endDate),
            recetasService.getRecetas(),
            mermasService.getMermas(currentRestaurant.id)
          ]);

          let mermasFiltradas = mermasData || [];
          if (startDate) {
            mermasFiltradas = mermasFiltradas.filter(m => new Date(m.fecha) >= startDate);
          }
          if (dateFilter !== 'historico') {
             mermasFiltradas = mermasFiltradas.filter(m => new Date(m.fecha) <= endDate);
          }

          let perdidaMermas = 0;
          mermasFiltradas.forEach(m => {
            perdidaMermas += Number(m.total_perdida || 0);
          });

          const recetasActivas = recetas?.filter(r => Number(r.precio_venta) > 0) || [];
          
          let ventasTotales = 0;
          let ingresoBruto = 0;
          let gananciaNeta = 0;
          let ventasUnicas = new Set();
          
          const agrupadoPorReceta = {};
          const agrupadoPorFecha = {};
          const agrupadoPorPago = { efectivo: 0, tarjeta: 0, transferencia: 0 };
          const agrupadoPorInsumo = {};

          productosData.forEach(item => {
             const receta = recetasActivas.find(r => r.id === item.receta_id);
             if (receta) {
               const costoUnitario = Number(receta.costo_total) || 0;
               const precioVenta = Number(receta.precio_venta) || 0;
               const gananciaUnitaria = precioVenta - costoUnitario;
               const ingresoTotalItem = precioVenta * item.cantidad;
               const gananciaTotalItem = gananciaUnitaria * item.cantidad;
               
               ventasTotales += item.cantidad;
               ingresoBruto += ingresoTotalItem;
               gananciaNeta += gananciaTotalItem;
               
               if (!agrupadoPorReceta[receta.id]) {
                 agrupadoPorReceta[receta.id] = {
                   id: receta.id,
                   nombre: receta.nombre,
                   es_subreceta: receta.es_subreceta,
                   cantidad: 0,
                   precioVenta: precioVenta,
                   costoInsumos: costoUnitario,
                   gananciaUnitaria: gananciaUnitaria,
                   ingresoBruto: 0,
                   gananciaTotal: 0,
                 };
               }
               agrupadoPorReceta[receta.id].cantidad += item.cantidad;
               agrupadoPorReceta[receta.id].ingresoBruto += ingresoTotalItem;
               agrupadoPorReceta[receta.id].gananciaTotal += gananciaTotalItem;

               if (item.ventas && item.ventas.metodo_pago) {
                  const mp = item.ventas.metodo_pago.toLowerCase();
                  if (agrupadoPorPago[mp] !== undefined) {
                     agrupadoPorPago[mp] += ingresoTotalItem;
                  }
               }

               if (item.ventas && item.ventas.id) {
                 ventasUnicas.add(item.ventas.id);
               }

               if (item.ventas && item.ventas.created_at) {
                 const fechaObj = new Date(item.ventas.created_at);
                 const fechaStr = dateFilter === 'hoy' 
                   ? `${fechaObj.getHours().toString().padStart(2, '0')}:00` 
                   : fechaObj.toISOString().split('T')[0];
                   
                 if (!agrupadoPorFecha[fechaStr]) {
                   agrupadoPorFecha[fechaStr] = { fecha: fechaStr, ventas: 0, ganancia: 0 };
                 }
                 agrupadoPorFecha[fechaStr].ventas += ingresoTotalItem;
                 agrupadoPorFecha[fechaStr].ganancia += gananciaTotalItem;
               }

               if (receta.ingredientes && receta.ingredientes.length > 0 && precioVenta > 0) {
                   receta.ingredientes.forEach(ing => {
                       if (ing.insumo && ing.insumo.id) {
                           const costoBase = Number(ing.insumo.costo_unidad_compra) / Number(ing.insumo.factor_conversion);
                           const costoRealIngrediente = (costoBase / (Number(ing.insumo.porcentaje_rendimiento) / 100)) * Number(ing.cantidad);
                           const proporcionCosto = costoUnitario > 0 ? (costoRealIngrediente / costoUnitario) : 0;
                           
                           const gananciaAportada = gananciaTotalItem * proporcionCosto;
                           const cantidadUsada = Number(ing.cantidad) * item.cantidad;

                           if (!agrupadoPorInsumo[ing.insumo.id]) {
                               agrupadoPorInsumo[ing.insumo.id] = {
                                   id: ing.insumo.id,
                                   nombre: ing.insumo.nombre,
                                   unidad_base: ing.insumo.unidad_base,
                                   gananciaAportada: 0,
                                   cantidadUsada: 0,
                                   vecesVendido: 0
                               };
                           }
                           agrupadoPorInsumo[ing.insumo.id].gananciaAportada += gananciaAportada;
                           agrupadoPorInsumo[ing.insumo.id].cantidadUsada += cantidadUsada;
                           agrupadoPorInsumo[ing.insumo.id].vecesVendido += item.cantidad;
                       }
                   });
               }
             }
          });

          const insumosList = Object.values(agrupadoPorInsumo);
          const topInsumoGanancia = insumosList.length > 0 
              ? insumosList.reduce((max, obj) => obj.gananciaAportada > max.gananciaAportada ? obj : max, insumosList[0])
              : null;
              
          const topInsumoUso = insumosList.length > 0 
              ? insumosList.reduce((max, obj) => obj.vecesVendido > max.vecesVendido ? obj : max, insumosList[0])
              : null;

          const data = Object.values(agrupadoPorReceta);
          const avgCantidad = data.length > 0 ? ventasTotales / data.length : 0;

          const dataMatriz = data.map(item => {
            const margen = (item.gananciaUnitaria / item.precioVenta) * 100;
            let bcg = 'neutro';
            
            if (margen >= 50 && item.cantidad >= avgCantidad) bcg = 'estrella';
            else if (margen < 50 && item.cantidad >= avgCantidad) bcg = 'caballito';
            else if (margen < 50 && item.cantidad < avgCantidad) bcg = 'hueso';
            
            return { ...item, margen, bcg };
          });

          dataMatriz.sort((a, b) => b.gananciaTotal - a.gananciaTotal);
          const badMargins = dataMatriz.filter(d => d.margen < 30 && d.cantidad > 0);
          const trendArray = Object.values(agrupadoPorFecha).sort((a, b) => a.fecha.localeCompare(b.fecha));

          const catData = data
            .filter(d => d.ingresoBruto > 0)
            .map(d => ({ name: d.nombre, value: d.ingresoBruto }))
            .sort((a, b) => b.value - a.value);
          
          let finalCatData = catData;
          if (catData.length > 5) {
            const top5 = catData.slice(0, 5);
            const otros = catData.slice(5).reduce((acc, curr) => acc + curr.value, 0);
            if (otros > 0) top5.push({ name: 'Otros', value: otros });
            finalCatData = top5;
          }

          const metodosPagoFinal = [
            { name: 'Efectivo', value: agrupadoPorPago.efectivo },
            { name: 'Tarjeta', value: agrupadoPorPago.tarjeta },
            { name: 'Transf.', value: agrupadoPorPago.transferencia }
          ].filter(m => m.value > 0);

          setReportData(dataMatriz);
          setAlertas(badMargins);
          setTrendData(trendArray);
          setCategoryData(finalCatData);
          setMetodosPagoData(metodosPagoFinal);

          setTotals({
            ventasTotales,
            ingresoBruto,
            gananciaNeta,
            perdidaMermas,
            rentabilidadPromedio: ingresoBruto > 0 ? (gananciaNeta / ingresoBruto) * 100 : 0,
            topInsumoGanancia,
            topInsumoUso
          });
        }

      } catch (error) {
        console.error('Error cargando Informes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [dateFilter, currentRestaurant]);

  const COLORS_BAR = ['#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981'];
  const COLORS_PIE = ['#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#eab308', '#94a3b8'];
  const COLORS_PAY = ['#10b981', '#3b82f6', '#8b5cf6'];

  const renderBCG = (bcg) => {
    if (bcg === 'estrella') return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-md ml-2 uppercase"><Star size={10} fill="currentColor" /> Estrella</span>;
    if (bcg === 'caballito') return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-md ml-2 uppercase"><TrendingUp size={10}/> Batalla</span>;
    if (bcg === 'hueso') return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md ml-2 uppercase"><Frown size={10}/> Hueso</span>;
    return null;
  };

  if (loading) {
    return <LoadingSpinner text="Analizando datos financieros..." />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-full w-full bg-slate-50/50 overflow-hidden rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    >
      <div className="flex-1 overflow-y-auto p-8 lg:p-10">
        
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Informes Estratégicos</h1>
            <p className="text-slate-500 mt-1 text-sm">Toma de decisiones basada en datos reales.</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2 pr-8 rounded-xl text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-slate-50 transition-colors appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat"
            >
              <option value="hoy">Hoy</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mes</option>
              <option value="historico">Histórico (Todo)</option>
            </select>
          </div>
        </div>


        {/* Panel de Alertas */}
        {alertas.length > 0 && (
          <motion.div 
            initial={{opacity:0, y:-10}} 
            animate={{opacity:1, y:0}} 
            className="mb-8 bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-start gap-4 shadow-sm"
          >
            <div className="bg-rose-100 p-2 rounded-full shrink-0">
              <AlertTriangle className="text-rose-600" size={24} />
            </div>
            <div>
              <h4 className="text-rose-800 font-bold text-sm">Alerta de Margen Crítico (Inflación / Costos Altos)</h4>
              <p className="text-rose-600 text-sm mt-1 mb-3">Los siguientes productos tienen un margen menor al 30%. Considera ajustar sus precios o modificar su receta:</p>
              <div className="flex flex-wrap gap-2">
                {alertas.map(a => (
                  <span key={a.id} className="bg-white border border-rose-200 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                    {a.nombre} <span className="text-rose-400 font-normal ml-1">({a.margen.toFixed(1)}%)</span>
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* KPIs Resumen Principal */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Platillos Vendidos</p>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{totals.ventasTotales}</h3>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><ShoppingCart size={18} strokeWidth={2.5} /></div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-md p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-3">
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Líderes (Insumos)</p>
              <div className="relative group/tooltip">
                 <AlertCircle size={14} className="text-slate-400 cursor-help" />
                 <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-3 bg-slate-800 text-white text-[11px] rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 shadow-xl pointer-events-none text-center font-medium">
                   El insumo que te dejó más ganancia líquida y el que más se usó.
                 </div>
               </div>
            </div>
            
            {totals.topInsumoGanancia ? (
              <div className="flex flex-col gap-3">
                 <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg shrink-0"><Crown size={14} strokeWidth={2.5}/></div>
                    <div className="overflow-hidden">
                       <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Top Ganancia</p>
                       <p className="text-sm font-bold text-slate-800 truncate" title={totals.topInsumoGanancia.nombre}>{totals.topInsumoGanancia.nombre}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg shrink-0"><PackageOpen size={14} strokeWidth={2.5}/></div>
                    <div className="overflow-hidden">
                       <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Top Uso</p>
                       <p className="text-sm font-bold text-slate-800 truncate" title={totals.topInsumoUso.nombre}>{totals.topInsumoUso.nombre}</p>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center text-slate-400 text-xs font-medium">Sin datos en periodo</div>
            )}
          </div>

          <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Ingreso Bruto</p>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-emerald-600 tracking-tighter truncate" title={`$${totals.ingresoBruto.toFixed(2)}`}>${totals.ingresoBruto.toFixed(2)}</h3>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={18} strokeWidth={2.5} /></div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Ganancia Neta</p>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-sky-600 tracking-tighter truncate" title={`$${totals.gananciaNeta.toFixed(2)}`}>${totals.gananciaNeta.toFixed(2)}</h3>
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl"><TrendingUp size={18} strokeWidth={2.5} /></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl shadow-lg border border-slate-700 text-white flex flex-col justify-between h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full mix-blend-overlay filter blur-[40px] opacity-10"></div>
            <div className="flex justify-between items-start mb-2 relative z-10">
               <p className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">Rentabilidad</p>
               <div className="relative group/tooltip">
                 <AlertCircle size={14} className="text-slate-400 cursor-help" />
                 <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-white text-slate-800 text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 shadow-xl pointer-events-none text-center">
                   Margen de ganancia promedio del periodo.
                 </div>
               </div>
            </div>
            <div className="flex items-end justify-between relative z-10">
              <h3 className="text-3xl font-black text-white tracking-tighter">{totals.rentabilidadPromedio.toFixed(1)}%</h3>
              <div className="p-2 bg-white/10 text-white rounded-xl"><Activity size={18} strokeWidth={2.5} /></div>
            </div>
          </div>
        </div>

        {/* Gráficos Estratégicos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Tendencia de Ventas (AreaChart) - 2 Columnas */}
          <div className="lg:col-span-2 xl:col-span-2 bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg mr-3 shadow-sm">
                <Activity size={18} strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                   <h2 className="text-lg font-bold text-slate-800 tracking-tight">Tendencia de Ventas</h2>
                   <div className="relative flex items-center group/tooltip">
                     <AlertCircle size={14} className="text-slate-400 hover:text-indigo-500 transition-colors cursor-help" />
                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 text-left pointer-events-none shadow-xl border border-slate-700">
                       <p className="mb-1"><span className="font-bold text-indigo-300">Ingreso Bruto:</span> Todo el dinero que entró a tu caja por la venta del platillo (Precio de venta).</p>
                       <p><span className="font-bold text-sky-300">Ganancia Neta:</span> El dinero libre que te queda *después* de restarle lo que te costó comprar los insumos para prepararlo.</p>
                     </div>
                   </div>
                </div>
                <p className="text-xs font-semibold text-slate-400">Evolución de Ingresos y Ganancias</p>
              </div>
            </div>
            <div className="flex-1 min-h-[250px] w-full">
              {trendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">No hay datos en este periodo</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorGanancia" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip 
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 600 }} 
                      formatter={(value) => [`$${Number(value).toFixed(2)}`, undefined]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }}/>
                    <Area type="monotone" dataKey="ventas" name="Ingreso Bruto" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
                    <Area type="monotone" dataKey="ganancia" name="Ganancia Neta" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorGanancia)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gráficos de Dona Verticales - 1 Columna */}
          <div className="lg:col-span-1 xl:col-span-1 flex flex-col gap-6">
            
            {/* Métodos de Pago */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col flex-1">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg mr-3 shadow-sm">
                  <CreditCard size={18} strokeWidth={2.5} />
                </div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Métodos de Pago</h2>
              </div>
              <div className="flex-1 min-h-[180px] w-full flex flex-col items-center justify-center text-center px-4">
                {metodosPagoData.length === 0 ? (
                  <>
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                       <CreditCard size={20} className="text-slate-300" />
                    </div>
                    <p className="text-slate-400 text-xs font-medium">Aquí verás cuánto de tu dinero entró por Efectivo, Tarjeta o Transferencia una vez que registres ventas.</p>
                  </>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={metodosPagoData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                        {metodosPagoData.map((entry, index) => (
                          <Cell key={`cell-pay-${index}`} fill={COLORS_PAY[index % COLORS_PAY.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 600 }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}/>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Categorías / Productos Top */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col flex-1">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg mr-3 shadow-sm">
                  <PieChartIcon size={18} strokeWidth={2.5} />
                </div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Ingresos por Platillo</h2>
              </div>
              <div className="flex-1 min-h-[180px] w-full flex items-center justify-center">
                {categoryData.length === 0 ? (
                  <div className="text-slate-400 text-sm">No hay datos</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 600 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            
          </div>
        </div>

        {/* Tabla Detallada con Matriz BCG */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden flex flex-col mb-8">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Matriz de Rentabilidad por Platillo</h2>
            <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
              {reportData.length} productos
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Producto</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Vendidos</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">Precio</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">Costo (Insumos)</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">Margen</th>
                  <th className="py-4 px-6 text-xs font-bold text-sky-600 uppercase tracking-wider text-right whitespace-nowrap">Ganancia Neta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">Cargando matriz...</td>
                  </tr>
                ) : reportData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">No hay ventas en este periodo.</td>
                  </tr>
                ) : (
                  reportData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <p className="text-sm font-bold text-slate-800">{row.nombre}</p>
                          {renderBCG(row.bcg)}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg min-w-[2rem]">
                          {row.cantidad}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-sm text-slate-600 font-medium">
                        ${row.precioVenta.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right text-sm text-amber-600 font-medium">
                        -${row.costoInsumos.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${row.margen >= 50 ? 'bg-emerald-50 text-emerald-600' : row.margen >= 30 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                          {row.margen.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-sm font-black text-sky-600">
                          ${row.gananciaTotal.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {!loading && reportData.length > 0 && (
                <tfoot className="bg-slate-50 border-t border-slate-200">
                  <tr>
                    <td className="py-4 px-6 text-sm font-black text-slate-800 text-right">Total del Periodo</td>
                    <td className="py-4 px-6 text-center text-sm font-black text-slate-800">{totals.ventasTotales}</td>
                    <td colSpan="3"></td>
                    <td className="py-4 px-6 text-right text-sm font-black text-sky-600">${totals.gananciaNeta.toFixed(2)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
