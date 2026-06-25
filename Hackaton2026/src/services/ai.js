const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_BASE_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

if (OPENAI_API_KEY) {
  console.log('OpenAI API key detected. Ready to generate.');
} else {
  console.info('OpenAI API key not found. Using local cognitive simulation.');
}

async function callOpenAI(messages, maxTokens = 4000) {
  const response = await fetch(OPENAI_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export const aiService = {
  isRealAIConnected: () => Boolean(OPENAI_API_KEY),

  generateGames: async (text, difficulty = 'Medio', preferences = {}) => {
    const questionCount = preferences.questionCount || 5;

    if (OPENAI_API_KEY) {
      try {
        return await generateWithOpenAI(text, difficulty, questionCount);
      } catch (error) {
        console.error('OpenAI generation failed, using local simulation:', error);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 900));
    return generateSmartMock(text, difficulty, questionCount);
  },

  askTutorAboutError: async (questionText, selectedAnswer, correctAnswer, explanation, contextText) => {
    const prompt = `Actua como tutor de estudio interactivo y amable.
Un estudiante respondio mal una pregunta. Explica de forma clara, breve y accionable por que se equivoco.

CONTEXTO:
${contextText ? contextText.slice(0, 1500) : 'Informacion general del tema.'}

PREGUNTA:
${questionText}

RESPUESTA DEL ESTUDIANTE:
${selectedAnswer}

RESPUESTA CORRECTA:
${correctAnswer}

EXPLICACION INICIAL:
${explanation}

Responde en espanol, maximo 3 parrafos cortos, con un consejo de estudio concreto.`;

    if (OPENAI_API_KEY) {
      try {
        return await callOpenAI([{ role: 'user', content: prompt }], 600);
      } catch (err) {
        console.error('OpenAI tutor failed:', err);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 700));
    return getMockTutorResponse(questionText, selectedAnswer, correctAnswer, explanation);
  },
};

async function generateWithOpenAI(text, difficulty, count) {
  const systemPrompt = 'Eres un generador de juegos educativos. Responde solo con JSON valido, sin markdown ni texto extra.';
  const userPrompt = `Analiza el texto de estudio y genera juegos didacticos interactivos.
Dificultad: ${difficulty}
Cantidad exacta por tipo de juego: ${count}
Idioma de salida: Espanol.

TEXTO:
"""
${text}
"""

Devuelve exactamente esta estructura:
{
  "title": "Titulo corto del set",
  "summary": "Resumen breve de los temas clave",
  "concepts": [
    { "term": "Termino clave", "definition": "Definicion corta", "explanation": "Por que importa" }
  ],
  "questions": {
    "multiple_choice": [
      {
        "question": "Pregunta clara",
        "options": ["Opcion A", "Opcion B", "Opcion C", "Opcion D"],
        "correctAnswerIndex": 0,
        "explanation": "Feedback de la respuesta correcta",
        "points": 100
      }
    ],
    "flashcards": [
      { "front": "Pregunta o termino", "back": "Respuesta", "hint": "Pista", "category": "Subtema" }
    ],
    "fill_blank": [
      { "phrase": "Frase con ______ como hueco", "answer": "Palabra", "hint": "Pista", "category": "Subtema" }
    ],
    "true_false": [
      { "statement": "Afirmacion verificable", "isTrue": true, "explanation": "Por que", "category": "Subtema" }
    ]
  }
}

Reglas:
1. En Facil usa preguntas directas y guiadas.
2. En Medio mezcla memoria y comprension.
3. En Dificil usa distractores plausibles y relaciones entre conceptos.
4. En fill_blank usa exactamente el marcador ______.
5. correctAnswerIndex debe ser un numero de 0 a 3.`;

  const content = await callOpenAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], 4000);

  let cleanJsonString = content.trim();
  if (cleanJsonString.startsWith('```')) {
    cleanJsonString = cleanJsonString.replace(/^```json\s*/, '').replace(/```$/, '');
  }

  return JSON.parse(cleanJsonString.trim());
}

