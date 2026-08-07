import { DEFAULT_COLOR } from './storage';
import { hexToRgb, parseHex, relativeLuminance, rgbToHex, rgbToHsl } from './color';

function hslToRgb(h, s, l) {
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const light = Math.max(0, Math.min(100, l)) / 100;
  const chroma = (1 - Math.abs(2 * light - 1)) * sat;
  const huePrime = (((h % 360) + 360) % 360) / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (huePrime >= 0 && huePrime < 1) [r1, g1, b1] = [chroma, x, 0];
  else if (huePrime < 2) [r1, g1, b1] = [x, chroma, 0];
  else if (huePrime < 3) [r1, g1, b1] = [0, chroma, x];
  else if (huePrime < 4) [r1, g1, b1] = [0, x, chroma];
  else if (huePrime < 5) [r1, g1, b1] = [x, 0, chroma];
  else [r1, g1, b1] = [chroma, 0, x];

  const m = light - chroma / 2;
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

function rgba(rgb, alpha) {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Build CSS custom properties from a picked color so the whole UI
 * follows that accent (green → green theme, blue → blue theme, etc.).
 */
export function buildThemeVars(hex) {
  const normalized = parseHex(hex) || DEFAULT_COLOR;
  const rgb = hexToRgb(normalized);
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Push saturation so every pick reads as vividly as the original green UI.
  const hue = h;
  const sat = Math.max(s * 1.15, 48);
  // Buttons need a mid-tone; very light/dark picks get nudged into range.
  const accentL = Math.min(Math.max(l, 32), 48);
  const accentS = Math.min(Math.max(sat, 62), 92);

  const accent = hslToHex(hue, accentS, accentL);
  const accentBright = hslToHex(hue, Math.min(accentS + 8, 98), Math.min(accentL + 14, 58));
  const accentStrong = hslToHex(hue, Math.min(accentS + 6, 95), Math.max(accentL - 14, 16));
  const accentRgb = hexToRgb(accent);

  const bg0 = hslToHex(hue, Math.min(accentS * 0.55, 52), 96);
  const bg1 = hslToHex(hue, Math.min(accentS * 0.62, 58), 90);
  const bgEnd = hslToHex(hue, Math.min(accentS * 0.4, 40), 97.5);
  const ghostHover = hslToHex(hue, Math.min(accentS * 0.45, 48), 94);
  const ink = hslToHex(hue, Math.min(accentS * 0.7, 62), 14);
  const inkMuted = hslToHex(hue, Math.min(accentS * 0.48, 42), 38);
  const inkRgb = hexToRgb(ink);

  const onAccent = relativeLuminance(accent) > 0.45 ? '#1A1A1A' : '#F7FFF9';

  return {
    '--bg-0': bg0,
    '--bg-1': bg1,
    '--bg-end': bgEnd,
    '--surface': '#ffffff',
    '--ink': ink,
    '--ink-muted': inkMuted,
    '--accent': accent,
    '--accent-bright': accentBright,
    '--accent-strong': accentStrong,
    '--accent-soft': rgba(accentRgb, 0.22),
    '--accent-soft-strong': rgba(accentRgb, 0.28),
    '--accent-border': rgba(accentRgb, 0.55),
    '--accent-border-soft': rgba(accentRgb, 0.42),
    '--accent-border-mid': rgba(accentRgb, 0.48),
    '--accent-border-strong': rgba(accentRgb, 0.7),
    '--accent-border-focus': rgba(accentRgb, 0.6),
    '--accent-shadow': rgba(accentRgb, 0.4),
    '--accent-shadow-soft': rgba(accentRgb, 0.36),
    '--accent-focus-ring': rgba(accentRgb, 0.22),
    '--accent-glow': rgba(accentRgb, 0.26),
    '--on-accent': onAccent,
    '--ghost-hover': ghostHover,
    '--warm': 'rgba(232, 140, 74, 0.22)',
    '--line': rgba(inkRgb, 0.14),
    '--ink-shadow': rgba(inkRgb, 0.12),
    '--ink-shadow-soft': rgba(inkRgb, 0.07),
    '--ink-shadow-faint': rgba(inkRgb, 0.05),
    '--danger': '#c45245',
    '--danger-soft': 'rgba(196, 82, 69, 0.12)',
  };
}

export function applyTheme(hex, target = document.documentElement) {
  if (!target) return;
  const vars = buildThemeVars(hex);
  Object.entries(vars).forEach(([key, value]) => {
    target.style.setProperty(key, value);
  });
}
