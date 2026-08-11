import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { contrastTextColor, parseHex } from '../lib/color';
import { writeClipboard } from '../lib/clipboard';
import { getAllState } from '../lib/storage';
import { applyTheme } from '../lib/theme';
import { applyDocumentLocale, t } from '../lib/i18n';
import './gradient.css';

const PRESETS = [
  {
    nameKey: 'presetOcean',
    type: 'linear',
    angle: 90,
    stops: [
      { id: 'p1', color: '#0E8F6F', position: 0 },
      { id: 'p2', color: '#5CBEFF', position: 100 },
    ],
  },
  {
    nameKey: 'presetSunset',
    type: 'linear',
    angle: 135,
    stops: [
      { id: 'p1', color: '#FF6B4A', position: 0 },
      { id: 'p2', color: '#FFB347', position: 55 },
      { id: 'p3', color: '#FFE29A', position: 100 },
    ],
  },
  {
    nameKey: 'presetForest',
    type: 'linear',
    angle: 180,
    stops: [
      { id: 'p1', color: '#0B6F56', position: 0 },
      { id: 'p2', color: '#7BC47F', position: 100 },
    ],
  },
  {
    nameKey: 'presetAurora',
    type: 'radial',
    angle: 90,
    stops: [
      { id: 'p1', color: '#F7FFF9', position: 0 },
      { id: 'p2', color: '#19A87F', position: 45 },
      { id: 'p3', color: '#0B3D4A', position: 100 },
    ],
  },
  {
    nameKey: 'presetBerry',
    type: 'linear',
    angle: 45,
    stops: [
      { id: 'p1', color: '#7B3F6E', position: 0 },
      { id: 'p2', color: '#E07A9A', position: 100 },
    ],
  },
  {
    nameKey: 'presetSky',
    type: 'radial',
    angle: 90,
    stops: [
      { id: 'p1', color: '#FFFFFF', position: 0 },
      { id: 'p2', color: '#8EC5FF', position: 100 },
    ],
  },
];

function createStop(color, position) {
  return {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    color,
    position,
  };
}

function sortStops(stops) {
  return [...stops].sort((a, b) => a.position - b.position);
}

function buildCss(type, angle, stops) {
  const sorted = sortStops(stops);
  const stopCss = sorted.map((stop) => `${stop.color} ${stop.position}%`).join(', ');
  if (type === 'radial') {
    return `radial-gradient(circle, ${stopCss})`;
  }
  return `linear-gradient(${angle}deg, ${stopCss})`;
}

