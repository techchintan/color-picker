import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  contrastTextColor,
  formatColorString,
  getColorFormats,
  parseHex,
  rgbToHex,
} from '../lib/color';
import {
  addColorToPalette,
  addToHistory,
  clearHistory,
  createPalette,
  deletePalette,
  getAllState,
  removeColorFromPalette,
  renamePalette,
} from '../lib/storage';
import './popup.css';

const TABS = [
  { id: 'history', label: 'History' },
  { id: 'palettes', label: 'Palettes' },
  { id: 'image', label: 'Image' },
];

const FORMAT_ROWS = [
  { key: 'hex', label: 'HEX' },
  { key: 'rgb', label: 'RGB' },
  { key: 'hsl', label: 'HSL' },
  { key: 'cmyk', label: 'CMYK' },
];

const App = () => {
  const [currentColor, setCurrentColor] = useState('#2F6F5E');
  const [history, setHistory] = useState([]);
  const [palettes, setPalettes] = useState([]);
  const [settings, setSettings] = useState({
    preferredFormat: 'hex',
    autoCopy: true,
    historyLimit: 50,
  });
  const [tab, setTab] = useState('history');
  const [picking, setPicking] = useState(false);
  const [toast, setToast] = useState('');
  const [paletteName, setPaletteName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const toastTimer = useRef(null);

  const formats = getColorFormats(currentColor);
  const eyeDropperSupported = typeof window !== 'undefined' && 'EyeDropper' in window;

  useEffect(() => {
    getAllState().then((state) => {
      setCurrentColor(state.currentColor);
      setHistory(state.history);
      setPalettes(state.palettes);
      setSettings(state.settings);
    });
  }, []);

  const showToast = (message) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1400);
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied');
    } catch {
      showToast('Copy failed');
    }
  };

  const selectColor = async (hex, { persistHistory = true, copyPreferred = true } = {}) => {
    const normalized = parseHex(hex);
    if (!normalized) return;

    setCurrentColor(normalized);

    if (persistHistory) {
      const nextHistory = await addToHistory(normalized, settings.historyLimit);
      setHistory(nextHistory);
    }

    if (copyPreferred && settings.autoCopy) {
      await copyText(formatColorString(normalized, settings.preferredFormat));
    }
  };

  const handleEyedropper = async () => {
    if (!eyeDropperSupported || picking) return;
    setPicking(true);
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      await selectColor(result.sRGBHex);
    } catch {
      // User cancelled eyedropper
    } finally {
      setPicking(false);
    }
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setHistory([]);
    showToast('History cleared');
  };

  const handleCreatePalette = async (event) => {
    event.preventDefault();
    if (!paletteName.trim()) return;
    const { palettes: next } = await createPalette(paletteName);
    setPalettes(next);
    setPaletteName('');
    showToast('Palette created');
  };

  const handleRenamePalette = async (id) => {
    const next = await renamePalette(id, renameValue);
    setPalettes(next);
    setRenamingId(null);
    setRenameValue('');
  };

  const handleDeletePalette = async (id) => {
    const next = await deletePalette(id);
    setPalettes(next);
    showToast('Palette deleted');
  };

  const handleAddToPalette = async (id) => {
    const next = await addColorToPalette(id, currentColor);
    setPalettes(next);
    showToast('Added to palette');
  };

  const handleRemoveFromPalette = async (id, hex) => {
    const next = await removeColorFromPalette(id, hex);
    setPalettes(next);
  };

  const drawImageToCanvas = (img) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maxWidth = 308;
    const maxHeight = 180;
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
    <div className="app">
      <header className="brand">
        <h1>Color Picker</h1>
        <span>HEX · Eyedropper</span>
      </header>

      <section className="hero">
        <div
          className="swatch"
          style={{ background: currentColor }}
          aria-label={`Current color ${currentColor}`}
        >
          <span className="swatch-label" style={{ color: contrastTextColor(currentColor) }}>
            {currentColor}
          </span>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleEyedropper}
            disabled={!eyeDropperSupported || picking}
          >
            {picking ? 'Picking…' : 'Eyedropper'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              copyText(formatColorString(currentColor, settings.preferredFormat))
            }
          >
            Copy
          </button>
        </div>
        {!eyeDropperSupported && (
          <p className="hint">EyeDropper is not supported in this browser.</p>
        )}
      </section>

      <section className="formats">
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
      </section>

      <nav className="tabs" aria-label="Color tools">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tab${tab === item.id ? ' active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === 'history' && (
        <section className="panel">
          <div className="panel-header">
            <h2>Recent colors</h2>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleClearHistory}
              disabled={!history.length}
            >
              Clear
            </button>
          </div>
          {history.length ? (
            <div className="swatch-grid">
              {history.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className="mini-swatch"
                  style={{ background: hex }}
                  title={hex}
                  aria-label={`Select ${hex}`}
                  onClick={() => selectColor(hex)}
                />
              ))}
            </div>
          ) : (
            <p className="empty">Pick a color to start building history.</p>
          )}
        </section>
      )}

      {tab === 'palettes' && (
        <section className="panel">
          <form className="inline-form" onSubmit={handleCreatePalette}>
            <input
              type="text"
              placeholder="New palette name"
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              maxLength={40}
            />
            <button type="submit" className="btn btn-ghost">
              Add
            </button>
          </form>

          {palettes.length ? (
            <div className="palette-list">
              {palettes.map((palette) => (
                <div key={palette.id} className="palette">
                  <div className="palette-top">
                    {renamingId === palette.id ? (
                      <form
                        className="inline-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleRenamePalette(palette.id);
                        }}
                      >
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          autoFocus
                        />
                        <button type="submit" className="btn btn-ghost">
                          Save
                        </button>
                      </form>
                    ) : (
                      <strong>{palette.name}</strong>
                    )}
                    <div className="palette-actions">
                      <button type="button" onClick={() => handleAddToPalette(palette.id)}>
                        + color
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingId(palette.id);
                          setRenameValue(palette.name);
                        }}
                      >
                        Rename
                      </button>
                      <button type="button" onClick={() => handleDeletePalette(palette.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                  {palette.colors.length ? (
                    <div className="swatch-grid">
                      {palette.colors.map((hex) => (
                        <button
                          key={`${palette.id}-${hex}`}
                          type="button"
                          className="mini-swatch"
                          style={{ background: hex }}
                          title={`${hex} (right-click to remove)`}
                          aria-label={`Select ${hex}`}
                          onClick={() => selectColor(hex)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            handleRemoveFromPalette(palette.id, hex);
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="empty">No colors yet. Add the current swatch.</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">Create a palette to group project colors.</p>
          )}
        </section>
      )}

      {tab === 'image' && (
        <section className="panel image-tools">
          <label className="btn btn-ghost file-btn">
            Upload image
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </label>
          <div className="canvas-wrap">
            <canvas ref={canvasRef} onClick={handleCanvasClick} />
          </div>
          <p className="hint">
            {imageLoaded
              ? 'Click any pixel on the image to sample its color.'
              : 'Upload a PNG, JPG, or WebP, then click to pick a color.'}
          </p>
        </section>
      )}

      <button
        type="button"
        className="footer-link"
        onClick={() => chrome.runtime.openOptionsPage()}
      >
        Settings & privacy
      </button>

      <div className={`toast${toast ? ' show' : ''}`} role="status">
        {toast}
      </div>
    </div>
  );
};

const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container);
root.render(<App />);
