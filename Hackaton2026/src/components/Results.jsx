import React, { useState } from 'react';
import { aiService } from '../services/ai';

export default function Results({ results = {}, onRetry, onBackToLobby, sourceText = '' }) {
  const { score, correctCount, totalQuestions, wrongQuestions = [], mode } = results;
  
  const [tutorQueryLoading, setTutorQueryLoading] = useState(null); // id o índice de la pregunta
  const [tutorResponses, setTutorResponses] = useState({}); // mapeo de indice -> respuesta del tutor
  const [followUps, setFollowUps] = useState({}); // follow up inputs
  const [chatHistories, setChatHistories] = useState({}); // chat histories por pregunta

  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const handleAskTutor = async (qIdx, question) => {
    if (tutorResponses[qIdx]) return; // ya cargado

    setTutorQueryLoading(qIdx);
    
    try {
      const response = await aiService.askTutorAboutError(
        question.question,
        question.selectedAnswer,
        question.correctAnswer,
        question.explanation,
        sourceText
      );
      
      setTutorResponses(prev => ({ ...prev, [qIdx]: response }));
      setChatHistories(prev => ({
        ...prev,
        [qIdx]: [{ sender: 'tutor', text: response }]
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setTutorQueryLoading(null);
    }
  };

  const handleSendFollowUp = async (qIdx, question) => {
    const query = followUps[qIdx];
    if (!query || !query.trim()) return;

    // Agregar pregunta a la historia
    const updatedHistory = [
      ...(chatHistories[qIdx] || []),
      { sender: 'user', text: query }
    ];
    setChatHistories(prev => ({ ...prev, [qIdx]: updatedHistory }));
    setFollowUps(prev => ({ ...prev, [qIdx]: '' }));
    
    setTutorQueryLoading(qIdx);

    try {
      // Simular llamada al tutor con contexto extendido
      const contextPrompt = `Pregunta original: "${question.question}". Respuesta correcta: "${question.correctAnswer}". El usuario pregunta: "${query}". Responde de forma muy amigable, pedagógica, clara y corta (1 o 2 párrafos).`;
      
      let reply;
      if (aiService.isRealAIConnected()) {
        const response = await aiService.askTutorAboutError(
          question.question, 
          question.selectedAnswer, 
          question.correctAnswer, 
          `Pregunta del usuario: ${query}. Responde directamente a esta consulta sobre el tema.`,
          sourceText
        );
        reply = response;
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        reply = `¡Muy buena pregunta! En base al material de estudio, ese aspecto se relaciona directamente con el núcleo del tema. El término clave se asocia con esta propiedad ya que define el comportamiento que observamos en los experimentos. ¿Queda clara esta distinción o te gustaría profundizar en otro detalle?`;
      }

      setChatHistories(prev => ({
        ...prev,
        [qIdx]: [...updatedHistory, { sender: 'tutor', text: reply }]
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setTutorQueryLoading(null);
    }
  };

  // Mensaje motivacional según rendimiento
  const getFeedbackMessage = () => {
    if (accuracy === 100) return { title: '¡Perfecto! 🥇', desc: '¡Has dominado este material por completo! Racha impecable.', color: 'text-emerald-400' };
    if (accuracy >= 70) return { title: '¡Excelente Trabajo! 🌟', desc: 'Tienes una base muy sólida. Corrige tus dudas con el tutor y lo dominarás.', color: 'text-violet-400' };
    if (accuracy >= 40) return { title: '¡Vas por buen camino! ⚡', desc: 'Repasar el glosario o usar el Tutor de IA te ayudará a fijar estos conceptos.', color: 'text-amber-400' };
    return { title: '¡No te rindas! 💪', desc: 'El aprendizaje es un proceso. ¡Usa las explicaciones personalizadas del tutor para despejar tus dudas!', color: 'text-red-400' };
  };

  const feedback = getFeedbackMessage();

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in">
      
      {/* Celebration Panel */}
      <div className="glass-panel p-8 rounded-2xl border border-zinc-800 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600/5 to-transparent pointer-events-none"></div>
        
        <span className="text-4xl md:text-5xl block mb-2">🏆</span>
        <h2 className={`text-3xl font-black font-display ${feedback.color} m-0`}>{feedback.title}</h2>
        <p className="text-sm text-zinc-300 max-w-md mx-auto mt-2 leading-relaxed">
          {feedback.desc}
        </p>

        {/* Stats Circle/Gauges */}
        <div className="grid grid-cols-2 gap-4 mt-8 max-w-sm mx-auto">
          <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-4 flex flex-col items-center">
            <span className="text-xs font-bold text-zinc-500 uppercase">Puntos ganados</span>
            <span className="text-2xl font-black text-yellow-400 mt-1">+{score} pts</span>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-4 flex flex-col items-center">
            <span className="text-xs font-bold text-zinc-500 uppercase">Precisión</span>
            <span className="text-2xl font-black text-white mt-1">{accuracy}%</span>
            <span className="text-[10px] text-zinc-500 mt-0.5">({correctCount}/{totalQuestions} correctas)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-violet-600/20 hover:scale-[1.02] cursor-pointer"
          >
            🔁 Reintentar Modo
          </button>
          <button
            onClick={onBackToLobby}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm rounded-xl transition-all border border-zinc-700 hover:scale-[1.02] cursor-pointer"
          >
            🎮 Elegir otro Modo
          </button>
        </div>
      </div>

      {/* Weak Areas & AI Tutor Section */}
      {wrongQuestions.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-black font-display text-zinc-200 flex items-center gap-2">
            <span>💡</span> Repasa tus dudas con el Tutor de IA
          </h3>
          <p className="text-xs text-zinc-400">
            Haz clic en el botón de tutoría en cualquiera de tus respuestas incorrectas para recibir una explicación adaptada y abrir un chat explicativo.
          </p>

          <div className="flex flex-col gap-4">
            {wrongQuestions.map((q, idx) => (
              <div 
                key={idx} 
                className="glass-panel rounded-xl border border-zinc-900 overflow-hidden bg-zinc-950/40"
              >
                {/* Question Info Bar */}
                <div className="p-4 bg-zinc-900/40 border-b border-zinc-900/60 flex flex-col md:flex-row justify-between gap-3 items-start md:items-center">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Pregunta con error</span>
                    <h4 className="text-sm font-bold text-zinc-200 mt-0.5 leading-relaxed">{q.question}</h4>
                  </div>
                  
                  <button
                    onClick={() => handleAskTutor(idx, q)}
                    disabled={tutorQueryLoading === idx}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                      tutorResponses[idx] 
                        ? 'bg-violet-950/40 text-violet-400 border-violet-850' 
                        : 'bg-zinc-850 border-zinc-700 hover:bg-violet-600/20 text-zinc-300 hover:text-violet-300 hover:border-violet-500/30'
                    }`}
                  >
                    {tutorQueryLoading === idx ? (
                      <>
                        <div className="w-3 h-3 border border-zinc-400/20 border-t-zinc-400 rounded-full animate-spin"></div>
                        <span>Consultando...</span>
                      </>
                    ) : tutorResponses[idx] ? (
                      <>
                        <span>💬</span>
                        <span>Tutor Activo</span>
                      </>
                    ) : (
                      <>
                        <span>🤖</span>
                        <span>Preguntar al Tutor</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Details list */}
                <div className="p-4 flex flex-col gap-2 text-xs">
                  <div className="flex gap-2">
                    <span className="text-zinc-500 font-bold w-20">Tu respuesta:</span>
                    <span className="text-red-400 font-semibold line-through">{q.selectedAnswer}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-zinc-500 font-bold w-20">Correcta:</span>
                    <span className="text-emerald-400 font-bold">{q.correctAnswer}</span>
                  </div>
                </div>

                {/* Tutor Chat Area */}
                {chatHistories[idx] && (
                  <div className="border-t border-zinc-900 bg-zinc-950/80 p-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-3.5 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                      {chatHistories[idx].map((msg, mIdx) => (
                        <div 
                          key={mIdx} 
                          className={`flex gap-3 text-xs leading-relaxed max-w-[85%] ${
                            msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px] ${
                            msg.sender === 'user' ? 'bg-zinc-800 text-zinc-300' : 'bg-violet-600 text-white shadow shadow-violet-500/20'
                          }`}>
                            {msg.sender === 'user' ? 'Tú' : 'IA'}
                          </div>
                          
                          <div className={`p-3 rounded-2xl ${
                            msg.sender === 'user' 
                              ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tr-none' 
                              : 'bg-violet-950/30 border border-violet-900/40 text-violet-200 rounded-tl-none whitespace-pre-line'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chat Input for Follow-up */}
                    <div className="flex gap-2 mt-2 pt-2 border-t border-zinc-900/60">
                      <input
                        type="text"
                        value={followUps[idx] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFollowUps(prev => ({ ...prev, [idx]: val }));
                        }}
                        placeholder="Hazle una pregunta de seguimiento al tutor..."
                        onKeyDown={(e) => e.key === 'Enter' && handleSendFollowUp(idx, q)}
                        className="flex-1 bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                      />
                      <button
                        onClick={() => handleSendFollowUp(idx, q)}
                        className="px-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition-all"
                      >
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
