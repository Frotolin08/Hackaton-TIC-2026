import { Fragment, useRef, useState } from 'react';

export default function GameFillInBlank({ questions = [], onGameFinished }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const inputRef = useRef(null);

  const currentQuestion = questions[currentIdx];

  const normalize = (str) => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[.,/#!$%&*;:{}=_`~()-]/g, '')
      .trim();
  };

  const handleSubmit = (event) => {
    if (event) event.preventDefault();
    if (isSubmitted || !userAnswer.trim()) return;

    setIsSubmitted(true);
    const isCorrect = normalize(userAnswer) === normalize(currentQuestion.answer);

    if (isCorrect) {
      setCorrectAnswersCount((prev) => prev + 1);
      setScore((prev) => prev + (showHint ? 60 : 120));
    } else {
      setWrongQuestions((prev) => [...prev, {
        question: `Completar: "${currentQuestion.phrase}"`,
        selectedAnswer: userAnswer,
        correctAnswer: currentQuestion.answer,
        explanation: `La palabra correcta era "${currentQuestion.answer}". Pista: ${currentQuestion.hint || 'sin pista'}`,
      }]);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((idx) => idx + 1);
      setUserAnswer('');
      setIsSubmitted(false);
      setShowHint(false);
      window.setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }

    onGameFinished({
      score,
      correctCount: correctAnswersCount,
      totalQuestions: questions.length,
      wrongQuestions,
      mode: 'fill_blank',
    });
  };

  if (!currentQuestion) return null;

  const isCorrectAnswer = normalize(userAnswer) === normalize(currentQuestion.answer);

  const getLetterHint = (word) => {
    if (!word) return '';
    if (word.length <= 2) return `${word[0]}...`;
    return `${word[0].toUpperCase()}${' _'.repeat(word.length - 2)} ${word[word.length - 1].toLowerCase()}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white/80 border border-gray-200 rounded-xl px-6 py-3">
        <span className="text-xs font-bold text-gray-600">Progreso: <span className="text-gray-900">{currentIdx + 1}/{questions.length}</span></span>
        <span className="text-xs font-bold text-gray-600">Puntaje: <span className="text-orange-500">{score} pts</span></span>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-gray-200 flex flex-col gap-6">
        {currentQuestion.category && (
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full w-fit">
            {currentQuestion.category}
          </span>
        )}

        <div className="py-4">
          <p className="text-xl md:text-2xl font-semibold text-gray-900 leading-relaxed text-center">
            {currentQuestion.phrase.split('______').map((part, index, array) => (
              <Fragment key={`${part}-${index}`}>
                {part}
                {index < array.length - 1 && (
                  <span className="inline-block border-b-2 border-dashed border-orange-500 text-orange-600 font-bold px-2 py-0.5 min-w-[80px] text-center mx-1">
                    {isSubmitted ? currentQuestion.answer : (userAnswer || '?')}
                  </span>
                )}
              </Fragment>
            ))}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(event) => setUserAnswer(event.target.value)}
              disabled={isSubmitted}
              autoFocus
              placeholder="Escribe tu respuesta aqui..."
              className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-900 placeholder-gray-400"
            />
            {!isSubmitted && (
              <button type="submit" disabled={!userAnswer.trim()} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs px-6 rounded-xl transition-all shadow-md shadow-orange-500/20 cursor-pointer">
                Comprobar
              </button>
            )}
          </div>

          {!isSubmitted && (
            <div className="flex justify-between items-center text-xs">
              {showHint ? (
                <div className="text-gray-600 bg-gray-50 border border-gray-200 p-2.5 rounded-xl animate-fade-in flex flex-col gap-1 w-full">
                  <div className="flex justify-between font-bold text-[10px] text-orange-600">
                    <span>PISTA DE ESTUDIO</span>
                    <span>-50% puntos</span>
                  </div>
                  <span>Concepto: <strong className="text-gray-900">{getLetterHint(currentQuestion.answer)}</strong> ({currentQuestion.answer.length} letras)</span>
                  {currentQuestion.hint && <span className="italic opacity-85 mt-0.5">Pista: {currentQuestion.hint}</span>}
                </div>
              ) : (
                <button type="button" onClick={() => setShowHint(true)} className="text-gray-500 hover:text-gray-700 font-semibold underline cursor-pointer ml-auto">
                  Revelar pista
                </button>
              )}
            </div>
          )}
        </form>

        {isSubmitted && (
          <div className={`p-5 rounded-xl border animate-fade-in flex flex-col gap-2 ${isCorrectAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <div className="flex items-center gap-2 font-bold text-sm">
              {isCorrectAnswer ? (
                <>
                  <span>Correcto. Excelente memoria.</span>
                  {showHint && <span className="text-[10px] font-normal text-emerald-600">(pista usada)</span>}
                </>
              ) : (
                <span>Incorrecto</span>
              )}
            </div>

            <p className="text-xs opacity-90">
              Frase completa: <strong className="underline">{currentQuestion.phrase.replace('______', currentQuestion.answer)}</strong>
            </p>

            {!isCorrectAnswer && (
              <p className="text-[11px] opacity-75">Tu respuesta: <span className="line-through">{userAnswer}</span></p>
            )}

            <button onClick={handleNext} className="mt-2 self-end bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-6 py-2 rounded-lg transition-all shadow-md shadow-orange-500/20">
              {currentIdx === questions.length - 1 ? 'Ver resultados' : 'Siguiente frase'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
