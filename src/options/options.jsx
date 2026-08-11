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
import { applyDocumentLocale, t } from '../lib/i18n';
import './options.css';

const App = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [currentColor, setCurrentColor] = useState(DEFAULT_COLOR);
  const [status, setStatus] = useState('');

  useEffect(() => {
    applyDocumentLocale();
    document.title = t('extName');
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
    flash(t('settingsSaved'));
  };

  const handleClearHistory = async () => {
    await clearHistory();
    flash(t('historyCleared'));
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm(t('clearAllConfirm'));
    if (!confirmed) return;
    await clearAllData();
    setSettings({ ...DEFAULT_SETTINGS });
    setCurrentColor(DEFAULT_COLOR);
    flash(t('allDataCleared'));
  };

  return (
    <div className="page">
      <header className="header">
        <img src="icons/icon-128.png" alt="" width={48} height={48} />
        <div>
          <h1>{t('appName')}</h1>
          <p>{t('optionsSubtitle')}</p>
        </div>
      </header>

      <section className="section">
        <h2>{t('defaultsTitle')}</h2>
        <p>{t('defaultsDesc')}</p>
        <div className="fields">
          <div className="field">
            <label htmlFor="preferredFormat">{t('preferredFormat')}</label>
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
            <label htmlFor="historyLimit">{t('historyLimit')}</label>
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
            {t('autoCopy')}
          </label>
        </div>
      </section>

      <section className="section">
        <h2>{t('localDataTitle')}</h2>
        <p>{t('localDataDesc')}</p>
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={handleClearHistory}>
            {t('clearHistory')}
          </button>
          <button type="button" className="btn btn-danger" onClick={handleClearAll}>
            {t('clearAllData')}
          </button>
        </div>
        <div className="status" role="status">
          {status}
        </div>
      </section>

      <section className="section privacy">
        <h2>{t('privacyTitle')}</h2>
        <p>{t('privacyBody')}</p>
        <ul>
          <li>{t('privacyAnalytics')}</li>
          <li>{t('privacyNoAds')}</li>
          <li>{t('privacyLocalStorage')}</li>
          <li>{t('privacyNoContentScripts')}</li>
        </ul>
        <p>
          <a href="privacy-policy.html" target="_blank" rel="noreferrer">
            {t('fullPrivacyPolicy')}
          </a>
        </p>
      </section>
    </div>
  );
};

applyDocumentLocale();
const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container);
root.render(<App />);
