import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  clearAllData,
  clearHistory,
  DEFAULT_COLOR,
  DEFAULT_SETTINGS,
  getAllState,
  saveSettings,
} from '../lib/storage';
import { applyTheme } from '../lib/theme';
import './options.css';

const App = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [currentColor, setCurrentColor] = useState(DEFAULT_COLOR);
  const [status, setStatus] = useState('');

  useEffect(() => {
    getAllState().then((state) => {
      setSettings(state.settings);
      setCurrentColor(state.currentColor);
    });
  }, []);

  useEffect(() => {
    applyTheme(currentColor);
  }, [currentColor]);

  const flash = (message) => {
    setStatus(message);
    setTimeout(() => setStatus(''), 1800);
  };

  const updateSetting = async (partial) => {
    const next = await saveSettings(partial);
    setSettings(next);
    flash('Settings saved');
  };

  const handleClearHistory = async () => {
    await clearHistory();
    flash('History cleared');
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm(
      'Clear all local color data? This resets history, palettes, and settings.'
    );
    if (!confirmed) return;
    await clearAllData();
    setSettings({ ...DEFAULT_SETTINGS });
    setCurrentColor(DEFAULT_COLOR);
    flash('All local data cleared');
  };

  return (
    <div className="page">
      <header className="header">
        <img src="icon.png" alt="" />
        <div>
          <h1>Color Picker</h1>
          <p>Settings stay on this device. Nothing is sent to a server.</p>
        </div>
      </header>

      <section className="section">
        <h2>Defaults</h2>
        <p>Choose how copied colors are formatted when you pick.</p>
        <div className="fields">
          <div className="field">
            <label htmlFor="preferredFormat">Preferred format</label>
            <select
              id="preferredFormat"
              value={settings.preferredFormat}
              onChange={(e) => updateSetting({ preferredFormat: e.target.value })}
            >
              <option value="hex">HEX</option>
              <option value="rgb">RGB</option>
              <option value="hsl">HSL</option>
              <option value="cmyk">CMYK</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="historyLimit">History limit</label>
            <input
              id="historyLimit"
              type="number"
              min={10}
              max={100}
              value={settings.historyLimit}
              onChange={(e) =>
                updateSetting({
                  historyLimit: Math.max(10, Math.min(100, Number(e.target.value) || 50)),
                })
              }
            />
          </div>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.autoCopy}
              onChange={(e) => updateSetting({ autoCopy: e.target.checked })}
            />
            Auto-copy preferred format after picking
          </label>
        </div>
      </section>

      <section className="section">
        <h2>Local data</h2>
        <p>Color history and palettes are stored with chrome.storage.local only.</p>
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={handleClearHistory}>
            Clear history
          </button>
          <button type="button" className="btn btn-danger" onClick={handleClearAll}>
            Clear all data
          </button>
        </div>
        <div className="status" role="status">
          {status}
        </div>
      </section>

      <section className="section privacy">
        <h2>Privacy</h2>
        <p>
          Color Picker does not collect, store, or transmit personal data. Picked colors
          never leave your browser.
        </p>
        <ul>
          <li>No analytics or advertising</li>
          <li>No network requests for core features</li>
          <li>Only the storage permission is used</li>
          <li>No content scripts injected into websites</li>
        </ul>
      </section>
    </div>
  );
};

const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container);
root.render(<App />);
