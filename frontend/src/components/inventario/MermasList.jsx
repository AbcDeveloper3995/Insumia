import { AlertTriangle, Calendar, Plus, Trash2 } from 'lucide-react';

export const MermasList = ({ mermas, insumos = [], recetas = [], onNewMerma }) => {
  if (!mermas || mermas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 border-dashed">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
          <Trash2 size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">No hay mermas registradas</h3>
        <p className="text-slate-500 text-center max-w-md mb-6">
          Mantén un control estricto de las pérdidas financieras registrando cualquier insumo o preparación que se haya desperdiciado.
        </p>
        <button
          onClick={onNewMerma}
          className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors cursor-pointer"
        >
          <Plus size={20} />
          Registrar Pérdida (Merma)
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-800">Historial de Mermas</h2>
          <p className="text-sm font-medium text-slate-500">Registro de salidas de inventario por desperdicio</p>
        </div>
        <button
          onClick={onNewMerma}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors cursor-pointer"
        >
          <Plus size={20} />
          Nueva Merma
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Ítems Afectados</th>
              <th className="px-6 py-4">Notas</th>
              <th className="px-6 py-4 text-right">Pérdida Financiera</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mermas.map((merma) => (
              <tr key={merma.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Calendar size={14} className="text-slate-400" />
                    {new Date(merma.fecha).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {merma.detalles?.map((det, i) => {
                      const nombreItem = det.tipo_item === 'receta' 
                        ? recetas.find(r => r.id === det.item_id)?.nombre 
                        : insumos.find(in_ => in_.id === det.item_id)?.nombre;
                        
                      return (
                        <span key={i} className="text-slate-700 font-medium flex flex-col mb-2 last:mb-0">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            {det.cantidad}x {nombreItem || 'Desconocido'} ({det.tipo_item === 'receta' ? 'Subreceta' : 'Insumo'})
                          </span>
                          <span className="text-xs text-slate-400 italic block ml-3 mt-0.5 whitespace-normal break-words max-w-[250px]">- {det.motivo}</span>
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-500 line-clamp-2">{merma.notas || '-'}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-bold text-rose-500 text-base">
                    ${Number(merma.total_perdida).toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
