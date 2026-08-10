const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const out = path.join(root, 'dist-firefox');
const firefoxManifest = path.join(root, 'src', 'static', 'manifest.firefox.json');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === 'manifest.firefox.json') continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function rimraf(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

if (!fs.existsSync(dist)) {
  console.error('Missing dist/. Run "npm run build" first.');
  process.exit(1);
}

if (!fs.existsSync(firefoxManifest)) {
  console.error('Missing src/static/manifest.firefox.json');
  process.exit(1);
}

rimraf(out);
copyDir(dist, out);
fs.copyFileSync(firefoxManifest, path.join(out, 'manifest.json'));

console.log('Firefox package ready: dist-firefox/');
console.log('Load it via about:debugging → This Firefox → Load Temporary Add-on');
