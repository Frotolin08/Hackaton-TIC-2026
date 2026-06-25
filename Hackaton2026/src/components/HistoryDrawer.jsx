import { useCallback, useEffect, useState } from 'react';
import { dbService } from '../services/db';

export default function HistoryDrawer({ onSelectSet, onClose }) {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dbService.getGameSets();
      setSets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadSets, 0);
    return () => window.clearTimeout(timer);
  }, [loadSets]);

  const handleDelete = async (event, id) => {
    event.stopPropagation();
    if (!window.confirm('Seguro que deseas eliminar este set de estudio?')) return;

    try {
      await dbService.deleteGameSet(id);
      loadSets();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto glass-panel p-6 rounded-2xl border border-gray-200 animate-fade-in flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Biblioteca guardada</span>
          <h3 className="text-xl font-black font-display text-gray-900 m-0">Mis sets de estudio</h3>
        </div>
        <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all border border-gray-300 cursor-pointer">
          Volver
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : sets.length === 0 ? (
        <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-2">
          <p className="text-sm font-semibold">No tienes sets creados todavia</p>
          <p className="text-xs">Sube un fragmento de texto en la pantalla principal para empezar.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
          {sets.map((set) => (
            <div key={set.id} onClick={() => onSelectSet(set)} className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-300 transition-all cursor-pointer group">
              <div className="flex flex-col gap-1 min-w-0 pr-4">
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors truncate">{set.title}</h4>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 border border-gray-200">{set.difficulty}</span>
                  <span>|</span>
                  <span>{new Date(set.createdAt).toLocaleDateString()}</span>
                  <span>|</span>
                  <span>{set.concepts?.length || 0} conceptos</span>
                  {set.levelMode && <span>| {set.levelMode === 'fixed' ? 'Fijo' : 'Adaptativo'}</span>}
                </div>
              </div>

              <button onClick={(event) => handleDelete(event, set.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar set">
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
