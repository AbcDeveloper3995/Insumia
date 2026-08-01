import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertCircle, ChefHat, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { insumosService } from '../services/api/insumos';
import { recetasService } from '../services/api/recetas';
import { ventasService } from '../services/api/ventas';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    insumosCount: 0,
    alertasStock: 0,
    recetasCount: 0,
    ventasHoy: 0
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
        const top5 = productosData.slice(0, 5);

        setStats({
          insumosCount: insumos?.length || 0,
          alertasStock: alertas.length,
          recetasCount: recetasActivas.length,
          ventasHoy: ventasHoyData?.length || 0
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

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm">
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
        
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* KPI 1 */}
          <Link to="/inventario" className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer block group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-400 mb-1 tracking-wide uppercase">Insumos</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
                  {stats.insumosCount}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                <Package size={24} />
              </div>
            </div>
          </Link>

          {/* KPI 2 */}
          <Link to="/inventario" className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all cursor-pointer block group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-400 mb-1 tracking-wide uppercase">Alertas Stock</p>
                <h3 className={`text-3xl font-black tracking-tight transition-colors ${stats.alertasStock > 0 ? 'text-amber-500 group-hover:text-amber-600' : 'text-slate-800 group-hover:text-amber-500'}`}>
                  {stats.alertasStock}
                </h3>
              </div>
              <div className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${stats.alertasStock > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                <AlertCircle size={24} />
              </div>
            </div>
          </Link>

          {/* KPI 3 */}
          <Link to="/recetas" className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer block group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-400 mb-1 tracking-wide uppercase">Menú Activo</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
                  {stats.recetasCount}
                </h3>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                <ChefHat size={24} />
              </div>
            </div>
          </Link>

          {/* KPI 4 */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-400 mb-1 tracking-wide uppercase">Ventas Hoy</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                  {stats.ventasHoy}
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

        </div>

        {/* Gráficos y Tablas Auxiliares */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Gráfico de Barras: Top Productos */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-3">
                <BarChart2 size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Top 5 Productos Más Vendidos</h2>
            </div>
            
            {loading ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Cargando gráfico...</div>
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

          {/* Panel Auxiliar Informativo */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl shadow-lg border border-slate-700 text-white flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">¡Tu restaurante está funcionando!</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Insumia está registrando automáticamente las ventas del POS, descontando los gramos de tus insumos, y alertándote si te quedas sin stock. 
              </p>
              
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-slate-200">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3"></div>
                  Inventario descontándose en tiempo real
                </li>
                <li className="flex items-center text-sm text-slate-200">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></div>
                  Costos de recetas bajo control
                </li>
                <li className="flex items-center text-sm text-slate-200">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-3"></div>
                  Alertas de compras automatizadas
                </li>
              </ul>
            </div>
            
            <Link to="/ventas" className="mt-8 bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-6 rounded-xl transition-colors text-center shadow-lg shadow-blue-500/20">
              Ir al Punto de Venta
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
