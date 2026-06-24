import React, { useState } from 'react';

export default function ConceptMap({ gameSet, onClose }) {
  if (!gameSet) return null;

  const { title, concepts = [] } = gameSet;
  const [selectedConcept, setSelectedConcept] = useState(concepts[0] || null);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Dimensiones del canvas SVG
  const width = 700;
  const height = 500;
  const cx = width / 2;
  const cy = height / 2;
  const R = 160; // Radio del círculo de nodos

  // Calcular las coordenadas de cada concepto en un círculo
  const nodes = concepts.map((concept, idx) => {
    const angle = (2 * Math.PI * idx) / concepts.length - Math.PI / 2; // Empezar arriba
    return {
      concept,
      idx,
      x: cx + R * Math.cos(angle),
      y: cy + R * Math.sin(angle),
    };
  });

  return (
    <div className="w-full max-w-5xl mx-auto glass-panel p-6 rounded-2xl border border-zinc-800 animate-fade-in flex flex-col gap-6 relative">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Visualizador de Conocimiento</span>
          <h3 className="text-xl font-black font-display text-white m-0">Mapa de Conceptos: {title}</h3>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all border border-zinc-700 cursor-pointer"
        >
          ✕ Volver al Lobby
        </button>
      </div>

      {/* Main Area: Map + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[450px]">
        
        {/* SVG Mind Map Panel */}
        <div className="lg:col-span-2 bg-zinc-950/60 border border-zinc-900 rounded-xl relative overflow-hidden flex items-center justify-center min-h-[400px]">
          
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-full max-w-[550px] max-h-[400px]"
          >
            {/* 1. DRAW CONNECTIONS */}
            {nodes.map((node) => {
              const isSelected = selectedConcept?.term === node.concept.term;
              const isHovered = hoveredIdx === node.idx;
              const isHighlight = isSelected || isHovered;

              return (
                <line
                  key={`line-${node.idx}`}
                  x1={cx}
                  y1={cy}
                  x2={node.x}
                  y2={node.y}
                  stroke={isHighlight ? '#8b5cf6' : '#27272a'}
                  strokeWidth={isHighlight ? 2 : 1}
                  strokeDasharray={isHighlight ? 'none' : '4,4'}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* 2. CENTRAL NODE */}
            <g transform={`translate(${cx}, ${cy})`}>
              <circle
                r="45"
                fill="#18181b"
                stroke="#8b5cf6"
                strokeWidth="2.5"
                className="filter drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]"
              />
              <foreignObject x="-40" y="-30" width="80" height="60">
                <div className="w-full h-full flex items-center justify-center text-center">
                  <span className="text-[10px] font-black text-white leading-tight font-display select-none line-clamp-3 px-1">
                    {title}
                  </span>
                </div>
              </foreignObject>
            </g>

            {/* 3. CONCEPT SUBNODES */}
            {nodes.map((node) => {
              const isSelected = selectedConcept?.term === node.concept.term;
              const isHovered = hoveredIdx === node.idx;
              
              return (
                <g
                  key={`node-${node.idx}`}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer group"
                  onClick={() => setSelectedConcept(node.concept)}
                  onMouseEnter={() => setHoveredIdx(node.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Glowing halo */}
                  <circle
                    r="32"
                    fill={isSelected ? 'rgba(139, 92, 246, 0.2)' : 'rgba(24, 24, 27, 0.9)'}
                    stroke={isSelected ? '#8b5cf6' : isHovered ? 'rgba(139, 92, 246, 0.7)' : '#3f3f46'}
                    strokeWidth={isSelected ? '2' : '1.5'}
                    className="transition-all duration-200 filter group-hover:drop-shadow-[0_0_6px_rgba(139,92,246,0.4)]"
                  />
                  <foreignObject x="-28" y="-28" width="56" height="56">
                    <div className="w-full h-full flex items-center justify-center text-center">
                      <span className="text-[9px] font-bold text-zinc-200 group-hover:text-white leading-tight select-none line-clamp-3 px-1">
                        {node.concept.term}
                      </span>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Side Detail Panel */}
        <div className="glass-panel p-5 rounded-xl border border-zinc-900 bg-zinc-950/40 flex flex-col justify-between">
          {selectedConcept ? (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div>
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Concepto Seleccionado</span>
                <h4 className="text-lg font-black font-display text-white mt-1">{selectedConcept.term}</h4>
              </div>

              <div className="flex flex-col gap-2.5">
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Definición Básica:</span>
                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-3 rounded-lg border border-zinc-900">
                    {selectedConcept.definition}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Importancia y Contexto:</span>
                  <p className="text-xs text-zinc-400 leading-relaxed italic bg-zinc-900/30 p-3 rounded-lg border border-zinc-950">
                    {selectedConcept.explanation}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-zinc-500">
              <span className="text-2xl mb-2">🕸️</span>
              <p className="text-xs">Haz clic en cualquier nodo del mapa mental para explorar su significado.</p>
            </div>
          )}

          {/* Quick Stats at the bottom */}
          <div className="border-t border-zinc-900 pt-4 mt-4 flex items-center justify-between text-[10px] text-zinc-500">
            <span>Nodos Totales: {concepts.length}</span>
            <span>Estilo MindMap 🚀</span>
          </div>
        </div>

      </div>
    </div>
  );
}
