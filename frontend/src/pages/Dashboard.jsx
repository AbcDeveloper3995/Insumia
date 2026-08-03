import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertCircle, ChefHat, BarChart2, ChevronRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { insumosService } from '../services/api/insumos';
import { recetasService } from '../services/api/recetas';
import { ventasService } from '../services/api/ventas';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '../components/ui/Loading';

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    insumosCount: 0,
    alertasStock: 0,
    recetasCount: 0,
    ventasHoy: 0,
    gananciaTotal: 0
  });
  const [topProductos, setTopProductos] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // 1. Cargar Insumos
        const insumos = await insumosService.getInsumos();
        const alertas = insumos?.filter(i => i.cantidad_actual_base <= i.umbral_minimo) || [];
        
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

        setStats({
          insumosCount: insumos?.length || 0,
          alertasStock: alertas.length,
          recetasCount: recetasActivas.length,
          ventasHoy: ventasHoyData?.length || 0,
          gananciaTotal
        });

        setTopProductos(top5);
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
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Panel Principal</h1>
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

          {/* KPI 2 */}
          <motion.div variants={itemVariants}>
            <div className="bg-white/70 backdrop-blur-md p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 hover:border-amber-200 hover:shadow-[0_8px_30px_rgb(245,158,11,0.1)] hover:-translate-y-1 transition-all duration-300 block group relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Alertas Stock</p>
                    <div className="relative flex items-center group/tooltip">
                      <Info size={14} className="text-slate-400 hover:text-amber-500 transition-colors cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10 text-center pointer-events-none">
                        Insumos que se encuentran por debajo o en su nivel mínimo de stock.
                      </div>
                    </div>
                  </div>
                  <h3 className={`text-4xl font-black tracking-tighter transition-colors ${stats.alertasStock > 0 ? 'text-amber-500 group-hover:text-amber-600' : 'text-slate-800 group-hover:text-amber-500'}`}>
                    {stats.alertasStock}
                  </h3>
                </div>
                <div className={`p-3.5 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm ${stats.alertasStock > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                  <AlertCircle size={24} strokeWidth={2.5} />
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
            <div className="bg-white/70 backdrop-blur-md p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 hover:border-sky-200 hover:shadow-[0_8px_30px_rgb(14,165,233,0.1)] hover:-translate-y-1 transition-all duration-300 block group relative">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Ganancia Total</p>
                    <div className="relative flex items-center group/tooltip">
                      <Info size={14} className="text-slate-400 hover:text-sky-500 transition-colors cursor-help" />
                      <div className="absolute bottom-full right-0 md:left-1/2 md:-translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10 text-center pointer-events-none">
                        Beneficio neto histórico (precio de venta - costo de insumos) acumulado.
                      </div>
                    </div>
                  </div>
                  <h3 className="text-4xl font-black text-slate-800 tracking-tighter group-hover:text-sky-600 transition-colors truncate" title={`$${stats.gananciaTotal.toFixed(2)}`}>
                    ${stats.gananciaTotal.toFixed(2)}
                  </h3>
                </div>
                <div className="p-3.5 bg-sky-50 text-sky-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm ml-2 flex-shrink-0">
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
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100">
            <div className="flex items-center mb-8">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl mr-4 shadow-sm">
                <BarChart2 size={20} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Top 5 Productos Más Vendidos</h2>
            </div>
            
            {loading ? (
              <div className="h-64"><LoadingSpinner text="Generando gráficos..." /></div>
            ) : topProductos.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Aún no hay ventas registradas para generar gráficos.
              </div>
            ) : (
              <div className="h-72 w-full">
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

          {/* Panel Auxiliar Informativo (Bento Box) */}
          <div className="bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 text-white flex flex-col justify-between relative overflow-hidden group">
            
            {/* Elemento de diseño de fondo simple */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40"></div>
            
            <div className="relative z-10">
              <div className="inline-flex px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-widest uppercase mb-4 border border-white/5 text-slate-200">
                Estado Operativo
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-3 text-white">Todo en Orden</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-8">
                Insumia está registrando automáticamente las ventas, descontando los gramos de tus insumos, y vigilando tu stock. 
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-center text-sm font-medium text-slate-200">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-4 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                  Inventario sincronizado
                </li>
                <li className="flex items-center text-sm font-medium text-slate-200">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-4 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
                  Costos calculados
                </li>
                <li className="flex items-center text-sm font-medium text-slate-200">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-4 shadow-[0_0_8px_rgba(192,132,252,0.8)]"></div>
                  Monitor de mermas activo
                </li>
              </ul>
            </div>
            
            <Link to="/ventas" className="relative z-10 mt-10 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-6 rounded-2xl transition-all duration-300 text-center flex items-center justify-center group/btn active:scale-95 shadow-md hover:shadow-lg">
              <span>Ir al Punto de Venta</span>
              <ChevronRight size={18} className="ml-2 opacity-70 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>

        </motion.div>
      </div>
    </motion.div>
  );
};
