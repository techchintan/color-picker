import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  contrastTextColor,
  formatColorString,
  getColorFormats,
  parseHex,
  rgbToHex,
} from '../lib/color';
import { addToHistory, getAllState } from '../lib/storage';
import { writeClipboard } from '../lib/clipboard';
import { applyTheme } from '../lib/theme';
import { trackPageView } from '../lib/analytics';
import { applyDocumentLocale, t } from '../lib/i18n';
import './image.css';

const FORMAT_ROWS = [
  { key: 'hex', label: 'HEX' },
  { key: 'rgb', label: 'RGB' },
  { key: 'hsl', label: 'HSL' },
  { key: 'cmyk', label: 'CMYK' },
];

const App = () => {
  const [currentColor, setCurrentColor] = useState('#2F6F5E');
  const [settings, setSettings] = useState({
    preferredFormat: 'hex',
    autoCopy: true,
    historyLimit: 50,
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [status, setStatus] = useState('');
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const statusTimer = useRef(null);

  const formats = getColorFormats(currentColor);

  useEffect(() => {
    applyDocumentLocale();
    document.title = t('imageTitle');
    getAllState().then((state) => {
      setCurrentColor(state.currentColor);
      setSettings(state.settings);
    });
    trackPageView('image');
  }, []);

  useEffect(() => {
    applyTheme(currentColor);
  }, [currentColor]);

  const flash = (message) => {
    setStatus(message);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatus(''), 1800);
  };

  const copyText = async (text) => {
    const ok = await writeClipboard(text);
    flash(ok ? t('copied') : t('copyFailed'));
  };

  const selectColor = async (hex) => {
    const normalized = parseHex(hex);
    if (!normalized) return;

    setCurrentColor(normalized);
    await addToHistory(normalized, settings.historyLimit);

    if (settings.autoCopy) {
      await copyText(formatColorString(normalized, settings.preferredFormat));
    } else {
      flash(t('colorPicked'));
    }
  };

  const drawImageToCanvas = (img) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maxWidth = 720;
    const maxHeight = 420;
    const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    setImageLoaded(true);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        drawImageToCanvas(img);
        flash(t('imageLoaded'));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasClick = async (event) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    await selectColor(hex);
  };

  return (
    <div className="page">
      <header className="header">
        <img src="icons/icon-128.png" alt="" width={48} height={48} />
        <div>
          <h1>{t('imageTitle')}</h1>
          <p>{t('imageSubtitle')}</p>
        </div>
      </header>

      <section className="section">
        <h2>{t('imageSection')}</h2>
        <p>{t('imageSectionDesc')}</p>
        <div className="actions">
          <label className="btn btn-ghost file-btn">
            {t('uploadImage')}
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>
        <div className="canvas-wrap">
          <canvas ref={canvasRef} onClick={handleCanvasClick} />
          {!imageLoaded && (
            <div className="canvas-empty">{t('canvasEmpty')}</div>
          )}
        </div>
        <p className="hint">
          {imageLoaded ? t('hintLoaded') : t('hintEmpty')}
        </p>
      </section>

      <section className="section">
        <h2>{t('selectedColor')}</h2>
        <div className="result">
          <div
            className="swatch"
            style={{ background: currentColor }}
            aria-label={t('currentColorAria', currentColor)}
          >
            <span style={{ color: contrastTextColor(currentColor) }}>{currentColor}</span>
          </div>
          <div className="formats">
            {FORMAT_ROWS.map((row) => (
              <div
                key={row.key}
                className={`format-row${
                  settings.preferredFormat === row.key ? ' preferred' : ''
                }`}
              >
                <span className="label">{row.label}</span>
                <span className="value">{formats?.strings[row.key]}</span>
                <button
                  type="button"
                  className="copy"
                  onClick={() => copyText(formats?.strings[row.key] || '')}
                >
                  {t('copy')}
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="status" role="status">
          {status}
        </div>
      </section>
    </div>
  );
};

applyDocumentLocale();
const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container);
root.render(<App />);
