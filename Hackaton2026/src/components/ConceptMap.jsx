import { useState } from 'react';

export default function ConceptMap({ gameSet, onClose }) {
  const concepts = gameSet?.concepts || [];
  const title = gameSet?.title || 'Set de estudio';
  const [selectedConcept, setSelectedConcept] = useState(concepts[0] || null);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!gameSet) return null;

  const width = 800;
  const height = 600;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 220;
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
    <div className="w-full max-w-5xl mx-auto glass-panel p-6 rounded-2xl border border-gray-200 animate-fade-in flex flex-col gap-6 relative">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Visualizador de conocimiento</span>
          <h3 className="text-xl font-black font-display text-gray-900 m-0">Mapa de conceptos: {title}</h3>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all border border-gray-300 cursor-pointer"
        >
          Volver al lobby
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[450px]">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl relative overflow-hidden flex items-center justify-center min-h-[500px]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-w-[650px] max-h-[500px]">
            {nodes.map((node) => {
              const isSelected = selectedConcept?.term === node.concept.term;
              const isHovered = hoveredIdx === node.idx;
              const isHighlight = isSelected || isHovered;

              return (
                <line
                  zIndex={1}
                  key={`line-${node.idx}`}
                  x1={cx}
                  y1={cy}
                  x2={node.x}
                  y2={node.y}
                  stroke={isHighlight ? '#f97316' : '#86898d'}
                  strokeWidth={1}
                  strokeDasharray={isHighlight ? '4,4' : '4,4'}
                />
              );
            })}

            <g transform={`translate(${cx}, ${cy})`}>
              <circle r="55" fill="#ffffff" stroke="#f97316" strokeWidth="3" />
              <foreignObject x="-50" y="-35" width="100" height="70">
                <div className="w-full h-full flex items-center justify-center text-center">
                  <span className="text-[14px] font-black text-gray-900 leading-tight font-display select-none line-clamp-3 px-1">
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
                    r="60"
                    fill={isSelected ? 'rgb(255, 206, 171)' : '#ffffff'}
                    stroke={isSelected ? '#f97316' : isHovered ? 'rgba(249, 115, 22, 0.6)' : '#d1d5db'}
                    strokeWidth={isSelected ? '2.5' : '2'}
                  />
                  <foreignObject x="-45" y="-45" width="90" height="90">
                    <div className="w-full h-full flex items-center justify-center text-center overflow-hidden">
                      <span className="text-[15px] font-bold text-gray-700 group-hover:text-gray-900 leading-tight select-none line-clamp-3 px-1 overflow-hidden text-ellipsis">
                        {node.concept.term}
                      </span>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-gray-200 bg-white flex flex-col justify-between">
          {selectedConcept ? (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div>
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Concepto seleccionado</span>
                <h4 className="text-lg font-black font-display text-gray-900 mt-1">{selectedConcept.term}</h4>
              </div>
              <div className="flex flex-col gap-2.5">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Definicion basica</span>
                  <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {selectedConcept.definition}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Importancia y contexto</span>
                  <p className="text-xs text-gray-600 leading-relaxed italic bg-gray-100 p-3 rounded-lg border border-gray-200">
                    {selectedConcept.explanation}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
              <p className="text-xs">Selecciona cualquier nodo para explorar su significado.</p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4 mt-4 flex items-center justify-between text-[10px] text-gray-500">
            <span>Nodos totales: {concepts.length}</span>
            <span>Mind map</span>
          </div>
        </div>
      </div>
    </div>
  );
}
