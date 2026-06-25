import { useMemo, useState } from 'react';
import { readStudyPackFile } from '../services/exportStudyPack';

const MIN_SOURCE_LENGTH = 120;
async function fetchUrlContents(rawUrl) {
  const parsedUrl = new URL(rawUrl);
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are supported');
  }

  const encodedUrl = encodeURIComponent(parsedUrl.toString());
  const endpoints = [
    `/api/scrape?url=${encodedUrl}`,
    `https://api.allorigins.win/get?url=${encodedUrl}`,
  ];

  let lastError;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`URL fetch failed: ${response.status}`);
      const data = await response.json();
      if (data?.contents) return data.contents;
      throw new Error('Response did not include contents');
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Could not fetch URL');
}

function extractReadableTextFromHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html || '', 'text/html');
  doc.querySelectorAll('script, style, nav, footer, header, noscript, svg').forEach((node) => node.remove());
  return doc.body.textContent.replace(/\s+/g, ' ').trim();
}

export default function SourceIngest({ onGenerate, onImportPack, isLoading = false, adaptiveProfile }) {
  const [activeTab, setActiveTab] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [levelMode, setLevelMode] = useState('adaptive');
  const [difficulty, setDifficulty] = useState(adaptiveProfile?.recommendedDifficulty || 'Medio');
  const [questionCount, setQuestionCount] = useState(adaptiveProfile?.questionCount || 6);
  const [extracting, setExtracting] = useState(false);
  const [importingPack, setImportingPack] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sourceLabel, setSourceLabel] = useState('Texto pegado');
  const [error, setError] = useState('');

  const activeDifficulty = levelMode === 'adaptive'
    ? adaptiveProfile?.recommendedDifficulty || difficulty
    : difficulty;
  const activeQuestionCount = levelMode === 'adaptive'
    ? adaptiveProfile?.questionCount || questionCount
    : questionCount;

  const sourceStats = useMemo(() => {
    const words = textInput.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 180));
    return { words, minutes };
  }, [textInput]);

  const canGenerate = textInput.trim().length >= MIN_SOURCE_LENGTH && typeof onGenerate === 'function';

  const extractPdfText = async (file) => {
    const [{ default: pdfWorkerUrl }, pdfjsLib] = await Promise.all([
      import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
      import('pdfjs-dist/legacy/build/pdf.mjs'),
    ]);
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      fullText += `${pageText}\n`;
      setProgress(Math.round((pageNum / pdf.numPages) * 100));
    }

    return fullText;
  };

  const handlePdfUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setExtracting(true);
    setProgress(5);
    setSourceLabel(file.name);

    try {
      const extracted = await extractPdfText(file);
      setTextInput(`Fuente: ${file.name}\n\n${extracted.trim()}`);
      setActiveTab('text');
    } catch (err) {
      console.error('PDF extraction error', err);
      setError('No pude leer ese PDF. Prueba con un PDF con texto seleccionable o pega el contenido manualmente.');
    } finally {
      setProgress(100);
      setExtracting(false);
    }
  };

  const handlePackUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || typeof onImportPack !== 'function') return;

    setError('');
    setImportingPack(true);

    try {
      const pack = await readStudyPackFile(file);
      await onImportPack(pack.set);
    } catch (err) {
      console.error('Pack import error', err);
      setError(err.message || 'No pude importar ese pack.');
    } finally {
      setImportingPack(false);
      event.target.value = '';
    }
  };

  const handleUrlScrape = async (event) => {
    event.preventDefault();
    if (!urlInput.trim()) return;

    setError('');
    setExtracting(true);
    setProgress(30);
    setSourceLabel(urlInput.trim());

    try {
      const html = await fetchUrlContents(urlInput.trim());
      const articleText = extractReadableTextFromHtml(html);

      if (articleText.length < MIN_SOURCE_LENGTH) {
        throw new Error('Extracted text is too short');
      }

      setTextInput(`Fuente: ${urlInput.trim()}\n\n${articleText.slice(0, 9000)}`);
      setActiveTab('text');
      setProgress(100);
    } catch (err) {
      console.error('URL fetch error', err);
      setError('No pude extraer esa URL desde el navegador. Pega el texto o prueba con otra fuente publica.');
    } finally {
      setExtracting(false);
    }
  };

  const handleGenerate = (event) => {
    event.preventDefault();
    if (!canGenerate) return;

    onGenerate({
      text: textInput.trim(),
      difficulty: activeDifficulty,
      preferences: {
        levelMode,
        questionCount: Number(activeQuestionCount),
        sourceLabel,
      },
    });
  };

  return (
    <form onSubmit={handleGenerate} className="source-studio">
      <div className="source-studio__header">
        <div>
          <p className="eyebrow">Motor de creacion</p>
          <h2>Convierte cualquier fuente en un entrenamiento jugable</h2>
        </div>
        <div className="adaptive-pill">
          <span>{levelMode === 'adaptive' ? 'Adaptativa' : 'Fija'}</span>
          <strong>{activeDifficulty}</strong>
        </div>
      </div>

      <div className="source-tabs" role="tablist" aria-label="Tipo de fuente">
        {[
          ['text', 'Texto'],
          ['url', 'URL'],
          ['pdf', 'PDF'],
          ['pack', 'Pack'],
        ].map(([id, label]) => (
          <button
            type="button"
            key={id}
            className={activeTab === id ? 'is-active' : ''}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'text' && (
        <textarea
          value={textInput}
          onChange={(event) => {
            setTextInput(event.target.value);
            setSourceLabel('Texto pegado');
          }}
          rows={12}
          className="source-textarea"
          placeholder="Pega apuntes, un articulo, una transcripcion o el material de clase. StudyQuest extrae conceptos y crea juegos de practica."
        />
      )}

      {activeTab === 'url' && (
        <div className="source-panel">
          <label htmlFor="source-url">URL publica</label>
          <div className="source-inline">
            <input
              id="source-url"
              type="url"
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              placeholder="https://..."
              required
            />
            <button type="button" onClick={handleUrlScrape} disabled={extracting}>
              {extracting ? 'Leyendo' : 'Extraer'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'pdf' && (
        <div className="source-panel">
          <label htmlFor="source-pdf">Sube un PDF con texto seleccionable</label>
          <input id="source-pdf" type="file" accept="application/pdf" onChange={handlePdfUpload} />
          {extracting && (
            <div className="meter" aria-label="Progreso de lectura del PDF">
              <span style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'pack' && (
        <div className="source-panel">
          <label htmlFor="source-pack">Importa un pack StudyQuest exportado</label>
          <input
            id="source-pack"
            type="file"
            accept="application/json,.json,.studyquest.json"
            onChange={handlePackUpload}
            disabled={importingPack}
          />
          <p>{importingPack ? 'Importando pack...' : 'Restaura juegos, conceptos y configuracion sin volver a generar.'}</p>
        </div>
      )}

      {error && <p className="source-error">{error}</p>}

      <div className="level-toggle" role="group" aria-label="Modo de dificultad">
        <button
          type="button"
          className={levelMode === 'adaptive' ? 'is-active' : ''}
          onClick={() => setLevelMode('adaptive')}
        >
          Adaptativa
        </button>
        <button
          type="button"
          className={levelMode === 'fixed' ? 'is-active' : ''}
          onClick={() => setLevelMode('fixed')}
        >
          Fija
        </button>
      </div>

      <div className="source-controls">
        <label>
          Dificultad
          <select
            value={activeDifficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            disabled={levelMode === 'adaptive'}
          >
            <option>Facil</option>
            <option>Medio</option>
            <option>Dificil</option>
          </select>
        </label>
        <label>
          Preguntas por modo
          <input
            type="number"
            min="4"
            max="10"
            value={activeQuestionCount}
            onChange={(event) => setQuestionCount(event.target.value)}
            disabled={levelMode === 'adaptive'}
          />
        </label>
        <div className="source-stat">
          <span>{sourceStats.words}</span>
          palabras / {sourceStats.minutes} min
        </div>
      </div>

      <div className="source-actions">
        <p>
          {levelMode === 'adaptive'
            ? adaptiveProfile?.focus || 'Crea un set con niveles ajustados a tu progreso.'
            : 'Modo fijo activo: se respetara la dificultad elegida para este set.'}
        </p>
        <button type="submit" disabled={!canGenerate || isLoading}>
          {isLoading ? 'Generando juegos...' : 'Generar juegos'}
        </button>
      </div>

      {!canGenerate && activeTab !== 'pack' && (
        <p className="source-help">
          Necesitas al menos {MIN_SOURCE_LENGTH} caracteres de material para generar un set util.
        </p>
      )}
    </form>
  );
}