function generateSmartMock(text, difficulty, count) {
  const cleanText = text.trim();
  const sentences = cleanText
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 10);

  let title = cleanText.split('\n')[0].replace(/[#*_ -]/g, '').trim();
  if (!title || title.length < 5 || title.length > 60) {
    title = cleanText.split(/\s+/).slice(0, 4).join(' ') || 'Set de estudio';
  }

  const summary = sentences.slice(0, 2).join('. ') || 'Entrenamiento interactivo creado desde el material ingresado.';
  const concepts = extractConcepts(cleanText, sentences, title, count + 2);

  const questions = {
    multiple_choice: [],
    flashcards: [],
    fill_blank: [],
    true_false: [],
  };

  concepts.forEach((concept, idx) => {
    const alternatives = concepts
      .filter((_, itemIdx) => itemIdx !== idx)
      .map((item) => item.definition)
      .slice(0, 3);

    while (alternatives.length < 3) {
      alternatives.push('Una idea relacionada pero incompleta del material.');
    }

    const shuffledOptions = shuffleArray([concept.definition, ...alternatives]);
    const correctAnswerIndex = shuffledOptions.indexOf(concept.definition);
    const points = difficulty === 'Facil' ? 100 : difficulty === 'Dificil' ? 200 : 150;

    questions.multiple_choice.push({
      question: `Cual opcion describe mejor "${concept.term}"?`,
      options: shuffledOptions,
      correctAnswerIndex,
      explanation: `${concept.term}: ${concept.definition}`,
      points,
    });

    questions.flashcards.push({
      front: `Que significa "${concept.term}"?`,
      back: concept.definition,
      hint: concept.definition.slice(0, 42),
      category: title,
    });

    const answer = concept.term.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') || 'concepto';
    questions.fill_blank.push({
      phrase: `El concepto "${concept.term}" ayuda a explicar ______ dentro de este material.`,
      answer,
      hint: `Empieza con ${answer.charAt(0).toUpperCase()} y tiene ${answer.length} letras.`,
      category: 'Vocabulario',
    });

    const isTrue = idx % 2 === 0;
    const neighbor = concepts[(idx + 1) % concepts.length] || concept;
    questions.true_false.push({
      statement: isTrue
        ? `"${concept.term}" se relaciona con: ${concept.definition}`
        : `"${concept.term}" se define como: ${neighbor.definition}`,
      isTrue,
      explanation: isTrue
        ? 'Correcto. Esa relacion aparece en la fuente.'
        : `Incorrecto. La definicion esperada es: ${concept.definition}`,
      category: 'Comprension',
    });
  });

  return {
    title,
    summary: summary.endsWith('.') ? summary : `${summary}.`,
    concepts: concepts.slice(0, count + 2),
    questions: {
      multiple_choice: questions.multiple_choice.slice(0, count),
      flashcards: questions.flashcards.slice(0, count),
      fill_blank: questions.fill_blank.slice(0, count),
      true_false: questions.true_false.slice(0, count),
    },
  };
}

function extractConcepts(cleanText, sentences, title, limit) {
  const concepts = [];
  const seen = new Set();
  const definitionRegex = /([A-Za-z0-9\s]{3,32})\s+(?:es|son|se refiere a|consiste en|:|-|—)\s+([^.]{16,150})/gi;
  let match;

  while ((match = definitionRegex.exec(cleanText)) !== null && concepts.length < limit) {
    const term = match[1].trim().split(/\s+/).slice(-4).join(' ');
    const definition = match[2].trim();
    const key = term.toLowerCase();

    if (!seen.has(key) && term.length > 2) {
      seen.add(key);
      concepts.push({
        term: capitalize(term),
        definition: capitalize(definition),
        explanation: `Es una pieza importante para entender ${title}.`,
      });
    }
  }

  const fallbackTerms = keywordTerms(cleanText, limit);
  for (const term of fallbackTerms) {
    if (concepts.length >= limit) break;
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const relatedSentence = sentences.find((sentence) => sentence.toLowerCase().includes(key)) || sentences[concepts.length % Math.max(sentences.length, 1)] || 'Idea principal extraida del material.';
    concepts.push({
      term,
      definition: relatedSentence,
      explanation: 'Concepto detectado por frecuencia y presencia en la fuente.',
    });
  }

  return concepts.length > 0 ? concepts : [
    {
      term: 'Idea central',
      definition: sentences[0] || 'Tema principal del material ingresado.',
      explanation: 'Punto de partida para construir la practica.',
    },
  ];
}

function keywordTerms(text, limit) {
  const stopWords = new Set(['para', 'como', 'esta', 'este', 'desde', 'donde', 'sobre', 'entre', 'tambien', 'porque', 'cuando', 'puede', 'pueden']);
  const counts = new Map();

  text.toLowerCase().split(/\W+/).forEach((word) => {
    if (word.length < 5 || stopWords.has(word)) return;
    counts.set(word, (counts.get(word) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.max(limit, 5))
    .map(([word]) => capitalize(word));
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getMockTutorResponse(questionText, selectedAnswer, correctAnswer, explanation) {
  return `Veo la confusion. En la pregunta "${questionText}" elegiste "${selectedAnswer}", pero la respuesta correcta era "${correctAnswer}".

La clave esta en separar el distractor de la idea principal. ${explanation}

Tip de estudio: escribe el concepto correcto con un ejemplo propio y vuelve a responder una pregunta parecida en unos minutos.`;
}
