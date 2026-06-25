import { dbService } from '../services/db';
import { aiService } from '../services/ai';

export default function Navbar({
  streak = 0,
  score = 0,
  adaptiveProfile,
  onHome,
  onViewHistory,
  onNewSource,
}) {
  const hasSupabase = dbService.isSupabaseConnected();
  const hasAI = aiService.isRealAIConnected();

  return (
    <nav className="topbar">
      <button className="brand-lockup" onClick={onHome} type="button">
        <span>SQ</span>
        <div>
          <strong>StudyQuest</strong>
          <small>Fuente a juegos adaptativos</small>
        </div>
      </button>

      <div className="topbar-stats" aria-label="Estado del usuario">
        <div title="Racha de estudio">
          <span>Racha</span>
          <strong>{streak}d</strong>
        </div>
        <div title="Puntuacion total">
          <span>Puntos</span>
          <strong>{score}</strong>
        </div>
        <div title="Perfil adaptativo">
          <span>Nivel</span>
          <strong>{adaptiveProfile?.recommendedDifficulty || 'Medio'}</strong>
        </div>
      </div>

      <div className="topbar-actions">
        <button type="button" onClick={onNewSource}>Nueva fuente</button>
        <button type="button" onClick={onViewHistory}>Biblioteca</button>
        <div className="status-dots" aria-label="Integraciones">
          <span className={hasSupabase ? 'is-online' : 'is-local'} title={hasSupabase ? 'Supabase activo' : 'Base local'}>
            DB
          </span>
          <span className={hasAI ? 'is-online' : 'is-local'} title={hasAI ? 'OpenAI activo' : 'Generador local'}>
            AI
          </span>
        </div>
      </div>
    </nav>
  );
}

