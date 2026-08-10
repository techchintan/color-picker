const path = require('path');
const { root, dist, assertDistReady, zipFolder } = require('./lib/fs-utils');

const zipPath = path.join(root, 'dist-chrome.zip');

assertDistReady();
zipFolder(dist, zipPath);

console.log(`Chrome Web Store package ready: ${zipPath}`);
console.log('Upload this ZIP in the Chrome Web Store Developer Dashboard → Package.');
