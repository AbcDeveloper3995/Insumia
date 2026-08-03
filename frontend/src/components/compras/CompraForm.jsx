import { useState, useMemo } from 'react';
import { ShoppingCart, Plus, X, Search, Trash2 } from 'lucide-react';

export const CompraForm = ({ proveedores, insumos, cajaActiva, onSubmit, isLoading = false }) => {
  const [proveedorId, setProveedorId] = useState('');
  const [pagarDeCaja, setPagarDeCaja] = useState(false);
  const [carrito, setCarrito] = useState([]);
  const [insumoSearch, setInsumoSearch] = useState('');

  const filteredInsumos = useMemo(() => {
    if (!insumoSearch.trim()) return insumos;
    return insumos.filter(i => i.nombre.toLowerCase().includes(insumoSearch.toLowerCase()));
  }, [insumos, insumoSearch]);

  const totalCompra = carrito.reduce((acc, curr) => acc + (curr.costo_total || 0), 0);

  const agregarAlCarrito = (insumo) => {
    if (carrito.find(item => item.insumo.id === insumo.id)) return;
    setCarrito([...carrito, { 
      insumo, 
      cantidad: 1, 
      costo_total: insumo.ultimo_costo_base ? (insumo.ultimo_costo_base * insumo.factor_conversion) : 0 
    }]);
    setInsumoSearch('');
  };

  const updateCarrito = (insumoId, field, value) => {
    setCarrito(carrito.map(item => {
      if (item.insumo.id === insumoId) {
        return { ...item, [field]: Number(value) };
      }
      return item;
    }));
  };

  const removeCarrito = (insumoId) => {
    setCarrito(carrito.filter(item => item.insumo.id !== insumoId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!proveedorId) {
      alert('Por favor selecciona un proveedor.');
      return;
    }
    if (carrito.length === 0) {
      alert('El carrito está vacío.');
      return;
    }
    onSubmit({ proveedor_id: proveedorId, pagarDeCaja, carrito });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-[70vh] max-h-[800px]">
      
      {/* 1. Proveedor */}
      <div className="mb-4 shrink-0">
        <label className="block text-sm font-bold text-slate-700 mb-2">Proveedor</label>
        <select 
          value={proveedorId} 
          onChange={e => setProveedorId(e.target.value)} 
          className="w-full bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
          required
        >
          <option value="">-- Seleccionar Proveedor --</option>
          {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden flex-col md:flex-row">
        {/* 2. Buscador y Lista de Insumos */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <label className="block text-sm font-bold text-slate-700 mb-2">Añadir Insumos</label>
          <div className="relative mb-3 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar insumo..." 
              value={insumoSearch} 
              onChange={e => setInsumoSearch(e.target.value)} 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
            />
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredInsumos.map(insumo => {
              const inCart = carrito.find(c => c.insumo.id === insumo.id);
              return (
                <div 
                  key={insumo.id} 
                  onClick={() => !inCart && agregarAlCarrito(insumo)} 
                  className={`p-3 rounded-lg border transition-all flex justify-between items-center ${inCart ? 'bg-slate-100 border-slate-200 opacity-60 cursor-default' : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer group'}`}
                >
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{insumo.nombre}</p>
                    <p className="text-xs text-slate-500">Se compra en: <span className="font-semibold text-slate-700">{insumo.unidad_compra}</span></p>
                  </div>
                  {!inCart && <Plus className="text-slate-300 group-hover:text-blue-500" size={18} />}
                </div>
              );
            })}
            {filteredInsumos.length === 0 && <p className="text-slate-400 text-xs text-center py-4">No se encontraron insumos.</p>}
          </div>
        </div>

        {/* 3. Carrito de Compra */}
        <div className="flex-[1.2] flex flex-col min-h-0 bg-white border border-slate-200 rounded-xl p-4">
          <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <ShoppingCart size={16}/> Factura / Detalle
          </label>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ShoppingCart size={32} className="mb-2 opacity-50"/>
                <p className="text-sm">Agrega insumos a la factura</p>
              </div>
            ) : (
              carrito.map(item => (
                <div key={item.insumo.id} className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-sm text-slate-800">{item.insumo.nombre}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        <span className="font-semibold">1 {item.insumo.unidad_compra}</span> = {item.insumo.factor_conversion} {item.insumo.unidad_base}
                      </p>
                    </div>
                    <button type="button" onClick={() => removeCarrito(item.insumo.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1"><Trash2 size={16}/></button>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                        Cantidad ({item.insumo.unidad_compra})
                      </label>
                      <input 
                        type="number" 
                        min="0.01" 
                        step="0.01" 
                        value={item.cantidad} 
                        onChange={e => updateCarrito(item.insumo.id, 'cantidad', e.target.value)} 
                        className="w-full bg-white border border-slate-300 px-3 py-2 rounded text-slate-800 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                        Costo Total ($)
                      </label>
                      <input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={item.costo_total} 
                        onChange={e => updateCarrito(item.insumo.id, 'costo_total', e.target.value)} 
                        className="w-full bg-white border border-slate-300 px-3 py-2 rounded text-slate-800 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                      />
                    </div>
                  </div>
                  
                  <div className="mt-2 text-right">
                     <p className="text-[10px] text-slate-500">
                        Costo Unitario: <span className="font-bold text-slate-700">${item.cantidad > 0 ? (item.costo_total / item.cantidad).toFixed(2) : '0.00'}</span> / {item.insumo.unidad_compra}
                     </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Resumen y Pago */}
          <div className="shrink-0 pt-4 border-t border-slate-200 mt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-sm">Total a Pagar:</span>
              <span className="text-2xl font-black text-slate-800">${totalCompra.toFixed(2)}</span>
            </div>

            <div className={`p-3 rounded-lg flex items-center justify-between border ${!cajaActiva ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-blue-200'}`}>
              <div>
                <p className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  Pagar al Instante
                  {!cajaActiva && <span className="bg-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded uppercase">Caja Cerrada</span>}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-[200px] leading-tight">
                  {cajaActiva 
                    ? 'Se descontará efectivo de la caja. Si apagas esto, quedará como "Cuenta por Pagar".' 
                    : 'No puedes pagar ahora porque la caja está cerrada. Se guardará como pendiente.'}
                </p>
              </div>
              <label className={`relative inline-flex items-center ${!cajaActiva ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                <input type="checkbox" disabled={!cajaActiva} checked={pagarDeCaja} onChange={e => setPagarDeCaja(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="shrink-0 pt-4 mt-4 border-t border-slate-200 flex justify-end gap-3">
        <button type="submit" disabled={isLoading} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm">
          {isLoading ? 'Registrando...' : 'Registrar Compra'}
        </button>
      </div>
    </form>
  );
};
