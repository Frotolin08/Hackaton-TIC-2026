import { useState } from 'react';
import { copyStudyPackSummary, downloadStudyPack } from '../services/exportStudyPack';

const MODE_META = {
  multiple_choice: {
    title: 'Opcion multiple',
    mark: 'A/B/C',
    description: 'Preguntas con distractores para comprobar comprension y velocidad.',
    accent: 'mode-violet',
  },
  flashcards: {
    title: 'Flashcards',
    mark: 'MEM',
    description: 'Repeticion espaciada con autoevaluacion para dominar conceptos.',
    accent: 'mode-blue',
  },
  fill_blank: {
    title: 'Completar frase',
    mark: 'TXT',
    description: 'Recuperacion activa: escribe el termino faltante con pistas opcionales.',
    accent: 'mode-green',
  },
  true_false: {
    title: 'Verdadero/Falso',
    mark: 'V/F',
    description: 'Juicios rapidos para detectar malentendidos y fijar explicaciones.',
    accent: 'mode-red',
  },
};

export default function Lobby({ gameSet, adaptiveProfile, onSelectMode, onBack, onOpenConceptMap }) {
  const [shareStatus, setShareStatus] = useState('');

  if (!gameSet) return null;

  const { title, summary, concepts = [], questions = {}, difficulty, sourceLabel } = gameSet;
  const totalQuestions = Object.values(questions).reduce((sum, list) => sum + (list?.length || 0), 0);
  const recommendedMode = adaptiveProfile?.coach?.recommendedMode;

  const modes = Object.entries(MODE_META).map(([id, meta]) => ({
    id,
    ...meta,
    count: questions[id]?.length || 0,
    recommended: id === recommendedMode,
  }));
  const recommendedAvailable = modes.find((mode) => mode.recommended && mode.count > 0);

  const handleCopySummary = async () => {
    try {
      const copied = await copyStudyPackSummary(gameSet, adaptiveProfile);
      setShareStatus(copied ? 'Resumen copiado' : 'No se pudo copiar');
    } catch (err) {
      console.error(err);
      setShareStatus('No se pudo copiar');
    } finally {
      window.setTimeout(() => setShareStatus(''), 2200);
    }
  };

  const handleDownload = () => {
    downloadStudyPack(gameSet, adaptiveProfile);
    setShareStatus('Pack descargado');
    window.setTimeout(() => setShareStatus(''), 2200);
  };

  return (
    <div className="lobby-shell">
      <section className="set-brief">
        <div className="set-brief__copy">
          <p className="eyebrow">Set activo</p>
          <h2>{title}</h2>
          <p>{summary}</p>
        </div>

        <div className="set-metrics" aria-label="Resumen del set">
          <div>
            <span>Nivel</span>
            <strong>{difficulty || adaptiveProfile?.recommendedDifficulty || 'Medio'}</strong>
          </div>
          <div>
            <span>Conceptos</span>
            <strong>{concepts.length}</strong>
          </div>
          <div>
            <span>Retos</span>
            <strong>{totalQuestions}</strong>
          </div>
        </div>
      </section>

      <section className="adaptive-strip">
        <div>
          <span>Perfil adaptativo</span>
          <strong>{adaptiveProfile?.learnerLabel || 'Explorador'}</strong>
        </div>
        <p>{adaptiveProfile?.focus || 'Practica variada con feedback inmediato.'}</p>
        {recommendedAvailable && (
          <button type="button" onClick={() => onSelectMode(recommendedAvailable.id)}>
            Jugar recomendado
          </button>
        )}
        <button type="button" onClick={onOpenConceptMap}>Mapa de conceptos</button>
        <button type="button" onClick={onBack}>Cambiar material</button>
      </section>

      <section className="export-strip" aria-label="Exportar set de estudio">
        <div>
          <span>Study pack</span>
          <strong>Guardar o compartir</strong>
          <p>Exporta el set completo como JSON o copia una guia Markdown para estudiar fuera de la app.</p>
        </div>
        <div className="export-actions">
          <button type="button" onClick={handleDownload}>Descargar pack</button>
          <button type="button" onClick={handleCopySummary}>Copiar resumen</button>
        </div>
        {shareStatus && <span className="export-status">{shareStatus}</span>}
      </section>

      {adaptiveProfile?.coach?.plan?.length > 0 && (
        <section className="coach-mini" aria-label="Plan del coach">
          <div>
            <span>Modo sugerido</span>
            <strong>{adaptiveProfile.coach.recommendedModeLabel}</strong>
          </div>
          <ol>
            {adaptiveProfile.coach.plan.slice(0, 3).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      <section className="concept-strip" aria-label="Conceptos clave">
        <div className="section-heading">
          <p className="eyebrow">Glosario activo</p>
          <h3>Conceptos extraidos</h3>
        </div>
        <div className="concept-list">
          {concepts.slice(0, 8).map((concept, index) => (
            <article key={`${concept.term}-${index}`}>
              <strong>{concept.term}</strong>
              <p>{concept.definition}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mode-grid" aria-label="Modos de juego">
        {modes.map((mode) => {
          const disabled = mode.count === 0;
          return (
            <button
              type="button"
              key={mode.id}
              className={`mode-card ${mode.accent} ${mode.recommended ? 'is-recommended' : ''}`}
              onClick={() => !disabled && onSelectMode(mode.id)}
              disabled={disabled}
            >
              <span className="mode-card__mark">{mode.mark}</span>
              {mode.recommended && <span className="mode-card__badge">Recomendado</span>}
              <div>
                <h3>{mode.title}</h3>
                <p>{mode.description}</p>
              </div>
              <strong>{disabled ? 'No disponible' : `${mode.count} retos`}</strong>
            </button>
          );
        })}
      </section>

      {sourceLabel && <p className="source-footnote">Fuente: {sourceLabel}</p>}
    </div>
  );
}
