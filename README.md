# WhatColor - Color Picker & Eyedropper

Privacy-first Chrome extension to pick colors from any screen or uploaded image, convert HEX / RGB / HSL / CMYK, copy in one click, and save history plus named palettes locally.

## Features

- Native **EyeDropper** pixel pick from any webpage or screen
- Format conversion: **HEX**, **RGB**, **HSL**, **CMYK**
- One-click copy (optional auto-copy of preferred format)
- Color history and named palettes in `chrome.storage.local`
- Pick colors from an uploaded image (canvas sampling)
- Options page for defaults, clear data, and privacy notes

## Permissions

**`storage`** for local history/settings, and host access to **`https://www.google-analytics.com/*`** for anonymous usage analytics (Measurement Protocol). No content scripts. Color values are not uploaded.

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

Chrome Web Store ZIP:

```bash
npm run build:chrome
```

Creates `dist-chrome.zip` for upload.

Firefox package:

```bash
npm run build:firefox
```

## Chrome Web Store upload

Store-ready files live in `store/`:

| Item | Location |
|---|---|
| Listing copy + Privacy tab answers | [`store/LISTING.md`](store/LISTING.md) |
| Privacy policy (host this on HTTPS) | [`store/privacy-policy.html`](store/privacy-policy.html) |
| Store icon / tile / marquee / screenshots | [`store/assets/`](store/assets/) |

### Steps

1. Run `npm run build:chrome`
2. Host `store/privacy-policy.html` on a public HTTPS URL (GitHub Pages, your site, etc.)
3. In the [Developer Dashboard](https://chrome.google.com/webstore/devconsole):
   - Upload `dist-chrome.zip`
   - Paste text from `store/LISTING.md`
   - Upload images from `store/assets/`
   - Fill Privacy practices using the answers in `store/LISTING.md`
   - Set the privacy policy URL to your hosted page
4. Submit for review

Recommended category: **Developer Tools** (or Art & Design).
