// src/pages/Game.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import MultipleChoiceGame from '../components/MultipleChoiceGame';
import FlashcardGame from '../components/FlashcardGame';
import Navbar from '../components/Navbar';

export default function Game() {
  const { selectedMode, gameSet } = useGame();
  const navigate = useNavigate();

  if (!gameSet) {
    // No game data yet, go back to home
    navigate('/');
    return null;
  }

  const renderGame = () => {
    switch (selectedMode) {
      case 'multiple-choice':
        return <MultipleChoiceGame data={gameSet.multipleChoice} />;
      case 'flashcard':
        return <FlashcardGame data={gameSet.flashcards} />;
      default:
        return <div className="text-center text-white">Selecciona un modo de juego en el lobby.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white">
      <Navbar />
      <main className="flex items-center justify-center py-12 px-4">
        <section className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-3xl w-full">
          {renderGame()}
        </section>
      </main>
    </div>
  );
}