const App = () => {
  const [type, setType] = useState('linear');
  const [angle, setAngle] = useState(90);
  const [stops, setStops] = useState([
    createStop('#0E8F6F', 0),
    createStop('#5CBEFF', 100),
  ]);
  const [activeId, setActiveId] = useState(null);
  const [status, setStatus] = useState('');
  const barRef = useRef(null);
  const statusTimer = useRef(null);
  const dragId = useRef(null);

  const cssValue = useMemo(() => buildCss(type, angle, stops), [type, angle, stops]);
  const cssBlock = `background: ${cssValue};`;
  const sortedStops = useMemo(() => sortStops(stops), [stops]);
  const activeStop = stops.find((stop) => stop.id === activeId) || sortedStops[0];

  useEffect(() => {
    applyDocumentLocale();
    document.title = t('gradientMaker');
    getAllState().then((state) => applyTheme(state.currentColor));
  }, []);

  useEffect(() => {
    if (activeStop?.color) applyTheme(activeStop.color);
  }, [activeStop?.color]);

  const flash = (message) => {
    setStatus(message);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatus(''), 1800);
  };

  const copyText = async (text) => {
    const ok = await writeClipboard(text);
    flash(ok ? t('cssCopied') : t('copyFailed'));
  };

  const updateStop = (id, partial) => {
    setStops((prev) =>
      prev.map((stop) => {
        if (stop.id !== id) return stop;
        const next = { ...stop, ...partial };
        if (partial.color !== undefined) {
          const normalized = parseHex(partial.color);
          if (!normalized) return stop;
          next.color = normalized;
        }
        if (partial.position !== undefined) {
          next.position = Math.max(0, Math.min(100, Math.round(partial.position)));
        }
        return next;
      })
    );
  };

  const addStopAt = (position) => {
    const color = activeStop?.color || '#0E8F6F';
    const stop = createStop(color, Math.max(0, Math.min(100, Math.round(position))));
    setStops((prev) => [...prev, stop]);
    setActiveId(stop.id);
  };

  const removeStop = (id) => {
    if (stops.length <= 2) {
      flash(t('keepTwoStops'));
      return;
    }
    setStops((prev) => prev.filter((stop) => stop.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const applyPreset = (preset) => {
    const name = t(preset.nameKey);
    const nextStops = preset.stops.map((stop) => createStop(stop.color, stop.position));
    setType(preset.type);
    setAngle(preset.angle);
    setStops(nextStops);
    setActiveId(nextStops[0]?.id || null);
    flash(t('presetApplied', name));
  };

  const positionFromEvent = (clientX) => {
    const bar = barRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(100, Math.round(ratio * 100)));
  };

  const handleBarClick = (event) => {
    if (event.target.closest('.stop-handle')) return;
    addStopAt(positionFromEvent(event.clientX));
  };

  const handleDragStart = (id) => (event) => {
    event.preventDefault();
    dragId.current = id;
    setActiveId(id);

    const onMove = (moveEvent) => {
      if (!dragId.current) return;
      updateStop(dragId.current, { position: positionFromEvent(moveEvent.clientX) });
    };

    const onUp = () => {
      dragId.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div className="page">
      <header className="header">
        <img src="icons/icon-128.png" alt="" width={48} height={48} />
        <div>
          <h1>{t('gradientMaker')}</h1>
          <p>{t('gradientSubtitle')}</p>
        </div>
      </header>

      <section className="section">
        <h2>{t('previewTitle')}</h2>
        <p>{t('previewDesc')}</p>
        <div className="preview" style={{ background: cssValue }} />

        <div className="mode-row">
          <div className="segmented" role="group" aria-label={t('gradientTypeAria')}>
            <button
              type="button"
              className={type === 'linear' ? 'active' : ''}
              onClick={() => setType('linear')}
            >
              {t('linear')}
            </button>
            <button
              type="button"
              className={type === 'radial' ? 'active' : ''}
              onClick={() => setType('radial')}
            >
              {t('radial')}
            </button>
          </div>

          {type === 'linear' && (
            <label className="angle-field">
              <span>{t('angleLabel', String(angle))}</span>
              <input
                type="range"
                min={0}
                max={360}
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
              />
            </label>
          )}
        </div>

        <div
          className="stop-bar"
          ref={barRef}
          onClick={handleBarClick}
          style={{ background: buildCss('linear', 90, stops) }}
          role="presentation"
        >
          {sortedStops.map((stop) => (
            <button
              key={stop.id}
              type="button"
              className={`stop-handle${activeStop?.id === stop.id ? ' active' : ''}`}
              style={{ left: `${stop.position}%`, background: stop.color }}
              title={t('stopTitle', [stop.color, String(stop.position)])}
              aria-label={t('stopAria', [stop.color, String(stop.position)])}
              onPointerDown={handleDragStart(stop.id)}
              onClick={(e) => {
                e.stopPropagation();
                setActiveId(stop.id);
              }}
            />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>{t('stopsTitle')}</h2>
            <p>{t('stopsDesc')}</p>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => addStopAt(50)}
          >
            {t('addStop')}
          </button>
        </div>

        {activeStop && (
          <div className="stop-editor">
            <div
              className="swatch"
              style={{ background: activeStop.color }}
              aria-hidden="true"
            >
              <span style={{ color: contrastTextColor(activeStop.color) }}>
                {activeStop.color}
              </span>
            </div>
            <div className="fields">
              <label className="field">
                <span>{t('colorLabel')}</span>
                <div className="color-row">
                  <input
                    type="color"
                    value={activeStop.color}
                    onChange={(e) => updateStop(activeStop.id, { color: e.target.value })}
                    aria-label={t('stopColorPickerAria')}
                  />
                  <input
                    type="text"
                    value={activeStop.color}
                    onChange={(e) => updateStop(activeStop.id, { color: e.target.value })}
                    maxLength={7}
                    spellCheck={false}
                  />
                </div>
              </label>
              <label className="field">
                <span>{t('positionLabel', String(activeStop.position))}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={activeStop.position}
                  onChange={(e) =>
                    updateStop(activeStop.id, { position: Number(e.target.value) })
                  }
                />
              </label>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeStop(activeStop.id)}
                disabled={stops.length <= 2}
              >
                {t('removeStop')}
              </button>
            </div>
          </div>
        )}

        <div className="stop-list">
          {sortedStops.map((stop) => (
            <button
              key={stop.id}
              type="button"
              className={`stop-chip${activeStop?.id === stop.id ? ' active' : ''}`}
              onClick={() => setActiveId(stop.id)}
            >
              <span className="dot" style={{ background: stop.color }} />
              <span>{stop.color}</span>
              <span className="muted">{stop.position}%</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>{t('presetsTitle')}</h2>
        <p>{t('presetsDesc')}</p>
        <div className="presets">
          {PRESETS.map((preset) => {
            const name = t(preset.nameKey);
            return (
              <button
                key={preset.nameKey}
                type="button"
                className="preset"
                style={{ background: buildCss(preset.type, preset.angle, preset.stops) }}
                onClick={() => applyPreset(preset)}
                title={name}
              >
                <span>{name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>{t('cssTitle')}</h2>
            <p>{t('cssDesc')}</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => copyText(cssBlock)}>
            {t('copyCss')}
          </button>
        </div>
        <pre className="css-block">
          <code>{cssBlock}</code>
        </pre>
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
