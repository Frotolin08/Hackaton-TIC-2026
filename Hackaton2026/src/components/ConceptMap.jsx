import { useState } from 'react';

export default function ConceptMap({ gameSet, onClose }) {
  const concepts = gameSet?.concepts || [];
  const title = gameSet?.title || 'Set de estudio';
  const [selectedConcept, setSelectedConcept] = useState(concepts[0] || null);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!gameSet) return null;

  const width = 700;
  const height = 500;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 160;
  const safeCount = Math.max(concepts.length, 1);

  const nodes = concepts.map((concept, idx) => {
    const angle = (2 * Math.PI * idx) / safeCount - Math.PI / 2;
    return {
      concept,
      idx,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  return (
    <div className="w-full max-w-5xl mx-auto glass-panel p-6 rounded-2xl border border-zinc-800 animate-fade-in flex flex-col gap-6 relative">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Visualizador de conocimiento</span>
          <h3 className="text-xl font-black font-display text-white m-0">Mapa de conceptos: {title}</h3>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all border border-zinc-700 cursor-pointer"
        >
          Volver al lobby
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[450px]">
        <div className="lg:col-span-2 bg-zinc-950/60 border border-zinc-900 rounded-xl relative overflow-hidden flex items-center justify-center min-h-[400px]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-w-[550px] max-h-[400px]">
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
                />
              );
            })}

            <g transform={`translate(${cx}, ${cy})`}>
              <circle r="45" fill="#18181b" stroke="#8b5cf6" strokeWidth="2.5" />
              <foreignObject x="-40" y="-30" width="80" height="60">
                <div className="w-full h-full flex items-center justify-center text-center">
                  <span className="text-[10px] font-black text-white leading-tight font-display select-none line-clamp-3 px-1">
                    {title}
                  </span>
                </div>
              </foreignObject>
            </g>

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
                  <circle
                    r="32"
                    fill={isSelected ? 'rgba(139, 92, 246, 0.2)' : 'rgba(24, 24, 27, 0.9)'}
                    stroke={isSelected ? '#8b5cf6' : isHovered ? 'rgba(139, 92, 246, 0.7)' : '#3f3f46'}
                    strokeWidth={isSelected ? '2' : '1.5'}
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

        <div className="glass-panel p-5 rounded-xl border border-zinc-900 bg-zinc-950/40 flex flex-col justify-between">
          {selectedConcept ? (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div>
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Concepto seleccionado</span>
                <h4 className="text-lg font-black font-display text-white mt-1">{selectedConcept.term}</h4>
              </div>
              <div className="flex flex-col gap-2.5">
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Definicion basica</span>
                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-3 rounded-lg border border-zinc-900">
                    {selectedConcept.definition}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Importancia y contexto</span>
                  <p className="text-xs text-zinc-400 leading-relaxed italic bg-zinc-900/30 p-3 rounded-lg border border-zinc-950">
                    {selectedConcept.explanation}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-zinc-500">
              <p className="text-xs">Selecciona cualquier nodo para explorar su significado.</p>
            </div>
          )}

          <div className="border-t border-zinc-900 pt-4 mt-4 flex items-center justify-between text-[10px] text-zinc-500">
            <span>Nodos totales: {concepts.length}</span>
            <span>Mind map</span>
          </div>
        </div>
      </div>
    </div>
  );
}
