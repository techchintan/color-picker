# Color Picker HEX | Eyedropper

Privacy-first Chrome extension to pick colors from any screen or uploaded image, convert HEX / RGB / HSL / CMYK, copy in one click, and save history plus named palettes locally.

## Features

- Native **EyeDropper** pixel pick from any webpage or screen
- Format conversion: **HEX**, **RGB**, **HSL**, **CMYK**
- One-click copy (optional auto-copy of preferred format)
- Color history and named palettes in `chrome.storage.local`
- Pick colors from an uploaded image (canvas sampling)
- Options page for defaults, clear data, and privacy notes

## Permissions

Only **`storage`**. No host permissions, no content scripts, no analytics, no network calls for core features.

## Develop

```bash
npm i
npm start
```

Webpack watches and writes bundles to `dist/`.

## Load unpacked

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist` folder

Shortcut: **Alt+Shift+C** opens the popup (`_execute_action`).

## Production build

```bash
npm run build
```

Zip the `dist` folder for Chrome Web Store upload.

## Chrome Web Store checklist

- Category: **Developer Tools** (or Art & Design)
- Accurate listing description matching shipped features
- Privacy tab: declare **no user data collected**
- Provide icon (16/48/128), tile, marquee, and screenshots
- Keep Manifest V3; do not add remote code or broad host access
- Test EyeDropper, formats, history, palettes, image pick, and clear-data before submit
