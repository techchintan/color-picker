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
    getAllState().then((state) => {
      setCurrentColor(state.currentColor);
      setSettings(state.settings);
    });
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
    flash(ok ? 'Copied' : 'Copy failed');
  };

  const selectColor = async (hex) => {
    const normalized = parseHex(hex);
    if (!normalized) return;

    setCurrentColor(normalized);
    await addToHistory(normalized, settings.historyLimit);

    if (settings.autoCopy) {
      await copyText(formatColorString(normalized, settings.preferredFormat));
    } else {
      flash('Color picked');
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
        flash('Image loaded');
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
        <img src="icon.png" alt="" />
        <div>
          <h1>Pick from image</h1>
          <p>Upload a local image and click any pixel to sample its color.</p>
        </div>
      </header>

      <section className="section">
        <h2>Image</h2>
        <p>Works with PNG, JPG, or WebP. Colors stay on this device.</p>
        <div className="actions">
          <label className="btn btn-ghost file-btn">
            Upload image
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>
        <div className="canvas-wrap">
          <canvas ref={canvasRef} onClick={handleCanvasClick} />
          {!imageLoaded && (
            <div className="canvas-empty">Upload an image to start picking colors.</div>
          )}
        </div>
        <p className="hint">
          {imageLoaded
            ? 'Click any pixel on the image to sample its color.'
            : 'Choose a file above, then click the preview to pick.'}
        </p>
      </section>

      <section className="section">
        <h2>Selected color</h2>
        <div className="result">
          <div
            className="swatch"
            style={{ background: currentColor }}
            aria-label={`Current color ${currentColor}`}
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
                  Copy
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

const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container);
root.render(<App />);
