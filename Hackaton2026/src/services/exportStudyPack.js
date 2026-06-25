export function buildStudyPack(gameSet, adaptiveProfile) {
  return {
    exportedAt: new Date().toISOString(),
    app: 'HumanLearning',
    version: 1,
    adaptiveProfile: adaptiveProfile ? {
      recommendedDifficulty: adaptiveProfile.recommendedDifficulty,
      learnerLabel: adaptiveProfile.learnerLabel,
      lastAccuracy: adaptiveProfile.lastAccuracy,
      sessions: adaptiveProfile.sessions,
      coach: adaptiveProfile.coach,
    } : null,
    set: gameSet,
  };
}

export function validateStudyPack(pack) {
  if (!pack || typeof pack !== 'object') {
    throw new Error('El archivo no tiene un formato valido.');
  }

  if (pack.app !== 'HumanLearning' || !pack.set || typeof pack.set !== 'object') {
    throw new Error('El archivo no parece ser un pack de HumanLearning.');
  }

  const set = pack.set;
  const questions = set.questions || {};
  const hasPlayableMode = [
    'multiple_choice',
    'flashcards',
    'fill_blank',
    'true_false',
  ].some((mode) => Array.isArray(questions[mode]) && questions[mode].length > 0);

  if (!hasPlayableMode) {
    throw new Error('El pack no incluye juegos utilizables.');
  }

  return {
    ...pack,
    set: {
      ...set,
      title: set.title || 'Set importado',
      summary: set.summary || 'Pack importado desde HumanLearning.',
      difficulty: set.difficulty || pack.adaptiveProfile?.recommendedDifficulty || 'Medio',
      levelMode: set.levelMode || 'fixed',
      sourceLabel: set.sourceLabel || 'Pack HumanLearning',
      questions: {
        multiple_choice: questions.multiple_choice || [],
        flashcards: questions.flashcards || [],
        fill_blank: questions.fill_blank || [],
        true_false: questions.true_false || [],
      },
      concepts: Array.isArray(set.concepts) ? set.concepts : [],
    },
  };
}

export function parseStudyPackJson(jsonText) {
  try {
    return validateStudyPack(JSON.parse(jsonText));
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error('El archivo JSON no se pudo leer.', { cause: err });
    }
    throw err;
  }
}

export async function readStudyPackFile(file) {
  if (!file) {
    throw new Error('Selecciona un archivo de pack.');
  }

  const text = await file.text();
  return parseStudyPackJson(text);
}

export function buildStudyPackMarkdown(gameSet, adaptiveProfile) {
  const concepts = gameSet?.concepts || [];
  const questions = gameSet?.questions || {};
  const modes = [
    ['multiple_choice', 'Opcion multiple'],
    ['flashcards', 'Flashcards'],
    ['fill_blank', 'Completar frase'],
    ['true_false', 'Verdadero/Falso'],
  ];

  const lines = [
    `# ${gameSet?.title || 'HumanLearning Set'}`,
    '',
    gameSet?.summary || 'Set de estudio generado desde una fuente.',
    '',
    '## Configuracion',
    `- Dificultad: ${gameSet?.difficulty || adaptiveProfile?.recommendedDifficulty || 'Medio'}`,
    `- Modo de nivel: ${gameSet?.levelMode === 'fixed' ? 'Fijo' : 'Adaptativo'}`,
    `- Fuente: ${gameSet?.sourceLabel || 'Fuente de estudio'}`,
    '',
    '## Plan sugerido',
    ...(adaptiveProfile?.coach?.plan || ['Practica un modo corto y revisa tus errores.']).map((step) => `- ${step}`),
    '',
    '## Conceptos clave',
    ...(concepts.length > 0 ? concepts.map((concept) => `- **${concept.term}**: ${concept.definition}`) : ['- Sin conceptos disponibles.']),
    '',
    '## Juegos incluidos',
    ...modes.map(([key, label]) => `- ${label}: ${questions[key]?.length || 0} retos`),
  ];

  return lines.join('\n');
}

export function downloadStudyPack(gameSet, adaptiveProfile) {
  const pack = buildStudyPack(gameSet, adaptiveProfile);
  const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugify(gameSet?.title || 'humanlearning-set')}.humanlearning.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function copyStudyPackSummary(gameSet, adaptiveProfile) {
  const markdown = buildStudyPackMarkdown(gameSet, adaptiveProfile);

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(markdown);
    return true;
  }

  const textarea = document.createElement('textarea');
  textarea.value = markdown;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}

function slugify(value) {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'humanlearning-set';
}

