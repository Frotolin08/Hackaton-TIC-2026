import { useState } from 'react';
import { aiService } from '../services/ai';

export default function Results({ results = {}, onRetry, onBackToLobby, sourceText = '' }) {
  const { score = 0, correctCount = 0, totalQuestions = 0, wrongQuestions = [], nextDifficulty } = results || {};
  const [tutorQueryLoading, setTutorQueryLoading] = useState(null);
  const [tutorResponses, setTutorResponses] = useState({});
  const [followUps, setFollowUps] = useState({});
  const [chatHistories, setChatHistories] = useState({});

  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const handleAskTutor = async (qIdx, question) => {
    if (tutorResponses[qIdx]) return;
    setTutorQueryLoading(qIdx);

    try {
      const response = await aiService.askTutorAboutError(
        question.question,
        question.selectedAnswer,
        question.correctAnswer,
        question.explanation,
        sourceText
      );
      setTutorResponses((prev) => ({ ...prev, [qIdx]: response }));
      setChatHistories((prev) => ({ ...prev, [qIdx]: [{ sender: 'tutor', text: response }] }));
    } catch (err) {
      console.error(err);
    } finally {
      setTutorQueryLoading(null);
    }
  };

  const handleSendFollowUp = async (qIdx, question) => {
    const query = followUps[qIdx];
    if (!query?.trim()) return;

    const updatedHistory = [...(chatHistories[qIdx] || []), { sender: 'user', text: query }];
    setChatHistories((prev) => ({ ...prev, [qIdx]: updatedHistory }));
    setFollowUps((prev) => ({ ...prev, [qIdx]: '' }));
    setTutorQueryLoading(qIdx);

    try {
      let reply;
      if (aiService.isRealAIConnected()) {
        reply = await aiService.askTutorAboutError(
          question.question,
          question.selectedAnswer,
          question.correctAnswer,
          `Pregunta del usuario: ${query}. Responde directamente esta duda sobre el tema.`,
          sourceText
        );
      } else {
        await new Promise((resolve) => setTimeout(resolve, 700));
        reply = 'Buena pregunta. La forma mas util de repasarlo es volver al concepto correcto, compararlo con tu respuesta y escribir un ejemplo propio. Eso ayuda a separar memorizar de comprender.';
      }

      setChatHistories((prev) => ({
        ...prev,
        [qIdx]: [...updatedHistory, { sender: 'tutor', text: reply }],
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setTutorQueryLoading(null);
    }
  };

  const getFeedbackMessage = () => {
    if (accuracy === 100) return { title: 'Dominio completo', desc: 'Respondiste todo correctamente. Puedes subir dificultad o cambiar de modo.', color: 'text-emerald-400' };
    if (accuracy >= 70) return { title: 'Base solida', desc: 'Buen rendimiento. Revisa los errores con el tutor para cerrar los huecos.', color: 'text-violet-400' };
    if (accuracy >= 40) return { title: 'En progreso', desc: 'Ya hay traccion. Conviene repasar glosario y repetir el modo.', color: 'text-amber-400' };
    return { title: 'Necesita refuerzo', desc: 'Baja dificultad, usa pistas y vuelve a practicar los conceptos principales.', color: 'text-red-400' };
  };

  const feedback = getFeedbackMessage();

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="glass-panel p-8 rounded-2xl border border-zinc-800 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600/5 to-transparent pointer-events-none" />
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Resultado de sesion</span>
        <h2 className={`text-3xl font-black font-display ${feedback.color} m-0 mt-2`}>{feedback.title}</h2>
        <p className="text-sm text-zinc-300 max-w-md mx-auto mt-2 leading-relaxed">{feedback.desc}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8 max-w-xl mx-auto">
          <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-4 flex flex-col items-center">
            <span className="text-xs font-bold text-zinc-500 uppercase">Puntos ganados</span>
            <span className="text-2xl font-black text-yellow-400 mt-1">+{score}</span>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-4 flex flex-col items-center">
            <span className="text-xs font-bold text-zinc-500 uppercase">Precision</span>
            <span className="text-2xl font-black text-white mt-1">{accuracy}%</span>
            <span className="text-[10px] text-zinc-500 mt-0.5">{correctCount}/{totalQuestions} correctas</span>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-4 flex flex-col items-center col-span-2 md:col-span-1">
            <span className="text-xs font-bold text-zinc-500 uppercase">Siguiente nivel</span>
            <span className="text-2xl font-black text-white mt-1">{nextDifficulty || 'Medio'}</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button onClick={onRetry} className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-violet-600/20 hover:scale-[1.02] cursor-pointer">
            Reintentar modo
          </button>
          <button onClick={onBackToLobby} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm rounded-xl transition-all border border-zinc-700 hover:scale-[1.02] cursor-pointer">
            Elegir otro modo
          </button>
        </div>
      </div>

      {wrongQuestions.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-black font-display text-zinc-200">Repasa tus dudas con el tutor</h3>
          <p className="text-xs text-zinc-400">Abre una explicacion para cada error y pregunta algo de seguimiento si necesitas mas contexto.</p>

          <div className="flex flex-col gap-4">
            {wrongQuestions.map((q, idx) => (
              <div key={`${q.question}-${idx}`} className="glass-panel rounded-xl border border-zinc-900 overflow-hidden bg-zinc-950/40">
                <div className="p-4 bg-zinc-900/40 border-b border-zinc-900/60 flex flex-col md:flex-row justify-between gap-3 items-start md:items-center">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Pregunta con error</span>
                    <h4 className="text-sm font-bold text-zinc-200 mt-0.5 leading-relaxed">{q.question}</h4>
                  </div>
                  <button onClick={() => handleAskTutor(idx, q)} disabled={tutorQueryLoading === idx} className="text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer bg-zinc-850 border-zinc-700 hover:bg-violet-600/20 text-zinc-300 hover:text-violet-300 hover:border-violet-500/30">
                    {tutorQueryLoading === idx ? 'Consultando...' : tutorResponses[idx] ? 'Tutor activo' : 'Preguntar al tutor'}
                  </button>
                </div>

                <div className="p-4 flex flex-col gap-2 text-xs">
                  <div className="flex gap-2"><span className="text-zinc-500 font-bold w-24">Tu respuesta:</span><span className="text-red-400 font-semibold line-through">{q.selectedAnswer}</span></div>
                  <div className="flex gap-2"><span className="text-zinc-500 font-bold w-24">Correcta:</span><span className="text-emerald-400 font-bold">{q.correctAnswer}</span></div>
                </div>

                {chatHistories[idx] && (
                  <div className="border-t border-zinc-900 bg-zinc-950/80 p-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-3.5 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                      {chatHistories[idx].map((msg, mIdx) => (
                        <div key={`${msg.sender}-${mIdx}`} className={`flex gap-3 text-xs leading-relaxed max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px] ${msg.sender === 'user' ? 'bg-zinc-800 text-zinc-300' : 'bg-violet-600 text-white shadow shadow-violet-500/20'}`}>
                            {msg.sender === 'user' ? 'Tu' : 'IA'}
                          </div>
                          <div className={`p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tr-none' : 'bg-violet-950/30 border border-violet-900/40 text-violet-200 rounded-tl-none whitespace-pre-line'}`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-2 pt-2 border-t border-zinc-900/60">
                      <input
                        type="text"
                        value={followUps[idx] || ''}
                        onChange={(event) => setFollowUps((prev) => ({ ...prev, [idx]: event.target.value }))}
                        placeholder="Pregunta de seguimiento..."
                        onKeyDown={(event) => event.key === 'Enter' && handleSendFollowUp(idx, q)}
                        className="flex-1 bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                      />
                      <button onClick={() => handleSendFollowUp(idx, q)} className="px-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition-all">
                        Enviar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
