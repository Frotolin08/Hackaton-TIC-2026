import React from 'react';
import { dbService } from '../services/db';
import { aiService } from '../services/ai';

export default function Navbar({ streak = 0, score = 0, onViewHistory }) {
  const hasSupabase = dbService.isSupabaseConnected();
  const hasClaude = aiService.isRealAIConnected();

  return (
    <nav className="glass-panel w-full px-6 py-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 mb-6 shadow-2xl">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-blue-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-violet-500/20">
          SQ
        </div>
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight bg-gradient-to-r from-white via-violet-200 to-violet-400 bg-clip-text text-transparent m-0 select-none">
            StudyQuest
          </h1>
          <p className="text-xs text-zinc-400 m-0">Plataforma de Aprendizaje Gamificado</p>
        </div>
      </div>

      {/* User Stats */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-full" title="Racha de días de estudio">
          <span className="text-lg">🔥</span>
          <span className="text-sm font-bold text-orange-400">{streak} {streak === 1 ? 'Día' : 'Días'}</span>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-full" title="Puntuación total acumulada">
          <span className="text-lg">🏆</span>
          <span className="text-sm font-bold text-yellow-400">{score} pts</span>
        </div>

        <button 
          onClick={onViewHistory}
          className="text-xs px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-all"
        >
          📂 Mis Sets
        </button>

        {/* Integration Status Badges */}
        <div className="hidden lg:flex items-center gap-2 text-[10px]">
          <span 
            className={`px-2 py-0.5 rounded-full border ${hasSupabase ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' : 'bg-amber-950/40 text-amber-400 border-amber-800/40'}`}
            title={hasSupabase ? 'Conectado a Base de Datos en la nube de Supabase' : 'Guardando localmente en LocalStorage'}
          >
            {hasSupabase ? '● DB Nube' : '● DB Local'}
          </span>
          <span 
            className={`px-2 py-0.5 rounded-full border ${hasClaude ? 'bg-indigo-950/40 text-indigo-400 border-indigo-800/40' : 'bg-purple-950/40 text-purple-400 border-purple-800/40'}`}
            title={hasClaude ? 'Consultando API oficial de OpenAI ChatGPT' : 'Generador Cognitivo Local Activo'}
          >
            {hasClaude ? '● ChatGPT' : '● IA Simulada'}
          </span>
        </div>
      </div>
    </nav>
  );
}
