import React, { useState, useEffect, useRef } from 'react';

export default function GameMultipleChoice({ questions = [], timerLimit = 30, onGameFinished }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timerLimit);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState([]); // Guardar cuáles erró para el Tutor IA
  
  const timerRef = useRef(null);

  const currentQuestion = questions[currentIdx];

  // Iniciar timer para la pregunta actual
  useEffect(() => {
    if (isAnswered) return;
    
    setTimeLeft(timerLimit);
    
    if (timerLimit === 60) return; // 60 significa sin límite

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAnswerSelect(-1); // Tiempo agotado
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIdx, isAnswered, timerLimit]);

  const handleAnswerSelect = (optionIdx) => {
    if (isAnswered) return;
    
    clearInterval(timerRef.current);
    setSelectedIdx(optionIdx);
    setIsAnswered(true);

    const isCorrect = optionIdx === currentQuestion.correctAnswerIndex;

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setCorrectAnswersCount(prev => prev + 1);
      
      // Calcular puntaje base + bonus de velocidad + bonus de racha
      const basePoints = currentQuestion.points || 100;
      const speedBonus = timerLimit !== 60 ? Math.round((timeLeft / timerLimit) * 50) : 0;
      const streakBonus = Math.min(newStreak * 10, 50);
      setScore(prev => prev + basePoints + speedBonus + streakBonus);
    } else {
      setStreak(0); // Romper racha
      
      // Registrar pregunta errada para el tutor
      setWrongQuestions(prev => [...prev, {
        question: currentQuestion.question,
        selectedAnswer: optionIdx === -1 ? "Tiempo agotado" : currentQuestion.options[optionIdx],
        correctAnswer: currentQuestion.options[currentQuestion.correctAnswerIndex],
        explanation: currentQuestion.explanation
      }]);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedIdx(null);
      setIsAnswered(false);
    } else {
      // Fin del juego
      onGameFinished({
        score,
        correctCount: correctAnswersCount,
        totalQuestions: questions.length,
        wrongQuestions,
        mode: 'multiple_choice'
      });
    }
  };

  if (!currentQuestion) return null;

  // Colores Kahoot para las 4 opciones
  const colors = [
    { bg: 'bg-red-500/20 border-red-500/40 hover:bg-red-500/30 text-red-200', active: 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/30' },
    { bg: 'bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30 text-blue-200', active: 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30' },
    { bg: 'bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30 text-amber-200', active: 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-600/30' },
    { bg: 'bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-200', active: 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30' }
  ];

  // Calcular porcentaje del timer
  const timerPercentage = timerLimit !== 60 ? (timeLeft / timerLimit) * 100 : 100;
  const timerColor = timeLeft > timerLimit * 0.5 ? 'bg-emerald-500' : timeLeft > timerLimit * 0.2 ? 'bg-amber-500' : 'bg-red-500 animate-pulse';

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in">
      
      {/* HUD Info */}
      <div className="flex justify-between items-center bg-zinc-950/60 border border-zinc-900 rounded-xl px-6 py-3">
        <span className="text-xs font-bold text-zinc-400">Pregunta: <span className="text-white">{currentIdx + 1}/{questions.length}</span></span>
        
        {/* Streak Flame */}
        <div className="flex items-center gap-1">
          <span className="text-sm">🔥 Racha:</span>
          <span className={`text-sm font-black transition-all ${streak > 0 ? 'text-orange-400 scale-110' : 'text-zinc-500'}`}>{streak}</span>
        </div>

        <span className="text-xs font-bold text-zinc-400">Puntaje: <span className="text-yellow-400">{score} pts</span></span>
      </div>

      {/* Main Board */}
      <div className="glass-panel p-8 rounded-2xl border border-zinc-800 flex flex-col gap-6 relative">
        
        {/* Progress bar timer */}
        {timerLimit !== 60 && (
          <div className="absolute top-0 inset-x-0 h-1.5 bg-zinc-900 rounded-t-2xl overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${timerColor}`} 
              style={{ width: `${timerPercentage}%` }}
            ></div>
          </div>
        )}

        {/* Question text */}
        <div className="text-center py-4">
          <h3 className="text-xl md:text-2xl font-black font-display text-white leading-relaxed">
            {currentQuestion.question}
          </h3>
        </div>

        {/* 4 Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedIdx === idx;
            const isCorrect = idx === currentQuestion.correctAnswerIndex;
            const style = colors[idx % 4];

            let buttonClass = `p-5 rounded-xl border text-sm md:text-base font-bold transition-all text-left flex items-center justify-between cursor-pointer `;
            
            if (isAnswered) {
              if (isCorrect) {
                // Resaltar respuesta correcta
                buttonClass += `bg-emerald-500 text-white border-emerald-300 shadow-lg shadow-emerald-500/20 scale-[1.01]`;
              } else if (isSelected) {
                // El usuario eligió mal esta
                buttonClass += `bg-red-500 text-white border-red-300 shadow-lg shadow-red-500/20 opacity-90`;
              } else {
                // Opción no seleccionada e incorrecta
                buttonClass += `opacity-30 border-zinc-800 bg-zinc-950 text-zinc-400 pointer-events-none`;
              }
            } else {
              buttonClass += `${style.bg}`;
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(idx)}
                disabled={isAnswered}
                className={buttonClass}
              >
                <span>{option}</span>
                {isAnswered && isCorrect && <span className="text-lg">✅</span>}
                {isAnswered && isSelected && !isCorrect && <span className="text-lg">❌</span>}
              </button>
            );
          })}
        </div>

        {/* Instant Feedback Overlay */}
        {isAnswered && (
          <div className="mt-4 p-5 rounded-xl border bg-zinc-900/60 border-zinc-800 animate-fade-in flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {selectedIdx === currentQuestion.correctAnswerIndex ? (
                <>
                  <span className="text-2xl">🎉</span>
                  <span className="text-sm font-bold text-emerald-400">¡Respuesta Correcta!</span>
                  {timerLimit !== 60 && <span className="text-[10px] text-zinc-500">+{Math.round((timeLeft / timerLimit) * 50)} pts por velocidad</span>}
                </>
              ) : (
                <>
                  <span className="text-2xl">😢</span>
                  <span className="text-sm font-bold text-red-400">
                    {selectedIdx === -1 ? '¡Se agotó el tiempo!' : '¡Respuesta Incorrecta!'}
                  </span>
                </>
              )}
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed italic">
              {currentQuestion.explanation}
            </p>

            <button
              onClick={handleNext}
              className="mt-3 self-end bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-6 py-2.5 rounded-lg transition-all shadow-md shadow-violet-600/20"
            >
              {currentIdx === questions.length - 1 ? 'Ver Resultados 🏆' : 'Siguiente Pregunta ➡️'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
