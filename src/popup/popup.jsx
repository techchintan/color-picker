import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  contrastTextColor,
  formatColorString,
  getColorFormats,
  parseHex,
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
import { openExtensionPage, openOptionsPage } from '../lib/browser-api';
import { writeClipboard } from '../lib/clipboard';
import { applyTheme } from '../lib/theme';
import { trackPageView } from '../lib/analytics';
import { applyDocumentLocale, t } from '../lib/i18n';
import './popup.css';

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
  const toastTimer = useRef(null);

  const formats = getColorFormats(currentColor);
  const eyeDropperSupported = typeof window !== 'undefined' && 'EyeDropper' in window;
  const tabs = [
    { id: 'history', label: t('tabHistory') },
    { id: 'palettes', label: t('tabPalettes') },
  ];

  useEffect(() => {
    applyDocumentLocale();
    document.title = t('extName');
    getAllState().then((state) => {
      setCurrentColor(state.currentColor);
      setHistory(state.history);
      setPalettes(state.palettes);
      setSettings(state.settings);
    });
    trackPageView('popup');
  }, []);

  useEffect(() => {
    applyTheme(currentColor);
  }, [currentColor]);

  const showToast = (message) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1400);
  };

  const copyText = async (text) => {
    const ok = await writeClipboard(text);
    showToast(ok ? t('copied') : t('copyFailed'));
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
    showToast(t('historyCleared'));
  };

  const handleCreatePalette = async (event) => {
    event.preventDefault();
    if (!paletteName.trim()) return;
    const { palettes: next } = await createPalette(paletteName);
    setPalettes(next);
    setPaletteName('');
    showToast(t('paletteCreated'));
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
    showToast(t('paletteDeleted'));
  };

  const handleAddToPalette = async (id) => {
    const next = await addColorToPalette(id, currentColor);
    setPalettes(next);
    showToast(t('addedToPalette'));
  };

  const handleRemoveFromPalette = async (id, hex) => {
    const next = await removeColorFromPalette(id, hex);
    setPalettes(next);
  };

  const openImagePage = () => {
    openExtensionPage('image.html');
  };

  const openGradientPage = () => {
    openExtensionPage('gradient.html');
  };

  return (
    <div className="app">
      <header className="brand">
        <h1>{t('appName')}</h1>
        <span>{t('brandTagline')}</span>
      </header>

      <section className="hero">
        <div
          className="swatch"
          style={{ background: currentColor }}
          aria-label={t('currentColorAria', currentColor)}
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
            {picking ? t('picking') : t('eyedropper')}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              copyText(formatColorString(currentColor, settings.preferredFormat))
            }
          >
            {t('copy')}
          </button>
        </div>
        {!eyeDropperSupported && (
          <p className="hint">{t('eyedropperUnsupported')}</p>
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
              {t('copy')}
            </button>
          </div>
        ))}
      </section>

      <nav className="tabs" aria-label={t('colorToolsAria')}>
        {tabs.map((item) => (
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
            <h2>{t('recentColors')}</h2>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleClearHistory}
              disabled={!history.length}
            >
              {t('clear')}
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
                  aria-label={t('selectColorAria', hex)}
                  onClick={() => selectColor(hex)}
                />
              ))}
            </div>
          ) : (
            <p className="empty">{t('historyEmpty')}</p>
          )}
        </section>
      )}

      {tab === 'palettes' && (
        <section className="panel">
          <form className="inline-form" onSubmit={handleCreatePalette}>
            <input
              type="text"
              placeholder={t('newPalettePlaceholder')}
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              maxLength={40}
            />
            <button type="submit" className="btn btn-ghost">
              {t('add')}
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
                          {t('save')}
                        </button>
                      </form>
                    ) : (
                      <strong>{palette.name}</strong>
                    )}
                    <div className="palette-actions">
                      <button type="button" onClick={() => handleAddToPalette(palette.id)}>
                        {t('addColor')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingId(palette.id);
                          setRenameValue(palette.name);
                        }}
                      >
                        {t('rename')}
                      </button>
                      <button type="button" onClick={() => handleDeletePalette(palette.id)}>
                        {t('delete')}
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
                          title={t('removeColorHint', hex)}
                          aria-label={t('selectColorAria', hex)}
                          onClick={() => selectColor(hex)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            handleRemoveFromPalette(palette.id, hex);
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="empty">{t('paletteEmpty')}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">{t('noPalettes')}</p>
          )}
        </section>
      )}

      <div className="footer-links">
        <button type="button" className="footer-link" onClick={openImagePage}>
          {t('pickFromImage')}
        </button>
        <button type="button" className="footer-link" onClick={openGradientPage}>
          {t('gradientMaker')}
        </button>
        <button
          type="button"
          className="footer-link"
          onClick={() => openOptionsPage()}
        >
          {t('settingsPrivacy')}
        </button>
      </div>

      <div className={`toast${toast ? ' show' : ''}`} role="status">
        {toast}
      </div>
    </div>
  );
};

applyDocumentLocale();
const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container);
root.render(<App />);
