import { useState, useMemo } from 'react';
import { ShoppingCart, Plus, X, Search, Trash2, Info, Settings2 } from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';
import { UNIDADES } from '../../constants';

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

  const isFormValid = Boolean(
    proveedorId &&
    carrito.length > 0 &&
    carrito.every(item => {
      const isCantidadValid = Number(item.cantidad) > 0;
      const isCostoValid = Number(item.costo_total) >= 0;
      const isFechaValid = item.fecha_caducidad && String(item.fecha_caducidad).trim() !== '';
      
      const validCompra = isCantidadValid && isCostoValid && isFechaValid;

      if (item.isNew) {
        return validCompra && 
               item.insumo.nombre.trim() !== '' &&
               Number(item.insumo.factor_conversion) > 0 && 
               Number(item.insumo.porcentaje_rendimiento) > 0 && 
               Number(item.insumo.umbral_minimo) >= 0 &&
               Number(item.insumo.dias_alerta_caducidad) >= 0;
      }
      return validCompra;
    })
  );

  const agregarAlCarrito = (insumo, isNew = false) => {
    if (!isNew && carrito.find(item => item.insumo.id === insumo.id)) return;
    const tempId = isNew ? 'temp_' + Date.now() + Math.random() : null;
    setCarrito([...carrito, { 
      isNew,
      tempId,
      insumo, 
      cantidad: 1, 
      costo_total: insumo.ultimo_costo_base ? (insumo.ultimo_costo_base * insumo.factor_conversion) : 0,
      fecha_caducidad: ''
    }]);
    setInsumoSearch('');
  };

  const updateCarrito = (insumoId, field, value, isNewField = false) => {
    setCarrito(carrito.map(item => {
      const isMatch = item.isNew ? item.tempId === insumoId : item.insumo.id === insumoId;
      if (isMatch) {
        if (isNewField) {
           return { ...item, insumo: { ...item.insumo, [field]: value } };
        }
        return { ...item, [field]: field === 'fecha_caducidad' ? value : Number(value) };
      }
      return item;
    }));
  };

  const removeCarrito = (insumoId, isNew = false) => {
    setCarrito(carrito.filter(item => isNew ? item.tempId !== insumoId : item.insumo.id !== insumoId));
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
        <CustomSelect 
          value={proveedorId} 
          onChange={setProveedorId} 
          options={[
            { value: '', label: '-- Seleccionar Proveedor --' },
            ...proveedores.map(p => ({ value: p.id, label: p.nombre }))
          ]}
        />
      </div>

      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden flex-col md:flex-row">
        {/* 2. Buscador y Lista de Insumos */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <label className="block text-sm font-bold text-slate-700 mb-2">Añadir Insumos</label>
          <div className="flex gap-2 mb-3 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar insumo..." 
                value={insumoSearch} 
                onChange={e => setInsumoSearch(e.target.value)} 
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-inner" 
              />
            </div>
            <button 
              type="button"
              onClick={() => {
                agregarAlCarrito({
                  nombre: '',
                  unidad_compra: UNIDADES.KILOGRAMOS,
                  unidad_base: UNIDADES.GRAMOS,
                  factor_conversion: 1000,
                  porcentaje_rendimiento: 100,
                  umbral_minimo: 0,
                  dias_alerta_caducidad: 7
                }, true);
              }}
              className="px-3 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 flex items-center justify-center font-bold shadow-sm transition-colors cursor-pointer"
              title="Registrar Nuevo Producto"
            >
              <Plus size={16} className="mr-1" /> Nuevo
            </button>
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
            {filteredInsumos.length === 0 && <p className="text-slate-400 text-xs text-center py-4">Busca un insumo para agregarlo o presiona "Nuevo".</p>}
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
              carrito.map((item, index) => {
                const uniqueId = item.isNew ? item.tempId : item.insumo.id;
                return (
                <div key={uniqueId || index} className={`border p-3 rounded-lg flex flex-col gap-3 ${item.isNew ? 'bg-indigo-50/30 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-4">
                      {item.isNew ? (
                        <div className="flex flex-col gap-1.5 w-full">
                          <input 
                            type="text"
                            placeholder="Nombre del nuevo insumo..."
                            value={item.insumo.nombre}
                            onChange={(e) => updateCarrito(uniqueId, 'nombre', e.target.value, true)}
                            autoFocus
                            className="font-bold text-sm text-slate-800 bg-white border border-indigo-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none w-full shadow-inner"
                          />
                          <div className="flex items-center">
                            <span className="bg-indigo-100 text-indigo-700 text-[9px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider inline-block">Nuevo Insumo</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-bold text-sm text-slate-800 flex items-center gap-2">
                            {item.insumo.nombre}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            <span className="font-semibold">1 {item.insumo.unidad_compra}</span> = {item.insumo.factor_conversion} {item.insumo.unidad_base}
                          </p>
                        </>
                      )}
                    </div>
                    <button type="button" onClick={() => removeCarrito(uniqueId, item.isNew)} className="text-slate-400 hover:text-red-500 transition-colors p-1 shrink-0"><Trash2 size={16}/></button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1 mb-1">
                        Cant. ({item.insumo.unidad_compra})
                      </label>
                      <input 
                        type="number" 
                        min="0.01" 
                        step="0.01" 
                        value={item.cantidad || ''} 
                        onChange={e => updateCarrito(uniqueId, 'cantidad', e.target.value)} 
                        className="w-full bg-white border border-slate-300 px-3 py-2 rounded text-slate-800 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                        Costo ($)
                      </label>
                      <input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={item.costo_total === 0 ? '' : item.costo_total} 
                        onChange={e => updateCarrito(uniqueId, 'costo_total', e.target.value)} 
                        className="w-full bg-white border border-slate-300 px-3 py-2 rounded text-slate-800 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                        Caducidad
                      </label>
                      <input 
                        type="date" 
                        value={item.fecha_caducidad || ''} 
                        onChange={e => updateCarrito(uniqueId, 'fecha_caducidad', e.target.value)} 
                        className="w-full bg-white border border-slate-300 px-3 py-2 rounded text-slate-800 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center" 
                      />
                    </div>
                  </div>
                  
                  {item.isNew && (
                    <div className="mt-2 bg-white rounded-lg border border-indigo-100 p-3 shadow-sm">
                      <h4 className="text-xs font-bold text-indigo-700 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                         <Settings2 size={14} /> Configuración Inicial
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                           <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Unidad Compra</label>
                           <select 
                             value={item.insumo.unidad_compra}
                             onChange={(e) => updateCarrito(uniqueId, 'unidad_compra', e.target.value, true)}
                             className="w-full bg-slate-50 border border-slate-200 px-2 py-1.5 rounded text-slate-800 text-xs focus:border-indigo-500 focus:bg-white outline-none"
                           >
                             {Object.values(UNIDADES).map(u => <option key={u} value={u}>{u}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Unidad Receta</label>
                           <select 
                             value={item.insumo.unidad_base}
                             onChange={(e) => updateCarrito(uniqueId, 'unidad_base', e.target.value, true)}
                             className="w-full bg-slate-50 border border-slate-200 px-2 py-1.5 rounded text-slate-800 text-xs focus:border-indigo-500 focus:bg-white outline-none"
                           >
                             {Object.values(UNIDADES).map(u => <option key={u} value={u}>{u}</option>)}
                           </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1 truncate" title={`1 ${item.insumo.unidad_compra} = X ${item.insumo.unidad_base}`}>Conversión</label>
                          <input 
                            type="number" min="0.01" step="0.01" 
                            value={item.insumo.factor_conversion} 
                            onChange={e => updateCarrito(uniqueId, 'factor_conversion', Number(e.target.value), true)} 
                            className="w-full bg-slate-50 border border-slate-200 px-2 py-1.5 rounded text-slate-800 text-xs focus:border-indigo-500 focus:bg-white outline-none" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1 truncate">% Rendi</label>
                          <input 
                            type="number" min="1" max="100" step="1" 
                            value={item.insumo.porcentaje_rendimiento} 
                            onChange={e => updateCarrito(uniqueId, 'porcentaje_rendimiento', Number(e.target.value), true)} 
                            className="w-full bg-slate-50 border border-slate-200 px-2 py-1.5 rounded text-slate-800 text-xs focus:border-indigo-500 focus:bg-white outline-none" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1 truncate">Alerta Mín ({item.insumo.unidad_base})</label>
                          <input 
                            type="number" min="0" step="1" 
                            value={item.insumo.umbral_minimo} 
                            onChange={e => updateCarrito(uniqueId, 'umbral_minimo', Number(e.target.value), true)} 
                            className="w-full bg-slate-50 border border-slate-200 px-2 py-1.5 rounded text-slate-800 text-xs focus:border-indigo-500 focus:bg-white outline-none" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1 truncate">Alerta Cad. (días)</label>
                          <input 
                            type="number" min="0" step="1" 
                            value={item.insumo.dias_alerta_caducidad} 
                            onChange={e => updateCarrito(uniqueId, 'dias_alerta_caducidad', Number(e.target.value), true)} 
                            className="w-full bg-slate-50 border border-slate-200 px-2 py-1.5 rounded text-slate-800 text-xs focus:border-indigo-500 focus:bg-white outline-none" 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-right border-t border-slate-200 pt-2">
                     <p className="text-[10px] text-slate-500">
                        Costo Unitario: <span className="font-bold text-slate-700">${item.cantidad > 0 ? (item.costo_total / item.cantidad).toFixed(2) : '0.00'}</span> / {item.insumo.unidad_compra}
                     </p>
                  </div>
                </div>
              )})
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
        <button type="submit" disabled={isLoading || !isFormValid} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm cursor-pointer disabled:cursor-not-allowed">
          {isLoading ? 'Registrando...' : 'Registrar Compra'}
        </button>
      </div>
    </form>
  );
};
