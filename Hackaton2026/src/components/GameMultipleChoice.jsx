import { useEffect, useRef, useState } from 'react';

export default function GameMultipleChoice({ questions = [], timerLimit = 30, onGameFinished }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timerLimit);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const timerRef = useRef(null);

  const currentQuestion = questions[currentIdx];

  useEffect(() => {
    if (isAnswered || timerLimit === 60 || !currentQuestion) return undefined;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setSelectedIdx(-1);
          setIsAnswered(true);
          setStreak(0);
          setWrongQuestions((items) => [
            ...items,
            {
              question: currentQuestion.question,
              selectedAnswer: 'Tiempo agotado',
              correctAnswer: currentQuestion.options[currentQuestion.correctAnswerIndex],
              explanation: currentQuestion.explanation,
            },
          ]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentQuestion, isAnswered, timerLimit]);

  const handleAnswerSelect = (optionIdx) => {
    if (isAnswered || !currentQuestion) return;

    clearInterval(timerRef.current);
    setSelectedIdx(optionIdx);
    setIsAnswered(true);

    const isCorrect = optionIdx === currentQuestion.correctAnswerIndex;

    if (isCorrect) {
      const newStreak = streak + 1;
      const basePoints = currentQuestion.points || 100;
      const speedBonus = timerLimit !== 60 ? Math.round((timeLeft / timerLimit) * 50) : 0;
      const streakBonus = Math.min(newStreak * 10, 50);

      setStreak(newStreak);
      setCorrectAnswersCount((prev) => prev + 1);
      setScore((prev) => prev + basePoints + speedBonus + streakBonus);
    } else {
      setStreak(0);
      setWrongQuestions((prev) => [
        ...prev,
        {
          question: currentQuestion.question,
          selectedAnswer: currentQuestion.options[optionIdx],
          correctAnswer: currentQuestion.options[currentQuestion.correctAnswerIndex],
          explanation: currentQuestion.explanation,
        },
      ]);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((idx) => idx + 1);
      setSelectedIdx(null);
      setIsAnswered(false);
      setTimeLeft(timerLimit);
      return;
    }

    onGameFinished({
      score,
      correctCount: correctAnswersCount,
      totalQuestions: questions.length,
      wrongQuestions,
      mode: 'multiple_choice',
    });
  };

  if (!currentQuestion) return null;

  const colors = [
    'bg-red-50 border-red-200 hover:bg-red-100 text-red-700',
    'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700',
    'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700',
    'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700',
  ];
  const timerPercentage = timerLimit !== 60 ? (timeLeft / timerLimit) * 100 : 100;
  const timerColor = timeLeft > timerLimit * 0.5 ? 'bg-emerald-500' : timeLeft > timerLimit * 0.2 ? 'bg-amber-500' : 'bg-red-500 animate-pulse';

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white/80 border border-gray-200 rounded-xl px-6 py-3">
        <span className="text-xs font-bold text-gray-600">Pregunta: <span className="text-gray-900">{currentIdx + 1}/{questions.length}</span></span>
        <span className={`text-sm font-black transition-all ${streak > 0 ? 'text-orange-500 scale-110' : 'text-gray-500'}`}>Racha {streak}</span>
        <span className="text-xs font-bold text-gray-600">Puntaje: <span className="text-orange-500">{score} pts</span></span>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-gray-200 flex flex-col gap-6 relative">
        {timerLimit !== 60 && (
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gray-200 rounded-t-2xl overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${timerColor}`} style={{ width: `${timerPercentage}%` }} />
          </div>
        )}

        <div className="text-center py-4">
          <h3 className="text-xl md:text-2xl font-black font-display text-gray-900 leading-relaxed">
            {currentQuestion.question}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedIdx === idx;
            const isCorrect = idx === currentQuestion.correctAnswerIndex;
            let buttonClass = 'p-5 rounded-xl border text-sm md:text-base font-bold transition-all text-left flex items-center justify-between cursor-pointer ';

            if (isAnswered) {
              if (isCorrect) {
                buttonClass += 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/20 scale-[1.01]';
              } else if (isSelected) {
                buttonClass += 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-500/20 opacity-90';
              } else {
                buttonClass += 'opacity-30 border-gray-200 bg-gray-50 text-gray-500 pointer-events-none';
              }
            } else {
              buttonClass += colors[idx % 4];
            }

            return (
              <button key={option} onClick={() => handleAnswerSelect(idx)} disabled={isAnswered} className={buttonClass}>
                <span>{option}</span>
                {isAnswered && isCorrect && <span className="text-lg">OK</span>}
                {isAnswered && isSelected && !isCorrect && <span className="text-lg">NO</span>}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="mt-4 p-5 rounded-xl border bg-gray-50 border-gray-200 animate-fade-in flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {selectedIdx === currentQuestion.correctAnswerIndex ? (
                <span className="text-sm font-bold text-emerald-600">Respuesta correcta</span>
              ) : (
                <span className="text-sm font-bold text-red-600">{selectedIdx === -1 ? 'Se agoto el tiempo' : 'Respuesta incorrecta'}</span>
              )}
              {timerLimit !== 60 && selectedIdx === currentQuestion.correctAnswerIndex && (
                <span className="text-[10px] text-gray-500">+{Math.round((timeLeft / timerLimit) * 50)} pts por velocidad</span>
              )}
            </div>

            <p className="text-xs text-gray-600 leading-relaxed italic">{currentQuestion.explanation}</p>

            <button
              onClick={handleNext}
              className="mt-3 self-end bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-6 py-2.5 rounded-lg transition-all shadow-md shadow-orange-500/20"
            >
              {currentIdx === questions.length - 1 ? 'Ver resultados' : 'Siguiente pregunta'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
