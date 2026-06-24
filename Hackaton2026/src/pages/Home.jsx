// src/pages/Home.jsx
import React from 'react';
import SourceIngest from '../components/SourceIngest';
import Navbar from '../components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white">

      <main className="flex items-center justify-center py-12 px-4">
        <section className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-4xl w-full">
          <h1 className="text-3xl font-bold mb-6 text-center">StudyQuest - Crea tu propio juego</h1>
          <SourceIngest />
        </section>
      </main>
    </div>
  );
}
