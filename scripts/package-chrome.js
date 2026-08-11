const path = require('path');
const {
  root,
  dist,
  assertDistReady,
  zipFolder,
  readPackageVersion,
} = require('./lib/fs-utils');

assertDistReady();

const version = readPackageVersion();
const zipPath = path.join(root, `dist-chrome-${version}.zip`);

zipFolder(dist, zipPath);

console.log(`Chrome Web Store package ready: ${zipPath}`);
console.log('Upload this ZIP in the Chrome Web Store Developer Dashboard → Package.');
