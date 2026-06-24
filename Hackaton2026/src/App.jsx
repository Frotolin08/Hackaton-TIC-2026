import React, { useState, useEffect } from 'react';
import Home from './pages/Home.jsx';
import Navbar from './components/Navbar'
import SourceIngest from './components/SourceIngest';
import Lobby from './components/Lobby';
import ConceptMap from './components/ConceptMap';
import HistoryDrawer from './components/HistoryDrawer';
import { LobbySkeleton, GamePlaySkeleton } from './components/Skeletons';

// Motores de juego
import GameMultipleChoice from './components/GameMultipleChoice';
import GameFlashcards from './components/GameFlashcards';
import GameFillInBlank from './components/GameFillInBlank';
import GameTrueFalse from './components/GameTrueFalse';
import Results from './components/Results';

// Servicios
import { aiService } from './services/ai';
import { dbService } from './services/db';

export default function App() {
  // Estados de navegación
  const [view, setView] = useState('home'); // 'home', 'ingest', 'history', 'lobby', 'concept_map', 'gameplay', 'results'
  const [activeSet, setActiveSet] = useState(null);
  const [gameMode, setGameMode] = useState(null); // 'multiple_choice', 'flashcards', 'fill_blank', 'true_false'

  // Estados globales de usuario
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);

  // Estados de procesamiento
  const [isLoading, setIsLoading] = useState(false);
  const [gameResults, setGameResults] = useState(null);

  // Cargar estadísticas y último set al iniciar
  useEffect(() => {
    const savedStreak = localStorage.getItem('studyquest_streak');
    const savedScore = localStorage.getItem('studyquest_score');

    if (savedStreak) setStreak(Number(savedStreak));
    if (savedScore) setScore(Number(savedScore));

    // Autodetectar si hay una racha activa (o inicializar en 1 si es nuevo)
    if (!savedStreak) {
      localStorage.setItem('studyquest_streak', '1');
      setStreak(1);
    }
  }, []);

  const handleGenerate = async ({ text, difficulty, preferences }) => {
    setIsLoading(true);
    setView('ingest'); // Mantener en ingest con el loader activo

    try {
      const generated = await aiService.generateGames(text, difficulty, preferences);

      // Guardar set en BD (Supabase o LocalStorage integrado)
      const savedSet = await dbService.saveGameSet({
        ...generated,
        difficulty,
        sourceText: text
      });

      setActiveSet(savedSet);
      setView('lobby');
    } catch (err) {
      console.error("Error al generar juegos:", err);
      alert("Hubo un error analizando el material. Por favor intenta con un texto más claro o revisa tu conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameFinished = async (outcome) => {
    // Actualizar racha y puntuación global
    const newScore = score + outcome.score;
    setScore(newScore);
    localStorage.setItem('studyquest_score', String(newScore));

    // Guardar progreso en la base de datos híbrida
    await dbService.saveUserProgress({
      setId: activeSet.id,
      title: activeSet.title,
      mode: outcome.mode,
      score: outcome.score,
      accuracy: Math.round((outcome.correctCount / outcome.totalQuestions) * 100),
      timestamp: new Date().toISOString()
    });

    setGameResults(outcome);
    setView('results');
  };

  const handleSelectHistorySet = (set) => {
    setActiveSet(set);
    setView('lobby');
  };

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-4 md:p-6 lg:p-8">

      {/* Navbar Superior */}
      <Navbar
        streak={streak}
        score={score}
        onViewHistory={() => setView('history')}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col justify-center py-4">

        {/* VISTA DE CARGA (SKELETONS) */}
        {isLoading && (
          <div className="flex flex-col gap-6 items-center justify-center max-w-4xl mx-auto w-full">
            <div className="text-center flex flex-col gap-2">
              <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto mb-2"></div>
              <h3 className="text-xl font-black font-display text-white">Procesando material cognitivo...</h3>
              <p className="text-xs text-zinc-400">Claude está extrayendo conceptos y diseñando 4 motores de juego interactivos.</p>
            </div>
            <LobbySkeleton />
          </div>
        )}

        {/* VISTAS DE LA APLICACIÓN */}
        {!isLoading && (
          <>
            {view === 'home' && <Home />}

            {/* 1. Ingesta de fuentes */}
            {view === 'ingest' && (
              <SourceIngest
                onGenerate={handleGenerate}
                isLoading={isLoading}
              />
            )}

            {/* 2. Historial de sets */}
            {view === 'history' && (
              <HistoryDrawer
                onSelectSet={handleSelectHistorySet}
                onClose={() => setView(activeSet ? 'lobby' : 'ingest')}
              />
            )}

            {/* 3. Lobby del Set de Juego */}
            {view === 'lobby' && activeSet && (
              <Lobby
                gameSet={activeSet}
                onSelectMode={(mode) => {
                  setGameMode(mode);
                  setView('gameplay');
                }}
                onBack={() => setView('ingest')}
                onOpenConceptMap={() => setView('concept_map')}
              />
            )}

            {/* 4. Mapa de Conceptos Clave (Mind Map) */}
            {view === 'concept_map' && activeSet && (
              <ConceptMap
                gameSet={activeSet}
                onClose={() => setView('lobby')}
              />
            )}

            {/* 5. Motor de Juegos */}
            {view === 'gameplay' && activeSet && (
              <div className="w-full">

                {/* Back to lobby header line */}
                <div className="max-w-3xl mx-auto mb-4 flex justify-between items-center px-2">
                  <span className="text-xs font-black text-violet-400 uppercase tracking-widest">
                    SQ: {activeSet.title}
                  </span>
                  <button
                    onClick={() => {
                      if (window.confirm("¿Seguro que deseas salir del juego actual? Perderás el progreso de esta sesión.")) {
                        setView('lobby');
                      }
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 font-bold underline cursor-pointer"
                  >
                    ✕ Salir de la partida
                  </button>
                </div>

                {/* Switch dinámico de modos de juego */}
                {gameMode === 'multiple_choice' && (
                  <GameMultipleChoice
                    questions={activeSet.questions.multiple_choice}
                    timerLimit={activeSet.timerLimit || 30}
                    onGameFinished={handleGameFinished}
                  />
                )}

                {gameMode === 'flashcards' && (
                  <GameFlashcards
                    cards={activeSet.questions.flashcards}
                    onGameFinished={handleGameFinished}
                  />
                )}

                {gameMode === 'fill_blank' && (
                  <GameFillInBlank
                    questions={activeSet.questions.fill_blank}
                    onGameFinished={handleGameFinished}
                  />
                )}

                {gameMode === 'true_false' && (
                  <GameTrueFalse
                    questions={activeSet.questions.true_false}
                    onGameFinished={handleGameFinished}
                  />
                )}
              </div>
            )}

            {/* 6. Pantalla de Resultados y Tutor de IA */}
            {view === 'results' && activeSet && (
              <Results
                results={gameResults}
                sourceText={activeSet.sourceText}
                onRetry={() => setView('gameplay')}
                onBackToLobby={() => setView('lobby')}
              />
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-900 mt-12 pt-6 text-center text-xs text-zinc-600 flex flex-col md:flex-row justify-between gap-4">
        <span>StudyQuest — Hackathon TIC 2026. Todos los derechos reservados.</span>
        <div className="flex justify-center gap-4">
          <a href="#" className="hover:text-zinc-400 transition-colors">Github</a>
          <span>•</span>
          <a href="#" className="hover:text-zinc-400 transition-colors">Vercel</a>
          <span>•</span>
          <a href="#" className="hover:text-zinc-400 transition-colors">Supabase</a>
        </div>
      </footer>

    </div>
  );
}
