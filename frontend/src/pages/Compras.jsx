import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { comprasService } from '../services/api/compras';
import { insumosService } from '../services/api/insumos';
import { cajaService } from '../services/api/caja';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, AlertTriangle, Building, Search, X, Wallet, Edit, Trash2, Save, Info } from 'lucide-react';
import { supabase } from '../services/api/client';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/Loading';
import { Modal } from '../components/common/Modal';
import { CompraForm } from '../components/compras/CompraForm';
import { useTour } from '../context/TourContext';

export const Compras = () => {
  const { session, currentRestaurant } = useAuth();
  
  // Data
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [cajaActiva, setCajaActiva] = useState(null);
  const [loading, setLoading] = useState(true);

  // Registro de Proveedor
  const [isAddingProveedor, setIsAddingProveedor] = useState(false);
  const [nuevoProveedor, setNuevoProveedor] = useState('');
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  
  // Modal de Registro de Compra
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compraToPay, setCompraToPay] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!session?.user?.id) return;
      
      const restauranteId = currentRestaurant?.id;
      if (!restauranteId) return;

      const provs = await comprasService.getProveedores(restauranteId);
      setProveedores(provs);
      
      const comps = await comprasService.getCompras(restauranteId);
      setCompras(comps);
      
      const ins = await insumosService.getInsumos(restauranteId);
      setInsumos((ins || []).filter(i => i.activo !== false));
      
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

  const { registerPageTour } = useTour();

  useEffect(() => {
    registerPageTour('compras', [
      {
        target: '.tour-compras-nuevo-proveedor',
        content: 'Para comenzar, registra en este directorio a las empresas o proveedores que te surten mercancía. Sin ellos, no podrás asentar una compra.',
        disableBeacon: true,
      },
      {
        target: '.tour-compras-add',
        content: 'Haz clic aquí para crear una nueva factura o registro de compra. Todo lo que adquieras actualizará automáticamente tu nivel de inventario.',
      },
      {
        target: '.tour-compras-historial',
        content: 'Aquí verás todo tu historial de adquisiciones. Las compras registradas como "Pendientes" te recordarán que debes liquidarlas después usando el saldo de caja.',
      }
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manejo de Proveedores
  const handleAddProveedor = async (e) => {
      e.preventDefault();
      if (!nuevoProveedor.trim()) return;
      try {
          const restauranteId = currentRestaurant?.id;

          await comprasService.createProveedor(restauranteId, { nombre: nuevoProveedor.trim() });
          setNuevoProveedor('');
          setIsAddingProveedor(false);
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
          const provs = await comprasService.getProveedores(currentRestaurant?.id);
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
              const provs = await comprasService.getProveedores(currentRestaurant?.id);
              setProveedores(provs);
              toast.success('Proveedor eliminado');
          } catch (err) {
              toast.error('Error al eliminar proveedor');
          }
      }
  };

  // Guardar Compra (desde el Modal)
  const handleRegistrarCompra = async (formData) => {
      const { proveedor_id, pagarDeCaja, carrito } = formData;
      
      try {
          setIsSubmitting(true);
          const restauranteId = currentRestaurant?.id;

          const estado = pagarDeCaja ? 'pagada' : 'pendiente';
          const cajaId = pagarDeCaja ? cajaActiva.id : null;
          
          const detalles = [];
          
          // Primero, procesamos el carrito. Si hay insumos nuevos, los creamos.
          for (const item of carrito) {
             let finalInsumoId = item.insumo.id;

             if (item.isNew) {
                const nuevoInsumoData = {
                  restaurante_id: restauranteId,
                  nombre: item.insumo.nombre,
                  unidad_compra: item.insumo.unidad_compra,
                  unidad_base: item.insumo.unidad_base,
                  factor_conversion: item.insumo.factor_conversion,
                  porcentaje_rendimiento: item.insumo.porcentaje_rendimiento,
                  umbral_minimo: item.insumo.umbral_minimo,
                  dias_alerta_caducidad: item.insumo.dias_alerta_caducidad,
                  costo_unidad_compra: 0
                };
                
                const createdInsumo = await insumosService.createInsumo(nuevoInsumoData);
                finalInsumoId = createdInsumo.id;
             }

             detalles.push({
                insumo_id: finalInsumoId,
                cantidad: item.cantidad,
                precio_unitario: item.cantidad > 0 ? (item.costo_total / item.cantidad) : 0,
                fecha_caducidad: item.fecha_caducidad // Guardamos la caducidad (se procesará en registrarCompra)
             });
          }

          // Nota: comprasService.registrarCompra deberá manejar 'fecha_caducidad' si está implementado, 
          // actualmente lo pasamos en el detalle.
          await comprasService.registrarCompra(restauranteId, proveedor_id, estado, detalles, cajaId);
          
          toast.success('¡Compra registrada con éxito!');
          setIsModalOpen(false);
          loadData();
          window.dispatchEvent(new Event('refreshAlerts'));
      } catch (err) {
          console.error(err);
          toast.error('Error al registrar compra');
      } finally {
          setIsSubmitting(false);
      }
  };
  
  // Pagar cuenta pendiente
  const handlePagarCuenta = (compraId) => {
      if (!cajaActiva) return toast.error('Debes abrir caja para pagar en efectivo.');
      setCompraToPay(compraId);
  };

  const confirmPagarCuenta = async () => {
      if (!compraToPay || !cajaActiva) return;
      try {
          await comprasService.marcarCompraComoPagada(compraToPay, cajaActiva.id);
          toast.success('Cuenta pagada exitosamente');
          loadData();
          window.dispatchEvent(new Event('refreshAlerts'));
      } catch (err) {
          toast.error('Error al pagar');
      } finally {
          setCompraToPay(null);
      }
  };

  if (loading) return <LoadingSpinner text="Cargando historial de compras..." />;

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm">
      <div className="flex-1 flex flex-col h-full bg-slate-50/50">
        
        {/* Header Premium Estándar */}
        <div className="px-8 py-6 bg-white border-b border-slate-100 shrink-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Compras y Proveedores</h1>
                <p className="text-slate-500 mt-1 text-sm">Gestiona el reabastecimiento de tu inventario y cuentas por pagar.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="tour-compras-add flex justify-center items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                    <Plus size={18} />
                    <span>Nueva Compra</span>
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 relative">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-10 w-64 h-64 bg-blue-400/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-400/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10">
                
                {/* COLUMNA 1: DIRECTORIO DE PROVEEDORES (AHORA PRIMERO) */}
                <div className="tour-compras-proveedores xl:col-span-1">
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                        <div className="p-6 border-b border-slate-100/80 font-bold text-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm">
                                    <Building size={20} strokeWidth={2.5} /> 
                                </div>
                                <span className="tracking-tight text-lg">Proveedores</span>
                            </div>
                            <button onClick={() => setIsAddingProveedor(true)} className="tour-compras-nuevo-proveedor flex items-center gap-1 text-sm bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow hover:shadow-md cursor-pointer active:scale-95 font-medium">
                                <Plus size={16} /> Nuevo
                            </button>
                        </div>
                        <ul className="divide-y divide-slate-100/80">
                            {isAddingProveedor && (
                                <li className="p-5 bg-blue-50/40 flex items-center justify-between border-l-4 border-l-blue-500">
                                    <div className="flex-1 flex gap-2 mr-2">
                                        <input type="text" value={nuevoProveedor} onChange={e => setNuevoProveedor(e.target.value)} placeholder="Nombre de la empresa..." className="flex-1 bg-white border border-blue-200/60 px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500/50 text-sm outline-none shadow-sm font-medium text-slate-700 placeholder-slate-400" autoFocus onKeyDown={(e) => { if(e.key === 'Enter') handleAddProveedor(e); if(e.key === 'Escape') {setIsAddingProveedor(false); setNuevoProveedor('');} }} />
                                        <button onClick={handleAddProveedor} disabled={!nuevoProveedor.trim()} className={`p-2 rounded-xl transition-all ${!nuevoProveedor.trim() ? 'text-blue-300 bg-blue-100/50 cursor-not-allowed' : 'text-white bg-emerald-500 hover:bg-emerald-600 cursor-pointer shadow-sm hover:shadow active:scale-95'}`}><Save size={18} /></button>
                                        <button onClick={() => { setIsAddingProveedor(false); setNuevoProveedor(''); }} className="p-2 text-slate-400 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-600 cursor-pointer shadow-sm active:scale-95"><X size={18} /></button>
                                    </div>
                                </li>
                            )}
                            {proveedores.length === 0 && !isAddingProveedor ? (
                                <li className="p-10 text-center flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 text-slate-300">
                                        <Building size={24} />
                                    </div>
                                    <p className="text-slate-500 text-sm font-medium">No hay proveedores registrados</p>
                                    <p className="text-slate-400 text-xs mt-1">Añade uno para empezar a registrar compras</p>
                                </li>
                            ) : (
                                proveedores.map(p => (
                                    <li key={p.id} className="p-5 hover:bg-slate-50/80 text-slate-700 font-semibold flex items-center justify-between group transition-all">
                                        {editingProveedor === p.id ? (
                                            <div className="flex-1 flex gap-2 mr-2">
                                                <input type="text" value={editNombre} onChange={e => setEditNombre(e.target.value)} className="flex-1 bg-white border border-slate-300 px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500/50 text-sm outline-none shadow-sm" autoFocus />
                                                <button onClick={() => handleSaveEditProveedor(p.id)} className="p-2 text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 shadow-sm transition-transform active:scale-95 cursor-pointer"><Save size={18} /></button>
                                                <button onClick={() => setEditingProveedor(null)} className="p-2 text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-transform active:scale-95 cursor-pointer"><X size={18} /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-400 opacity-70"></div>
                                                    <span className="tracking-tight">{p.nombre}</span>
                                                </div>
                                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1.5 -translate-x-2 group-hover:translate-x-0 duration-300">
                                                    <button onClick={() => handleEditProveedor(p)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors" title="Editar"><Edit size={16} /></button>
                                                    <button onClick={() => handleDeleteProveedor(p.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>

                {/* COLUMNA 2: HISTORIAL DE COMPRAS */}
                <div className="tour-compras-historial xl:col-span-2 space-y-6">
                    {/* Alerta de cuentas por pagar */}
                    {compras.filter(c => c.estado === 'pendiente').length > 0 && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/60 p-5 rounded-3xl flex items-start gap-4 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                            <div className="p-2.5 bg-amber-100/50 text-amber-600 rounded-2xl shrink-0">
                                <AlertTriangle size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-amber-900 font-bold tracking-tight mb-1">Cuentas por pagar pendientes</h3>
                                <p className="text-amber-700/80 text-sm font-medium">Tienes compras registradas que no se han liquidado. Recuerda usar la caja activa para pagarlas cuando corresponda.</p>
                            </div>
                        </div>
                    )}

                    {compras.length === 0 ? (
                        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 lg:p-12 flex flex-col items-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center relative overflow-hidden">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-full max-h-lg bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-white/0 to-white/0 pointer-events-none"></div>
                            
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 relative z-10 rotate-3">
                                <ShoppingCart size={36} strokeWidth={2} className="-rotate-3" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tighter relative z-10">Módulo de Compras</h2>
                            <p className="text-slate-500 text-base max-w-xl mb-12 leading-relaxed relative z-10">
                                Gestiona el abastecimiento de tu restaurante. Registra facturas, administra deudas con proveedores y mantén tu inventario sincronizado automáticamente.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-10 relative z-10">
                                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col items-center hover:-translate-y-1 transition-transform duration-300">
                                    <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl mb-5 ring-4 ring-indigo-50/50"><Building size={24} strokeWidth={2} /></div>
                                    <h4 className="font-bold text-slate-800 mb-2 tracking-tight">1. Proveedores</h4>
                                    <p className="text-xs text-slate-500 font-medium">Añade al panel lateral a las empresas que te surten insumos.</p>
                                </div>
                                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col items-center hover:-translate-y-1 transition-transform duration-300">
                                    <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl mb-5 ring-4 ring-emerald-50/50"><ShoppingCart size={24} strokeWidth={2} /></div>
                                    <h4 className="font-bold text-slate-800 mb-2 tracking-tight">2. Adquisición</h4>
                                    <p className="text-xs text-slate-500 font-medium">Ingresa los insumos basándote en su unidad de compra (Kilos, Cajas).</p>
                                </div>
                                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col items-center hover:-translate-y-1 transition-transform duration-300">
                                    <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl mb-5 ring-4 ring-rose-50/50"><Wallet size={24} strokeWidth={2} /></div>
                                    <h4 className="font-bold text-slate-800 mb-2 tracking-tight">3. Tesorería</h4>
                                    <p className="text-xs text-slate-500 font-medium">Liquida la factura con efectivo de tu caja o déjala en estado pendiente.</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(true)} className="relative z-10 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-900/30 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2 cursor-pointer group">
                                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> Registrar Primera Compra
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 text-xs uppercase font-black tracking-widest">
                                        <th className="py-5 px-6">Fecha</th>
                                        <th className="py-5 px-6">Proveedor</th>
                                        <th className="py-5 px-6 text-right">Total</th>
                                        <th className="py-5 px-6 text-center">Estado</th>
                                        {compras.some(c => c.estado === 'pendiente') && (
                                            <th className="py-5 px-6 text-center">Acciones</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/60">
                                    {compras.map(c => (
                                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-4 px-6 text-sm text-slate-500 font-medium">{new Date(c.fecha).toLocaleDateString()}</td>
                                            <td className="py-4 px-6 text-sm font-bold text-slate-800 tracking-tight">{c.proveedores?.nombre}</td>
                                            <td className="py-4 px-6 text-sm font-black text-slate-800 text-right">${Number(c.total).toFixed(2)}</td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full inline-block ${c.estado === 'pagada' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {c.estado}
                                                </span>
                                            </td>
                                            {compras.some(compra => compra.estado === 'pendiente') && (
                                                <td className="py-4 px-6 text-center">
                                                    {c.estado === 'pendiente' && (
                                                        <button onClick={() => handlePagarCuenta(c.id)} className="text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow active:scale-95">
                                                            Liquidar Deuda
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nueva Compra"
        maxWidth="max-w-5xl"
      >
        <CompraForm 
          proveedores={proveedores} 
          insumos={insumos} 
          cajaActiva={cajaActiva}
          onSubmit={handleRegistrarCompra}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Modal de Confirmación de Pago */}
      <Modal
        isOpen={!!compraToPay}
        onClose={() => setCompraToPay(null)}
        title="💳 Confirmar Pago"
        maxWidth="max-w-md"
      >
        <div className="text-slate-700">
          <p className="mb-4 text-base">
            ¿Estás seguro de que deseas pagar esta cuenta pendiente usando el efectivo de la caja actual?
          </p>
          <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg mb-6 text-sm">
            Se registrará un egreso en la caja por el total de la compra.
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setCompraToPay(null)}
              className="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={confirmPagarCuenta}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md cursor-pointer"
            >
              Confirmar Pago
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
