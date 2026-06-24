import React from 'react';

export default function Lobby({ gameSet, onSelectMode, onBack, onOpenConceptMap }) {
  if (!gameSet) return null;

  const { title, summary, concepts, questions } = gameSet;

  // Modos de juego disponibles
  const modes = [
    {
      id: 'multiple_choice',
      title: 'Multiple Choice',
      emoji: '⚡',
      description: 'Preguntas con 4 opciones. ¡Estilo Kahoot con cuenta regresiva y multiplicador de racha!',
      timeEstimate: `${(questions.multiple_choice?.length || 5) * 15} seg`,
      color: 'from-violet-600/30 to-fuchsia-600/30 border-violet-500/40 hover:shadow-violet-500/10 hover:border-violet-500',
      badgeColor: 'bg-violet-950/60 text-violet-400 border-violet-800/40'
    },
    {
      id: 'flashcards',
      title: 'Flashcards 3D',
      emoji: '🎴',
      description: 'Tarjetas de memoria con animación 3D de volteo y algoritmo de repetición espaciada.',
      timeEstimate: `${(questions.flashcards?.length || 5) * 20} seg`,
      color: 'from-blue-600/30 to-indigo-600/30 border-blue-500/40 hover:shadow-blue-500/10 hover:border-blue-500',
      badgeColor: 'bg-blue-950/60 text-blue-400 border-blue-800/40'
    },
    {
      id: 'fill_blank',
      title: 'Completar Frase',
      emoji: '✏️',
      description: 'Escribe el término que falta para completar la oración. Usa pistas si te trabas.',
      timeEstimate: `${(questions.fill_blank?.length || 5) * 25} seg`,
      color: 'from-emerald-600/30 to-teal-600/30 border-emerald-500/40 hover:shadow-emerald-500/10 hover:border-emerald-500',
      badgeColor: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
    },
    {
      id: 'true_false',
      title: 'Verdadero o Falso',
      emoji: '⚖️',
      description: 'Juicios rápidos basados en la lectura. Recibe explicaciones didácticas al errar.',
      timeEstimate: `${(questions.true_false?.length || 5) * 10} seg`,
      color: 'from-rose-600/30 to-orange-600/30 border-rose-500/40 hover:shadow-rose-500/10 hover:border-rose-500',
      badgeColor: 'bg-rose-950/60 text-rose-400 border-rose-800/40'
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 animate-fade-in">
      
      {/* Header section (title and summary) */}
      <div className="glass-panel p-8 rounded-2xl border border-zinc-800 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-violet-400">Set de Estudio Activo</span>
            <h2 className="text-3xl font-black font-display text-white mt-1 mb-0">{title}</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onOpenConceptMap}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-violet-600/20"
            >
              🕸️ Ver Mapa de Conceptos
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all border border-zinc-700"
            >
              📥 Cambiar Material
            </button>
          </div>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl mb-6">
          {summary}
        </p>

        {/* Concept quick overview */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
            <span>📚</span> Glosario de Conceptos Clave ({concepts?.length || 0})
          </h4>
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
            {concepts?.map((c, i) => (
              <div 
                key={i} 
                className="flex-shrink-0 w-64 bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 flex flex-col gap-1.5 transition-all hover:border-zinc-800"
              >
                <span className="text-xs font-black text-violet-400 font-display">{c.term}</span>
                <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed" title={c.definition}>
                  {c.definition}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game modes list */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-black font-display text-zinc-200">🎮 Selecciona un Modo de Juego</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modes.map((mode) => {
            const hasQuestions = questions[mode.id] && questions[mode.id].length > 0;
            return (
              <button
                key={mode.id}
                onClick={() => hasQuestions && onSelectMode(mode.id)}
                disabled={!hasQuestions}
                className={`text-left p-6 rounded-2xl border bg-gradient-to-br ${mode.color} transition-all flex gap-4 hover:scale-[1.01] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <div className="text-4xl bg-zinc-900/80 w-16 h-16 rounded-2xl flex items-center justify-center border border-zinc-800 shadow">
                  {mode.emoji}
                </div>
                
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-black font-display text-white m-0 leading-none">{mode.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${mode.badgeColor}`}>
                        ⏱️ Est: {mode.timeEstimate}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                      {mode.description}
                    </p>
                  </div>
                  
                  {!hasQuestions && (
                    <span className="text-[10px] text-amber-500 font-bold mt-2">
                      ⚠️ No disponible para este material
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
