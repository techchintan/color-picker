/**
 * Cross-browser WebExtension API (Chrome, Edge, Brave, Opera, Firefox, Safari).
 * Prefer the standard `browser` namespace; fall back to `chrome`.
 */
function resolveApi() {
  const root =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
        ? self
        : typeof window !== 'undefined'
          ? window
          : {};

  if (root.browser?.runtime?.id != null || root.browser?.runtime?.getURL) {
    return root.browser;
  }
  if (root.chrome?.runtime?.id != null || root.chrome?.runtime?.getURL) {
    return root.chrome;
  }
  return root.browser || root.chrome || null;
}

export const ext = resolveApi();

export function getExt() {
  const api = resolveApi();
  if (!api) {
    throw new Error('WebExtension APIs are not available in this context.');
  }
  return api;
}

/** Promise-safe storage.local helpers (Chrome callbacks + Firefox promises). */
export function storageGet(keys) {
  const api = getExt();
  const area = api.storage.local;
  const result = area.get(keys);
  if (result && typeof result.then === 'function') return result;
  return new Promise((resolve, reject) => {
    try {
      area.get(keys, (data) => {
        const err = api.runtime?.lastError;
        if (err) reject(new Error(err.message));
        else resolve(data);
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function storageSet(values) {
  const api = getExt();
  const area = api.storage.local;
  const result = area.set(values);
  if (result && typeof result.then === 'function') return result;
  return new Promise((resolve, reject) => {
    try {
      area.set(values, () => {
        const err = api.runtime?.lastError;
        if (err) reject(new Error(err.message));
        else resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function getExtensionUrl(path) {
  return getExt().runtime.getURL(path);
}

export function openOptionsPage() {
  const api = getExt();
  const result = api.runtime.openOptionsPage?.();
  if (result && typeof result.then === 'function') return result;
  return Promise.resolve();
}

export function openExtensionPage(path) {
  const api = getExt();
  const url = api.runtime.getURL(path);
  if (api.tabs?.create) {
    const result = api.tabs.create({ url });
    if (result && typeof result.then === 'function') return result;
    return new Promise((resolve, reject) => {
      api.tabs.create({ url }, (tab) => {
        const err = api.runtime?.lastError;
        if (err) reject(new Error(err.message));
        else resolve(tab);
      });
    });
  }
  // Last resort for unusual hosts
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  return Promise.resolve();
}

export function onInstalled(listener) {
  getExt().runtime.onInstalled.addListener(listener);
}

export function onStartup(listener) {
  const api = getExt();
  if (api.runtime.onStartup?.addListener) {
    api.runtime.onStartup.addListener(listener);
  }
}
