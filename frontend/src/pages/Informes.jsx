import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  Download
} from 'lucide-react';
import { ventasService } from '../services/api/ventas';
import { recetasService } from '../services/api/recetas';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export const Informes = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);
  const [totals, setTotals] = useState({
    ventasTotales: 0,
    ingresoBruto: 0,
    gananciaNeta: 0
  });

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        
        // Cargar recetas activas
        const recetas = await recetasService.getRecetas();
        const recetasActivas = recetas?.filter(r => !r.es_subreceta && Number(r.precio_venta) > 0) || [];
        
        // Cargar todas las ventas (histórico)
        const productosData = await ventasService.getVentasPorPlatillo();
        
        let ventasTotales = 0;
        let ingresoBruto = 0;
        let gananciaNeta = 0;
        
        const data = [];

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
             
             data.push({
               id: receta.id,
               nombre: receta.nombre,
               cantidad: item.cantidad,
               precioVenta: precioVenta,
               costoInsumos: costoUnitario,
               gananciaUnitaria: gananciaUnitaria,
               ingresoBruto: ingresoTotalItem,
               gananciaTotal: gananciaTotalItem,
               margen: (gananciaUnitaria / precioVenta) * 100
             });
           }
        });

        // Ordenar por ganancia total descendente
        data.sort((a, b) => b.gananciaTotal - a.gananciaTotal);

        setReportData(data);
        setTotals({
          ventasTotales,
          ingresoBruto,
          gananciaNeta
        });

      } catch (error) {
        console.error('Error cargando Informes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, []);

  const COLORS = ['#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981'];

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
        
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Informes y Rentabilidad</h1>
            <p className="text-slate-500 mt-1 text-sm">Análisis detallado de ventas, costos y ganancias reales por platillo.</p>
          </div>
          <div className="flex items-center gap-3">
            {loading && (
              <div className="flex items-center text-slate-400 text-sm font-medium mr-4">
                <div className="animate-pulse flex items-center">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
                  Analizando datos...
                </div>
              </div>
            )}
            <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
              <Download size={16} />
              Exportar CSV
            </button>
          </div>
        </div>
        
        {/* KPIs Resumen */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
        >
          {/* KPI 1 */}
          <motion.div variants={itemVariants}>
            <div className="bg-white/70 backdrop-blur-md p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Platillos Vendidos</p>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shadow-sm">
                  <ShoppingCart size={20} strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-4xl font-black text-slate-800 tracking-tighter">
                {totals.ventasTotales}
              </h3>
            </div>
          </motion.div>

          {/* KPI 2 */}
          <motion.div variants={itemVariants}>
            <div className="bg-white/70 backdrop-blur-md p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Ingreso Bruto</p>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm">
                  <DollarSign size={20} strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-4xl font-black text-slate-800 tracking-tighter">
                ${totals.ingresoBruto.toFixed(2)}
              </h3>
            </div>
          </motion.div>

          {/* KPI 3: Ganancia Neta Total */}
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-7 rounded-3xl shadow-[0_8px_30px_rgb(14,165,233,0.2)] border border-sky-400 text-white flex flex-col justify-between h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full mix-blend-overlay filter blur-[60px] opacity-20"></div>
              <div className="flex justify-between items-start mb-2 relative z-10">
                <p className="text-xs font-bold text-sky-100 tracking-widest uppercase">Ganancia Neta Total</p>
                <div className="p-2.5 bg-white/20 text-white rounded-2xl shadow-sm">
                  <TrendingUp size={20} strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-4xl font-black text-white tracking-tighter relative z-10 truncate" title={`$${totals.gananciaNeta.toFixed(2)}`}>
                ${totals.gananciaNeta.toFixed(2)}
              </h3>
            </div>
          </motion.div>
        </motion.div>

        {/* Contenido Principal: Gráfico y Tabla */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Gráfico de Ganancias (1 Columna en XL) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="xl:col-span-1 bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col"
          >
            <div className="flex items-center mb-6">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-lg mr-3 shadow-sm">
                <BarChart3 size={18} strokeWidth={2.5} />
              </div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Top Ganancias</h2>
            </div>
            
            <div className="flex-1 min-h-[300px] w-full">
              {loading ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">Cargando gráfico...</div>
              ) : reportData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm text-center px-4">
                  No hay datos suficientes para generar el gráfico.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reportData.slice(0, 5)}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} width={100} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 600 }}
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Ganancia']}
                    />
                    <Bar dataKey="gananciaTotal" name="Ganancia Neta" radius={[0, 6, 6, 0]} barSize={24}>
                      {reportData.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Tabla Detallada (2 Columnas en XL) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="xl:col-span-2 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Desglose por Platillo</h2>
              <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                {reportData.length} registros
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Platillo</th>
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
                      <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">
                        Calculando rentabilidad...
                      </td>
                    </tr>
                  ) : reportData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">
                        No hay ventas registradas aún.
                      </td>
                    </tr>
                  ) : (
                    reportData.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-4 px-6">
                          <p className="text-sm font-bold text-slate-800">{row.nombre}</p>
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
                      <td className="py-4 px-6 text-sm font-black text-slate-800 text-right">Total</td>
                      <td className="py-4 px-6 text-center text-sm font-black text-slate-800">{totals.ventasTotales}</td>
                      <td colSpan="3"></td>
                      <td className="py-4 px-6 text-right text-sm font-black text-sky-600">${totals.gananciaNeta.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
};
