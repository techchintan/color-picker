const fs = require('fs');
const path = require('path');
const {
  root,
  dist,
  assertDistReady,
  rimraf,
  copyDir,
  zipFolder,
  readPackageVersion,
} = require('./lib/fs-utils');

const out = path.join(root, 'dist-firefox');
const firefoxManifest = path.join(root, 'src', 'static', 'manifest.firefox.json');

assertDistReady();

if (!fs.existsSync(firefoxManifest)) {
  console.error('Missing src/static/manifest.firefox.json');
  process.exit(1);
}

const version = readPackageVersion();
const zipPath = path.join(root, `dist-firefox-${version}.zip`);

rimraf(out);
copyDir(dist, out, { skipNames: ['manifest.firefox.json'] });
fs.copyFileSync(firefoxManifest, path.join(out, 'manifest.json'));
zipFolder(out, zipPath);

console.log(`Firefox package ready: ${out}/`);
console.log(`Firefox ZIP ready: ${zipPath}`);
console.log('Load the folder via about:debugging → This Firefox → Load Temporary Add-on');
