import { useState } from 'react';

export default function GameTrueFalse({ questions = [], onGameFinished }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedVal, setSelectedVal] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState([]);

  const currentQuestion = questions[currentIdx];

  const handleSelect = (val) => {
    if (isAnswered || !currentQuestion) return;

    setSelectedVal(val);
    setIsAnswered(true);

    const isCorrect = val === currentQuestion.isTrue;
    if (isCorrect) {
      setCorrectAnswersCount((prev) => prev + 1);
      setScore((prev) => prev + 100);
    } else {
      setWrongQuestions((prev) => [...prev, {
        question: `V/F: "${currentQuestion.statement}"`,
        selectedAnswer: val ? 'Verdadero' : 'Falso',
        correctAnswer: currentQuestion.isTrue ? 'Verdadero' : 'Falso',
        explanation: currentQuestion.explanation,
      }]);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((idx) => idx + 1);
      setSelectedVal(null);
      setIsAnswered(false);
      return;
    }

    onGameFinished({
      score,
      correctCount: correctAnswersCount,
      totalQuestions: questions.length,
      wrongQuestions,
      mode: 'true_false',
    });
  };

  if (!currentQuestion) return null;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center bg-zinc-950/60 border border-zinc-900 rounded-xl px-6 py-3">
        <span className="text-xs font-bold text-zinc-400">Declaracion: <span className="text-white">{currentIdx + 1}/{questions.length}</span></span>
        <span className="text-xs font-bold text-zinc-400">Puntaje: <span className="text-yellow-400">{score} pts</span></span>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-zinc-800 flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-emerald-500 to-red-500" />

        {currentQuestion.category && (
          <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 bg-violet-950/40 border border-violet-900/40 px-2.5 py-1 rounded-full w-fit ml-2">
            {currentQuestion.category}
          </span>
        )}

        <div className="text-center py-6 px-4">
          <p className="text-lg md:text-2xl font-semibold text-zinc-100 leading-relaxed">
            "{currentQuestion.statement}"
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 ml-2">
          <button
            onClick={() => handleSelect(true)}
            disabled={isAnswered}
            className={`p-6 rounded-xl border text-sm md:text-base font-black transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
              isAnswered
                ? currentQuestion.isTrue
                  ? 'bg-emerald-500 text-white border-emerald-300 shadow-lg shadow-emerald-500/20 scale-[1.01]'
                  : selectedVal === true
                    ? 'bg-red-500 text-white border-red-300 opacity-90'
                    : 'opacity-20 border-zinc-900 bg-zinc-950 text-zinc-500 pointer-events-none'
                : 'bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 hover:border-emerald-500'
            }`}
          >
            <span>VERDADERO</span>
          </button>

          <button
            onClick={() => handleSelect(false)}
            disabled={isAnswered}
            className={`p-6 rounded-xl border text-sm md:text-base font-black transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
              isAnswered
                ? !currentQuestion.isTrue
                  ? 'bg-emerald-500 text-white border-emerald-300 shadow-lg shadow-emerald-500/20 scale-[1.01]'
                  : selectedVal === false
                    ? 'bg-red-500 text-white border-red-300 opacity-90'
                    : 'opacity-20 border-zinc-900 bg-zinc-950 text-zinc-500 pointer-events-none'
                : 'bg-red-500/20 border-red-500/40 hover:bg-red-500/30 text-red-300 hover:border-red-500'
            }`}
          >
            <span>FALSO</span>
          </button>
        </div>

        {isAnswered && (
          <div className={`ml-2 p-5 rounded-xl border animate-fade-in flex flex-col gap-2 ${selectedVal === currentQuestion.isTrue ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300' : 'bg-red-950/30 border-red-800 text-red-300'}`}>
            <div className="flex items-center gap-2 font-bold text-sm">
              {selectedVal === currentQuestion.isTrue ? <span>Correcto. Bien juzgado.</span> : <span>Incorrecto</span>}
            </div>

            <p className="text-xs opacity-90 leading-relaxed">
              <strong>Explicacion:</strong> {currentQuestion.explanation}
            </p>

            <button onClick={handleNext} className="mt-2 self-end bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-6 py-2 rounded-lg transition-all shadow-md shadow-violet-600/20">
              {currentIdx === questions.length - 1 ? 'Ver resultados' : 'Siguiente pregunta'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
