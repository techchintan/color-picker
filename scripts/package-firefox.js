const fs = require('fs');
const path = require('path');
const { root, dist, assertDistReady, rimraf, copyDir } = require('./lib/fs-utils');

const out = path.join(root, 'dist-firefox');
const firefoxManifest = path.join(root, 'src', 'static', 'manifest.firefox.json');

assertDistReady();

if (!fs.existsSync(firefoxManifest)) {
  console.error('Missing src/static/manifest.firefox.json');
  process.exit(1);
}

rimraf(out);
copyDir(dist, out, { skipNames: ['manifest.firefox.json'] });
fs.copyFileSync(firefoxManifest, path.join(out, 'manifest.json'));

console.log('Firefox package ready: dist-firefox/');
console.log('Load it via about:debugging → This Firefox → Load Temporary Add-on');
