const MODE_LABELS = {
  multiple_choice: 'Opcion multiple',
  flashcards: 'Flashcards',
  fill_blank: 'Completar frase',
  true_false: 'Verdadero/Falso',
};

const DEFAULT_PROFILE = {
  recommendedDifficulty: 'Medio',
  questionCount: 6,
  timerLimit: 30,
  learnerLabel: 'Explorador',
  focus: 'Construir una base solida con practica variada.',
  lastAccuracy: null,
  sessions: 0,
  coach: {
    trend: 'Sin historial',
    weakestMode: null,
    strongestMode: null,
    recommendedMode: 'multiple_choice',
    recommendedModeLabel: MODE_LABELS.multiple_choice,
    plan: [
      'Crea un set desde una fuente real.',
      'Juega opcion multiple para medir comprension inicial.',
      'Cierra con flashcards para fijar conceptos clave.',
    ],
    modeStats: [],
  },
};

export function buildAdaptiveProfile(progress = []) {
  if (!Array.isArray(progress) || progress.length === 0) {
    return DEFAULT_PROFILE;
  }

  const sorted = [...progress].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  const recent = sorted.slice(0, 8);
  const sessions = sorted.length;
  const averageAccuracy = Math.round(
    recent.reduce((sum, item) => sum + Number(item.accuracy || 0), 0) / recent.length
  );
  const coach = buildCoach(sorted, averageAccuracy);

  if (averageAccuracy >= 84 && sessions >= 2) {
    return {
      recommendedDifficulty: 'Dificil',
      questionCount: 8,
      timerLimit: 22,
      learnerLabel: 'Retador',
      focus: 'Subir exigencia con distractores mas finos y menos tiempo.',
      lastAccuracy: averageAccuracy,
      sessions,
      coach,
    };
  }

  if (averageAccuracy < 55) {
    return {
      recommendedDifficulty: 'Facil',
      questionCount: 5,
      timerLimit: 45,
      learnerLabel: 'Refuerzo',
      focus: 'Bajar friccion, usar mas pistas y priorizar conceptos clave.',
      lastAccuracy: averageAccuracy,
      sessions,
      coach,
    };
  }

  return {
    recommendedDifficulty: 'Medio',
    questionCount: 6,
    timerLimit: 30,
    learnerLabel: 'Equilibrado',
    focus: 'Mantener ritmo con practica mixta y feedback inmediato.',
    lastAccuracy: averageAccuracy,
    sessions,
    coach,
  };
}

export function nextDifficultyFromOutcome(currentDifficulty, accuracy) {
  if (accuracy >= 85) return 'Dificil';
  if (accuracy < 55) return 'Facil';
  return currentDifficulty || 'Medio';
}

function buildCoach(progress, averageAccuracy) {
  const modeStats = Object.entries(groupByMode(progress)).map(([mode, items]) => {
    const accuracy = Math.round(items.reduce((sum, item) => sum + Number(item.accuracy || 0), 0) / items.length);
    const bestScore = Math.max(...items.map((item) => Number(item.score || 0)));
    return {
      mode,
      label: MODE_LABELS[mode] || mode,
      sessions: items.length,
      accuracy,
      bestScore,
    };
  }).sort((a, b) => a.accuracy - b.accuracy);

  const weakestMode = modeStats[0] || null;
  const strongestMode = modeStats.length > 0 ? [...modeStats].sort((a, b) => b.accuracy - a.accuracy)[0] : null;
  const recommendedMode = chooseRecommendedMode(weakestMode, progress);
  const trend = getTrend(progress);

  return {
    trend,
    weakestMode,
    strongestMode,
    recommendedMode,
    recommendedModeLabel: MODE_LABELS[recommendedMode] || recommendedMode,
    plan: buildPlan({ averageAccuracy, weakestMode, strongestMode, recommendedMode, trend }),
    modeStats,
  };
}

function groupByMode(progress) {
  return progress.reduce((groups, item) => {
    const mode = item.mode || 'multiple_choice';
    return {
      ...groups,
      [mode]: [...(groups[mode] || []), item],
    };
  }, {});
}

function chooseRecommendedMode(weakestMode, progress) {
  if (weakestMode?.mode) return weakestMode.mode;

  const playedModes = new Set(progress.map((item) => item.mode));
  return Object.keys(MODE_LABELS).find((mode) => !playedModes.has(mode)) || 'multiple_choice';
}

function getTrend(progress) {
  if (progress.length < 3) return 'Calibrando';

  const lastThree = progress.slice(0, 3).map((item) => Number(item.accuracy || 0));
  const previousThree = progress.slice(3, 6).map((item) => Number(item.accuracy || 0));
  if (previousThree.length === 0) return 'Calibrando';

  const recentAverage = average(lastThree);
  const previousAverage = average(previousThree);
  const delta = recentAverage - previousAverage;

  if (delta >= 8) return 'Subiendo';
  if (delta <= -8) return 'Bajando';
  return 'Estable';
}

function buildPlan({ averageAccuracy, weakestMode, strongestMode, recommendedMode, trend }) {
  const plan = [];

  if (averageAccuracy < 55) {
    plan.push('Repite una sesion corta en dificultad Facil antes de subir el nivel.');
  } else if (averageAccuracy >= 84) {
    plan.push('Usa dificultad Dificil para forzar transferencia y no solo memoria.');
  } else {
    plan.push('Mantente en Medio y alterna recuperacion activa con feedback inmediato.');
  }

  if (weakestMode) {
    plan.push(`Prioriza ${weakestMode.label}: precision actual ${weakestMode.accuracy}%.`);
  } else {
    plan.push(`Empieza por ${MODE_LABELS[recommendedMode]} para crear una linea base.`);
  }

  if (strongestMode && strongestMode.accuracy >= 80) {
    plan.push(`Usa ${strongestMode.label} como cierre de confianza despues del modo debil.`);
  } else {
    plan.push('Cierra con flashcards para fijar terminos y definiciones.');
  }

  if (trend === 'Bajando') {
    plan.push('La tendencia baja: reduce cantidad de preguntas y revisa explicaciones antes de repetir.');
  }

  return plan.slice(0, 4);
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
