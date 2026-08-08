import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertCircle, ChefHat, BarChart2, ChevronRight, Info, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { insumosService } from '../services/api/insumos';
import { recetasService } from '../services/api/recetas';
import { ventasService } from '../services/api/ventas';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { supabase } from '../services/api/client';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '../components/ui/Loading';

export const Dashboard = () => {
  const { currentRestaurant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    insumosCount: 0,
    alertasStock: 0,
    alertasItems: [],
    recetasCount: 0,
    ventasHoy: 0,
    gananciaTotal: 0,
    valorInventario: 0
  });
  const [topProductos, setTopProductos] = useState([]);
  const [topIngredientes, setTopIngredientes] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // 1. Cargar Insumos y Compras
        const insumos = await insumosService.getInsumos();
        
        const sessionRes = await supabase.auth.getSession();
        const user = sessionRes.data?.session?.user;
        let comprasData = null;
        if (user) {
          const { data: userData } = await supabase.from('usuarios').select('restaurante_id').eq('id', user.id).single();
          if (userData?.restaurante_id) {
            const { data } = await supabase.from('compras').select('total').eq('restaurante_id', userData.restaurante_id);
            comprasData = data;
          }
        }
        
        let valorInventario = 0;
        comprasData?.forEach(c => {
           valorInventario += (Number(c.total) || 0);
        });
        
        // 2. Cargar Recetas Activas (con precio de venta > 0)
        const recetas = await recetasService.getRecetas();
        const recetasActivas = recetas?.filter(r => !r.es_subreceta && Number(r.precio_venta) > 0) || [];
        
        // 3. Cargar Ventas de Hoy
        const ventasHoyData = await ventasService.getVentasHoy();
        
        // 4. Cargar Top Productos para Gráfico
        const productosData = await ventasService.getVentasPorPlatillo();
        // Tomar solo los top 5
        const top5 = [...productosData].sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

        // 5. Calcular Ganancia Real Histórica
        let gananciaTotal = 0;
        productosData.forEach(item => {
           const receta = recetasActivas.find(r => r.id === item.receta_id);
           if (receta) {
             const costoUnitario = Number(receta.costo_total) || 0;
             const precioVenta = Number(receta.precio_venta) || 0;
             const gananciaUnitaria = precioVenta - costoUnitario;
             gananciaTotal += gananciaUnitaria * item.cantidad;
           }
        });

        // 4.5 Cargar Top Ingredientes Estrella
        const { data: movs } = await supabase
          .from('insumo_movimientos')
          .select('insumo_id, ingreso_generado, insumos(nombre)')
          .eq('tipo', 'venta');
        
        const rentabilidad = {};
        if (movs) {
          movs.forEach(m => {
            if (!rentabilidad[m.insumo_id]) {
              rentabilidad[m.insumo_id] = { nombre: m.insumos?.nombre || 'Desconocido', ganancia: 0 };
            }
            rentabilidad[m.insumo_id].ganancia += Number(m.ingreso_generado || 0);
          });
        }
        const topIngs = Object.values(rentabilidad)
          .filter(i => i.ganancia > 0)
          .sort((a,b) => b.ganancia - a.ganancia)
          .slice(0, 5);

        // 6. Cargar Lotes para Alertas de Caducidad
        let alertasCaducidad = [];
        if (userData?.restaurante_id) {
          const { data: lotes } = await supabase
            .from('lotes_insumo')
            .select('id, cantidad_actual, fecha_caducidad, insumos(nombre, dias_alerta_caducidad, unidad_base)')
            .eq('restaurante_id', userData.restaurante_id)
            .gt('cantidad_actual', 0)
            .not('fecha_caducidad', 'is', null);

          if (lotes) {
            const hoy = new Date();
            hoy.setHours(0,0,0,0);
            
            lotes.forEach(lote => {
               // Convertir fecha UTC asumiendo formato YYYY-MM-DD
               const fechaCad = new Date(lote.fecha_caducidad + 'T00:00:00');
               const diasRestantes = Math.ceil((fechaCad - hoy) / (1000 * 60 * 60 * 24));
               const limite = lote.insumos?.dias_alerta_caducidad || 7;
               
               if (diasRestantes <= limite) {
                 alertasCaducidad.push({
                   id: lote.id,
                   nombre: lote.insumos?.nombre,
                   diasRestantes,
                   cantidad: lote.cantidad_actual,
                   unidad: lote.insumos?.unidad_base,
                   fecha: lote.fecha_caducidad
                 });
               }
            });
            alertasCaducidad.sort((a,b) => a.diasRestantes - b.diasRestantes);
          }
        }

        setStats({
          insumosCount: insumos?.length || 0,
          recetasCount: recetasActivas.length,
          ventasHoy: ventasHoyData?.length || 0,
          gananciaTotal,
          valorInventario,
          alertasCaducidad
        });

        setTopProductos(top5);
        setTopIngredientes(topIngs);
      } catch (error) {
        console.error('Error cargando Dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Paleta de colores para el gráfico
  const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-full w-full bg-slate-50/50 overflow-hidden rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    >
      <div className="flex-1 overflow-y-auto p-8 lg:p-10">
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Panel Principal <span className="text-blue-600 ml-1">{currentRestaurant ? `- ${currentRestaurant.nombre}` : ''}</span></h1>
            <p className="text-slate-500 mt-1 text-sm">Resumen en tiempo real del estado de tu restaurante.</p>
          </div>
          {loading && (
            <div className="flex items-center text-slate-400 text-sm font-medium">
              <div className="animate-pulse flex items-center">
                <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
                Sincronizando datos...
              </div>
            </div>
          )}
        </div>
        
        {/* KPIs Grid */}
        {loading ? (
          <div className="h-40"><LoadingSpinner text="Preparando tu resumen..." /></div>
        ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10"
        >
          
          {/* KPI 1 */}
          <motion.div variants={itemVariants}>
            <div className="bg-white/70 backdrop-blur-md p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 hover:border-blue-200 hover:shadow-[0_8px_30px_rgb(59,130,246,0.1)] hover:-translate-y-1 transition-all duration-300 block group relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Insumos</p>
                    <div className="relative flex items-center group/tooltip">
                      <Info size={14} className="text-slate-400 hover:text-blue-500 transition-colors cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10 text-center pointer-events-none">
                        Total de materias primas o insumos registrados en el sistema.
                      </div>
                    </div>
                  </div>
                  <h3 className="text-4xl font-black text-slate-800 tracking-tighter group-hover:text-blue-600 transition-colors">
                    {stats.insumosCount}
                  </h3>
                </div>
                <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Package size={24} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* KPI 2: Valor de Inventario */}
          <motion.div variants={itemVariants}>
            <div className="bg-white/70 backdrop-blur-md p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 hover:border-amber-200 hover:shadow-[0_8px_30px_rgb(245,158,11,0.1)] hover:-translate-y-1 transition-all duration-300 block group relative">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Valor Stock</p>
                    <div className="relative flex items-center group/tooltip">
                      <Info size={14} className="text-slate-400 hover:text-amber-500 transition-colors cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10 text-center pointer-events-none">
                        Dinero invertido actualmente en materia prima (stock físico).
                      </div>
                    </div>
                  </div>
                  <h3 className="text-4xl font-black text-slate-800 tracking-tighter group-hover:text-amber-600 transition-colors truncate" title={`$${stats.valorInventario.toFixed(2)}`}>
                    ${stats.valorInventario.toFixed(2)}
                  </h3>
                </div>
                <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm ml-2 flex-shrink-0">
                  <DollarSign size={24} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* KPI 3 */}
          <motion.div variants={itemVariants}>
            <div className="bg-white/70 backdrop-blur-md p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 hover:border-indigo-200 hover:shadow-[0_8px_30px_rgb(99,102,241,0.1)] hover:-translate-y-1 transition-all duration-300 block group relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Menú Activo</p>
                    <div className="relative flex items-center group/tooltip">
                      <Info size={14} className="text-slate-400 hover:text-indigo-500 transition-colors cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10 text-center pointer-events-none">
                        Cantidad de platillos disponibles para la venta.
                      </div>
                    </div>
                  </div>
                  <h3 className="text-4xl font-black text-slate-800 tracking-tighter group-hover:text-indigo-600 transition-colors">
                    {stats.recetasCount}
                  </h3>
                </div>
                <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <ChefHat size={24} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* KPI 4 */}
          <motion.div variants={itemVariants}>
            <div className="bg-white/70 backdrop-blur-md p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 hover:border-emerald-200 hover:shadow-[0_8px_30px_rgb(16,185,129,0.1)] hover:-translate-y-1 transition-all duration-300 block group relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Ventas Hoy</p>
                    <div className="relative flex items-center group/tooltip">
                      <Info size={14} className="text-slate-400 hover:text-emerald-500 transition-colors cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10 text-center pointer-events-none">
                        Número total de ventas realizadas en el día de hoy.
                      </div>
                    </div>
                  </div>
                  <h3 className="text-4xl font-black text-slate-800 tracking-tighter group-hover:text-emerald-600 transition-colors">
                    {stats.ventasHoy}
                  </h3>
                </div>
                <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <TrendingUp size={24} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* KPI 5: Ganancia Real */}
          <motion.div variants={itemVariants}>
            <div className="bg-white/70 backdrop-blur-md p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 hover:border-blue-200 hover:shadow-[0_8px_30px_rgb(59,130,246,0.1)] hover:-translate-y-1 transition-all duration-300 block group relative">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Ganancia Total</p>
                    <div className="relative flex items-center group/tooltip">
                      <Info size={14} className="text-slate-400 hover:text-blue-500 transition-colors cursor-help" />
                      <div className="absolute bottom-full right-0 md:left-1/2 md:-translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10 text-center pointer-events-none">
                        Beneficio neto histórico (precio de venta - costo de insumos) acumulado.
                      </div>
                    </div>
                  </div>
                  <h3 className="text-4xl font-black text-slate-800 tracking-tighter group-hover:text-blue-600 transition-colors truncate" title={`$${stats.gananciaTotal.toFixed(2)}`}>
                    ${stats.gananciaTotal.toFixed(2)}
                  </h3>
                </div>
                <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm ml-2 flex-shrink-0">
                  <TrendingUp size={24} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
        )}

        {/* Gráficos y Tablas Auxiliares */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          
          {/* Gráfico de Barras: Top Productos */}
          <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col">
            <div className="flex items-center mb-8 shrink-0">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl mr-4 shadow-sm">
                <BarChart2 size={20} strokeWidth={2.5} />
              </div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Top Recetas</h2>
            </div>
            
            {loading ? (
              <div className="h-64"><LoadingSpinner text="Generando gráficos..." /></div>
            ) : topProductos.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Aún no hay ventas registradas para generar gráficos.
              </div>
            ) : (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProductos}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="nombre" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="cantidad" name="Platillos Vendidos" radius={[6, 6, 0, 0]} maxBarSize={50}>
                      {topProductos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Gráfico de Dona: Top Ingredientes */}
          <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col">
            <div className="flex items-center mb-4 shrink-0">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl mr-4 shadow-sm">
                <Package size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Insumos Estrella</h2>
                <p className="text-xs text-slate-400 font-medium">Mayor ganancia aportada</p>
              </div>
            </div>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center"><LoadingSpinner text="Calculando..." /></div>
            ) : topIngredientes.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm text-center">
                Vende platillos para descubrir tus ingredientes estrella.
              </div>
            ) : (
              <div className="flex-1 relative min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip 
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Ganancia']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      wrapperStyle={{ zIndex: 100 }}
                    />
                    <Pie
                      data={topIngredientes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="ganancia"
                      nameKey="nombre"
                      stroke="none"
                    >
                      {topIngredientes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend (Center Text) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none mt-[-10px]">
                   <span className="text-xl font-black text-slate-800">${topIngredientes[0]?.ganancia.toFixed(0)}</span>
                   <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Líder</span>
                </div>
              </div>
            )}
          </div>

          {/* Panel Auxiliar Informativo / Alertas (Bento Box) */}
          {stats.alertasCaducidad?.length > 0 ? (
            <div className="p-8 rounded-3xl shadow-xl border flex flex-col relative overflow-hidden group bg-red-900 border-red-800 text-white h-[400px]">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full mix-blend-screen filter blur-[80px] opacity-40 bg-red-500"></div>
              
              <div className="relative z-10 flex-1 flex flex-col min-h-0">
                <div className="inline-flex px-3 py-1 bg-red-500/20 rounded-full text-xs font-bold tracking-widest uppercase mb-4 border border-red-400/30 text-red-100 self-start">
                  Alerta de Caducidad
                </div>
                <h2 className="text-2xl font-black tracking-tight mb-2 text-white">
                  Atención Requerida
                </h2>
                <p className="text-red-200 text-sm leading-relaxed mb-4">
                  Tienes {stats.alertasCaducidad.length} lote(s) próximo(s) a caducar o ya vencidos.
                </p>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {stats.alertasCaducidad.map((alerta) => (
                    <div key={alerta.id} className="bg-red-950/50 border border-red-800/50 p-3 rounded-xl">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm text-red-50">{alerta.nombre}</span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${alerta.diasRestantes < 0 ? 'bg-red-500 text-white' : alerta.diasRestantes === 0 ? 'bg-orange-500 text-white' : 'bg-yellow-500 text-yellow-950'}`}>
                          {alerta.diasRestantes < 0 ? 'Caducado' : alerta.diasRestantes === 0 ? 'Caduca Hoy' : `En ${alerta.diasRestantes} días`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-red-300">Vence: {alerta.fecha}</span>
                        <span className="text-xs font-bold text-red-200">{Number(alerta.cantidad).toFixed(1)} {alerta.unidad} res.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl shadow-xl border flex flex-col justify-between relative overflow-hidden group bg-slate-900 border-slate-800 text-white">
              {/* Elemento de diseño de fondo simple */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full mix-blend-screen filter blur-[80px] opacity-40 bg-blue-500"></div>
              
              <div className="relative z-10">
                <div className="inline-flex px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-widest uppercase mb-4 border border-white/5 text-slate-200">
                  Estado Operativo
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-3 text-white">
                  Sistemas en Orden
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Insumia está registrando automáticamente las ventas, descontando los gramos de tus insumos, y vigilando tu stock y mermas en tiempo real.
                </p>
                
                <ul className="space-y-3">
                    <li className="flex items-center text-sm font-medium text-slate-200">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mr-4 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                      Inventario sincronizado
                    </li>
                    <li className="flex items-center text-sm font-medium text-slate-200">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-4 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
                      Costos de recetas calculados
                    </li>
                    <li className="flex items-center text-sm font-medium text-slate-200">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-4 shadow-[0_0_8px_rgba(192,132,252,0.8)]"></div>
                      Auditoría Kardex activa
                    </li>
                </ul>
              </div>
              
              <Link to="/ventas" className="relative z-10 mt-8 font-bold py-3.5 px-6 rounded-2xl transition-all duration-300 text-center flex items-center justify-center group/btn active:scale-95 shadow-md hover:shadow-lg text-white bg-blue-600 hover:bg-blue-500">
                <span>Ir al Punto de Venta</span>
                <ChevronRight size={18} className="ml-2 opacity-70 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

        </motion.div>
      </div>
    </motion.div>
  );
};
