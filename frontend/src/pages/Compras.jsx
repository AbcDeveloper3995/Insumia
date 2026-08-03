import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { comprasService } from '../services/api/compras';
import { insumosService } from '../services/api/insumos';
import { cajaService } from '../services/api/caja';
import { motion } from 'framer-motion';
import { Truck, ShoppingCart, Plus, CheckCircle2, AlertTriangle, Building, Search, X, Wallet, Edit, Trash2, Save } from 'lucide-react';
import { supabase } from '../services/api/client';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/Loading';
import { UNIDADES } from '../constants';

export const Compras = () => {
  const { session } = useAuth();
  
  const [activeTab, setActiveTab] = useState('historial'); // 'historial', 'registrar', 'proveedores'
  
  // Data
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [cajaActiva, setCajaActiva] = useState(null);
  const [loading, setLoading] = useState(true);

  // Registro de Proveedor
  const [nuevoProveedor, setNuevoProveedor] = useState('');
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  
  // Registro de Compra
  const [compraForm, setCompraForm] = useState({ proveedor_id: '', pagarDeCaja: false });
  const [carrito, setCarrito] = useState([]); // { insumo, cantidad, precio_unitario }
  const [insumoSearch, setInsumoSearch] = useState('');

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

      const provs = await comprasService.getProveedores(restauranteId);
      setProveedores(provs);
      
      const comps = await comprasService.getCompras(restauranteId);
      setCompras(comps);
      
      const ins = await insumosService.getInsumos(restauranteId);
      setInsumos(ins);
      
      const caja = await cajaService.getCajaAbierta(restauranteId);
      setCajaActiva(caja);
    } catch (error) {
      console.error('Error loading compras data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) loadData();
  }, [session?.user?.id]);

  // Manejo de Proveedores
  const handleAddProveedor = async (e) => {
      e.preventDefault();
      if (!nuevoProveedor.trim()) return;
      try {
          const { data: userData } = await supabase.from('usuarios').select('restaurante_id').eq('id', session.user.id).single();
          const restauranteId = userData.restaurante_id;

          await comprasService.createProveedor(restauranteId, { nombre: nuevoProveedor.trim() });
          setNuevoProveedor('');
          const provs = await comprasService.getProveedores(restauranteId);
          setProveedores(provs);
          toast.success('Proveedor guardado');
      } catch (err) {
          toast.error('Error al guardar proveedor');
      }
  };

  const handleEditProveedor = (p) => {
      setEditingProveedor(p.id);
      setEditNombre(p.nombre);
  };

  const handleSaveEditProveedor = async (id) => {
      if (!editNombre.trim()) return;
      try {
          await comprasService.updateProveedor(id, { nombre: editNombre.trim() });
          const { data: userData } = await supabase.from('usuarios').select('restaurante_id').eq('id', session.user.id).single();
          const provs = await comprasService.getProveedores(userData.restaurante_id);
          setProveedores(provs);
          setEditingProveedor(null);
          toast.success('Proveedor actualizado');
      } catch (err) {
          toast.error('Error al actualizar proveedor');
      }
  };

  const handleDeleteProveedor = async (id) => {
      if (window.confirm('¿Seguro que deseas eliminar este proveedor?')) {
          try {
              await comprasService.deleteProveedor(id);
              const { data: userData } = await supabase.from('usuarios').select('restaurante_id').eq('id', session.user.id).single();
              const provs = await comprasService.getProveedores(userData.restaurante_id);
              setProveedores(provs);
              toast.success('Proveedor eliminado');
          } catch (err) {
              toast.error('Error al eliminar proveedor');
          }
      }
  };

  // Carrito de Compra
  const agregarAlCarrito = (insumo) => {
      if (carrito.find(item => item.insumo.id === insumo.id)) return;
      setCarrito([...carrito, { 
          insumo, 
          cantidad_presentacion: 1, 
          formato: 'Base', 
          unidades_por_presentacion: 1, 
          costo_total: insumo.ultimo_costo_base || 0 
      }]);
      setInsumoSearch('');
  };

  const updateCarrito = (insumoId, field, value) => {
      setCarrito(carrito.map(item => {
          if (item.insumo.id === insumoId) {
              const updated = { ...item, [field]: value };
              // Ensure numeric fields are numbers
              if (['cantidad_presentacion', 'unidades_por_presentacion', 'costo_total'].includes(field)) {
                  updated[field] = Number(value);
              }
              return updated;
          }
          return item;
      }));
  };

  const handleFormatoChange = (insumo, newFormato) => {
      let nuevasUnidades = 1;
      const base = insumo.unidad_medida.toLowerCase();
      const f = newFormato.toLowerCase();
      
      // Auto-conversiones métricas
      if (f === 'kg' && base === 'g') nuevasUnidades = 1000;
      else if (f === 'l' && base === 'ml') nuevasUnidades = 1000;
      else if (f === 'g' && base === 'kg') nuevasUnidades = 0.001;
      else if (f === 'ml' && base === 'l') nuevasUnidades = 0.001;
      
      setCarrito(carrito.map(item => {
          if (item.insumo.id === insumo.id) {
              return { ...item, formato: newFormato, unidades_por_presentacion: nuevasUnidades };
          }
          return item;
      }));
  };

  const removeCarrito = (insumoId) => {
      setCarrito(carrito.filter(item => item.insumo.id !== insumoId));
  };

  const totalCompra = carrito.reduce((acc, curr) => acc + (curr.costo_total || 0), 0);

  // Guardar Compra
  const handleRegistrarCompra = async () => {
      if (!compraForm.proveedor_id || carrito.length === 0) return toast.error('Selecciona proveedor e insumos.');
      
      if (compraForm.pagarDeCaja && !cajaActiva) {
          return toast.error('No hay caja abierta para realizar el pago.');
      }

      try {
          const { data: userData } = await supabase.from('usuarios').select('restaurante_id').eq('id', session.user.id).single();
          const restauranteId = userData.restaurante_id;

          const estado = compraForm.pagarDeCaja ? 'pagada' : 'pendiente';
          const cajaId = compraForm.pagarDeCaja ? cajaActiva.id : null;
          
          const detalles = carrito.map(item => {
              const cantidadReal = item.formato === 'Base' ? item.cantidad_presentacion : (item.cantidad_presentacion * item.unidades_por_presentacion);
              return {
                  insumo_id: item.insumo.id,
                  cantidad: cantidadReal,
                  precio_unitario: cantidadReal > 0 ? (item.costo_total / cantidadReal) : 0
              };
          });

          await comprasService.registrarCompra(restauranteId, compraForm.proveedor_id, estado, detalles, cajaId);
          
          toast.success('Compra registrada con éxito!');
          setCarrito([]);
          setCompraForm({ proveedor_id: '', pagarDeCaja: false });
          setActiveTab('historial');
          loadData();
      } catch (err) {
          console.error(err);
          toast.error('Error al registrar compra');
      }
  };
  
  // Pagar cuenta pendiente
  const handlePagarCuenta = async (compraId) => {
      if (!cajaActiva) return toast.error('Debes abrir caja para pagar en efectivo.');
      if (window.confirm('¿Pagar esta cuenta pendiente usando el efectivo de la caja actual?')) {
          try {
              await comprasService.marcarCompraComoPagada(compraId, cajaActiva.id);
              toast.success('Cuenta pagada');
              loadData();
          } catch (err) {
              toast.error('Error al pagar');
          }
      }
  };

  const filteredInsumos = insumos.filter(i => i.nombre.toLowerCase().includes(insumoSearch.toLowerCase()));

  if (loading) return <LoadingSpinner text="Cargando historial de compras..." />;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-full w-full bg-slate-50/50 overflow-hidden rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Compras y Proveedores</h1>
              <p className="text-slate-500 mt-1 text-sm">Gestiona el reabastecimiento de tu inventario y cuentas por pagar.</p>
          </div>
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
              <button onClick={() => setActiveTab('historial')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'historial' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>Historial</button>
              <button onClick={() => setActiveTab('registrar')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'registrar' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>Nueva Compra</button>
              <button onClick={() => setActiveTab('proveedores')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'proveedores' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>Proveedores</button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto">
          {/* PESTAÑA HISTORIAL Y CUENTAS POR PAGAR */}
          {activeTab === 'historial' && (
              <div className="space-y-6">
                  {/* Alerta de cuentas por pagar */}
                  {compras.filter(c => c.estado === 'pendiente').length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-4">
                          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" />
                          <div>
                              <h3 className="text-amber-800 font-bold text-sm">Tienes cuentas por pagar pendientes</h3>
                              <p className="text-amber-700 text-sm mt-1">Algunas compras se registraron pero no se pagaron en su momento. Paga estas deudas usando la caja activa.</p>
                          </div>
                      </div>
                  )}

                  {compras.length === 0 ? (
                      <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-6 lg:p-8 flex flex-col items-center shadow-sm text-center">
                          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                              <ShoppingCart size={32} strokeWidth={1.5} />
                          </div>
                          <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Bienvenido a Compras</h2>
                          <p className="text-slate-500 text-base max-w-2xl mb-8 leading-relaxed">
                              Este módulo te permite registrar la mercancía que entra al restaurante. Al registrar una compra, Insumia actualizará tu inventario automáticamente y llevará el control de tus deudas.
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-8">
                              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                  <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl mb-3 inline-block"><Building size={20} /></div>
                                  <h4 className="font-bold text-slate-800 mb-1">1. Proveedores</h4>
                                  <p className="text-xs text-slate-500">Agrega a las empresas o personas que te surten (Ej. Frutería, Coca-Cola).</p>
                              </div>
                              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                  <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl mb-3 inline-block"><ShoppingCart size={20} /></div>
                                  <h4 className="font-bold text-slate-800 mb-1">2. Facturas</h4>
                                  <p className="text-xs text-slate-500">Busca tus insumos, ponles el costo y guárdalos. El inventario subirá de inmediato.</p>
                              </div>
                              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                  <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl mb-3 inline-block"><Wallet size={20} /></div>
                                  <h4 className="font-bold text-slate-800 mb-1">3. Pago y Deudas</h4>
                                  <p className="text-xs text-slate-500">Puedes pagar la mercancía sacando dinero de tu Caja al instante, o dejarla como "Por Pagar".</p>
                              </div>
                          </div>
                          <button onClick={() => setActiveTab('registrar')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-base shadow-md hover:bg-blue-700 transition-all active:scale-95">
                              Registrar Primera Compra
                          </button>
                      </div>
                  ) : (
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <table className="w-full text-left">
                              <thead>
                                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase font-bold">
                                      <th className="py-4 px-6">Fecha</th>
                                      <th className="py-4 px-6">Proveedor</th>
                                      <th className="py-4 px-6 text-right">Total</th>
                                      <th className="py-4 px-6 text-center">Estado</th>
                                      <th className="py-4 px-6 text-center">Acciones</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {compras.map(c => (
                                      <tr key={c.id} className="hover:bg-slate-50/50">
                                          <td className="py-4 px-6 text-sm text-slate-600">{new Date(c.fecha).toLocaleDateString()}</td>
                                          <td className="py-4 px-6 text-sm font-bold text-slate-800">{c.proveedores?.nombre}</td>
                                          <td className="py-4 px-6 text-sm font-bold text-slate-800 text-right">${Number(c.total).toFixed(2)}</td>
                                          <td className="py-4 px-6 text-center">
                                              <span className={`text-xs font-bold px-3 py-1 rounded-full ${c.estado === 'pagada' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                  {c.estado.toUpperCase()}
                                              </span>
                                          </td>
                                          <td className="py-4 px-6 text-center">
                                              {c.estado === 'pendiente' && (
                                                  <button onClick={() => handlePagarCuenta(c.id)} className="text-xs font-bold bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 px-3 py-1.5 rounded-lg transition-colors">
                                                      Pagar (Efectivo)
                                                  </button>
                                              )}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  )}
              </div>
          )}

          {/* PESTAÑA REGISTRAR COMPRA */}
          {activeTab === 'registrar' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col h-full overflow-y-auto">
                      <h2 className="text-lg font-bold text-slate-800 mb-4">Seleccionar Insumos</h2>
                      
                      <div className="relative mb-6">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input type="text" placeholder="Buscar insumo..." value={insumoSearch} onChange={e => setInsumoSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {filteredInsumos.map(insumo => (
                              <div key={insumo.id} onClick={() => agregarAlCarrito(insumo)} className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all flex justify-between items-center group">
                                  <div>
                                      <p className="font-bold text-slate-800 text-sm group-hover:text-blue-800">{insumo.nombre}</p>
                                      <p className="text-xs text-slate-500">{insumo.unidad_medida}</p>
                                  </div>
                                  <Plus className="text-slate-300 group-hover:text-blue-500" size={18} />
                              </div>
                          ))}
                          {filteredInsumos.length === 0 && <p className="text-slate-400 text-sm col-span-3 text-center py-4">No se encontraron insumos.</p>}
                      </div>
                  </div>

                  <div className="bg-slate-800 rounded-2xl p-6 text-white flex flex-col">
                      <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><ShoppingCart size={20}/> Factura</h2>
                      
                      <select value={compraForm.proveedor_id} onChange={e => setCompraForm({...compraForm, proveedor_id: e.target.value})} className="w-full bg-slate-700/50 border border-slate-600 px-4 py-3 rounded-xl text-white focus:outline-none focus:border-blue-400 mb-6 font-semibold cursor-pointer hover:bg-slate-700 transition-colors appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat">
                          <option value="">-- Seleccionar Proveedor --</option>
                          {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>

                      <div className="flex-1 overflow-y-auto space-y-4 mb-6">
                          {carrito.length === 0 ? <p className="text-slate-400 text-sm text-center">Carrito vacío.</p> : (
                              carrito.map(item => (
                                  <div key={item.insumo.id} className="bg-slate-700/30 p-3 rounded-xl">
                                      <div className="flex justify-between items-center mb-2">
                                          <p className="font-bold text-sm">{item.insumo.nombre}</p>
                                          <button onClick={() => removeCarrito(item.insumo.id)} className="text-slate-400 hover:text-rose-400"><X size={16}/></button>
                                      </div>
                                      <div className="flex flex-col gap-3">
                                          <div className="flex gap-3">
                                              <div className="flex-[0.5]">
                                                  <label className="text-[10px] text-slate-400 uppercase font-bold">{item.formato === 'Base' ? `Comprando (${item.insumo.unidad_medida})` : `Comprando (${item.formato}s)`}</label>
                                                  <input type="number" min="0.01" step="0.01" value={item.cantidad_presentacion} onChange={e => updateCarrito(item.insumo.id, 'cantidad_presentacion', e.target.value)} className="w-full bg-slate-900 border border-slate-600 px-3 py-2 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
                                              </div>
                                              <div className="flex-1">
                                                  <label className="text-[10px] text-slate-400 uppercase font-bold">Formato de Compra</label>
                                                  <select value={item.formato} onChange={e => handleFormatoChange(item.insumo, e.target.value)} className="w-full bg-slate-900 border border-slate-600 px-3 py-2 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none appearance-none">
                                                      <option value="Base">Por {item.insumo.unidad_medida} (Medida Base)</option>
                                                      {Object.values(UNIDADES)
                                                        .filter(u => u !== item.insumo.unidad_medida)
                                                        .map(u => (
                                                          <option key={u} value={u}>Por {u.charAt(0).toUpperCase() + u.slice(1)}</option>
                                                        ))
                                                      }
                                                  </select>
                                              </div>
                                          </div>
                                          
                                          <div className="flex gap-3">
                                              {!['base', 'kg', 'g', 'l', 'ml'].includes(item.formato.toLowerCase()) && (
                                                  <div className="flex-1">
                                                      <label className="text-[10px] text-slate-400 uppercase font-bold">¿Cuánto trae 1 {item.formato}? ({item.insumo.unidad_medida})</label>
                                                      <input type="number" min="0.01" step="0.01" value={item.unidades_por_presentacion} onChange={e => updateCarrito(item.insumo.id, 'unidades_por_presentacion', e.target.value)} className="w-full bg-slate-900 border border-slate-600 px-3 py-2 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
                                                  </div>
                                              )}
                                              <div className="flex-1">
                                                  <label className="text-[10px] text-slate-400 uppercase font-bold">Costo Total Lote ($)</label>
                                                  <input type="number" min="0" step="0.01" value={item.costo_total} onChange={e => updateCarrito(item.insumo.id, 'costo_total', e.target.value)} className="w-full bg-slate-900 border border-slate-600 px-3 py-2 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
                                              </div>
                                          </div>
                                      </div>
                                      <div className="mt-3 pt-3 border-t border-slate-600 flex justify-between items-center">
                                          <p className="text-[11px] text-emerald-400 font-bold">
                                              +{item.formato === 'Base' ? item.cantidad_presentacion : (item.cantidad_presentacion * item.unidades_por_presentacion)} {item.insumo.unidad_medida} al inventario
                                          </p>
                                          <p className="text-[11px] text-slate-400">
                                              Costo Unit: <span className="font-bold text-slate-300">${(item.cantidad_presentacion > 0 && (item.formato === 'Base' ? true : item.unidades_por_presentacion > 0)) ? (item.costo_total / (item.formato === 'Base' ? item.cantidad_presentacion : (item.cantidad_presentacion * item.unidades_por_presentacion))).toFixed(2) : '0.00'}</span> / {item.insumo.unidad_medida}
                                          </p>
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>

                      <div className="pt-4 border-t border-slate-700 mb-6">
                          <div className="flex justify-between items-center mb-6">
                              <span className="text-slate-400 font-bold uppercase tracking-wider text-sm">Total:</span>
                              <span className="text-3xl font-black">${totalCompra.toFixed(2)}</span>
                          </div>

                          <div className={`bg-slate-700/50 p-4 rounded-xl flex items-center justify-between mb-4 border ${!cajaActiva ? 'border-rose-900/50 opacity-75' : 'border-slate-600'}`}>
                              <div>
                                  <p className="font-bold text-sm flex items-center gap-2">
                                      Pagar de la Caja Actual
                                      {!cajaActiva && <span className="bg-rose-500/20 text-rose-300 text-[10px] px-2 py-0.5 rounded-md uppercase">Caja Cerrada</span>}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-tight">Si activas esto, se descontará del efectivo de hoy. Si lo dejas apagado, quedará como "Cuenta por Pagar".</p>
                              </div>
                              <label className={`relative inline-flex items-center ${!cajaActiva ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                  <input type="checkbox" disabled={!cajaActiva} checked={compraForm.pagarDeCaja} onChange={e => setCompraForm({...compraForm, pagarDeCaja: e.target.checked})} className="sr-only peer" />
                                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                              </label>
                          </div>
                      </div>

                      <button onClick={handleRegistrarCompra} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                          Registrar Compra
                      </button>
                  </div>
              </div>
          )}

          {/* PESTAÑA PROVEEDORES */}
          {activeTab === 'proveedores' && (
              <div className="max-w-2xl">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 flex items-end gap-4">
                      <div className="flex-1">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Nuevo Proveedor</label>
                          <input type="text" value={nuevoProveedor} onChange={e => setNuevoProveedor(e.target.value)} placeholder="Ej. Frutería Central" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <button onClick={handleAddProveedor} disabled={!nuevoProveedor.trim()} className={`font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${!nuevoProveedor.trim() ? 'bg-blue-300 text-blue-50 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-md active:scale-95'}`}>
                          <Plus size={18} /> Agregar
                      </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
                          <Building size={18} className="text-slate-400" /> Directorio de Proveedores
                      </div>
                      <ul className="divide-y divide-slate-100">
                          {proveedores.length === 0 ? (
                              <li className="p-6 text-center text-slate-400 text-sm">No tienes proveedores registrados.</li>
                          ) : (
                              proveedores.map(p => (
                                  <li key={p.id} className="p-4 hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-between group">
                                      {editingProveedor === p.id ? (
                                          <div className="flex-1 flex gap-2 mr-4">
                                              <input type="text" value={editNombre} onChange={e => setEditNombre(e.target.value)} className="flex-1 bg-white border border-slate-300 px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none" autoFocus />
                                              <button onClick={() => handleSaveEditProveedor(p.id)} className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 cursor-pointer"><Save size={16} /></button>
                                              <button onClick={() => setEditingProveedor(null)} className="p-1.5 text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"><X size={16} /></button>
                                          </div>
                                      ) : (
                                          <>
                                              <span>{p.nombre}</span>
                                              <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                                  <button onClick={() => handleEditProveedor(p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer"><Edit size={16} /></button>
                                                  <button onClick={() => handleDeleteProveedor(p.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"><Trash2 size={16} /></button>
                                              </div>
                                          </>
                                      )}
                                  </li>
                              ))
                          )}
                      </ul>
                  </div>
              </div>
          )}
      </div>
    </motion.div>
  );
};
