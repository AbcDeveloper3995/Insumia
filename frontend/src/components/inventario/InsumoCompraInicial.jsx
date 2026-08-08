import { useState } from 'react';
import { ShoppingCart, Plus, Check, SkipForward } from 'lucide-react';

export const InsumoCompraInicial = ({ insumo, proveedores, cajaActiva, onAddProveedor, onSubmit, onSkip, isLoading }) => {
  const [proveedorId, setProveedorId] = useState('');
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);
  const [nuevoProveedorNombre, setNuevoProveedorNombre] = useState('');
  
  const [cantidad, setCantidad] = useState('');
  const [costoTotal, setCostoTotal] = useState('');
  const [fechaCaducidad, setFechaCaducidad] = useState('');
  const [pagarDeCaja, setPagarDeCaja] = useState(false);

  const handleProviderSelect = (e) => {
    const val = e.target.value;
    if (val === 'NEW') {
      setIsCreatingProvider(true);
      setProveedorId('');
    } else {
      setProveedorId(val);
    }
  };

  const handleSaveNuevoProveedor = async () => {
    if (!nuevoProveedorNombre.trim()) return;
    try {
      const newProv = await onAddProveedor(nuevoProveedorNombre);
      if (newProv) {
        setProveedorId(newProv.id);
        setIsCreatingProvider(false);
        setNuevoProveedorNombre('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!proveedorId) return alert('Selecciona o crea un proveedor');
    if (!cantidad || Number(cantidad) <= 0) return alert('Ingresa una cantidad válida');
    if (!costoTotal || Number(costoTotal) < 0) return alert('Ingresa un costo válido');
    
    onSubmit({
      proveedor_id: proveedorId,
      cantidad: Number(cantidad),
      costo_total: Number(costoTotal),
      fecha_caducidad: fechaCaducidad || null,
      pagarDeCaja
    });
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
        <h3 className="text-blue-800 font-bold mb-1 flex items-center gap-2">
          <Check size={18} /> ¡Insumo Guardado con Éxito!
        </h3>
        <p className="text-sm text-blue-700">
          Para que "{insumo?.nombre}" aparezca en tu inventario listo para usarse, registra tu primera compra.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
        
        {/* PROVEEDOR */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">¿A quién se lo compraste?</label>
          {isCreatingProvider ? (
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Nombre del proveedor..."
                value={nuevoProveedorNombre}
                onChange={e => setNuevoProveedorNombre(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
              <button 
                type="button" 
                onClick={handleSaveNuevoProveedor}
                disabled={!nuevoProveedorNombre.trim()}
                className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-bold hover:bg-emerald-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Guardar
              </button>
              <button 
                type="button" 
                onClick={() => setIsCreatingProvider(false)}
                className="bg-slate-100 text-slate-600 px-3 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <select
              value={proveedorId}
              onChange={handleProviderSelect}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-700 cursor-pointer"
            >
              <option value="">-- Seleccionar Proveedor --</option>
              {proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
              <option value="NEW" className="font-bold text-blue-600">
                + Añadir nuevo proveedor...
              </option>
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Cantidad comprada
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                placeholder="Ej. 10"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-16"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 uppercase">
                {insumo?.unidad_compra}
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Costo total ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={costoTotal}
              onChange={e => setCostoTotal(e.target.value)}
              placeholder="Ej. 250.00"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Caducidad (Opcional)
            </label>
            <input
              type="date"
              value={fechaCaducidad}
              onChange={e => setFechaCaducidad(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700"
            />
          </div>
        </div>

        {cantidad && costoTotal && (
          <div className="bg-slate-50 p-3 rounded-lg text-right mt-2">
            <p className="text-xs text-slate-500">
              Costo unitario calculado: <span className="font-bold text-slate-700">${(Number(costoTotal)/Number(cantidad)).toFixed(2)}</span> / {insumo?.unidad_compra}
            </p>
          </div>
        )}

        <div className={`p-3 mt-4 rounded-lg flex items-center justify-between border ${!cajaActiva ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-blue-200'}`}>
          <div>
            <p className="font-bold text-sm text-slate-800 flex items-center gap-2">
              Pagar al Instante
              {!cajaActiva && <span className="bg-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded uppercase">Caja Cerrada</span>}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-[200px] leading-tight">
              {cajaActiva 
                ? 'Se descontará de la caja. Si lo apagas, será una Cuenta por Pagar.' 
                : 'La caja está cerrada, se guardará como pendiente.'}
            </p>
          </div>
          <label className={`relative inline-flex items-center ${!cajaActiva ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            <input type="checkbox" disabled={!cajaActiva} checked={pagarDeCaja} onChange={e => setPagarDeCaja(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-4">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            Saltar este paso <SkipForward size={14} />
          </button>
          
          <button
            type="submit"
            disabled={isLoading || isCreatingProvider}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
          >
            <ShoppingCart size={18} />
            {isLoading ? 'Registrando...' : 'Registrar Compra'}
          </button>
        </div>
      </form>
    </div>
  );
};
