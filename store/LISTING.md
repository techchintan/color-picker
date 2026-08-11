# Chrome Web Store listing copy

Use these fields in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

## Product details

**Name**  
WhatColor - Color Picker & Eyedropper

**Summary** (short description, keep under ~132 characters)  
The fastest color picker and eyedropper for designers. Instantly identify and copy HEX, RGB, and HSL codes on any webpage.

**Category**  
Developer Tools  
(Alternate: Art & Design)

**Language**  
English

## Detailed description

```text
WhatColor - Color Picker & Eyedropper is a fast, privacy-first color tool for designers and developers.

Pick any on-screen color with the native eyedropper, convert between HEX, RGB, HSL, and CMYK, and copy the format you need in one click. Save recent colors and named palettes locally — nothing is sent to a server.

Features
• Native EyeDropper pixel pick from webpages or your screen
• Convert and copy HEX, RGB, HSL, and CMYK
• Optional auto-copy of your preferred format
• Color history with adjustable limit
• Named palettes stored on your device
• Pick colors from an uploaded image
• Keyboard shortcut: Alt+Shift+C (configurable in browser settings)
• Options page for defaults, clear data, and privacy notes

Privacy
• Only the storage permission
• No analytics, ads, or tracking
• No host permissions and no content scripts
• Colors and settings stay in local browser storage

Works in Chromium browsers that support the EyeDropper API (Chrome, Edge, Brave, Opera, and similar).
```

## Graphic assets (upload these)

All files are in `store/assets/`:

| Dashboard field | File | Size |
|---|---|---|
| Store icon | `store-icon-128.png` | 128×128 |
| Small promo tile | `promo-tile-440x280.png` | 440×280 |
| Marquee promo tile (optional) | `marquee-1400x560.png` | 1400×560 |
| Screenshot 1 | `screenshot-1-1280x800.png` | 1280×800 |
| Screenshot 2 | `screenshot-2-1280x800.png` | 1280×800 |

Extension package icons (inside the ZIP) live at `icons/icon-16.png`, `icons/icon-48.png`, `icons/icon-128.png` (from `src/static/icons/`).

## Privacy practices tab

Answer to match the shipped extension:

| Question | Answer |
|---|---|
| Does the extension collect user data? | **No** |
| Remote code? | **No** |
| Sell user data? | **No** |
| Use data for purposes unrelated to core functionality? | **No** |
| Transfer data for purposes unrelated? | **No** |
| Privacy policy URL | Host `store/privacy-policy.html` (GitHub Pages, your site, etc.) and paste the public HTTPS URL |

### Single purpose

Help users pick colors from the screen or images and convert/copy HEX, RGB, HSL, and CMYK values, with local history and palettes.

### Permission justification

**storage** — Stores the current color, color history, named palettes, and user settings (preferred format, auto-copy, history limit) locally on the device. No data is synced to a remote server by this extension.

## Distribution

- Visibility: Public (or Unlisted for a soft launch)
- Regions: All regions (or as preferred)

## Package upload

```bash
npm run build:chrome
```

Upload `dist-chrome.zip` on the Package tab.
