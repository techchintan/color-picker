import { getExt } from './browser-api';

/**
 * Localized string via chrome.i18n / browser.i18n.
 * @param {string} messageName
 * @param {string|string[]|undefined} substitutions
 * @returns {string}
 */
export function t(messageName, substitutions) {
  try {
    const api = getExt();
    if (api?.i18n?.getMessage) {
      const msg = api.i18n.getMessage(messageName, substitutions);
      if (msg) return msg;
    }
  } catch {
    // Fall through when APIs are unavailable (e.g. plain browser tab).
  }
  return messageName;
}

/** Set html lang/dir from the browser UI locale (@@ui_locale / @@bidi_dir). */
export function applyDocumentLocale() {
  if (typeof document === 'undefined') return;
  const lang = t('@@ui_locale') || 'en';
  const dir = t('@@bidi_dir') || 'ltr';
  document.documentElement.lang = lang.replace(/_/g, '-');
  document.documentElement.dir = dir;
}
