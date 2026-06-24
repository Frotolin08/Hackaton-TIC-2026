import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Configure pdfjs worker (the CDN URL works in most dev setups)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function SourceIngest() {
  const [activeTab, setActiveTab] = useState('text'); // text | url | pdf
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  // ---------- Text tab ----------
  const handleTextChange = e => setTextInput(e.target.value);

  // ---------- PDF handling ----------
  const extractPdfText = async file => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const handlePdfUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfFile(file);
    setPdfUploading(true);
    setPdfProgress(0);

    // Simulated progress bar – real extraction runs in background
    const progressInterval = setInterval(() => {
      setPdfProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 150);

    try {
      const extracted = await extractPdfText(file);
      setTextInput(`Contenido extraído del PDF "${file.name}":\n\n${extracted}`);
      setActiveTab('text');
    } catch (err) {
      console.error('PDF extraction error', err);
      setTextInput('Error al extraer el texto del PDF.');
    } finally {
      clearInterval(progressInterval);
      setPdfProgress(100);
      setPdfUploading(false);
    }
  };

  // ---------- URL scraping ----------
  const handleUrlScrape = async e => {
    e.preventDefault();
    if (!urlInput) return;
    setPdfUploading(true); // reuse loader UI
    setPdfProgress(30);
    try {
      // Use a CORS proxy to avoid browser same-origin restrictions
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlInput)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      const html = data.contents;
      // Simple extraction: strip tags – not perfect but gives readable text
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const articleText = doc.body.textContent.replace(/\s+/g, ' ').trim();
      setTextInput(`Contenido extraído de la URL "${urlInput}":\n\n${articleText.slice(0, 5000)}`);
      setActiveTab('text');
      setPdfProgress(100);
    } catch (err) {
      console.error('URL fetch error', err);
      setTextInput('Error al obtener el contenido de la URL.');
      setPdfProgress(100);
    } finally {
      setPdfUploading(false);
    }
  };

  return (
    <div className="container bg-glass p-4">
      <h2 className="mt-2 mb-2">💡 Ingesta de Fuente</h2>
      {/* Tab selector */}
      <div className="flex-center mb-2">
        {['text', 'url', 'pdf'].map(tab => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? 'bg-primary-dark' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'text' && 'Texto'}
            {tab === 'url' && 'URL'}
            {tab === 'pdf' && 'PDF'}
          </button>
        ))}
      </div>

      {/* Content per tab */}
      {activeTab === 'text' && (
        <textarea
          value={textInput}
          onChange={handleTextChange}
          rows={12}
          className="w-full p-2 border rounded bg-glass"
          placeholder="Pega o escribe texto aquí…"
        />
      )}

      {activeTab === 'url' && (
        <form onSubmit={handleUrlScrape} className="flex flex-col gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="Introduce una URL…"
            className="p-2 border rounded bg-glass"
            required
          />
          <button type="submit" className="btn" disabled={pdfUploading}>
            {pdfUploading ? 'Obteniendo...' : 'Obtener contenido'}
          </button>
        </form>
      )}

      {activeTab === 'pdf' && (
        <div className="flex flex-col gap-2">
          <input type="file" accept="application/pdf" onChange={handlePdfUpload} />
          {pdfUploading && (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded h-2 overflow-hidden">
                <div
                  className="bg-primary h-2"
                  style={{ width: `${pdfProgress}%` }}
                />
              </div>
              <span>{pdfProgress}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
