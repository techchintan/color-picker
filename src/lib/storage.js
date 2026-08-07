export const DEFAULT_SETTINGS = {
  preferredFormat: 'hex',
  autoCopy: true,
  historyLimit: 50,
};

export const DEFAULT_COLOR = '#2F6F5E';

const STORAGE_KEYS = {
  currentColor: 'currentColor',
  history: 'history',
  palettes: 'palettes',
  settings: 'settings',
};

function getStorageArea() {
  return chrome.storage.local;
}

export async function getAllState() {
  const data = await getStorageArea().get([
    STORAGE_KEYS.currentColor,
    STORAGE_KEYS.history,
    STORAGE_KEYS.palettes,
    STORAGE_KEYS.settings,
  ]);

  return {
    currentColor: data.currentColor || DEFAULT_COLOR,
    history: Array.isArray(data.history) ? data.history : [],
    palettes: Array.isArray(data.palettes) ? data.palettes : [],
    settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
  };
}

export async function ensureDefaults() {
  const data = await getStorageArea().get([
    STORAGE_KEYS.currentColor,
    STORAGE_KEYS.history,
    STORAGE_KEYS.palettes,
    STORAGE_KEYS.settings,
  ]);

  const updates = {};
  if (!data.currentColor) updates.currentColor = DEFAULT_COLOR;
  if (!Array.isArray(data.history)) updates.history = [];
  if (!Array.isArray(data.palettes)) updates.palettes = [];
  if (!data.settings) updates.settings = { ...DEFAULT_SETTINGS };

  if (Object.keys(updates).length) {
    await getStorageArea().set(updates);
  }
}

export async function setCurrentColor(hex) {
  await getStorageArea().set({ [STORAGE_KEYS.currentColor]: hex });
}

export async function addToHistory(hex, limit = DEFAULT_SETTINGS.historyLimit) {
  const { history } = await getStorageArea().get(STORAGE_KEYS.history);
  const list = Array.isArray(history) ? history : [];
  const next = [hex, ...list.filter((item) => item !== hex)].slice(0, limit);
  await getStorageArea().set({
    [STORAGE_KEYS.history]: next,
    [STORAGE_KEYS.currentColor]: hex,
  });
  return next;
}

export async function clearHistory() {
  await getStorageArea().set({ [STORAGE_KEYS.history]: [] });
}

export async function saveSettings(partial) {
  const { settings } = await getStorageArea().get(STORAGE_KEYS.settings);
  const next = { ...DEFAULT_SETTINGS, ...(settings || {}), ...partial };
  await getStorageArea().set({ [STORAGE_KEYS.settings]: next });
  return next;
}

export async function createPalette(name) {
  const { palettes } = await getStorageArea().get(STORAGE_KEYS.palettes);
  const list = Array.isArray(palettes) ? palettes : [];
  const palette = {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || 'Untitled',
    colors: [],
  };
  const next = [palette, ...list];
  await getStorageArea().set({ [STORAGE_KEYS.palettes]: next });
  return { palette, palettes: next };
}

export async function renamePalette(id, name) {
  const { palettes } = await getStorageArea().get(STORAGE_KEYS.palettes);
  const list = Array.isArray(palettes) ? palettes : [];
  const next = list.map((palette) =>
    palette.id === id ? { ...palette, name: name.trim() || palette.name } : palette
  );
  await getStorageArea().set({ [STORAGE_KEYS.palettes]: next });
  return next;
}

export async function deletePalette(id) {
  const { palettes } = await getStorageArea().get(STORAGE_KEYS.palettes);
  const list = Array.isArray(palettes) ? palettes : [];
  const next = list.filter((palette) => palette.id !== id);
  await getStorageArea().set({ [STORAGE_KEYS.palettes]: next });
  return next;
}

export async function addColorToPalette(id, hex) {
  const { palettes } = await getStorageArea().get(STORAGE_KEYS.palettes);
  const list = Array.isArray(palettes) ? palettes : [];
  const next = list.map((palette) => {
    if (palette.id !== id) return palette;
    const colors = [hex, ...palette.colors.filter((c) => c !== hex)];
    return { ...palette, colors };
  });
  await getStorageArea().set({ [STORAGE_KEYS.palettes]: next });
  return next;
}

export async function removeColorFromPalette(id, hex) {
  const { palettes } = await getStorageArea().get(STORAGE_KEYS.palettes);
  const list = Array.isArray(palettes) ? palettes : [];
  const next = list.map((palette) => {
    if (palette.id !== id) return palette;
    return { ...palette, colors: palette.colors.filter((c) => c !== hex) };
  });
  await getStorageArea().set({ [STORAGE_KEYS.palettes]: next });
  return next;
}

export async function clearAllData() {
  await getStorageArea().set({
    [STORAGE_KEYS.currentColor]: DEFAULT_COLOR,
    [STORAGE_KEYS.history]: [],
    [STORAGE_KEYS.palettes]: [],
    [STORAGE_KEYS.settings]: { ...DEFAULT_SETTINGS },
  });
}
