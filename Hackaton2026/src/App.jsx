import { useEffect, useState } from 'react';
import Home from './pages/Home.jsx';
import Navbar from './components/Navbar';
import SourceIngest from './components/SourceIngest';
import Lobby from './components/Lobby';
import ConceptMap from './components/ConceptMap';
import HistoryDrawer from './components/HistoryDrawer';
import { LobbySkeleton } from './components/Skeletons';
import GameMultipleChoice from './components/GameMultipleChoice';
import GameFlashcards from './components/GameFlashcards';
import GameFillInBlank from './components/GameFillInBlank';
import GameTrueFalse from './components/GameTrueFalse';
import Results from './components/Results';
import { aiService } from './services/ai';
import { dbService } from './services/db';
import { buildAdaptiveProfile, nextDifficultyFromOutcome } from './services/adaptive';

const timerForDifficulty = (difficulty, adaptiveTimer) => {
  if (difficulty === 'Facil') return 45;
  if (difficulty === 'Dificil') return 22;
  return adaptiveTimer || 30;
};

export default function App() {
  const [view, setView] = useState('home');
  const [activeSet, setActiveSet] = useState(null);
  const [gameMode, setGameMode] = useState(null);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [gameResults, setGameResults] = useState(null);
  const [adaptiveProfile, setAdaptiveProfile] = useState(buildAdaptiveProfile());
  const [progressHistory, setProgressHistory] = useState([]);

  useEffect(() => {
    const bootstrap = async () => {
      const savedStreak = Number(localStorage.getItem('studyquest_streak') || 1);
      const savedScore = Number(localStorage.getItem('studyquest_score') || 0);
      setStreak(savedStreak);
      setScore(savedScore);
      localStorage.setItem('studyquest_streak', String(savedStreak));

      try {
        const progress = await dbService.getUserProgress();
        setProgressHistory(progress);
        setAdaptiveProfile(buildAdaptiveProfile(progress));
      } catch (err) {
        console.error('Could not load adaptive profile', err);
      }
    };

    bootstrap();
  }, []);

  const handleGenerate = async ({ text, difficulty, preferences }) => {
    setIsLoading(true);
    setView('home');

    try {
      const selectedDifficulty = difficulty || adaptiveProfile.recommendedDifficulty;
      const selectedQuestionCount = preferences?.questionCount || adaptiveProfile.questionCount;
      const isAdaptive = preferences?.levelMode !== 'fixed';
      const generated = await aiService.generateGames(text, selectedDifficulty, {
        ...preferences,
        questionCount: selectedQuestionCount,
      });

      const savedSet = await dbService.saveGameSet({
        ...generated,
        difficulty: selectedDifficulty,
        sourceText: text,
        timerLimit: isAdaptive ? adaptiveProfile.timerLimit : timerForDifficulty(selectedDifficulty),
        levelMode: isAdaptive ? 'adaptive' : 'fixed',
        adaptiveSnapshot: isAdaptive ? adaptiveProfile : null,
        sourceLabel: preferences?.sourceLabel || 'Fuente de estudio',
      });

      setActiveSet(savedSet);
      setView('lobby');
    } catch (err) {
      console.error('Error generating games:', err);
      window.alert('No pude analizar el material. Intenta con un texto mas claro o revisa la conexion.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleImportPack = async (importedSet) => {
    setIsLoading(true);

    try {
      const savedSet = await dbService.saveGameSet({
        ...importedSet,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        importedAt: new Date().toISOString(),
        title: importedSet.title || 'Set importado',
        sourceLabel: importedSet.sourceLabel || 'Pack StudyQuest',
        sourceText: importedSet.sourceText || importedSet.summary || 'Pack importado desde StudyQuest.',
        timerLimit: importedSet.timerLimit || timerForDifficulty(importedSet.difficulty || 'Medio', adaptiveProfile.timerLimit),
      });

      setActiveSet(savedSet);
      setView('lobby');
    } catch (err) {
      console.error('Error importing pack:', err);
      window.alert('No pude importar ese pack. Revisa que sea un archivo StudyQuest valido.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleGameFinished = async (outcome) => {
    const accuracy = outcome.totalQuestions > 0
      ? Math.round((outcome.correctCount / outcome.totalQuestions) * 100)
      : 0;
    const newScore = score + outcome.score;
    const nextDifficulty = nextDifficultyFromOutcome(activeSet?.difficulty, accuracy);

    setScore(newScore);
    localStorage.setItem('studyquest_score', String(newScore));

    await dbService.saveUserProgress({
      setId: activeSet.id,
      title: activeSet.title,
      mode: outcome.mode,
      score: outcome.score,
      accuracy,
      nextDifficulty,
      timestamp: new Date().toISOString(),
    });

    const progress = await dbService.getUserProgress();
    setProgressHistory(progress);
    setAdaptiveProfile(buildAdaptiveProfile(progress));
    setGameResults({ ...outcome, accuracy, nextDifficulty });
    setView('results');
  };

  const handleSelectHistorySet = (set) => {
    setActiveSet(set);
    setView('lobby');
  };

  const startMode = (mode) => {
    setGameMode(mode);
    setGameResults(null);
    setView('gameplay');
  };

  return (
    <div className="app-shell">
      <Navbar
        streak={streak}
        score={score}
        adaptiveProfile={adaptiveProfile}
        onHome={() => setView(activeSet ? 'lobby' : 'home')}
        onViewHistory={() => setView('history')}
        onNewSource={() => setView('new_source')}
      />

      <main className="app-main">
        {isLoading && (
          <div className="loading-state">
            <div className="loader-ring" />
            <div>
              <h3>Analizando la fuente y construyendo juegos</h3>
              <p>Extrayendo conceptos, distractores, pistas y feedback adaptativo.</p>
            </div>
            <LobbySkeleton />
          </div>
        )}

        {!isLoading && view === 'home' && (
          <Home
            onGenerate={handleGenerate}
            onImportPack={handleImportPack}
            isLoading={isLoading}
            adaptiveProfile={adaptiveProfile}
            progressHistory={progressHistory}
          />
        )}

        {!isLoading && view === 'new_source' && (
          <div className="single-panel">
            <SourceIngest
              onGenerate={handleGenerate}
              onImportPack={handleImportPack}
              isLoading={isLoading}
              adaptiveProfile={adaptiveProfile}
            />
          </div>
        )}

        {!isLoading && view === 'history' && (
          <HistoryDrawer
            onSelectSet={handleSelectHistorySet}
            onClose={() => setView(activeSet ? 'lobby' : 'home')}
          />
        )}

        {!isLoading && view === 'lobby' && activeSet && (
          <Lobby
            gameSet={activeSet}
            adaptiveProfile={adaptiveProfile}
            onSelectMode={startMode}
            onBack={() => setView('new_source')}
            onOpenConceptMap={() => setView('concept_map')}
          />
        )}

        {!isLoading && view === 'concept_map' && activeSet && (
          <ConceptMap gameSet={activeSet} onClose={() => setView('lobby')} />
        )}

        {!isLoading && view === 'gameplay' && activeSet && (
          <div className="game-shell">
            <div className="game-shell__bar">
              <span>{activeSet.title}</span>
              <button
                onClick={() => {
                  if (window.confirm('Seguro que deseas salir? Perderas el progreso de esta sesion.')) {
                    setView('lobby');
                  }
                }}
              >
                Salir
              </button>
            </div>

            {gameMode === 'multiple_choice' && (
              <GameMultipleChoice
                questions={activeSet.questions.multiple_choice}
                timerLimit={activeSet.timerLimit || adaptiveProfile.timerLimit}
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

        {!isLoading && view === 'results' && activeSet && (
          <Results
            results={gameResults}
            sourceText={activeSet.sourceText}
            onRetry={() => setView('gameplay')}
            onBackToLobby={() => setView('lobby')}
          />
        )}
      </main>

      <footer className="app-footer">
        <span>StudyQuest - Hackathon TIC 2026</span>
        <span>Fuente a juegos adaptativos de aprendizaje</span>
      </footer>
    </div>
  );
}




