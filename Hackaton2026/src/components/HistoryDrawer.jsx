import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';

export default function HistoryDrawer({ onSelectSet, onClose }) {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSets();
  }, []);

  const loadSets = async () => {
    setLoading(true);
    try {
      const data = await dbService.getGameSets();
      setSets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que deseas eliminar este set de estudio?")) return;
    
    try {
      await dbService.deleteGameSet(id);
      loadSets();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto glass-panel p-6 rounded-2xl border border-zinc-800 animate-fade-in flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Biblioteca Guardada</span>
          <h3 className="text-xl font-black font-display text-white m-0">Mis Sets de Estudio</h3>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all border border-zinc-700 cursor-pointer"
        >
          Volver
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
        </div>
      ) : sets.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 flex flex-col items-center gap-2">
          <span className="text-3xl">📂</span>
          <p className="text-sm font-semibold">No tienes sets creados todavía</p>
          <p className="text-xs">¡Sube un fragmento de texto en la pantalla principal para empezar!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
          {sets.map((set) => (
            <div
              key={set.id}
              onClick={() => onSelectSet(set)}
              className="flex justify-between items-center p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl hover:border-violet-500/30 transition-all cursor-pointer group"
            >
              <div className="flex flex-col gap-1 min-w-0 pr-4">
                <h4 className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors truncate">
                  {set.title}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <span className="bg-zinc-900 px-2 py-0.5 rounded text-zinc-400 border border-zinc-850">
                    {set.difficulty}
                  </span>
                  <span>•</span>
                  <span>{new Date(set.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{set.concepts?.length || 0} conceptos</span>
                </div>
              </div>

              <button
                onClick={(e) => handleDelete(e, set.id)}
                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all"
                title="Eliminar set"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
