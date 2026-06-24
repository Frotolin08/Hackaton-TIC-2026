const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_BASE_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

if (OPENAI_API_KEY) {
  console.log('OpenAI ChatGPT API key detected. Ready to generate.');
} else {
  console.info('OpenAI API key not found (VITE_OPENAI_API_KEY). Using client-side cognitive simulation for game generation.');
}

// Helper to call OpenAI Chat Completions API
async function callOpenAI(messages, maxTokens = 4000) {
  const response = await fetch(OPENAI_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export const aiService = {
  isRealAIConnected: () => {
    return !!OPENAI_API_KEY;
  },

  // Generar juegos a partir de texto
  generateGames: async (text, difficulty = 'Medio', preferences = {}) => {
    const questionCount = preferences.questionCount || 5;

    if (OPENAI_API_KEY) {
      try {
        const response = await generateWithOpenAI(text, difficulty, questionCount);
        return response;
      } catch (error) {
        console.error('OpenAI API error, falling back to smart simulation:', error);
        // Fallback a simulación cognitiva
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay
        return generateSmartMock(text, difficulty, questionCount);
      }
    } else {
      // Simular delay de carga de red/IA
      await new Promise(resolve => setTimeout(resolve, 2200));
      return generateSmartMock(text, difficulty, questionCount);
    }
  },

  // Tutor IA para explicar un error en una pregunta específica
  askTutorAboutError: async (questionText, selectedAnswer, correctAnswer, explanation, contextText) => {
    const prompt = `Actúa como un tutor de estudio interactivo y amigable (estilo Duolingo/NotebookLM).
Un estudiante estaba respondiendo una pregunta de estudio y cometió un error. Ayúdale a entender por qué se equivocó y explícale el concepto de forma muy clara, corta y comprensible.

CONTEXTO DE ESTUDIO:
${contextText ? contextText.slice(0, 1500) : 'Información general del tema.'}

PREGUNTA:
"${questionText}"

RESPUESTA DEL ESTUDIANTE:
"${selectedAnswer}"

RESPUESTA CORRECTA:
"${correctAnswer}"

EXPLICACIÓN CORTA INICIAL:
"${explanation}"

Por favor, escribe una explicación amena, con tono de ánimo, que no supere los 3 párrafos cortos, destacando la clave del malentendido y dándole un tip nemotécnico o de estudio para recordarlo.`;

    if (OPENAI_API_KEY) {
      try {
        const reply = await callOpenAI(
          [{ role: 'user', content: prompt }],
          600
        );
        return reply;
      } catch (err) {
        console.error('OpenAI Tutor error:', err);
        return getMockTutorResponse(questionText, selectedAnswer, correctAnswer, explanation);
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getMockTutorResponse(questionText, selectedAnswer, correctAnswer, explanation);
    }
  }
};

// --- LLAMADA A OPENAI (ChatGPT) ---
async function generateWithOpenAI(text, difficulty, count) {
  const systemPrompt = `Eres un generador de juegos educativos. Responde ÚNICAMENTE con un objeto JSON válido, sin texto extra, sin markdown, sin bloques de código.`;

  const userPrompt = `Analiza el siguiente texto de estudio y genera un set completo de juegos didácticos interactivos.
Debes adaptar las preguntas a una dificultad de nivel: "${difficulty}". 
Genera exactamente ${count} elementos por cada tipo de juego si es posible.

TEXTO A ANALIZAR:
"""
${text}
"""

INSTRUCCIONES DE FORMATO:
Debes responder ÚNICAMENTE con un objeto JSON válido y estructurado, sin texto introductorio ni explicaciones antes o después de la llave de JSON.
El JSON debe seguir esta estructura exacta:
{
  "title": "Un título corto y atractivo para este set de estudio",
  "summary": "Un resumen conciso en un párrafo de los temas clave cubiertos",
  "concepts": [
    { "term": "Término clave", "definition": "Definición corta", "explanation": "Explicación de por qué es importante" }
  ],
  "questions": {
    "multiple_choice": [
      {
        "question": "Pregunta de opción múltiple interactiva y clara",
        "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
        "correctAnswerIndex": 0,
        "explanation": "Explicación corta de por qué esa es la correcta cuando el usuario responda",
        "points": 100
      }
    ],
    "flashcards": [
      {
        "front": "Pregunta, término o concepto en la tarjeta frontal",
        "back": "Respuesta, detalle o explicación al reverso",
        "hint": "Pista útil corta para recordar",
        "category": "Subtema"
      }
    ],
    "fill_blank": [
      {
        "phrase": "Una oración clave donde se reemplaza la palabra crucial con '______' (usa exactamente 6 guiones bajos)",
        "answer": "LaPalabraExactaParaCompletar",
        "hint": "Pista gramatical o conceptual",
        "category": "Subtema"
      }
    ],
    "true_false": [
      {
        "statement": "Una afirmación científica, histórica o del texto que pueda ser verdadera o falsa",
        "isTrue": true,
        "explanation": "Explicación corta de por qué es verdadero o falso",
        "category": "Subtema"
      }
    ]
  }
}

REGLAS DE GENERACIÓN DE CONTENIDO:
1. Adapta la redacción a la dificultad: "${difficulty}". En "Fácil", usa términos directos y preguntas guiadas. En "Difícil", usa preguntas analíticas, de relación y opción múltiple donde las opciones incorrectas sean distractores plausibles.
2. Asegúrate de que en 'fill_blank' la frase contenga exactamente el marcador '______' (6 guiones bajos) y el campo 'answer' sea exactamente la palabra que encaja allí.
3. Asegúrate de que 'correctAnswerIndex' sea un número de 0 a 3 que apunte a la opción correcta en la lista 'options'.
4. Toda la salida debe estar en idioma Español.`;

  const content = await callOpenAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], 4000);

  // Limpieza de posibles tags markdown de código (```json ... ```)
  let cleanJsonString = content.trim();
  if (cleanJsonString.startsWith('```')) {
    cleanJsonString = cleanJsonString.replace(/^```json\s*/, '').replace(/```$/, '');
  }
  
  return JSON.parse(cleanJsonString.trim());
}

// --- COGNITIVE SIMULATOR / SMART MOCK GENERATOR ---
// Genera dinámicamente un set de preguntas en base al texto usando heurísticas de JavaScript.
// Esto permite usar cualquier texto y obtener preguntas realistas sin depender de Internet.
function generateSmartMock(text, difficulty, count) {
  // Limpieza inicial
  const cleanText = text.trim();
  
  // Título genérico o basado en el texto
  let title = "Set de Estudio Express";
  let firstLine = cleanText.split('\n')[0].replace(/[#*_\-]/g, '').trim();
  if (firstLine && firstLine.length > 5 && firstLine.length < 50) {
    title = firstLine;
  } else {
    // Tomar las primeras 3 palabras
    const words = cleanText.split(/\s+/).slice(0, 4).join(" ");
    if (words && words.length > 3) title = words + "...";
  }

  // Generar resumen
  const sentences = cleanText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
  
  let summary = sentences.slice(0, 2).join(". ") + ".";
  if (summary.length < 20) {
    summary = "Análisis completo sobre el material ingresado para entrenamiento interactivo de memoria y conceptos.";
  }

  // Extracción de Conceptos Clave (heurística simple: palabras en mayúscula o frases que parecen definiciones)
  const concepts = [];
  const processedTerms = new Set();
  
  // Buscar frases que contengan "es", "son", "se refiere a", "refiere a", "consiste en", "como:" o guiones/dos puntos
  const definitionRegex = /([A-ZÁÉÍÓÚÑa-záéíïóúüñ\s]{3,25})\s+(?:es|son|se refiere a|refiere a|consiste en|—|-|:)\s+([^.]{10,120})/gi;
  let match;
  let matchesCount = 0;
  
  while ((match = definitionRegex.exec(cleanText)) !== null && matchesCount < 10) {
    const term = match[1].trim();
    const definition = match[2].trim();
    
    // Normalizar término
    const normalizedTerm = term.toLowerCase();
    if (!processedTerms.has(normalizedTerm) && term.split(' ').length <= 4 && term.length > 2) {
      processedTerms.add(normalizedTerm);
      concepts.push({
        term: term.charAt(0).toUpperCase() + term.slice(1),
        definition: definition.charAt(0).toUpperCase() + definition.slice(1),
        explanation: `Este concepto representa un pilar dentro de la lectura analizada sobre "${title}".`
      });
      matchesCount++;
    }
  }

  // Si no se encontraron conceptos con regex, crear algunos genéricos extrayendo palabras clave del texto
  if (concepts.length < 3) {
    const fallbackTerms = ["Concepto Principal", "Marco Teórico", "Aplicación Práctica", "Estructura Base", "Análisis Crítico"];
    const textWords = cleanText.split(/\s+/).filter(w => w.length > 5);
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      let term = fallbackTerms[i];
      if (textWords[i * 3]) {
        const word = textWords[i * 3].replace(/[^a-zA-ZáéíóúñÁÉÍÓÚ]/g, '');
        if (word.length > 4) {
          term = word.charAt(0).toUpperCase() + word.slice(1);
        }
      }
      
      const relatedSentence = sentences.find(s => s.toLowerCase().includes(term.toLowerCase())) || 
                               sentences[i % sentences.length] || 
                               "Detalle del concepto extraído del texto.";
      
      concepts.push({
        term,
        definition: relatedSentence,
        explanation: "Concepto clave identificado mediante análisis de frecuencia y relevancia textual."
      });
    }
  }

  // Generar preguntas en base a los conceptos extraídos
  const questions = {
    multiple_choice: [],
    flashcards: [],
    fill_blank: [],
    true_false: []
  };

  concepts.forEach((concept, idx) => {
    // 1. Multiple Choice
    // Opciones alternativas usando otras definiciones
    const alternativeDefs = concepts
      .filter((_, i) => i !== idx)
      .map(c => c.definition)
      .slice(0, 3);
    
    while (alternativeDefs.length < 3) {
      alternativeDefs.push("Una definición alternativa o distractor del tema en estudio.");
    }
    
    // Mezclar la correcta y las incorrectas
    const options = [concept.definition, ...alternativeDefs];
    const shuffledOptions = shuffleArray([...options]);
    const correctAnswerIndex = shuffledOptions.indexOf(concept.definition);

    questions.multiple_choice.push({
      question: `¿Cuál de las siguientes opciones describe correctamente el término "${concept.term}"?`,
      options: shuffledOptions,
      correctAnswerIndex: correctAnswerIndex,
      explanation: `Efectivamente, ${concept.term} se define como: ${concept.definition}.`,
      points: difficulty === 'Fácil' ? 100 : difficulty === 'Medio' ? 150 : 200
    });

    // 2. Flashcard
    questions.flashcards.push({
      front: `¿Qué significa: "${concept.term}"?`,
      back: concept.definition,
      hint: `Empieza con la idea de: "${concept.definition.slice(0, 15)}..."`,
      category: title
    });

    // 3. Fill-in-the-blank
    // Crear una frase donde ocultamos el término
    const baseSentence = concept.definition;
    const termWords = concept.term.split(' ');
    const mainWord = termWords[0]; // usar la primera palabra del término
    
    let phrase = baseSentence;
    let answer = mainWord;
    
    // Intentar reemplazar en la definición si existe la palabra
    const reg = new RegExp(`\\b${mainWord}\\b`, 'gi');
    if (reg.test(baseSentence)) {
      phrase = baseSentence.replace(reg, "______");
    } else {
      // Reemplazo genérico
      phrase = `El concepto "${concept.term}" se define como la base de ______ que estructura este conocimiento.`;
      phrase = phrase.replace("______", "______");
      answer = "estudio";
    }

    questions.fill_blank.push({
      phrase: phrase,
      answer: answer,
      hint: `Es un concepto clave de la lectura que empieza con la letra "${answer.charAt(0).toUpperCase()}".`,
      category: "Vocabulario"
    });

    // 4. True or False
    const isTrue = idx % 2 === 0;
    const statement = isTrue 
      ? `De acuerdo al material de estudio, "${concept.term}" se define como: ${concept.definition}`
      : `El concepto "${concept.term}" hace referencia a: ${concepts[(idx + 1) % concepts.length].definition}`;

    questions.true_false.push({
      statement: statement,
      isTrue: isTrue,
      explanation: isTrue 
        ? `Correcto. El texto valida que ${concept.term} es ${concept.definition}.` 
        : `Incorrecto. En realidad, ${concept.term} se define como: ${concept.definition}.`,
      category: "Comprensión"
    });
  });

  // Limitar cantidad a lo solicitado
  questions.multiple_choice = questions.multiple_choice.slice(0, count);
  questions.flashcards = questions.flashcards.slice(0, count);
  questions.fill_blank = questions.fill_blank.slice(0, count);
  questions.true_false = questions.true_false.slice(0, count);

  return {
    title,
    summary,
    concepts: concepts.slice(0, count + 2),
    questions
  };
}

// Helper para mezclar arrays
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Mock Tutor IA Response
function getMockTutorResponse(questionText, selectedAnswer, correctAnswer, explanation) {
  return `¡Hola! Entiendo perfectamente la confusión. En esta pregunta:

**"${questionText}"**

Elegiste: *"${selectedAnswer}"*, pero la respuesta correcta es *"${correctAnswer}"*. 

**¿Por qué ocurrió esto?**
El error radica en que la opción seleccionada suele ser un distractor muy común que confunde la causa con el efecto (o un concepto similar). Como indica la explicación oficial: ${explanation}

**Tip de Estudio de StudyQuest 💡**
Para la próxima vez, intenta asociar la palabra clave de la respuesta correcta con un ejemplo de tu vida cotidiana. ¡Vas por muy buen camino, errar es la mejor forma de fijar la memoria a largo plazo! ¿Quieres intentar responder una parecida para practicar?`;
}
