import { useState } from 'react';

export default function GameFlashcards({ cards = [], onGameFinished }) {
  const [queue, setQueue] = useState(() => cards.map((card, i) => ({
    id: card.id || i,
    data: card,
    attempts: 0,
    stage: 0,
  })));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState([]);

  const activeItem = queue[currentIdx];

  const handleSelfGrade = (grade) => {
    if (!activeItem) return;

    setTotalAttempts((prev) => prev + 1);
    setIsFlipped(false);
    setShowHint(false);

    const nextQueue = [...queue];
    const currentItem = { ...activeItem, attempts: activeItem.attempts + 1 };
    let pointsEarned = 0;

    if (grade === 'easy') {
      currentItem.stage = 2;
      pointsEarned = Math.max(150 - currentItem.attempts * 20, 50);
      setScore((prev) => prev + pointsEarned);
      nextQueue.splice(currentIdx, 1);
    } else if (grade === 'medium') {
      currentItem.stage = 1;
      pointsEarned = 50;
      setScore((prev) => prev + pointsEarned);
      nextQueue.splice(currentIdx, 1);
      nextQueue.push(currentItem);
    } else {
      currentItem.stage = 0;
      nextQueue.splice(currentIdx, 1);
      nextQueue.splice(Math.min(2, nextQueue.length), 0, currentItem);
    }

    const nextHistory = [...history, {
      term: currentItem.data.front,
      grade,
      attempts: currentItem.attempts,
    }];

    setHistory(nextHistory);
    setQueue(nextQueue);

    if (nextQueue.length === 0) {
      onGameFinished({
        score: score + pointsEarned,
        correctCount: cards.length,
        totalQuestions: cards.length,
        attempts: totalAttempts + 1,
        history: nextHistory,
        mode: 'flashcards',
      });
      return;
    }

    if (currentIdx >= nextQueue.length) {
      setCurrentIdx(0);
    }
  };

  if (!activeItem) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  const remainingCount = queue.length;
  const totalCount = cards.length || 1;
  const progressPercent = ((totalCount - remainingCount) / totalCount) * 100;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-2 bg-zinc-950/60 border border-zinc-900 rounded-xl p-4">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-zinc-400">Tarjetas por dominar: <span className="text-violet-400 font-black">{remainingCount}</span></span>
          <span className="text-yellow-400">{score} pts</span>
        </div>
        <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
          <div className="bg-gradient-to-r from-violet-600 to-blue-500 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <button type="button" className="perspective-1000 w-full h-96 cursor-pointer relative text-left" onClick={() => setIsFlipped((value) => !value)}>
        <div className={`w-full h-full duration-500 transform-style-3d relative transition-all ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className="absolute inset-0 w-full h-full rounded-2xl glass-panel border border-zinc-800 flex flex-col justify-between p-8 backface-hidden shadow-2xl">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pregunta / termino</span>
              <span className="text-sm font-bold text-yellow-400">Hint</span>
            </div>

            <div className="text-center my-auto flex flex-col gap-4">
              <h3 className="text-2xl md:text-3xl font-black font-display text-white leading-relaxed px-4">
                {activeItem.data.front}
              </h3>

              {showHint ? (
                <span className="text-xs text-violet-400 font-bold bg-violet-950/40 px-3 py-1.5 rounded-lg border border-violet-900/40 w-fit mx-auto animate-fade-in">
                  Pista: {activeItem.data.hint || 'No hay pistas para esta tarjeta'}
                </span>
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowHint(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.stopPropagation();
                      setShowHint(true);
                    }
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 font-semibold underline w-fit mx-auto cursor-pointer"
                >
                  Revelar pista
                </span>
              )}
            </div>

            <div className="text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Clic para voltear
            </div>
          </div>

          <div className="absolute inset-0 w-full h-full rounded-2xl glass-panel border border-violet-500/30 bg-gradient-to-b from-zinc-950/80 to-zinc-900/80 flex flex-col justify-between p-8 backface-hidden rotate-y-180 shadow-2xl">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Definicion / explicacion</span>
              <span className="text-sm font-bold text-orange-300">Review</span>
            </div>

            <div className="text-center my-auto px-4 overflow-y-auto max-h-48 scrollbar-thin">
              <p className="text-base md:text-lg text-zinc-200 leading-relaxed font-medium">
                {activeItem.data.back}
              </p>
            </div>

            <div className="text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Clic para volver al frente
            </div>
          </div>
        </div>
      </button>

      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold text-center text-zinc-400 uppercase tracking-wider">Que tan bien lo recordaste?</span>
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => handleSelfGrade('again')} className="flex flex-col items-center justify-center py-3.5 px-2 rounded-xl bg-red-950/20 border border-red-800/40 hover:bg-red-950/40 hover:border-red-500 text-red-300 transition-all cursor-pointer shadow hover:scale-[1.02]">
            <span className="text-xs font-bold mt-1">Otra vez</span>
            <span className="text-[9px] opacity-60 mt-0.5">Aparece pronto</span>
          </button>
          <button onClick={() => handleSelfGrade('medium')} className="flex flex-col items-center justify-center py-3.5 px-2 rounded-xl bg-amber-950/20 border border-amber-800/40 hover:bg-amber-950/40 hover:border-amber-500 text-amber-300 transition-all cursor-pointer shadow hover:scale-[1.02]">
            <span className="text-xs font-bold mt-1">Dificil</span>
            <span className="text-[9px] opacity-60 mt-0.5">Repasar luego</span>
          </button>
          <button onClick={() => handleSelfGrade('easy')} className="flex flex-col items-center justify-center py-3.5 px-2 rounded-xl bg-emerald-950/20 border border-emerald-800/40 hover:bg-emerald-950/40 hover:border-emerald-500 text-emerald-300 transition-all cursor-pointer shadow hover:scale-[1.02]">
            <span className="text-xs font-bold mt-1">Facil</span>
            <span className="text-[9px] opacity-60 mt-0.5">Dominado</span>
          </button>
        </div>
      </div>
    </div>
  );
}
