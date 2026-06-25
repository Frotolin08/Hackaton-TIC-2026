import SourceIngest from '../components/SourceIngest';

const featureRows = [
  ['01', 'Ingesta flexible', 'Pega texto, extrae una URL publica o sube un PDF con contenido seleccionable.'],
  ['02', 'Juegos generados', 'El sistema crea opcion multiple, flashcards, completar frase y verdadero/falso.'],
  ['03', 'Nivel adaptativo', 'La dificultad, cantidad y tiempo recomendado cambian segun tu precision reciente.'],
];

export default function Home({ onGenerate, onImportPack, isLoading, adaptiveProfile, progressHistory = [] }) {
  const coach = adaptiveProfile?.coach;
  const recentSessions = progressHistory.slice(0, 4);

  return (
    <div className="home-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">StudyQuest Lab</p>
          <h1>Tu material entra como fuente. Sale como practica inteligente.</h1>
          <p>
            Crea juegos de aprendizaje desde apuntes reales, juega en sesiones cortas y deja que
            el nivel se ajuste con cada resultado.
          </p>
        </div>

        <div className="mission-board" aria-label="Estado del entrenamiento">
          <div>
            <span>Perfil</span>
            <strong>{adaptiveProfile?.learnerLabel || 'Explorador'}</strong>
          </div>
          <div>
            <span>Nivel sugerido</span>
            <strong>{adaptiveProfile?.recommendedDifficulty || 'Medio'}</strong>
          </div>
          <div>
            <span>Precision reciente</span>
            <strong>
              {adaptiveProfile?.lastAccuracy === null || adaptiveProfile?.lastAccuracy === undefined
                ? 'Sin datos'
                : `${adaptiveProfile.lastAccuracy}%`}
            </strong>
          </div>
        </div>
      </section>

      <section className="coach-panel" aria-label="Plan adaptativo">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Coach adaptativo</p>
            <h3>Proxima mejor sesion</h3>
          </div>
          <div className="coach-next">
            <span>Modo recomendado</span>
            <strong>{coach?.recommendedModeLabel || 'Opcion multiple'}</strong>
          </div>
        </div>

        <div className="coach-grid">
          <div className="coach-card coach-card--wide">
            <span>Tendencia</span>
            <strong>{coach?.trend || 'Sin historial'}</strong>
            <p>{adaptiveProfile?.focus || 'Crea una primera sesion para calibrar el nivel.'}</p>
          </div>
          <div className="coach-card">
            <span>Sesiones</span>
            <strong>{adaptiveProfile?.sessions || 0}</strong>
            <p>{recentSessions.length > 0 ? 'Ultimas partidas guardadas.' : 'Aun no hay historial.'}</p>
          </div>
          <div className="coach-card">
            <span>Punto debil</span>
            <strong>{coach?.weakestMode?.label || 'Por descubrir'}</strong>
            <p>{coach?.weakestMode ? `${coach.weakestMode.accuracy}% de precision` : 'Juega dos modos para detectarlo.'}</p>
          </div>
        </div>

        <div className="coach-plan">
          {(coach?.plan || []).map((item, index) => (
            <div key={item}>
              <span>{index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>

        {coach?.modeStats?.length > 0 && (
          <div className="mode-stats" aria-label="Rendimiento por modo">
            {coach.modeStats.map((mode) => (
              <div key={mode.mode}>
                <span>{mode.label}</span>
                <strong>{mode.accuracy}%</strong>
                <small>{mode.sessions} sesiones</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="workspace-grid">
        <SourceIngest
          onGenerate={onGenerate}
          onImportPack={onImportPack}
          isLoading={isLoading}
          adaptiveProfile={adaptiveProfile}
        />

        <aside className="feature-rail" aria-label="Flujo de aprendizaje">
          {featureRows.map(([index, title, description]) => (
            <div className="feature-row" key={index}>
              <span>{index}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </div>
          ))}

          {recentSessions.length > 0 && (
            <div className="recent-sessions">
              <h3>Ultimas sesiones</h3>
              {recentSessions.map((session) => (
                <div key={session.id || `${session.title}-${session.timestamp}`}>
                  <span>{session.title}</span>
                  <strong>{session.accuracy}%</strong>
                </div>
              ))}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

