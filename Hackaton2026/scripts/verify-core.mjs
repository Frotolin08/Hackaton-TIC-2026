import assert from 'node:assert/strict';
import { buildAdaptiveProfile, nextDifficultyFromOutcome } from '../src/services/adaptive.js';
import {
  buildStudyPack,
  buildStudyPackMarkdown,
  parseStudyPackJson,
  validateStudyPack,
} from '../src/services/exportStudyPack.js';

const sampleSet = {
  title: 'Biologia celular',
  summary: 'Practica sobre celulas y organelos.',
  difficulty: 'Medio',
  levelMode: 'adaptive',
  sourceLabel: 'Apuntes',
  questions: {
    multiple_choice: [
      {
        question: 'Que organelo produce energia?',
        options: ['Mitocondria', 'Ribosoma', 'Nucleo', 'Lisosoma'],
        correct_answer: 'Mitocondria',
      },
    ],
    flashcards: [],
    fill_blank: [],
    true_false: [],
  },
  concepts: [{ term: 'Mitocondria', definition: 'Organelo asociado a la energia celular.' }],
};

const defaultProfile = buildAdaptiveProfile();
assert.equal(defaultProfile.recommendedDifficulty, 'Medio');
assert.equal(defaultProfile.coach.recommendedMode, 'multiple_choice');

const lowProfile = buildAdaptiveProfile([
  { accuracy: 42, mode: 'flashcards', timestamp: '2026-06-20T10:00:00.000Z' },
]);
assert.equal(lowProfile.recommendedDifficulty, 'Facil');

const highProfile = buildAdaptiveProfile([
  { accuracy: 90, mode: 'multiple_choice', timestamp: '2026-06-22T10:00:00.000Z' },
  { accuracy: 88, mode: 'fill_blank', timestamp: '2026-06-21T10:00:00.000Z' },
]);
assert.equal(highProfile.recommendedDifficulty, 'Dificil');

const weakModeProfile = buildAdaptiveProfile([
  { accuracy: 92, mode: 'multiple_choice', timestamp: '2026-06-22T10:00:00.000Z' },
  { accuracy: 45, mode: 'true_false', timestamp: '2026-06-21T10:00:00.000Z' },
]);
assert.equal(weakModeProfile.coach.recommendedMode, 'true_false');
assert.equal(nextDifficultyFromOutcome('Medio', 90), 'Dificil');
assert.equal(nextDifficultyFromOutcome('Dificil', 40), 'Facil');
assert.equal(nextDifficultyFromOutcome('Medio', 70), 'Medio');

const pack = buildStudyPack(sampleSet, highProfile);
assert.equal(pack.app, 'StudyQuest');
assert.equal(pack.version, 1);
assert.equal(validateStudyPack(pack).set.title, sampleSet.title);
assert.equal(parseStudyPackJson(JSON.stringify(pack)).set.questions.multiple_choice.length, 1);
assert.match(buildStudyPackMarkdown(sampleSet, highProfile), /Mitocondria/);
assert.throws(() => parseStudyPackJson('{'), /JSON/);
assert.throws(() => validateStudyPack({ app: 'OtherApp' }), /StudyQuest/);

console.log('Core verification passed');
