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
                    className="flex justify-center items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                    <Plus size={18} />
                    <span>Nueva Compra</span>
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* COLUMNA 1: HISTORIAL DE COMPRAS */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Alerta de cuentas por pagar */}
                    {compras.filter(c => c.estado === 'pendiente').length > 0 && (
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3">
                            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="text-amber-800 font-bold text-sm">Cuentas por pagar pendientes</h3>
                                <p className="text-amber-700 text-sm mt-1">Algunas compras se registraron pero no se pagaron en su momento. Paga estas deudas usando la caja activa.</p>
                            </div>
                        </div>
                    )}

                    {compras.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-6 lg:p-12 flex flex-col items-center shadow-sm text-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <ShoppingCart size={32} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Bienvenido a Compras</h2>
                            <p className="text-slate-500 text-base max-w-2xl mb-10 leading-relaxed">
                                Este módulo te permite registrar la mercancía que entra al restaurante. Al registrar una compra, Insumia actualizará tu inventario automáticamente en base a las unidades de compra configuradas en tu inventario.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-10">
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center">
                                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl mb-4 inline-block"><Building size={24} /></div>
                                    <h4 className="font-bold text-slate-800 mb-2">1. Proveedores</h4>
                                    <p className="text-xs text-slate-500">Agrega a las empresas que te surten en la pestaña de "Proveedores".</p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center">
                                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl mb-4 inline-block"><ShoppingCart size={24} /></div>
                                    <h4 className="font-bold text-slate-800 mb-2">2. Compras Simplificadas</h4>
                                    <p className="text-xs text-slate-500">Añade insumos y su cantidad basada en cómo la compras (Kilos, Cajas, etc).</p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center">
                                    <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl mb-4 inline-block"><Wallet size={24} /></div>
                                    <h4 className="font-bold text-slate-800 mb-2">3. Pago y Deudas</h4>
                                    <p className="text-xs text-slate-500">Paga la mercancía sacando dinero de tu Caja al instante, o déjala como deuda.</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-base shadow hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 cursor-pointer">
                                <Plus size={20} /> Iniciar Primera Compra
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
                                                    <button onClick={() => handlePagarCuenta(c.id)} className="text-xs font-bold bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm">
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

                {/* COLUMNA 2: DIRECTORIO DE PROVEEDORES */}
                <div className="xl:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 font-bold text-slate-700 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <Building size={18} className="text-slate-400" /> Directorio de Proveedores
                            </div>
                            <button onClick={() => setIsAddingProveedor(true)} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer active:scale-95">
                                <Plus size={16} /> Agregar
                            </button>
                        </div>
                        <ul className="divide-y divide-slate-100">
                            {isAddingProveedor && (
                                <li className="p-4 bg-blue-50/50 flex items-center justify-between">
                                    <div className="flex-1 flex gap-2 mr-4">
                                        <input type="text" value={nuevoProveedor} onChange={e => setNuevoProveedor(e.target.value)} placeholder="Nombre del proveedor..." className="flex-1 bg-white border border-blue-200 px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none shadow-inner" autoFocus onKeyDown={(e) => { if(e.key === 'Enter') handleAddProveedor(e); if(e.key === 'Escape') {setIsAddingProveedor(false); setNuevoProveedor('');} }} />
                                        <button onClick={handleAddProveedor} disabled={!nuevoProveedor.trim()} className={`p-1.5 rounded-lg transition-colors ${!nuevoProveedor.trim() ? 'text-blue-300 bg-blue-100 cursor-not-allowed' : 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200 cursor-pointer shadow-sm'}`}><Save size={16} /></button>
                                        <button onClick={() => { setIsAddingProveedor(false); setNuevoProveedor(''); }} className="p-1.5 text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer shadow-sm"><X size={16} /></button>
                                    </div>
                                </li>
                            )}
                            {proveedores.length === 0 && !isAddingProveedor ? (
                                <li className="p-8 text-center text-slate-400 text-sm">No tienes proveedores registrados aún.</li>
                            ) : (
                                proveedores.map(p => (
                                    <li key={p.id} className="p-4 hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-between group transition-colors">
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
